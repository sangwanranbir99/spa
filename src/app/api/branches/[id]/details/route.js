const { NextResponse } = require('next/server');
const connectDB = require('../../../../../../lib/db');
const authMiddleware = require('../../../../../../lib/authMiddleware');
const { checkBranchAccess } = require('../../../../../../lib/roleMiddleware');
const Branch = require('../../../../../../models/Branch');
const User = require('../../../../../../models/User');
const Massage = require('../../../../../../models/Massage');

// GET branch details with all related data (employees, massages)
export async function GET(req, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(req);
        const { id: branchId } = await params;

        // Verify user has access to this branch
        if (!checkBranchAccess(user, branchId)) {
            return NextResponse.json(
                { message: 'You do not have access to this branch' },
                { status: 403 }
            );
        }

        // Fetch branch details
        const branch = await Branch.findById(branchId);
        if (!branch) {
            return NextResponse.json(
                { message: 'Branch not found' },
                { status: 404 }
            );
        }

        // Fetch employees for this branch (exclude admin users)
        const employees = await User.find({
            branches: { $in: [branchId] },
            status: true,
            role: { $ne: 'admin' } // Exclude admin users
        }).populate('branches').select('-password');

        // Fetch massages for this branch
        const massages = await Massage.find({
            branches: { $in: [branchId] },
            status: true
        }).populate('branches');

        // Return all data in one response
        return NextResponse.json({
            branch,
            employees,
            massages,
            totalEmployees: employees.length,
            totalMassages: massages.length
        });

    } catch (error) {
        console.error('Get branch details error:', error);
        return NextResponse.json(
            { message: error.message || 'Error fetching branch details' },
            { status: 500 }
        );
    }
}
