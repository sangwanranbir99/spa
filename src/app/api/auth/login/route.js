const { NextResponse } = require('next/server');
const jwt = require('jsonwebtoken');
const connectDB = require('../../../../../lib/db');
const User = require('../../../../../models/User');

export async function POST(req) {
    try {
        await connectDB();

        const { username, password } = await req.json();

        // Find user by username and populate branches
        const user = await User.findOne({ username }).populate('branches');

        // Check if user exists
        if (!user) {
            return NextResponse.json(
                { message: 'Invalid username or password' },
                { status: 400 }
            );
        }

        // Check if user is active
        if (!user.status) {
            return NextResponse.json(
                { message: 'Your account is inactive. Please contact the administrator.' },
                { status: 403 }
            );
        }

        // Check if password matches
        if (password !== user.password) {
            return NextResponse.json(
                { message: 'Invalid username or password' },
                { status: 400 }
            );
        }

        // Create token with branch information
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                branches: user.branches.map(b => b._id)
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return NextResponse.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                role: user.role,
                branches: user.branches
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Error logging in', error: error.message },
            { status: 500 }
        );
    }
}
