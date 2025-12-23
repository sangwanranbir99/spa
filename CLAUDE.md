# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack Next.js 16 application for VIP Spa Management System (SMS) with integrated backend API routes. Built using App Router architecture with React 19, Tailwind CSS v4, MongoDB, and JWT authentication. Features role-based access control (admin, manager, employee) with branch-level data isolation.

## Development Commands

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build production bundle
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Initialize database with admin user
node scripts/init-admin.js
```

## Environment Setup

Required environment variables in `.env` file:

```bash
MONGO_URI=mongodb://localhost:27017/sms_database  # or MongoDB Atlas connection string
JWT_SECRET=your_strong_secret_key
```

## Architecture

### Full-Stack Structure

This is a **unified Next.js application** with both frontend and backend in a single codebase:

- **Frontend**: React components in `src/app/` and `src/components/`
- **Backend API**: Next.js API routes in `src/app/api/`
- **Database Models**: Mongoose schemas in `models/`
- **Middleware**: Authentication and authorization in `lib/`
- **Scripts**: Database initialization in `scripts/`

### Authentication Flow

1. User logs in via `/api/auth/login` with username/password
2. Server validates credentials against MongoDB User model
3. JWT token generated with user ID, role, and branch IDs
4. Token stored in localStorage on client
5. All API requests include `Authorization: Bearer <token>` header
6. `authMiddleware.js` validates token and populates user data
7. `roleMiddleware.js` enforces role-based and branch-level access

### Role-Based Access Control (RBAC)

**Three user roles with hierarchical permissions:**

- **Admin**: Full access to all branches and users. Can create/edit/delete branches and any users.
- **Manager**: Access to ONE assigned branch. Can view branch data and create/edit employees in their branch only.
- **Employee**: Access to ONE assigned branch. Read-only access to their branch data.

### Branch-Level Data Isolation

**Global Branch Context System:**

All dashboard pages use `BranchContext` (`src/context/BranchContext.js`) to manage selected branch state globally:

- **Admin**: Has access to ALL branches in the system (fetched dynamically via API). Can select "All Branches" (null) or specific branch via header dropdown. Data automatically filters based on selection. The `User.branches` field is ignored for admins - they always see all branches.
- **Manager**: Auto-assigned to their ONE branch (from `User.branches`) on login. Cannot change branch. Branch dropdown not shown.
- **Employee**: Auto-assigned to their ONE branch (from `User.branches`) on login. Cannot change branch. Branch dropdown not shown.

**How Branch Filtering Works:**

1. `BranchProvider` wraps all dashboard routes in `src/app/dashboard/layout.js`
2. On mount, BranchContext:
   - For **Admin**: Fetches ALL branches via `GET /api/branches`
   - For **Manager/Employee**: Uses branches from localStorage (set during login)
3. Header dropdown (DashboardLayout) lets admin switch between "All Branches" and any specific branch
4. Manager/Employee automatically see only their assigned branch (no dropdown shown)
5. All dashboard pages use `useBranch()` hook to access `selectedBranch` and react to changes
6. Pages refetch data automatically when `selectedBranch` changes via useEffect dependency
7. API calls include `?branchId={id}` query param when branch is selected

### Database Models

**User Model** (`models/User.js`):
- Fields: name, username, password (plaintext - should be hashed in production), role, status, phoneNumber, address, notes, branches[]
- Role enum: ['admin', 'manager', 'employee']
- Branches: Array of ObjectId references to Branch model

**Branch Model** (`models/Branch.js`):
- Fields: name, code (unique), address, contactNumber, email, status, notes
- Code is uppercase and unique identifier

**Massage Model** (`models/Massage.js`):
- Fields: name, description, time[], price[], discountedPrice[], branches[], status
- Time/price/discountedPrice are parallel arrays (same index = same duration option)
- Branches: Array of ObjectId references (massage availability per branch)

**Booking Model** (`models/Booking.js`):
- Fields: clientName, clientContact, massage (ref), massageDate, massageTime, massageEndTime, sessionTime, massageType, massagePrice, discount, staffDetails (ref to User), createdBy, cash, card, upi, otherPayment, roomNumber, branch (ref), updateHistory[]
- Payment split across cash/card/upi/otherPayment fields
- updateHistory tracks all changes with updatedBy, updatedAt, and field changes

**Client Model** (`models/Client.js`):
- Fields: name, phone (unique), username, visitHistory[]
- visitHistory: Array of Booking ObjectId references
- Phone is unique identifier for client lookup

**Expense Model** (`models/Expense.js`):
- Fields: title, amount, date, branch (ref), createdBy

### API Routes Structure

All routes use Next.js App Router API conventions (`route.js` files):

**Authentication Routes** (`src/app/api/auth/`):
- `POST /api/auth/login` - User login, returns JWT token with user data and branches
- `GET /api/auth/me` - Get current user details (requires auth)

**Branch Routes** (`src/app/api/branches/`):
- `GET /api/branches` - List branches (filtered by user role/access)
- `POST /api/branches` - Create branch (admin only)
- `GET /api/branches/[id]` - Get single branch (with access check)
- `PUT /api/branches/[id]` - Update branch (admin only)
- `DELETE /api/branches/[id]` - Delete branch (admin only)

**User Routes** (`src/app/api/users/`):
- `GET /api/users` - List users (admin sees all, manager sees their branch)
- `POST /api/users` - Create user (admin creates any, manager creates employees in their branch)
- `GET /api/users/[id]` - Get single user (with access check)
- `PUT /api/users/[id]` - Update user (role-based restrictions)
- `DELETE /api/users/[id]` - Delete user (admin only)

**Massage Routes** (`src/app/api/massages/`):
- `GET /api/massages` - List massages (filtered by branch access)
- `POST /api/massages` - Create massage
- `GET /api/massages/[id]` - Get single massage
- `PUT /api/massages/[id]` - Update massage
- `DELETE /api/massages/[id]` - Delete massage

**Booking Routes** (`src/app/api/bookings/`):
- `GET /api/bookings` - List bookings (supports `?branchId=` and `?date=` filters)
- `POST /api/bookings` - Create booking
- `GET /api/bookings/[id]` - Get single booking
- `PUT /api/bookings/[id]` - Update booking (tracks changes in updateHistory)
- `DELETE /api/bookings/[id]` - Delete booking
- `GET /api/bookings/date/[date]` - Get bookings for specific date
- `GET /api/bookings/client/[phone]` - Get bookings by client phone number
- `GET /api/bookings/stats` - Get booking statistics
- `GET /api/bookings/stats/employee` - Get employee-wise booking stats
- `GET /api/bookings/monthly-report` - Get monthly booking report

**Client Routes** (`src/app/api/client/`):
- `GET /api/client` - List clients
- `POST /api/client` - Create client
- `GET /api/client/[id]` - Get single client
- `PUT /api/client/[id]` - Update client
- `DELETE /api/client/[id]` - Delete client

**Expense Routes** (`src/app/api/expenses/`):
- `GET /api/expenses` - List expenses (supports `?branchId=` filter)
- `POST /api/expenses` - Create expense
- `GET /api/expenses/[id]` - Get single expense
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense
- `GET /api/expenses/stats` - Get expense statistics

**Employee Routes** (`src/app/api/employees/`):
- `GET /api/employees` - List employees (filtered by branch)
- `GET /api/employees/[id]` - Get single employee

### Frontend Architecture

**Layout Hierarchy**:
```
src/app/layout.js (Root Layout with ThemeProvider)
  └─ src/app/page.js (Auto-redirects to /dashboard or /login)
  └─ src/app/login/page.js (Login form)
  └─ src/app/dashboard/layout.js (Dashboard Layout wrapper with BranchProvider)
      └─ DashboardLayout component (Sidebar + Header)
          └─ src/app/dashboard/page.js (Dashboard home)
          └─ src/app/dashboard/branches/page.js (Branch management)
          └─ src/app/dashboard/employees/page.js (Employee management)
          └─ src/app/dashboard/massages/page.js (Massage services)
          └─ src/app/dashboard/bookings/page.js (Booking management)
          └─ src/app/dashboard/clients/page.js (Client list)
          └─ src/app/dashboard/expenses/page.js (Expense tracking)
          └─ src/app/dashboard/analytics/page.js (Analytics dashboard)
          └─ src/app/dashboard/booking-report/page.js (Booking reports)
          └─ src/app/dashboard/settings/page.js (User settings)
