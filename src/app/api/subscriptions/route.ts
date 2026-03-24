import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-config';
import { Subscription } from '@/models/Subscription';

// GET: /api/subscriptions or /api/subscriptions?id=xxx
export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      const subscription = await Subscription.findById(id);
      if (!subscription) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ subscription });
    }
    const subscriptions = await Subscription.find().sort({ created_at: -1 });
    return NextResponse.json({ subscriptions });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

// POST: Create new subscription
export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const body = await req.json();
    if (!body.title || !body.price || !body.duration_type || !body.duration_value) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const newSub = new Subscription({
      title: body.title,
      description: body.description,
      certificate_flag: !!body.certificate_flag,
      price: Number(body.price),
      duration_type: body.duration_type,
      duration_value: Number(body.duration_value),
      status: body.status || 'active',
      created_at: new Date()
    });
    await newSub.save();
    return NextResponse.json({ message: 'Subscription created', subscription: newSub });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

// PUT: Update subscription by id (expects ?id=xxx)
export async function PUT(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const body = await req.json();
    const updated = await Subscription.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Subscription updated', subscription: updated });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}

// DELETE: Delete subscription by id (expects ?id=xxx)
export async function DELETE(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const deleted = await Subscription.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Subscription deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
  }
}
