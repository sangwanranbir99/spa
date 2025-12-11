const { NextResponse } = require('next/server');
const connectDB = require('../../../../../lib/db');
const authMiddleware = require('../../../../../lib/authMiddleware');

export async function GET(req) {
    try {
        await connectDB();

        const user = await authMiddleware(req);

        return NextResponse.json({
            id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
            status: user.status,
            phoneNumber: user.phoneNumber,
            address: user.address,
            notes: user.notes,
            branches: user.branches
        });

    } catch (error) {
        console.error('Get user details error:', error);
        return NextResponse.json(
            { message: error.message || 'Error fetching user details' },
            { status: 401 }
        );
    }
}