```

**Key Components**:

- `DashboardLayout.js`: Main dashboard wrapper with sidebar, header, branch dropdown, theme toggle, and user profile dropdown
- `Sidebar.js`: Navigation menu with role-based filtering
- `ThemeProvider.js`: next-themes wrapper for dark mode support

**Client-Side State**:
- User data stored in localStorage: `token`, `name`, `role`, `branches`
- Selected branch stored in localStorage: `selectedBranch`
- Theme preference stored in localStorage: `vip-sms-theme`

### Styling System

- **Tailwind CSS v4** with PostCSS plugin (`@tailwindcss/postcss`)
- Class-based dark mode using `next-themes` (attribute: "class")
- Dark mode classes: `dark:` prefix (e.g., `dark:bg-zinc-900`)
- Theme toggle button in dashboard header switches between light/dark
- Custom fonts: Geist Sans and Geist Mono via `next/font/google`

### Path Aliases

- `@/*` maps to `./src/*` (configured in jsconfig.json)
- Use `@/` prefix for all imports from src directory
- Example: `import Sidebar from '@/components/layout/Sidebar'`

### Database Connection

- Connection managed via `lib/db.js` with singleton pattern
- Uses Mongoose with modern configuration (no deprecated options)
- Connection cached to prevent multiple connections in serverless
- Called at start of each API route: `await connectDB()`

## Important Implementation Notes

### API Route Pattern

All API routes follow this structure:

```javascript
const { NextResponse } = require('next/server');
const connectDB = require('../../../../lib/db');
const authMiddleware = require('../../../../lib/authMiddleware');

export async function GET(req) {
  try {
    await connectDB();
    const user = await authMiddleware(req);

    // Role/branch access checks here
    // Business logic here

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 401 }
    );
  }
}
```

### Model Export Pattern

Models must use the conditional export pattern to prevent Mongoose recompilation errors:

```javascript
module.exports = mongoose.models.ModelName || mongoose.model('ModelName', schema);
```

### Populate Model Registration

**CRITICAL**: When using Mongoose `.populate()` in API routes, you MUST import all referenced models in that file, even if not directly used. In Next.js serverless environment, each API route loads independently - if a model isn't imported, Mongoose won't have its schema registered and will throw:

```
Schema hasn't been registered for model "ModelName"
```

**Fix**: Import all models that are referenced via `populate()`:

```javascript
const Booking = require('../models/Booking');
// Import models used in populate() to ensure schemas are registered
const Massage = require('../models/Massage');
const User = require('../models/User');
const Branch = require('../models/Branch');

// Now populate() will work
const booking = await Booking.findById(id)
  .populate('massage', 'name')
  .populate('staffDetails', 'name')
  .populate('branch', 'name code');
```

### Authentication Middleware Usage

Extract user from token:

```javascript
const user = await authMiddleware(req);
// user object includes: _id, name, username, role, branches (populated)
```

### Role-Based Authorization

Use `roleMiddleware.js` helper functions:

```javascript
const { checkRole, checkBranchAccess, checkManagerBranchAccess } = require('lib/roleMiddleware');

// Check if user has specific role (admin always passes)
if (!checkRole(user, 'admin')) { /* deny */ }

