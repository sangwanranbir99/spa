const { NextResponse } = require('next/server');
const connectDB = require('../../../../lib/db');
const authMiddleware = require('../../../../lib/authMiddleware');
const { checkRole, checkManagerBranchAccess } = require('../../../../lib/roleMiddleware');
const User = require('../../../../models/User');

// GET all employees (filtered by branch and role)
export async function GET(req) {
    try {
        await connectDB();

        const user = await authMiddleware(req);

        // Only admin and manager can access employees
        if (!['admin', 'manager'].includes(user.role)) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Get branchId from query params
        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get('branchId');

        let query = { role: { $in: ['employee', 'manager'] } };

        if (user.role === 'admin') {
            // Admin can see all employees or filtered by branch
            if (branchId) {
                // Find employees where branchId exists in their branches array
                query.branches = { $in: [branchId] };
            }
        } else if (user.role === 'manager') {
            // Manager can only see employees in their branch(es)
            const branchIds = user.branches.map(b => b._id || b);

            if (branchId) {
                // Check if manager has access to this branch
                if (!branchIds.some(id => id.toString() === branchId)) {
                    return NextResponse.json(
                        { message: 'You do not have access to this branch' },
                        { status: 403 }
                    );
                }
                // Find employees where this specific branchId exists in their branches array
                query.branches = { $in: [branchId] };
            } else {
                // Show all employees that have at least one of manager's branches
                query.branches = { $in: branchIds };
            }
        }

        const employees = await User.find(query).populate('branches');

        return NextResponse.json(employees);

    } catch (error) {
        console.error('Get employees error:', error);
        return NextResponse.json(
            { message: error.message || 'Error fetching employees' },
            { status: 500 }
        );
    }
}

// CREATE new employee
export async function POST(req) {
    try {
        await connectDB();

        const user = await authMiddleware(req);
        const employeeData = await req.json();

        // Only admin and manager can create employees
        if (!['admin', 'manager'].includes(user.role)) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Validate required fields
        if (!employeeData.name || !employeeData.username || !employeeData.password || !employeeData.role) {
            return NextResponse.json(
                { message: 'Name, username, password, and role are required' },
                { status: 400 }
            );
        }

        // Validate role
        if (!['employee', 'manager'].includes(employeeData.role)) {
            return NextResponse.json(
                { message: 'Role must be either employee or manager' },
                { status: 400 }
            );
        }

        // Validate branches
        if (!employeeData.branches || employeeData.branches.length === 0) {
            return NextResponse.json(
                { message: 'User must be assigned to at least one branch' },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username: employeeData.username });
        if (existingUser) {
            return NextResponse.json(
                { message: 'Username already exists' },
                { status: 400 }
            );
        }

        // Role-based validation
        if (user.role === 'manager') {
            // Manager can only create employees (not other managers)
            if (employeeData.role === 'manager') {
                return NextResponse.json(
                    { message: 'Managers cannot create other managers' },
                    { status: 403 }
                );
            }

            // Manager can only assign users to their own branch(es)
            const managerBranchIds = user.branches.map(b => b._id.toString());
            const userBranchIds = employeeData.branches.map(id => id.toString());

            const hasAccess = userBranchIds.every(branchId =>
                managerBranchIds.includes(branchId)
            );

            if (!hasAccess) {
                return NextResponse.json(
                    { message: 'You can only assign users to your own branch(es)' },
                    { status: 403 }
                );
            }
        }

        // Create user with specified role
        const newUser = new User({
            ...employeeData,
            status: employeeData.status !== undefined ? employeeData.status : true
        });

        await newUser.save();

        const savedUser = await User.findById(newUser._id).populate('branches');

        return NextResponse.json(
            { message: `${employeeData.role === 'manager' ? 'Manager' : 'Employee'} created successfully`, user: savedUser },
            { status: 201 }
        );

    } catch (error) {
        console.error('Create employee error:', error);
        return NextResponse.json(
            { message: error.message || 'Error creating employee' },
            { status: 500 }
        );
    }
}
