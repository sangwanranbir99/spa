const { NextResponse } = require('next/server');
const connectDB = require('../../../../lib/db');
const authMiddleware = require('../../../../lib/authMiddleware');
const { checkRole } = require('../../../../lib/roleMiddleware');
const Branch = require('../../../../models/Branch');

// GET all branches (based on user role and access)
export async function GET(req) {
    try {
        await connectDB();

        const user = await authMiddleware(req);

        let branches;

        if (user.role === 'admin') {
            // Admin can see all branches
            branches = await Branch.find();
        } else if (user.role === 'manager' || user.role === 'employee') {
            // Manager and Employee can only see their assigned branches
            if (!user.branches || user.branches.length === 0) {
                console.warn(`User ${user._id} (${user.role}) has no branches assigned`);
                return NextResponse.json([]);
            }
            const branchIds = user.branches.map(b => b._id || b);
            branches = await Branch.find({ _id: { $in: branchIds } });
        } else {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 403 }
            );
        }

        console.log(`Returning ${branches.length} branches for user role: ${user.role}`);
        return NextResponse.json(branches);

    } catch (error) {
        console.error('Get branches error:', error);
        return NextResponse.json(
            { message: error.message || 'Error fetching branches' },
            { status: 401 }
        );
    }
}

// CREATE new branch (only admin)
export async function POST(req) {
    try {
        await connectDB();

        const user = await authMiddleware(req);

        // Only admin can create branches
        if (!checkRole(user, 'admin')) {
            return NextResponse.json(
                { message: 'Only admins can create branches' },
                { status: 403 }
            );
        }

        const branchData = await req.json();
        console.log('Received branch data:', branchData);
        console.log('Room count value:', branchData.roomCount, 'Type:', typeof branchData.roomCount);

        // Check if branch code already exists
        const existingBranch = await Branch.findOne({ code: branchData.code });
        if (existingBranch) {
            return NextResponse.json(
                { message: 'Branch code already exists' },
                { status: 400 }
            );
        }

        const branch = new Branch(branchData);
        await branch.save();

        console.log('Branch saved to database:', branch);
        console.log('Saved roomCount:', branch.roomCount);

        return NextResponse.json(
            { message: 'Branch created successfully', branch },
            { status: 201 }
        );

    } catch (error) {
        console.error('Create branch error:', error);
        return NextResponse.json(
            { message: error.message || 'Error creating branch' },
            { status: 500 }
        );
    }
}
