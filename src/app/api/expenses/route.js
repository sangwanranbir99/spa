const { NextResponse } = require('next/server');
const connectDB = require('../../../../lib/db');
const authMiddleware = require('../../../../lib/authMiddleware');
const { checkRole, checkBranchAccess } = require('../../../../lib/roleMiddleware');
const Expense = require('../../../../models/Expense');

// GET expenses with optional date and branch filtering
export async function GET(req) {
  try {
    await connectDB();
    const user = await authMiddleware(req);

    // Only admin and manager can view expenses
    if (!checkRole(user, 'manager')) {
      return NextResponse.json(
        { message: 'Access denied. Manager or Admin only.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const branchId = searchParams.get('branchId');

    let filter = {};

    // If a date is provided, filter expenses for that specific date
    if (date) {
      const startDate = new Date(date);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);

      filter.date = { $gte: startDate, $lte: endDate };
    }

    // Branch filtering
    if (user.role === 'admin') {
      // Admin can filter by specific branch or see all
      if (branchId && branchId !== 'null') {
        filter.branch = branchId;
      }
    } else if (user.role === 'manager') {
      // Manager can only see their branch expenses
      if (user.branches && user.branches.length > 0) {
        filter.branch = user.branches[0]._id;
      } else {
        return NextResponse.json(
          { message: 'No branch assigned to manager' },
          { status: 403 }
        );
      }
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { message: error.message || 'Error fetching expenses' },
      { status: error.message === 'No authorization token provided' ? 401 : 500 }
    );
  }
}

// POST create new expense
export async function POST(req) {
  try {
    await connectDB();
    const user = await authMiddleware(req);

    // Only admin and manager can create expenses
    if (!checkRole(user, 'manager')) {
      return NextResponse.json(
        { message: 'Access denied. Manager or Admin only.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, amount, date, branchId } = body;

    if (!title || !amount || !date || !branchId) {
      return NextResponse.json(
        { message: 'Title, amount, date, and branch are required' },
        { status: 400 }
      );
    }

    // Check if user has access to this branch
    if (!checkBranchAccess(user, branchId)) {
      return NextResponse.json(
        { message: 'Access denied. You do not have access to this branch.' },
        { status: 403 }
      );
    }

    const expense = new Expense({
      title,
      amount,
      date: new Date(date),
      branch: branchId,
      createdBy: user.name
    });

    await expense.save();

    return NextResponse.json(
      { message: 'Expense added successfully', expense },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { message: error.message || 'Error creating expense' },
      { status: error.message === 'No authorization token provided' ? 401 : 500 }
    );
  }
}
