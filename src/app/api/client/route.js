const { NextResponse } = require('next/server');
const connectDB = require('../../../../lib/db');
const authMiddleware = require('../../../../lib/authMiddleware');
const Client = require('../../../../models/Client');

// GET all clients with optional search
export async function GET(req) {
  try {
    await connectDB();
    const user = await authMiddleware(req);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    let query = {};

    // Build search query if search parameter provided
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const clients = await Client.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
