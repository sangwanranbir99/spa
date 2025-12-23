const { NextResponse } = require('next/server');
const connectDB = require('../../../../../lib/db');
const authMiddleware = require('../../../../../lib/authMiddleware');
const { checkRole } = require('../../../../../lib/roleMiddleware');
const Expense = require('../../../../../models/Expense');
const mongoose = require('mongoose');

export async function GET(req) {
  try {
    await connectDB();
    const user = await authMiddleware(req);

    // Only admin and manager can access expense reports
    if (!checkRole(user, 'manager')) {
      return NextResponse.json(
        { message: 'Access denied. Manager or Admin only.' },
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

    // Create start of month date using UTC to avoid timezone issues
    const startOfMonth = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0));

    // Create end of month date
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const endOfMonth = new Date(Date.UTC(yearNum, monthNum - 1, lastDay, 23, 59, 59, 999));

    // Build match query
    const matchQuery = {
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    };

    // Branch filtering
    if (user.role === 'admin') {
      // Admin can filter by specific branch or see all
      if (branchId && branchId !== 'null') {
        matchQuery.branch = new mongoose.Types.ObjectId(branchId);
      }
    } else if (user.role === 'manager') {
      // Manager can only see their branch expenses
      if (user.branches && user.branches.length > 0) {
        const managerBranchId = user.branches[0]._id || user.branches[0];
        matchQuery.branch = new mongoose.Types.ObjectId(managerBranchId.toString());
      } else {
        return NextResponse.json(
          { message: 'No branch assigned to manager' },
          { status: 403 }
        );
      }
    }

    // Aggregate expenses by date
    const result = await Expense.aggregate([
      {
        $match: matchQuery,
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Calculate grand totals
    const grandTotal = result.reduce((acc, item) => ({
      count: acc.count + item.count,
      amount: acc.amount + item.totalAmount,
    }), { count: 0, amount: 0 });

    return NextResponse.json({
      result,
      totalCount: grandTotal.count,
      totalAmount: grandTotal.amount
    });
  } catch (error) {
    console.error('Error fetching expense report:', error);
    return NextResponse.json(
      { message: error.message || 'Error fetching expense report' },
      { status: error.message === 'No authorization token provided' ? 401 : 500 }
    );
  }
}
