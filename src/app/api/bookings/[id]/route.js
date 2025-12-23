const { NextResponse } = require('next/server');
const connectDB = require('../../../../../lib/db');
const authMiddleware = require('../../../../../lib/authMiddleware');
const Booking = require('../../../../../models/Booking');
// Import models used in populate() to ensure schemas are registered
const Massage = require('../../../../../models/Massage');
const User = require('../../../../../models/User');
const Branch = require('../../../../../models/Branch');

// GET single booking
export async function GET(req, { params }) {
  try {
    await connectDB();
    const user = await authMiddleware(req);
    const { id } = await params;

    const booking = await Booking.findById(id)
      .populate('massage', 'name time price discountedPrice')
      .populate('staffDetails', 'name')
      .populate('branch', 'name code')
      .populate({
        path: 'updateHistory.updatedBy',
        select: 'name'
      });

    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check branch access
    if (user.role !== 'admin') {
      const userBranchIds = user.branches.map(b => b._id.toString());
      if (!userBranchIds.includes(booking.branch._id.toString())) {
        return NextResponse.json(
          { message: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// PUT update booking (with update history tracking)
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const user = await authMiddleware(req);
    const { id } = await params;
    const updateData = await req.json();

    // Find existing booking
    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check branch access
    if (user.role !== 'admin') {
      const userBranchIds = user.branches.map(b => b._id.toString());
      if (!userBranchIds.includes(booking.branch.toString())) {
        return NextResponse.json(
          { message: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    }

    // Track changes for update history
    const changes = [];
    const trackableFields = [
      'massagePrice', 'cash', 'card', 'upi', 'otherPayment',
      'staffDetails', 'massageDate', 'massageTime', 'massageEndTime',
      'roomNumber', 'sessionTime', 'massage'
    ];

    trackableFields.forEach(field => {
      if (updateData[field] !== undefined && updateData[field] != booking[field]) {
        changes.push({
          field,
          oldValue: booking[field],
          newValue: updateData[field]
        });
      }
    });

    // Add update history entry if there are changes
    if (changes.length > 0) {
      if (!booking.updateHistory) {
        booking.updateHistory = [];
      }

      booking.updateHistory.push({
        updatedBy: user.name,
        updatedAt: new Date(),
        changes
      });
    }

    // Update booking fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'updateHistory') {
        booking[key] = updateData[key];
      }
    });

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate('massage', 'name')
      .populate('staffDetails', 'name')
      .populate('branch', 'name code');

    return NextResponse.json({
      message: 'Booking updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// DELETE booking (Admin only)
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const user = await authMiddleware(req);
    const { id } = await params;

    // Only admin can delete bookings
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Only administrators can delete bookings' },
        { status: 403 }
      );
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    await Booking.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
