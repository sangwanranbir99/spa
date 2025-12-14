const { NextResponse } = require('next/server');
const connectDB = require('../../../../../lib/db');
const authMiddleware = require('../../../../../lib/authMiddleware');
const Booking = require('../../../../../models/Booking');

// GET booking statistics (daily and monthly)
export async function GET(req) {
    try {
        await connectDB();

        const user = await authMiddleware(req);

        // Only admin can access analytics
        if (user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Only admin can access analytics' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');
        const month = searchParams.get('month');
        const branchId = searchParams.get('branchId');

        let startDate, endDate;

        // Determine date range
        if (date && month) {
            if (!month.match(/^\d{4}-\d{2}$/)) {
                throw new Error('Invalid month format. Expected YYYY-MM');
            }
            if (!date.match(/^\d{1,2}$/)) {
                throw new Error('Invalid date format. Expected D or DD');
            }

            const [yearStr, monthStr] = month.split('-');
            const year = +yearStr;
            const monthIndex = +monthStr - 1;
            const day = +date;

            startDate = new Date(Date.UTC(year, monthIndex, day, 0, 0, 0));
            endDate = new Date(Date.UTC(year, monthIndex, day, 23, 59, 59));

        } else if (date) {
            if (!date.match(/^\d{1,2}$/)) {
                throw new Error('Invalid date format. Expected D or DD');
            }

            const today = new Date();
            const year = today.getFullYear();
            const monthIndex = today.getMonth();
            const day = +date;

            startDate = new Date(Date.UTC(year, monthIndex, day, 0, 0, 0));
            endDate = new Date(Date.UTC(year, monthIndex, day, 23, 59, 59));

        } else if (month) {
            if (!month.match(/^\d{4}-\d{2}$/)) {
                throw new Error('Invalid month format. Expected YYYY-MM');
            }

            const [yearStr, monthStr] = month.split('-');
            const year = +yearStr;
            const monthIndex = +monthStr - 1;
            const today = new Date();

            startDate = new Date(`${month}-01T00:00:00Z`);
            if (today.getUTCFullYear() === year && today.getUTCMonth() === monthIndex) {
                const day = today.getUTCDate();
                endDate = new Date(Date.UTC(year, monthIndex, day, 23, 59, 59));
            } else {
                const lastDay = new Date(year, monthIndex + 1, 0).getDate();
                endDate = new Date(Date.UTC(year, monthIndex, lastDay, 23, 59, 59));
            }

        } else {
            const today = new Date();
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
            endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        }

        // Build query with branch filter if provided
        const query = {
            massageDate: { $gte: startDate, $lte: endDate }
        };

        if (branchId && branchId !== 'null') {
            query.branch = branchId;
        }

        // Fetch bookings
        const bookings = await Booking.find(query).populate('staffDetails');

        const totalClients = bookings.length;

        // Aggregate payments
        let cashTotal = 0;
        let cardTotal = 0;
        let upiTotal = 0;
        let totalOtherPayment = 0;
        let totalPayments = 0;

        bookings.forEach(b => {
            // Cash
            if (b.cash > 0) {
                cashTotal += b.cash;
            } else if (b.paymentMode === 'Cash') {
                cashTotal += b.massagePrice;
            }

            // Card
            if (b.card > 0) {
                cardTotal += b.card;
            } else if (b.paymentMode === 'Card') {
                cardTotal += b.massagePrice;
            }

            // UPI
            if (b.upi > 0) {
                upiTotal += b.upi;
            } else if (b.paymentMode === 'UPI') {
                upiTotal += b.massagePrice;
            }

            // Other
            totalOtherPayment += b.otherPayment || 0;
            totalPayments += b.massagePrice || 0;
        });

        const paymentStats = {
            cash: { totalAmount: cashTotal },
            card: { totalAmount: cardTotal },
            upi: { totalAmount: upiTotal },
        };

        // Send response
        return NextResponse.json({
            stats: {
                totalClients,
                paymentStats,
                totalPayments,
                totalOtherPayment,
                dateRange: { startDate, endDate },
            },
        });

    } catch (error) {
        console.error('Get booking stats error:', error);
        return NextResponse.json(
            { message: error.message || 'Error fetching booking stats' },
            { status: 500 }
        );
    }
}