// Check if user can access specific branch
if (!checkBranchAccess(user, branchId)) { /* deny */ }

// Check if manager can assign employee to branch
if (!checkManagerBranchAccess(user, employeeBranchId)) { /* deny */ }
```

### Client-Side Protected Routes

Pages requiring authentication should check for token:

```javascript
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
  }
}, [router]);
```

### Branch Filtering in Dashboard Pages

**Pattern for implementing branch-aware pages:**

```javascript
'use client';

import { useBranch } from '@/context/BranchContext';

const MyDashboardPage = () => {
  const { selectedBranch, getBranchId } = useBranch();
  const [data, setData] = useState([]);

  // Refetch data when selected branch changes
  useEffect(() => {
    fetchData();
  }, [selectedBranch]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const branchId = getBranchId();

    // Add branchId as query param if branch is selected
    const branchParam = branchId ? `?branchId=${branchId}` : '';

    const res = await fetch(`/api/endpoint${branchParam}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setData(data);
  };

  return <div>{/* Display data filtered by branch */}</div>;
};
```

**Key Points:**
- Import `useBranch` hook from `@/context/BranchContext`
- Use `selectedBranch` as useEffect dependency to auto-refetch on branch change
- Use `getBranchId()` to get current branch ID for API calls
- Pass `branchId` as query parameter (`?branchId={id}`)
- For admins with no branch selected, `getBranchId()` returns `null` (= all branches)

## Configuration Files

- `next.config.mjs` - Next.js config with React Compiler enabled
- `eslint.config.mjs` - ESLint using flat config format
- `postcss.config.mjs` - PostCSS for Tailwind CSS v4
- `jsconfig.json` - Path aliases configuration
- `.env` - Environment variables (not committed)
- `.env.example` - Template for required environment variables

## React Compiler

- Enabled in next.config.mjs (`reactCompiler: true`)
- Provides automatic optimizations for React components
- No manual memoization needed in most cases

## Branch Context Data

The BranchContext also fetches and caches branch-related data:
- `branchDetails`: Current branch information
- `branchEmployees`: Employees for selected branch (or all employees for admin with no selection)
- `branchMassages`: Massages available for selected branch
- `refreshBranchData()`: Manual refresh function for data updates 
