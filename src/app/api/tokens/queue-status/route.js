import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { mobileNumber, tokenNumber } = await request.json();

    if (!mobileNumber && !tokenNumber) {
      return NextResponse.json({ success: false, message: 'Provide mobileNumber or tokenNumber' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('hospital-management');

    // Resolve token document
    let tokenDoc = null;

    if (tokenNumber) {
      tokenDoc = await db.collection('tokens').findOne({ tokenNumber });
      if (!tokenDoc) {
        return NextResponse.json({ success: false, message: 'Token not found' }, { status: 404 });
      }
    } else if (mobileNumber) {
      const patient = await db.collection('patients_profile').findOne({ mobileNumber });
      if (!patient) {
        return NextResponse.json({ success: false, message: 'Patient not found for this mobile number' }, { status: 404 });
      }

      // Prefer today's active token
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

    // Compute queue ahead based on generatedAt within same hospital/department/date and Active status
    const { hospitalName, department, date, generatedAt } = tokenDoc;

    const patientsAhead = await db.collection('tokens').countDocuments({
      hospitalName,
      department,
      date,
      status: 'Active',
      generatedAt: { $lt: generatedAt }
    });

    return NextResponse.json({
      success: true,
      tokenNumber: tokenDoc.tokenNumber,
      queue: {
        patientsAhead,
        status: tokenDoc.status
      },
      token: {
        hospitalName,
        department,
        date,
        generatedAt: tokenDoc.generatedAt,
        patientId: tokenDoc.patientId,
        patientName: tokenDoc.patientName
      }
    });
  } catch (error) {
    console.error('Queue status error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

