const { NextResponse } = require('next/server');
const connectDB = require('../../../../../lib/db');
const authMiddleware = require('../../../../../lib/authMiddleware');
const { checkBranchAccess } = require('../../../../../lib/roleMiddleware');
const User = require('../../../../../models/User');

// GET single employee
export async function GET(req, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(req);
        const { id } = await params;

        // Only admin and manager can access employees
        if (!['admin', 'manager'].includes(user.role)) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 403 }
            );
        }

        const employee = await User.findById(id).populate('branches');

        if (!employee || !['employee', 'manager'].includes(employee.role)) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Check if user has access to this employee's branch(es)
        if (user.role === 'manager') {
            const managerBranchIds = user.branches.map(b => b._id.toString());
            const employeeBranchIds = employee.branches.map(b => b._id.toString());

            const hasAccess = employeeBranchIds.some(branchId =>
                managerBranchIds.includes(branchId)
            );

            if (!hasAccess) {
                return NextResponse.json(
                    { message: 'You do not have access to this employee' },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json(employee);

    } catch (error) {
        console.error('Get employee error:', error);
        return NextResponse.json(
            { message: error.message || 'Error fetching employee' },
            { status: 500 }
        );
    }
}

// UPDATE employee
export async function PUT(req, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(req);
        const { id } = await params;
        const updateData = await req.json();

        // Only admin and manager can update employees
        if (!['admin', 'manager'].includes(user.role)) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Find the user
        const employee = await User.findById(id);

        if (!employee || !['employee', 'manager'].includes(employee.role)) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Check if user has access to this user
        if (user.role === 'manager') {
            const managerBranchIds = user.branches.map(b => b._id.toString());
            const targetUserBranchIds = employee.branches.map(b => b.toString());

            const hasAccess = targetUserBranchIds.some(branchId =>
                managerBranchIds.includes(branchId)
            );

            if (!hasAccess) {
                return NextResponse.json(
                    { message: 'You do not have access to this user' },
                    { status: 403 }
                );
            }

            // Manager cannot change role to manager
            if (updateData.role === 'manager') {
                return NextResponse.json(
                    { message: 'Managers cannot promote users to manager role' },
                    { status: 403 }
                );
            }

            // Manager cannot edit existing managers
            if (employee.role === 'manager') {
                return NextResponse.json(
                    { message: 'Managers cannot edit other managers' },
                    { status: 403 }
                );
            }

            // If manager is updating branches, validate they have access to new branches
            if (updateData.branches) {
                const newBranchIds = updateData.branches.map(id => id.toString());
                const hasAccessToNewBranches = newBranchIds.every(branchId =>
                    managerBranchIds.includes(branchId)
                );

                if (!hasAccessToNewBranches) {
                    return NextResponse.json(
                        { message: 'You can only assign users to your own branch(es)' },
                        { status: 403 }
                    );
                }
            }
        }

        // Check if username is being updated and if it already exists
        if (updateData.username && updateData.username !== employee.username) {
            const existingUser = await User.findOne({ username: updateData.username, _id: { $ne: id } });
            if (existingUser) {
                return NextResponse.json(
                    { message: 'Username already exists' },
                    { status: 400 }
                );
            }
        }

        // Validate role if being changed
        if (updateData.role && !['employee', 'manager'].includes(updateData.role)) {
            return NextResponse.json(
                { message: 'Role must be either employee or manager' },
                { status: 400 }
            );
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('branches');

        return NextResponse.json({
            message: 'User updated successfully',
            employee: updatedUser
        });

    } catch (error) {
        console.error('Update employee error:', error);
        return NextResponse.json(
            { message: error.message || 'Error updating employee' },
            { status: 500 }
        );
    }
}

// DELETE employee (Admin only)
export async function DELETE(req, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(req);
        const { id } = await params;

        // Only admin can delete employees
        if (user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Only administrators can delete employees' },
                { status: 403 }
            );
        }

        const employee = await User.findById(id);

        if (!employee || !['employee', 'manager'].includes(employee.role)) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        await User.findByIdAndDelete(id);

        return NextResponse.json({
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete employee error:', error);
        return NextResponse.json(
            { message: error.message || 'Error deleting employee' },
            { status: 500 }
        );
    }
}
