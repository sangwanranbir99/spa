const { NextResponse } = require('next/server');
const connectDB = require('../../../../../../lib/db');
const authMiddleware = require('../../../../../../lib/authMiddleware');
const Booking = require('../../../../../../models/Booking');
const User = require('../../../../../../models/User');

// GET employee booking statistics
export async function GET(req) {
    try {
        await connectDB();

        const user = await authMiddleware(req);

        // Only admin can access employee analytics
        if (user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Only admin can access employee analytics' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');
        const month = searchParams.get('month');
        const employeeName = searchParams.get('employeeName');
        const branchId = searchParams.get('branchId');

        // Determine daily date range
        let startOfDay, endOfDay;
        if (date) {
            const d = new Date(date);
            startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        } else {
            const today = new Date();
            startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        }

        // Determine monthly date range
        let startOfMonth, endOfMonth;
        if (month) {
            const [year, mon] = month.split('-');
            const yearNum = parseInt(year, 10);
            const monthIndex = parseInt(mon, 10) - 1;
            startOfMonth = new Date(yearNum, monthIndex, 1);
            const lastDay = new Date(yearNum, monthIndex + 1, 0).getDate();
            endOfMonth = new Date(yearNum, monthIndex, lastDay, 23, 59, 59, 999);
        } else {
            const today = new Date();
            startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            endOfMonth = new Date(today.getFullYear(), today.getMonth(), lastDay, 23, 59, 59, 999);
        }

        // Build base match conditions
        const dailyMatch = { massageDate: { $gte: startOfDay, $lte: endOfDay } };
        const monthlyMatch = { massageDate: { $gte: startOfMonth, $lte: endOfMonth } };

        // Add branch filter if provided
        if (branchId && branchId !== 'null') {
            dailyMatch.branch = branchId;
            monthlyMatch.branch = branchId;
        }

        // Build pipelines
        const buildPipeline = (baseMatch, period) => {
            const pipeline = [
                { $match: baseMatch },
                {
                    $lookup: {
                        from: "users",
                        localField: "staffDetails",
                        foreignField: "_id",
                        as: "staff"
                    }
                },
                { $unwind: "$staff" }
            ];

            // Filter by employee name if provided
            if (employeeName) {
                pipeline.push({ $match: { "staff.name": employeeName } });
            }

            const groupStage = {
                $group: {
                    _id: "$staffDetails",
                    staffName: { $first: "$staff.name" },
                    [`${period}BookingCount`]: { $sum: 1 },
                    [`${period}UniqueClients`]: { $addToSet: "$clientContact" },
                    [`${period}Bookings`]: { $push: "$$ROOT" },
                    [`${period}MassagePayment`]: { $sum: "$massagePrice" },
                    [`${period}OtherPayment`]: { $sum: "$otherPayment" },
                    [`${period}CashPayment`]: { $sum: "$cash" },
                    [`${period}CardPayment`]: { $sum: "$card" },
                    [`${period}UpiPayment`]: { $sum: "$upi" }
                }
            };

            pipeline.push(groupStage);
            pipeline.push({
                $addFields: {
                    [`${period}UniqueClients`]: { $size: `$${period}UniqueClients` }
                }
            });

            return pipeline;
        };

        const dailyPipeline = buildPipeline(dailyMatch, "daily");
        const monthlyPipeline = buildPipeline(monthlyMatch, "monthly");

        // Run aggregations
        const dailyStats = await Booking.aggregate(dailyPipeline);
        const monthlyStats = await Booking.aggregate(monthlyPipeline);

        // If filtering by employeeName and no results, return default
        if (employeeName) {
            if (dailyStats.length === 0) {
                dailyStats.push({
                    _id: null,
                    staffName: employeeName,
                    dailyBookingCount: 0,
                    dailyUniqueClients: 0,
                    dailyBookings: [],
                    dailyMassagePayment: 0,
                    dailyOtherPayment: 0,
                    dailyCashPayment: 0,
                    dailyCardPayment: 0,
                    dailyUpiPayment: 0
                });
            }
            if (monthlyStats.length === 0) {
                monthlyStats.push({
                    _id: null,
                    staffName: employeeName,
                    monthlyBookingCount: 0,
                    monthlyUniqueClients: 0,
                    monthlyBookings: [],
                    monthlyMassagePayment: 0,
                    monthlyOtherPayment: 0,
                    monthlyCashPayment: 0,
                    monthlyCardPayment: 0,
                    monthlyUpiPayment: 0
                });
            }
        }

        // Overall daily totals
        const overallDailyPipeline = [
            { $match: dailyMatch },
            {
                $lookup: {
                    from: "users",
                    localField: "staffDetails",
                    foreignField: "_id",
                    as: "staff"
                }
            },
            { $unwind: "$staff" }
        ];

        if (employeeName) {
            overallDailyPipeline.push({ $match: { "staff.name": employeeName } });
        }

        overallDailyPipeline.push({
            $group: {
                _id: null,
                totalDailyMassagePayment: { $sum: "$massagePrice" },
                totalDailyOtherPayment: { $sum: "$otherPayment" },
                totalDailyCashPayment: { $sum: "$cash" },
                totalDailyCardPayment: { $sum: "$card" },
                totalDailyUpiPayment: { $sum: "$upi" },
                allDailyBookings: { $push: "$$ROOT" },
                totalDailyBookingCount: { $sum: 1 }
            }
        });

        const overallDailyArr = await Booking.aggregate(overallDailyPipeline);
        const overallDailyTotals = overallDailyArr.length > 0
            ? overallDailyArr[0]
            : {
                totalDailyMassagePayment: 0,
                totalDailyOtherPayment: 0,
                totalDailyCashPayment: 0,
                totalDailyCardPayment: 0,
                totalDailyUpiPayment: 0,
                totalDailyBookingCount: 0,
                allDailyBookings: []
            };

        // Overall monthly totals
        const overallMonthlyPipeline = [
            { $match: monthlyMatch },
            {
                $lookup: {
                    from: "users",
                    localField: "staffDetails",
                    foreignField: "_id",
                    as: "staff"
                }
            },
            { $unwind: "$staff" }
        ];

        if (employeeName) {
            overallMonthlyPipeline.push({ $match: { "staff.name": employeeName } });
        }

        overallMonthlyPipeline.push({
            $group: {
                _id: null,
                totalMonthlyMassagePayment: { $sum: "$massagePrice" },
                totalMonthlyOtherPayment: { $sum: "$otherPayment" },
                totalMonthlyCashPayment: { $sum: "$cash" },
                totalMonthlyCardPayment: { $sum: "$card" },
                totalMonthlyUpiPayment: { $sum: "$upi" },
                allMonthlyBookings: { $push: "$$ROOT" },
                totalMonthlyBookingCount: { $sum: 1 }
            }
        });

        const overallMonthlyArr = await Booking.aggregate(overallMonthlyPipeline);
        const overallMonthlyTotals = overallMonthlyArr.length > 0
            ? overallMonthlyArr[0]
            : {
                totalMonthlyMassagePayment: 0,
                totalMonthlyOtherPayment: 0,
                totalMonthlyCashPayment: 0,
                totalMonthlyCardPayment: 0,
                totalMonthlyUpiPayment: 0,
                totalMonthlyBookingCount: 0,
                allMonthlyBookings: []
            };

        return NextResponse.json({
            dailyStats,
            monthlyStats,
            dailyTotals: {
                totalDailyBookingCount: overallDailyTotals.totalDailyBookingCount,
                totalDailyMassagePayment: overallDailyTotals.totalDailyMassagePayment,
                totalDailyOtherPayment: overallDailyTotals.totalDailyOtherPayment,
                totalDailyCashPayment: overallDailyTotals.totalDailyCashPayment,
                totalDailyCardPayment: overallDailyTotals.totalDailyCardPayment,
                totalDailyUpiPayment: overallDailyTotals.totalDailyUpiPayment,
                dailyBookings: overallDailyTotals.allDailyBookings,
                dailyRange: { startOfDay, endOfDay }
            },
            monthlyTotals: {
                totalMonthlyBookingCount: overallMonthlyTotals.totalMonthlyBookingCount,
                totalMonthlyMassagePayment: overallMonthlyTotals.totalMonthlyMassagePayment,
                totalMonthlyOtherPayment: overallMonthlyTotals.totalMonthlyOtherPayment,
                totalMonthlyCashPayment: overallMonthlyTotals.totalMonthlyCashPayment,
                totalMonthlyCardPayment: overallMonthlyTotals.totalMonthlyCardPayment,
                totalMonthlyUpiPayment: overallMonthlyTotals.totalMonthlyUpiPayment,
                monthlyBookings: overallMonthlyTotals.allMonthlyBookings,
                monthlyRange: { startOfMonth, endOfMonth }
            }
        });

    } catch (error) {
        console.error('Get employee booking stats error:', error);
        return NextResponse.json(
            { message: error.message || 'Error fetching employee booking stats' },
            { status: 500 }
        );
    }
}
