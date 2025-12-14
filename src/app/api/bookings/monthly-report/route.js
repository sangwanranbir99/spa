const { NextResponse } = require('next/server');
const connectDB = require('../../../../../lib/db');
const authMiddleware = require('../../../../../lib/authMiddleware');
const { checkRole } = require('../../../../../lib/roleMiddleware');
const Booking = require('../../../../../models/Booking');
const mongoose = require('mongoose');

export async function GET(req) {
  try {
    await connectDB();
    const user = await authMiddleware(req);

    // Only admin can access booking reports
    if (!checkRole(user, 'admin')) {
      return NextResponse.json(
        { message: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const branchId = searchParams.get('branchId');

    if (!year || !month) {
      return NextResponse.json(
        { message: 'Year and Month are required' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month); // month expected to be 1-indexed (1 for Jan)

    // Create start of month date
    const startOfMonth = new Date(`${yearNum}-${String(monthNum).padStart(2, '0')}-01`);
    startOfMonth.setHours(0, 0, 0, 0);

    // Create end of month date
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const endOfMonth = new Date(`${yearNum}-${String(monthNum).padStart(2, '0')}-${lastDay}`);
    endOfMonth.setHours(23, 59, 59, 999);

    // Build match query
    const matchQuery = {
      massageDate: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    };

    // Add branch filter if branchId is provided (for admin branch filtering)
    if (branchId && branchId !== 'null') {
      matchQuery.branch = new mongoose.Types.ObjectId(branchId);
    }

    // Aggregate bookings by date
    const result = await Booking.aggregate([
      {
        $match: matchQuery,
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$massageDate" } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error fetching booking history:', error);
    return NextResponse.json(
      { message: error.message || 'Error fetching booking history' },
      { status: error.message === 'No authorization token provided' ? 401 : 500 }
    );
  }
}
