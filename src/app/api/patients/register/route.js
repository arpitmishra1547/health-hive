import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { encryptPatientFields, decryptPatientFields, encrypt } from '@/lib/crypto'

export async function POST(request) {
  try {
    const patientData = await request.json();
    const client = await clientPromise;
    const db = client.db("hospital-management");

    // Validate required fields
    const requiredFields = [
      'fullName', 'dateOfBirth', 'age', 'gender', 'mobileNumber', 
      'address', 'city', 'hospitalName', 'department'
    ];

    for (const field of requiredFields) {
      if (!patientData[field]) {
        return NextResponse.json({ 
          success: false, 
          message: `Missing required field: ${field}` 
        }, { status: 400 });
      }
    }

    // Check if mobile number already exists (need to check encrypted value)
    // Try to encrypt the mobile number to check against encrypted records
    let encryptedMobile = patientData.mobileNumber
    try {
      encryptedMobile = encrypt(patientData.mobileNumber)
    } catch {}
    
    // Check both encrypted and unencrypted (for backward compatibility)
    const existingPatient = await db.collection("patients_profile").findOne({ 
      $or: [
        { mobileNumber: patientData.mobileNumber },
        { mobileNumber: encryptedMobile }
      ]
    });

    if (existingPatient) {
      return NextResponse.json({ 
        success: false, 
        message: "Patient with this mobile number already exists" 
      }, { status: 400 });
    }

    // Aadhaar is optional now; remove uniqueness constraint

    // Determine hospital coordinates for patient profile
    let hospitalCoordinates = patientData.hospitalCoordinates;
    
    // For AIIMS Bhopal, provide default coordinates since it's always within 100m
    if (patientData.hospitalName === "All India Institute of Medical Sciences (AIIMS)" && 
        patientData.hospitalCity === "Bhopal") {
      hospitalCoordinates = {
        lat: 23.251797808801957, // Bhopal coordinates
        lng: 77.46620424743277
      };
    } else if (!hospitalCoordinates) {
      // If no coordinates provided and not AIIMS Bhopal, provide default coordinates
      hospitalCoordinates = {
        lat: 23.251797808801957, // Default coordinates
        lng: 77.46620424743277
      };
    }

    // Create patient document
    const patient = {
      ...encryptPatientFields(patientData),
      hospitalCoordinates: hospitalCoordinates,
      patientId: `P${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      status: "Registered",
      tokenStatus: "Token Pending",
      registrationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to patients_profile collection
    const result = await db.collection("patients_profile").insertOne(patient);

    if (result.insertedId) {
      // Save to patients_mobileNumbers collection for quick lookup
      await db.collection("patients_mobileNumbers").insertOne({ 
        mobileNumber: patientData.mobileNumber,
        patientId: patient.patientId,
        createdAt: new Date()
      });

      // If Aadhaar is provided, optionally store for lookup (not required)
      if (patientData.aadhaarNumber) {
        await db.collection("patients_aadhaar").insertOne({ 
          aadhaarNumber: patientData.aadhaarNumber,
          patientId: patient.patientId,
          createdAt: new Date()
        });
      }

      // Save hospital location data
      await db.collection("hospital_locations").insertOne({
        hospitalName: patientData.hospitalName,
        hospitalCity: patientData.hospitalCity,
        city: patientData.city,
        coordinates: hospitalCoordinates,
        department: patientData.department,
        patientId: patient.patientId,
        createdAt: new Date()
      });

      // Decrypt patient data for response (or return minimal data)
      const decryptedPatient = decryptPatientFields(patient)
      
      return NextResponse.json({ 
        success: true, 
        message: "Patient registered successfully",
        patient: {
          patientId: decryptedPatient.patientId,
          fullName: decryptedPatient.fullName || patient.fullName,
          mobileNumber: decryptedPatient.mobileNumber || patient.mobileNumber,
          status: decryptedPatient.status || patient.status,
          tokenStatus: decryptedPatient.tokenStatus || patient.tokenStatus
        }
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: "Failed to register patient" 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    }, { status: 500 });
  }
}
