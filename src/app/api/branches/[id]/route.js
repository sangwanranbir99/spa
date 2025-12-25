const { NextResponse } = require('next/server');
const connectDB = require('../../../../../lib/db');
const authMiddleware = require('../../../../../lib/authMiddleware');
const { checkRole, checkBranchAccess } = require('../../../../../lib/roleMiddleware');
const Branch = require('../../../../../models/Branch');

// GET single branch by ID
export async function GET(req, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(req);
        const { id } = await params;

        // Check if user has access to this branch
        if (!checkBranchAccess(user, id)) {
            return NextResponse.json(
                { message: 'You do not have access to this branch' },
                { status: 403 }
            );
        }

        const branch = await Branch.findById(id);

        if (!branch) {
            return NextResponse.json(
                { message: 'Branch not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(branch);

    } catch (error) {
        console.error('Get branch error:', error);
        return NextResponse.json(
            { message: error.message || 'Error fetching branch' },
            { status: 500 }
        );
    }
}

// UPDATE branch by ID (only admin)
export async function PUT(req, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(req);
        const { id } = await params;

        // Only superadmin can update branches
        if (!checkRole(user, 'superadmin')) {
            return NextResponse.json(
                { message: 'Only superadmins can update branches' },
                { status: 403 }
            );
        }

        const updateData = await req.json();

        // If code is being updated, check if it already exists
        if (updateData.code) {
            const existingBranch = await Branch.findOne({
                code: updateData.code,
                _id: { $ne: id }
            });
            if (existingBranch) {
                return NextResponse.json(
                    { message: 'Branch code already exists' },
                    { status: 400 }
                );
            }
        }

        const branch = await Branch.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!branch) {
            return NextResponse.json(
                { message: 'Branch not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Branch updated successfully',
            branch
        });

    } catch (error) {
        console.error('Update branch error:', error);
        return NextResponse.json(
            { message: error.message || 'Error updating branch' },
            { status: 500 }
        );
    }
}

// DELETE branch by ID (only admin)
export async function DELETE(req, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(req);
        const { id } = await params;

        // Only superadmin can delete branches
        if (!checkRole(user, 'superadmin')) {
            return NextResponse.json(
                { message: 'Only superadmins can delete branches' },
                { status: 403 }
            );
        }

        const branch = await Branch.findByIdAndDelete(id);

        if (!branch) {
            return NextResponse.json(
                { message: 'Branch not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Branch deleted successfully'
        });

    } catch (error) {
        console.error('Delete branch error:', error);
        return NextResponse.json(
            { message: error.message || 'Error deleting branch' },
            { status: 500 }
        );
    }
}
