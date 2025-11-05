import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const AVERAGE_CONSULT_MINUTES = 10;

export async function POST(request) {
  try {
    const { mobileNumber, tokenNumber } = await request.json();
    if (!mobileNumber && !tokenNumber) {
      return NextResponse.json({ success: false, message: 'Provide mobileNumber or tokenNumber' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('hospital-management');

    // Resolve token
    let tokenDoc = null;
    let patient = null;

    if (tokenNumber) {
      tokenDoc = await db.collection('tokens').findOne({ tokenNumber });
      if (!tokenDoc) {
        return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
      }
      patient = await db.collection('patients_profile').findOne({ patientId: tokenDoc.patientId });
    } else {
      patient = await db.collection('patients_profile').findOne({ mobileNumber });
      if (!patient) {
        return NextResponse.json({ success: false, message: 'Patient not found for this mobile number' }, { status: 404 });
      }
      const todayStr = new Date().toISOString().split('T')[0];
      tokenDoc = await db.collection('tokens').findOne({
        patientId: patient.patientId,
        date: todayStr,
        status: 'Active'
      }, { sort: { generatedAt: -1 } });

      if (!tokenDoc && patient.tokenNumber) {
        tokenDoc = await db.collection('tokens').findOne({ tokenNumber: patient.tokenNumber });
      }

      if (!tokenDoc) {
        return NextResponse.json({ success: false, message: 'Active token not found for this patient' }, { status: 404 });
      }
    }

    // Queue ahead
    const patientsAhead = await db.collection('tokens').countDocuments({
      hospitalName: tokenDoc.hospitalName,
      department: tokenDoc.department,
      date: tokenDoc.date,
      status: 'Active',
      generatedAt: { $lt: tokenDoc.generatedAt }
    });

    // Pick a doctor for department (best-effort)
    const doctor = await db.collection('doctors_list').findOne(
      { department: tokenDoc.department, status: 'Active' },
      { projection: { _id: 0, doctorId: 1, name: 1, department: 1 } }
    );

    // Estimate appointment time: now + patientsAhead * avg minutes
    const now = new Date();
    const eta = new Date(now.getTime() + Math.max(patientsAhead, 0) * AVERAGE_CONSULT_MINUTES * 60 * 1000);

    return NextResponse.json({
      success: true,
      tokenNumber: tokenDoc.tokenNumber,
      appointmentTime: eta.toISOString(),
      appointmentTimeDisplay: eta.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      doctor: doctor ? { name: doctor.name, department: doctor.department, doctorId: doctor.doctorId } : null,
      queue: { patientsAhead }
    });
  } catch (error) {
    console.error('Appointment time error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

