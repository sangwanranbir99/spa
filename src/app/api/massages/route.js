const { NextResponse } = require('next/server');
const connectDB = require('../../../../lib/db');
const authMiddleware = require('../../../../lib/authMiddleware');
const Massage = require('../../../../models/Massage');

// GET all massages (filtered by branch and role)
export async function GET(req) {
    try {
        await connectDB();

        const user = await authMiddleware(req);

        // All roles can view massages
        if (!['admin', 'manager', 'employee'].includes(user.role)) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Get branchId and search query from params
        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get('branchId');
        const searchName = searchParams.get('name');

        let query = {};

        // Add search by name if provided
        if (searchName) {
            query.name = { $regex: searchName, $options: 'i' };
        }

        if (user.role === 'admin') {
            // Admin can see all massages or filtered by branch
            if (branchId) {
                query.branches = { $in: [branchId] };
            }
        } else if (user.role === 'manager' || user.role === 'employee') {
            // Manager and Employee can only see massages in their branch(es)
            const branchIds = user.branches.map(b => b._id || b);

            if (branchId) {
                // Check if user has access to this branch
                if (!branchIds.some(id => id.toString() === branchId)) {
                    return NextResponse.json(
                        { message: 'You do not have access to this branch' },
                        { status: 403 }
                    );
                }
                query.branches = { $in: [branchId] };
            } else {
                // Show all massages in user's branches
                query.branches = { $in: branchIds };
            }
        }

        const massages = await Massage.find(query).populate('branches');

        return NextResponse.json(massages);

    } catch (error) {
        console.error('Get massages error:', error);
        return NextResponse.json(
            { message: error.message || 'Error fetching massages' },
            { status: 500 }
        );
    }
}

// CREATE new massage
export async function POST(req) {
    try {
        await connectDB();

        const user = await authMiddleware(req);
        const massageData = await req.json();

        // Only admin and manager can create massages
        if (!['admin', 'manager'].includes(user.role)) {
            return NextResponse.json(
                { message: 'Only admin and manager can create massages' },
                { status: 403 }
            );
        }

        // Validate required fields
        if (!massageData.name || !massageData.time || !massageData.price || !massageData.discountedPrice) {
            return NextResponse.json(
                { message: 'Name, time, price, and discounted price are required' },
                { status: 400 }
            );
        }

        // Validate arrays have same length
        if (massageData.time.length !== massageData.price.length ||
            massageData.time.length !== massageData.discountedPrice.length) {
            return NextResponse.json(
                { message: 'Time, price, and discounted price arrays must have the same length' },
                { status: 400 }
            );
        }

        // Validate branches
        if (!massageData.branches || massageData.branches.length === 0) {
            return NextResponse.json(
                { message: 'Massage must be assigned to at least one branch' },
                { status: 400 }
            );
        }

        // Role-based validation
        if (user.role === 'manager') {
            // Manager can only assign massages to their own branch(es)
            const managerBranchIds = user.branches.map(b => b._id.toString());
            const massageBranchIds = massageData.branches.map(id => id.toString());

            const hasAccess = massageBranchIds.every(branchId =>
                managerBranchIds.includes(branchId)
            );

            if (!hasAccess) {
                return NextResponse.json(
                    { message: 'You can only assign massages to your own branch(es)' },
                    { status: 403 }
                );
            }
        }

        // Create massage
        const newMassage = new Massage({
            ...massageData,
            status: massageData.status !== undefined ? massageData.status : true
        });

        await newMassage.save();

        const savedMassage = await Massage.findById(newMassage._id).populate('branches');

        return NextResponse.json(
            { message: 'Massage created successfully', massage: savedMassage },
            { status: 201 }
        );

    } catch (error) {
        console.error('Create massage error:', error);
        return NextResponse.json(
            { message: error.message || 'Error creating massage' },
            { status: 500 }
        );
    }
}
