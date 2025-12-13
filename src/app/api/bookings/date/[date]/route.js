const { NextResponse } = require('next/server');
const connectDB = require('../../../../../../lib/db');
const authMiddleware = require('../../../../../../lib/authMiddleware');
const Booking = require('../../../../../../models/Booking');

// GET bookings by date
export async function GET(req, { params }) {
  try {
    await connectDB();
    const user = await authMiddleware(req);
    const { date } = await params;

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');

    // Parse the date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let query = {
      massageDate: { $gte: startDate, $lte: endDate }
    };

    // Branch filtering
    if (user.role === 'admin') {
      if (branchId && branchId !== 'null') {
        query.branch = branchId;
      }
    } else {
      const userBranchIds = user.branches.map(b => b._id || b);
      if (branchId) {
        if (!userBranchIds.some(id => id.toString() === branchId)) {
          return NextResponse.json(
            { message: 'You do not have access to this branch' },
            { status: 403 }
          );
        }
        query.branch = branchId;
      } else {
        query.branch = { $in: userBranchIds };
      }
    }

    const bookings = await Booking.find(query)
      .populate('massage', 'name')
      .populate('staffDetails', 'name')
      .populate('branch', 'name code')
      .sort({ massageTime: 1 });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Get bookings by date error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
