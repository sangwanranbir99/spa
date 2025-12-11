const { NextResponse } = require('next/server');
const connectDB = require('../../../../../lib/db');
const authMiddleware = require('../../../../../lib/authMiddleware');
const { checkRole, checkManagerBranchAccess } = require('../../../../../lib/roleMiddleware');
const User = require('../../../../../models/User');

// GET single user by ID
export async function GET(req, { params }) {
    try {
        await connectDB();

        const currentUser = await authMiddleware(req);
        const { id } = params;

        const targetUser = await User.findById(id).select('-password').populate('branches');

        if (!targetUser) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Check access permissions
        if (currentUser.role === 'admin') {
            // Admin can view any user
            return NextResponse.json(targetUser);
        } else if (currentUser.role === 'manager') {
            // Manager can only view users in their branch
            const managerBranchIds = currentUser.branches.map(b => (b._id || b).toString());
            const userBranchIds = targetUser.branches.map(b => (b._id || b).toString());

            const hasCommonBranch = userBranchIds.some(branchId =>
                managerBranchIds.includes(branchId)
            );

            if (!hasCommonBranch) {
                return NextResponse.json(
                    { message: 'You do not have access to this user' },
                    { status: 403 }
                );
            }

            return NextResponse.json(targetUser);
        } else {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 403 }
            );
        }

    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { message: error.message || 'Error fetching user' },
            { status: 500 }
        );
    }
}

// UPDATE user by ID
export async function PUT(req, { params }) {
    try {
        await connectDB();

        const currentUser = await authMiddleware(req);
        const { id } = params;
        const updateData = await req.json();

        // Find the user to update
        const targetUser = await User.findById(id);

        if (!targetUser) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Check if username is being changed and if it already exists
        if (updateData.username && updateData.username !== targetUser.username) {
            const existingUser = await User.findOne({
                username: updateData.username,
                _id: { $ne: id }
            });
            if (existingUser) {
                return NextResponse.json(
                    { message: 'Username already exists' },
                    { status: 400 }
                );
            }
        }

        // Role-based update logic
        if (currentUser.role === 'admin') {
            // Admin can update any user
            const updatedUser = await User.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).select('-password').populate('branches');

            return NextResponse.json({
                message: 'User updated successfully',
                user: updatedUser
            });

        } else if (currentUser.role === 'manager') {
            // Manager can only update employees in their branch
            if (targetUser.role !== 'employee') {
                return NextResponse.json(
                    { message: 'Managers can only update employee users' },
                    { status: 403 }
                );
            }

            // Check if target user is in manager's branch
            const managerBranchId = (currentUser.branches[0]._id || currentUser.branches[0]).toString();
            const userBranchIds = targetUser.branches.map(b => b.toString());

            if (!userBranchIds.includes(managerBranchId)) {
                return NextResponse.json(
                    { message: 'You can only update employees in your branch' },
                    { status: 403 }
                );
            }

            // Managers cannot change role or branches
            delete updateData.role;
            delete updateData.branches;

            const updatedUser = await User.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).select('-password').populate('branches');

            return NextResponse.json({
                message: 'Employee updated successfully',
                user: updatedUser
            });

        } else {
            return NextResponse.json(
                { message: 'You do not have permission to update users' },
                { status: 403 }
            );
        }

    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { message: error.message || 'Error updating user' },
            { status: 500 }
        );
    }
}

// DELETE user by ID
export async function DELETE(req, { params }) {
    try {
        await connectDB();

        const currentUser = await authMiddleware(req);
        const { id } = params;

        // Only admin can delete users
        if (!checkRole(currentUser, 'admin')) {
            return NextResponse.json(
                { message: 'Only admins can delete users' },
                { status: 403 }
            );
        }

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { message: error.message || 'Error deleting user' },
            { status: 500 }
        );
    }
}
