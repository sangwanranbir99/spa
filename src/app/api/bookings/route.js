const { NextResponse } = require('next/server');
const connectDB = require('../../../../lib/db');
const authMiddleware = require('../../../../lib/authMiddleware');
const Booking = require('../../../../models/Booking');
const Client = require('../../../../models/Client');
const Massage = require('../../../../models/Massage');
const mongoose = require('mongoose');

// GET all bookings (filtered by branch and date)
export async function GET(req) {
  try {
    await connectDB();
    const user = await authMiddleware(req);

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const date = searchParams.get('date');

    let query = {};

    // Branch filtering
    if (user.role === 'admin') {
      // Admin can see bookings from selected branch or all branches
      if (branchId && branchId !== 'null') {
        query.branch = new mongoose.Types.ObjectId(branchId);
      }
    } else {
      // Manager and employee see bookings from their assigned branches
      const userBranchIds = user.branches.map(b => b._id || b);
      if (branchId) {
        // Verify user has access to this branch
        if (!userBranchIds.some(id => id.toString() === branchId)) {
          return NextResponse.json(
            { message: 'You do not have access to this branch' },
            { status: 403 }
          );
        }
        query.branch = new mongoose.Types.ObjectId(branchId);
      } else {
        query.branch = { $in: userBranchIds };
      }
    }

    // Date filtering
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.massageDate = { $gte: startDate, $lte: endDate };
    }

    const bookings = await Booking.find(query)
      .populate('massage', 'name')
      .populate('staffDetails', 'name')
      .populate('branch', 'name code')
      .sort({ massageDate: -1, massageTime: -1 });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// POST create new booking
export async function POST(req) {
  try {
    await connectDB();
    const user = await authMiddleware(req);

    const body = await req.json();
    const {
      clientName,
      clientContact,
      massage,
      massageDate,
      massageTime,
      massageEndTime,
      sessionTime,
      staffDetails,
      cash = 0,
      card = 0,
      upi = 0,
      massagePrice,
      otherPayment = 0,
      roomNumber,
      branch
    } = body;

    // Check branch access
    if (user.role !== 'admin') {
      const userBranchIds = user.branches.map(b => b._id.toString());
      if (!userBranchIds.includes(branch)) {
        return NextResponse.json(
          { message: 'You do not have access to this branch' },
          { status: 403 }
        );
      }
    }

    // Find or create client
    let client = await Client.findOne({ phone: clientContact });
    if (!client) {
      client = new Client({
        name: clientName,
        phone: clientContact,
        visitHistory: [],
      });
      await client.save();
    }

    // Get massage details
    const selectedMassage = await Massage.findById(massage);
    if (!selectedMassage) {
      return NextResponse.json(
        { message: 'Massage type not found' },
        { status: 404 }
      );
    }

    // Create the booking
    const booking = new Booking({
      clientName,
      clientContact,
      massage,
      massageDate,
      massageTime,
      massageEndTime,
      sessionTime,
      massageType: selectedMassage.name,
      massagePrice,
      staffDetails,
      createdBy: user.name,
      cash,
      card,
      upi,
      otherPayment,
      roomNumber,
      branch,
      updateHistory: []
    });

    await booking.save();

    // Add booking to client's visit history
    client.visitHistory.push(booking._id);
    await client.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('massage', 'name')
      .populate('staffDetails', 'name')
      .populate('branch', 'name code');

    return NextResponse.json(
      { message: 'Booking created successfully', booking: populatedBooking },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
