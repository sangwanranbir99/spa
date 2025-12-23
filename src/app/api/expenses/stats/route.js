const { NextResponse } = require('next/server');
const connectDB = require('../../../../../lib/db');
const authMiddleware = require('../../../../../lib/authMiddleware');
const { checkRole, checkBranchAccess } = require('../../../../../lib/roleMiddleware');
const Expense = require('../../../../../models/Expense');
const mongoose = require('mongoose');

// GET expense statistics
export async function GET(req) {
  try {
    await connectDB();
    const user = await authMiddleware(req);

    // Only admin and manager can view expense stats
    if (!checkRole(user, 'manager')) {
      return NextResponse.json(
        { message: 'Access denied. Manager or Admin only.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const branchId = searchParams.get('branchId');

    // Parse date from query params, default to today if not provided
    let year, month, day;
    if (date) {
      // Parse date string (YYYY-MM-DD)
      [year, month, day] = date.split('-').map(Number);
    } else {
      const today = new Date();
      year = today.getFullYear();
      month = today.getMonth() + 1;
      day = today.getDate();
    }

    // Set up start and end for the day (current date only)
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    // Set up start of month to end of current day (1st to current date)
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endOfCurrentDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    // Build branch filter
    let branchFilter = {};
    if (user.role === 'admin') {
      // Admin can filter by specific branch or see all
      if (branchId && branchId !== 'null') {
        branchFilter.branch = new mongoose.Types.ObjectId(branchId);
      }
    } else if (user.role === 'manager') {
      // Manager can only see their branch expenses
      if (user.branches && user.branches.length > 0) {
        // Ensure ObjectId for aggregation pipeline
        const managerBranchId = user.branches[0]._id || user.branches[0];
        branchFilter.branch = new mongoose.Types.ObjectId(managerBranchId.toString());
      } else {
        return NextResponse.json(
          { message: 'No branch assigned to manager' },
          { status: 403 }
        );
      }
    }

    // Aggregate daily expenses (just for the selected day)
    const dailyStats = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startOfDay, $lte: endOfDay },
          ...branchFilter
        },
      },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" },
          count: { $sum: 1 }
        },
      },
    ]);

    // Aggregate monthly expenses (from 1st of month to current date)
    const monthlyStats = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfCurrentDay },
          ...branchFilter
        },
      },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" },
          count: { $sum: 1 }
        },
      },
    ]);

    // Get totals, defaulting to 0 if no expenses are found
    const dailyTotal = dailyStats.length > 0 ? dailyStats[0].totalExpense : 0;
    const monthlyTotal = monthlyStats.length > 0 ? monthlyStats[0].totalExpense : 0;
    const dailyCount = dailyStats.length > 0 ? dailyStats[0].count : 0;
    const monthlyCount = monthlyStats.length > 0 ? monthlyStats[0].count : 0;

    return NextResponse.json({
      dailyTotal,
      monthlyTotal,
      dailyCount,
      monthlyCount,
      dateRange: {
        startOfDay: startOfDay,
        endOfDay: endOfDay,
        startOfMonth: startOfMonth,
        endOfCurrentDay: endOfCurrentDay
      }
    });
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    return NextResponse.json(
      { message: error.message || 'Error fetching expense stats' },
      { status: error.message === 'No authorization token provided' ? 401 : 500 }
    );
  }
}
