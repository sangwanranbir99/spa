const { NextResponse } = require('next/server');
const connectDB = require('../../../../../lib/db');
const authMiddleware = require('../../../../../lib/authMiddleware');
const User = require('../../../../../models/User');

// Change password for authenticated user
export async function PUT(req) {
    try {
        await connectDB();

        const user = await authMiddleware(req);
        const { currentPassword, newPassword } = await req.json();

        // Validate required fields
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { message: 'Current password and new password are required' },
                { status: 400 }
            );
        }

        // Validate new password length
        if (newPassword.length < 6) {
            return NextResponse.json(
                { message: 'New password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        // Fetch the full user object with password
        const fullUser = await User.findById(user._id);
        if (!fullUser) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Verify current password
        // NOTE: In production, use bcrypt for password hashing
        if (fullUser.password !== currentPassword) {
            return NextResponse.json(
                { message: 'Current password is incorrect' },
                { status: 401 }
            );
        }

        // Update password
        // NOTE: In production, hash the password with bcrypt before saving
        fullUser.password = newPassword;
        await fullUser.save();

        return NextResponse.json(
            { message: 'Password changed successfully' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json(
            { message: error.message || 'Error changing password' },
            { status: 500 }
        );
    }
}
