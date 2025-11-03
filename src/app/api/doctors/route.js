import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

function generateDoctorId(sequenceNumber) {
  return `DR-${String(sequenceNumber).padStart(5, '0')}`;
}

async function ensureIndexes(db) {
  await db.collection('doctors_list').createIndex({ doctorId: 1 }, { unique: true });
  await db.collection('doctors_list').createIndex({ department: 1 });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status'); // expected: available | busy | emergency

    const client = await clientPromise;
    const db = client.db('hospital-management');
    await ensureIndexes(db);

    const query = {};
    if (department) query.department = department;
    if (doctorId) query.doctorId = doctorId;
    if (status) {
      // Backward compatibility: treat 'Active' as 'available'
      if (status === 'available') {
        query.status = { $in: ['available', 'Active'] };
      } else {
        query.status = status;
      }
    }
    const doctors = await db.collection('doctors_list').find(query, {
      projection: {
        _id: 0,
        doctorId: 1,
        name: 1,
        department: 1,
        specialization: 1,
        contact: 1,
        status: 1,
      },
      sort: { department: 1, name: 1 },
    }).toArray();

    return NextResponse.json({ success: true, total: doctors.length, doctors });
  } catch (error) {
    console.error('Doctors GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch doctors' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { action } = payload;
    
    console.log('Doctors API POST request:', { action, payload });

    const client = await clientPromise;
    const db = client.db('hospital-management');
    await ensureIndexes(db);

    if (action === 'add') {
      const { name, department, specialization, contact, status = 'Active' } = payload;
      if (!name || !department) {
        return NextResponse.json({ success: false, message: 'name and department are required' }, { status: 400 });
      }

      // get next sequence number using counters collection for atomic increments
      let counter = await db.collection('counters').findOne({ _id: 'doctorId' });
      if (!counter) {
        await db.collection('counters').insertOne({ _id: 'doctorId', seq: 0 });
        counter = { seq: 0 };
      }
      
      const newSeq = counter.seq + 1;
      await db.collection('counters').updateOne(
        { _id: 'doctorId' },
        { $set: { seq: newSeq } }
      );
      const doctorId = generateDoctorId(newSeq);

      const doc = {
        doctorId,
        name,
        department,
        specialization: specialization || department,
        contact: contact || null,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('doctors_list').insertOne(doc);
      console.log('Doctor added successfully:', result);
      return NextResponse.json({ success: true, doctor: doc });
    }

    if (action === 'remove') {
      const { doctorId } = payload;
      if (!doctorId) {
        return NextResponse.json({ success: false, message: 'doctorId is required' }, { status: 400 });
      }
      const res = await db.collection('doctors_list').deleteOne({ doctorId });
      if (res.deletedCount === 0) {
        return NextResponse.json({ success: false, message: 'Doctor not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'updateStatus') {
      const { doctorId, status } = payload;
      if (!doctorId || !status) {
        return NextResponse.json({ success: false, message: 'doctorId and status are required' }, { status: 400 });
      }
      if (!['available','busy','emergency','Active'].includes(status)) {
        return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
      }
      const res = await db.collection('doctors_list').updateOne(
        { doctorId },
        { $set: { status, updatedAt: new Date() } }
      );
      if (res.matchedCount === 0) {
        return NextResponse.json({ success: false, message: 'Doctor not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'seed') {
      // seed a few test doctors
      const departments = ['Cardiology','Dermatology','Orthopedics','General Medicine','Pediatrics','Neurology','Gynecology','Psychiatry'];
      const names = ['A Sharma','B Mehta','C Rao','D Singh','E Verma','F Iyer','G Patel','H Khan'];
      const batch = [];
      let counter = await db.collection('counters').findOne({ _id: 'doctorId' });
      if (!counter) {
        await db.collection('counters').insertOne({ _id: 'doctorId', seq: 0 });
        counter = { seq: 0 };
      }
      
      for (let i = 0; i < names.length; i++) {
        const newSeq = counter.seq + i + 1;
        batch.push({
          doctorId: generateDoctorId(newSeq),
          name: `Dr. ${names[i]}`,
          department: departments[i % departments.length],
          specialization: departments[i % departments.length],
          contact: `+91-98${Math.floor(100000000 + Math.random()*899999999).toString().slice(0,8)}`,
          status: 'Active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      // Update counter to the last sequence number
      if (batch.length > 0) {
        await db.collection('counters').updateOne(
          { _id: 'doctorId' },
          { $set: { seq: counter.seq + batch.length } }
        );
      }
      if (batch.length) {
        await db.collection('doctors_list').insertMany(batch, { ordered: false });
      }
      return NextResponse.json({ success: true, added: batch.length });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Doctors POST error:', error);
    const message = error?.code === 11000 ? 'Duplicate doctorId' : 'Failed to process request';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
