import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { encrypt } from '@/lib/crypto'
import { Buffer } from 'buffer';

// Collection: queues
// Document shape:
// {
//   _id: ObjectId,
//   doctorId: string,
//   emergencyQueue: [ { ticketId, patientName, patientId, mobileNumber, createdAt } ],
//   normalQueue: [ { ticketId, patientName, patientId, mobileNumber, createdAt } ],
//   currentEmergency: { ticketId, startedAt } | null,
//   updatedAt: Date
// }

async function ensureIndexes(db) {
  await db.collection('queues').createIndex({ doctorId: 1 }, { unique: true });
}

function generateTicketId(doctorId) {
  const ts = Date.now().toString(36).toUpperCase();
  return `T-${doctorId}-${ts}`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    if (!doctorId) {
      return NextResponse.json({ success: false, message: 'doctorId is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('hospital-management');
    await ensureIndexes(db);

    const doc = await db.collection('queues').findOne({ doctorId });

    const payload = doc || {
      doctorId,
      emergencyQueue: [],
      normalQueue: [],
      currentEmergency: null,
      updatedAt: new Date()
    };

    const doctorBusyWithEmergency = !!(payload.currentEmergency || (payload.emergencyQueue && payload.emergencyQueue.length > 0));

    return NextResponse.json({ success: true, queue: payload, doctorBusyWithEmergency });
  } catch (error) {
    console.error('Queue GET failed:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch queue' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body;
    let action;
    let parsedForm = null;
    const isMultipart = contentType.includes('multipart/form-data');
    if (isMultipart) {
      parsedForm = await request.formData();
      action = parsedForm.get('action');
      body = Object.create(null);
      for (const [key, value] of parsedForm.entries()) {
        body[key] = value;
      }
    } else {
      body = await request.json();
      action = (body || {}).action;
    }

    const client = await clientPromise;
    const db = client.db('hospital-management');
    await ensureIndexes(db);

    if (action === 'enqueue') {
      const { doctorId, patientName, patientId = null, mobileNumber = null } = body;
      const emergency = String(body?.emergency) === 'true' || body?.emergency === true;
      if (!doctorId || !patientName) {
        return NextResponse.json({ success: false, message: 'doctorId and patientName are required' }, { status: 400 });
      }

      // Optional emergency details
      let emergencyReason = null;
      let emergencyVerified = false;
      let emergencyAttachment = null;
      // Additional patient/context fields
      const age = body?.age ? Number(body.age) : null;
      const gender = body?.gender || null;
      const city = body?.city || null;
      const hospitalId = body?.hospitalId || null;
      const hospitalName = body?.hospitalName || null;
      const emergencyType = body?.emergencyType || null;
      const preferredDoctorId = body?.preferredDoctorId || null;

      if (emergency) {
        emergencyReason = (body.emergencyReason || '').toString().slice(0, 500);
        const keywords = ['accident', 'chest pain', 'unconscious', 'bleeding', 'stroke'];
        const text = (emergencyReason || '').toLowerCase();
        emergencyVerified = keywords.some(k => text.includes(k));

        // Handle uploaded file if multipart
        if (isMultipart && parsedForm) {
          const file = parsedForm.get('emergencyDoc');
          if (file && typeof file === 'object' && typeof file.arrayBuffer === 'function') {
            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = file.type || 'application/octet-stream';
            emergencyAttachment = {
              filename: file.name || 'document',
              mimeType,
              size: file.size || base64.length * 0.75,
              dataUrl: `data:${mimeType};base64,${base64}`
            };
          }
        }
      }

      const ticketId = generateTicketId(doctorId);
      const entry = { 
        ticketId, 
        patientName, 
        patientId, 
        mobileNumber, 
        createdAt: new Date(),
        type: emergency ? 'emergency' : 'normal',
        emergencyReason: emergency ? encrypt(emergencyReason || '') : emergencyReason,
        emergencyVerified,
        emergencyAttachment,
        age,
        gender,
        city,
        hospitalId,
        hospitalName,
        emergencyType,
        preferredDoctorId
      };

      const update = emergency
        ? { $setOnInsert: { doctorId }, $push: { emergencyQueue: entry }, $set: { updatedAt: new Date() } }
        : { $setOnInsert: { doctorId }, $push: { normalQueue: entry }, $set: { updatedAt: new Date() } };

      const result = await db.collection('queues').updateOne(
        { doctorId },
        update,
        { upsert: true }
      );

      return NextResponse.json({ success: true, ticket: entry });
    }

    if (action === 'startEmergency') {
      const { doctorId } = body;
      if (!doctorId) {
        return NextResponse.json({ success: false, message: 'doctorId is required' }, { status: 400 });
      }

      const doc = await db.collection('queues').findOne({ doctorId });
      if (!doc || (doc.emergencyQueue || []).length === 0) {
        return NextResponse.json({ success: false, message: 'No emergency cases pending' }, { status: 400 });
      }

      const nextEmergency = doc.emergencyQueue[0];
      await db.collection('queues').updateOne(
        { doctorId },
        {
          $set: { currentEmergency: { ticketId: nextEmergency.ticketId, startedAt: new Date() }, updatedAt: new Date() },
          $pop: { emergencyQueue: -1 } // remove first item
        }
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'resolveEmergency') {
      const { doctorId } = body;
      if (!doctorId) {
        return NextResponse.json({ success: false, message: 'doctorId is required' }, { status: 400 });
      }

      await db.collection('queues').updateOne(
        { doctorId },
        { $set: { currentEmergency: null, updatedAt: new Date() } }
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'dequeueNormal') {
      const { doctorId } = body;
      if (!doctorId) {
        return NextResponse.json({ success: false, message: 'doctorId is required' }, { status: 400 });
      }

      // Only allow normal dequeue if no current emergency and emergencyQueue empty
      const doc = await db.collection('queues').findOne({ doctorId }, { projection: { currentEmergency: 1, emergencyQueue: 1, normalQueue: 1 } });
      const blocked = doc && (doc.currentEmergency || (doc.emergencyQueue && doc.emergencyQueue.length > 0));
      if (blocked) {
        return NextResponse.json({ success: false, message: 'Emergency in progress, normal queue is paused' }, { status: 409 });
      }

      if (!doc || (doc.normalQueue || []).length === 0) {
        return NextResponse.json({ success: false, message: 'No normal patients waiting' }, { status: 400 });
      }

      const nextNormal = doc.normalQueue[0];
      await db.collection('queues').updateOne(
        { doctorId },
        { $pop: { normalQueue: -1 }, $set: { updatedAt: new Date() } }
      );

      return NextResponse.json({ success: true, served: nextNormal });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Queue POST failed:', error);
    return NextResponse.json({ success: false, message: 'Queue operation failed' }, { status: 500 });
  }
}


