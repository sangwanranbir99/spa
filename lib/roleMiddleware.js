const checkRole = (user, allowedRoles) => {
    // Superadmin and Admin can access everything
    if (user.role === 'superadmin' || user.role === 'admin') {
        return true;
    }

    // Check if user's role is in the allowed roles array
    if (Array.isArray(allowedRoles)) {
        return allowedRoles.includes(user.role);
    }

    // Check single role
    return user.role === allowedRoles;
};

const checkBranchAccess = (user, branchId) => {
    // Superadmin and Admin can access all branches
    if (user.role === 'superadmin' || user.role === 'admin') {
        return true;
    }

    // Check if user has access to the specific branch
    if (!user.branches || user.branches.length === 0) {
        return false;
    }

    // Convert branchId to string for comparison
    const branchIdStr = branchId.toString();
    return user.branches.some(branch =>
        (branch._id || branch).toString() === branchIdStr
    );
};

const checkManagerBranchAccess = (user, employeeBranchId) => {
    // Only for managers assigning employees
    if (user.role !== 'manager') {
        return false;
    }

    // Manager can only assign to their own branch
    if (!user.branches || user.branches.length === 0) {
        return false;
    }

    const userBranchId = (user.branches[0]._id || user.branches[0]).toString();
    return userBranchId === employeeBranchId.toString();
};

module.exports = {
    checkRole,
    checkBranchAccess,
    checkManagerBranchAccess
};
