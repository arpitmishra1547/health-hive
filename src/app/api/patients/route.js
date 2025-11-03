import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db("hospital-management");

    // Fetch all patients from the patients_profile collection
    const patients = await db.collection("patients_profile")
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ 
      success: true, 
      patients: patients 
    });
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch patients" 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { mobileNumber, action, patientData } = await request.json();
    const client = await clientPromise;
    const db = client.db("hospital-management");

    if (action === 'checkMobile') {
      // Check if mobile number exists
      const existingPatient = await db.collection("patients_mobileNumbers").findOne({ mobileNumber });
      // Fetch profile in any case
      const patientProfile = await db.collection("patients_profile").findOne({ mobileNumber });

      if (existingPatient && patientProfile) {
        return NextResponse.json({ exists: true, patient: patientProfile });
      }

      // If mapping exists but profile missing, treat as not existing (dangling mapping)
      if (existingPatient && !patientProfile) {
        try {
          await db.collection("patients_mobileNumbers").deleteOne({ mobileNumber });
        } catch {}
      }
      return NextResponse.json({ exists: false });
    }

    if (action === 'createPatient') {
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

      // Create new patient
      const patientProfile = {
        ...patientData,
        hospitalCoordinates: hospitalCoordinates,
        mobileNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to patients_profile collection
      const result = await db.collection("patients_profile").insertOne(patientProfile);
      
      if (result.insertedId) {
        // Save to patients_mobileNumbers collection for quick lookup
        await db.collection("patients_mobileNumbers").insertOne({ 
          mobileNumber,
          patientId: patientProfile.patientId,
          createdAt: new Date()
        });

        // Save to patients_aadhaar collection for Aadhaar lookup
        if (patientData.aadhaarNumber) {
          await db.collection("patients_aadhaar").insertOne({ 
            aadhaarNumber: patientData.aadhaarNumber,
            patientId: patientProfile.patientId,
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
          patientId: patientProfile.patientId,
          createdAt: new Date()
        });

        return NextResponse.json({ 
          success: true, 
          message: "Patient created successfully",
          patient: {
            patientId: patientProfile.patientId,
            fullName: patientProfile.fullName,
            mobileNumber: patientProfile.mobileNumber,
            status: patientProfile.status,
            tokenStatus: patientProfile.tokenStatus
          }
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          message: "Failed to create patient" 
        }, { status: 500 });
      }
    }

    if (action === 'updatePatient') {
      // Update patient profile
      const updateData = {
        ...patientData,
        updatedAt: new Date()
      };

      const result = await db.collection("patients_profile").updateOne(
        { mobileNumber },
        { $set: updateData }
      );

      if (result.modifiedCount > 0) {
        return NextResponse.json({ 
          success: true, 
          message: "Patient updated successfully" 
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          message: "Patient not found" 
        });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
