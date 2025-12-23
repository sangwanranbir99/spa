const { NextResponse } = require('next/server');
const connectDB = require('../../../../../lib/db');
const authMiddleware = require('../../../../../lib/authMiddleware');
const { checkRole, checkBranchAccess } = require('../../../../../lib/roleMiddleware');
const Expense = require('../../../../../models/Expense');

// PATCH update expense
export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const user = await authMiddleware(req);

    // Only admin and manager can update expenses
    if (!checkRole(user, 'manager')) {
      return NextResponse.json(
        { message: 'Access denied. Manager or Admin only.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { title, amount } = body;

    const expense = await Expense.findById(id);

    if (!expense) {
      return NextResponse.json(
        { message: 'Expense not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this expense's branch
    if (!checkBranchAccess(user, expense.branch.toString())) {
      return NextResponse.json(
        { message: 'Access denied. You do not have access to this expense.' },
        { status: 403 }
      );
    }

    // Update fields if provided
    if (title !== undefined) expense.title = title;
    if (amount !== undefined) expense.amount = amount;

    await expense.save();

    return NextResponse.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { message: error.message || 'Error updating expense' },
      { status: error.message === 'No authorization token provided' ? 401 : 500 }
    );
  }
}

// DELETE expense
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const user = await authMiddleware(req);

    // Only admin can delete expenses
    if (!checkRole(user, 'admin')) {
      return NextResponse.json(
        { message: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const expense = await Expense.findById(id);

    if (!expense) {
      return NextResponse.json(
        { message: 'Expense not found' },
        { status: 404 }
      );
    }

    await Expense.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { message: error.message || 'Error deleting expense' },
      { status: error.message === 'No authorization token provided' ? 401 : 500 }
    );
  }
}
