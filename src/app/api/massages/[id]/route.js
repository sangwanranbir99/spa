const { NextResponse } = require('next/server');
const connectDB = require('../../../../../lib/db');
const authMiddleware = require('../../../../../lib/authMiddleware');
const Massage = require('../../../../../models/Massage');

// GET single massage
export async function GET(req, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(req);
        const { id } = await params;

        // All roles can view massages
        if (!['admin', 'manager', 'employee'].includes(user.role)) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 403 }
            );
        }

        const massage = await Massage.findById(id).populate('branches');

        if (!massage) {
            return NextResponse.json(
                { message: 'Massage not found' },
                { status: 404 }
            );
        }

        // Check if user has access to this massage's branch(es)
        if (user.role === 'manager' || user.role === 'employee') {
            const userBranchIds = user.branches.map(b => b._id.toString());
            const massageBranchIds = massage.branches.map(b => b._id.toString());

            const hasAccess = massageBranchIds.some(branchId =>
                userBranchIds.includes(branchId)
            );

            if (!hasAccess) {
                return NextResponse.json(
                    { message: 'You do not have access to this massage' },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json(massage);

    } catch (error) {
        console.error('Get massage error:', error);
        return NextResponse.json(
            { message: error.message || 'Error fetching massage' },
            { status: 500 }
        );
    }
}

// UPDATE massage
export async function PUT(req, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(req);
        const { id } = await params;
        const updateData = await req.json();

        // Only admin and manager can update massages
        if (!['admin', 'manager'].includes(user.role)) {
            return NextResponse.json(
                { message: 'Only admin and manager can update massages' },
                { status: 403 }
            );
        }

        // Find the massage
        const massage = await Massage.findById(id);

        if (!massage) {
            return NextResponse.json(
                { message: 'Massage not found' },
                { status: 404 }
            );
        }

        // Check if user has access to this massage
        if (user.role === 'manager') {
            const managerBranchIds = user.branches.map(b => b._id.toString());
            const massageBranchIds = massage.branches.map(b => b.toString());

            const hasAccess = massageBranchIds.some(branchId =>
                managerBranchIds.includes(branchId)
            );

            if (!hasAccess) {
                return NextResponse.json(
                    { message: 'You do not have access to this massage' },
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
                        { message: 'You can only assign massages to your own branch(es)' },
                        { status: 403 }
                    );
                }
            }
        }

        // Validate arrays have same length if updating
        if (updateData.time || updateData.price || updateData.discountedPrice) {
            const timeLength = updateData.time ? updateData.time.length : massage.time.length;
            const priceLength = updateData.price ? updateData.price.length : massage.price.length;
            const discountedPriceLength = updateData.discountedPrice ? updateData.discountedPrice.length : massage.discountedPrice.length;

            if (timeLength !== priceLength || timeLength !== discountedPriceLength) {
                return NextResponse.json(
                    { message: 'Time, price, and discounted price arrays must have the same length' },
                    { status: 400 }
                );
            }
        }

        // Update massage
        const updatedMassage = await Massage.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('branches');

        return NextResponse.json({
            message: 'Massage updated successfully',
            massage: updatedMassage
        });

    } catch (error) {
        console.error('Update massage error:', error);
        return NextResponse.json(
            { message: error.message || 'Error updating massage' },
            { status: 500 }
        );
    }
}

// DELETE massage (Admin only)
export async function DELETE(req, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(req);
        const { id } = await params;

        // Only admin can delete massages
        if (user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Only administrators can delete massages' },
                { status: 403 }
            );
        }

        const massage = await Massage.findById(id);

        if (!massage) {
            return NextResponse.json(
                { message: 'Massage not found' },
                { status: 404 }
            );
        }

        await Massage.findByIdAndDelete(id);

        return NextResponse.json({
            message: 'Massage deleted successfully'
        });

    } catch (error) {
        console.error('Delete massage error:', error);
        return NextResponse.json(
            { message: error.message || 'Error deleting massage' },
            { status: 500 }
        );
    }
}
