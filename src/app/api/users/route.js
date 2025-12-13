const { NextResponse } = require('next/server');
const connectDB = require('../../../../lib/db');
const authMiddleware = require('../../../../lib/authMiddleware');
const { checkRole, checkManagerBranchAccess } = require('../../../../lib/roleMiddleware');
const User = require('../../../../models/User');

// GET all users (based on role)
export async function GET(req) {
    try {
        await connectDB();

        const user = await authMiddleware(req);

        // Get branchId from query params
        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get('branchId');

        let query = {};
        let users;

        if (user.role === 'admin') {
            // Admin can see all users or filter by branch
            if (branchId && branchId !== 'null') {
                query.branches = branchId;
            }
            users = await User.find(query).select('-password').populate('branches');
        } else if (user.role === 'manager') {
            // Manager can see users in their branch
            const branchIds = user.branches.map(b => b._id || b);

            // If branchId is provided, verify manager has access to it
            if (branchId && branchId !== 'null') {
                if (!branchIds.some(id => id.toString() === branchId)) {
                    return NextResponse.json(
                        { message: 'You do not have access to this branch' },
                        { status: 403 }
                    );
                }
                query.branches = branchId;
            } else {
                query.branches = { $in: branchIds };
            }

            users = await User.find(query).select('-password').populate('branches');
        } else {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 403 }
            );
        }

        return NextResponse.json({ users });

    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json(
            { message: error.message || 'Error fetching users' },
            { status: 401 }
        );
    }
}

// CREATE new user
export async function POST(req) {
    try {
        await connectDB();

        const user = await authMiddleware(req);
        const userData = await req.json();

        // Validate required fields
        if (!userData.name || !userData.username || !userData.password || !userData.role) {
            return NextResponse.json(
                { message: 'Name, username, password, and role are required' },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username: userData.username });
        if (existingUser) {
            return NextResponse.json(
                { message: 'Username already exists' },
                { status: 400 }
            );
        }

        // Role-based creation logic
        if (user.role === 'admin') {
            // Admin can create any user with any branches
            const newUser = new User(userData);
            await newUser.save();

            const savedUser = await User.findById(newUser._id).select('-password').populate('branches');
            return NextResponse.json(
                { message: 'User created successfully', user: savedUser },
                { status: 201 }
            );

        } else if (user.role === 'manager') {
            // Manager can only create employees in their branch
            if (userData.role !== 'employee') {
                return NextResponse.json(
                    { message: 'Managers can only create employee users' },
                    { status: 403 }
                );
            }

            // Validate branch assignment
            if (!userData.branches || userData.branches.length === 0) {
                return NextResponse.json(
                    { message: 'Employee must be assigned to a branch' },
                    { status: 400 }
                );
            }

            // Check if manager has access to the assigned branch
            const employeeBranchId = userData.branches[0];
            if (!checkManagerBranchAccess(user, employeeBranchId)) {
                return NextResponse.json(
                    { message: 'You can only assign employees to your own branch' },
                    { status: 403 }
                );
            }

            const newUser = new User(userData);
            await newUser.save();

            const savedUser = await User.findById(newUser._id).select('-password').populate('branches');
            return NextResponse.json(
                { message: 'Employee created successfully', user: savedUser },
                { status: 201 }
            );

        } else {
            return NextResponse.json(
                { message: 'You do not have permission to create users' },
                { status: 403 }
            );
        }

    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json(
            { message: error.message || 'Error creating user' },
            { status: 500 }
        );
    }
}
