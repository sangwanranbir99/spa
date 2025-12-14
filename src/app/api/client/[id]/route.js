const { NextResponse } = require('next/server');
const connectDB = require('../../../../../lib/db');
const authMiddleware = require('../../../../../lib/authMiddleware');
const Client = require('../../../../../models/Client');

// GET client by ID with visit history
export async function GET(req, { params }) {
  try {
    await connectDB();
    const user = await authMiddleware(req);
    const { id } = await params;

    const client = await Client.findById(id).populate({
      path: 'visitHistory',
      options: { sort: { massageDate: -1 } },
      populate: [
        {
          path: 'massage',
          select: 'name description time price discountedPrice',
        },
        {
          path: 'staffDetails',
          select: 'name role',
        },
        {
          path: 'branch',
          select: 'name code',
        },
      ],
    });

    if (!client) {
      return NextResponse.json(
        { message: 'Client not found' },
        { status: 404 }
      );
    }

    const totalVisits = client.visitHistory.length;

    return NextResponse.json({ client, totalVisits });
  } catch (error) {
    console.error('Get client details error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
