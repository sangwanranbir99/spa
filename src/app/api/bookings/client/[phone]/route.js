const { NextResponse } = require('next/server');
const connectDB = require('../../../../../../lib/db');
const authMiddleware = require('../../../../../../lib/authMiddleware');
const Booking = require('../../../../../../models/Booking');

// GET client bookings by phone (ALL branches - not filtered)
export async function GET(req, { params }) {
  try {
    await connectDB();
    const user = await authMiddleware(req);
    const { phone } = await params;

    // IMPORTANT: Client history is NOT filtered by branch
    // Users can see client's booking history from ALL branches
    const bookings = await Booking.find({ clientContact: phone })
      .populate('massage', 'name')
      .populate('staffDetails', 'name')
      .populate('branch', 'name code')
      .sort({ massageDate: -1, massageTime: -1 });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Get client bookings error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
