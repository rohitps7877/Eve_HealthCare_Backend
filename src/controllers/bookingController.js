import prisma from "../config/db.js";

const createBooking = async (req, res) => {
    try {
        const { testId, centreId, appointmentDate } = req.body;

        if (!testId || !centreId || !appointmentDate) {
            return res.status(400).send(
                "Test, centre and appointment date are required"
            );
        }

        const testIdNumber = Number(testId);
        const centreIdNumber = Number(centreId);

        const date = new Date(appointmentDate);

        if (isNaN(date.getTime())) {
            return res.status(400).send("Invalid appointment date");
        }

        if (date <= new Date()) {
            return res.status(400).send("Appointment date must be in the future");
        }

        const test = await prisma.diagnosticTest.findUnique({
            where: {
                id: testIdNumber
            }
        });

        if (!test) {
            return res.status(404).send("Diagnostic test not found");
        }

        const centre = await prisma.diagnosticCentre.findUnique({
            where: {
                id: centreIdNumber
            },
            include: {
                tests: true
            }
        });

        if (!centre) {
            return res.status(404).send("Diagnostic centre not found");
        }

        const testAvailable = centre.tests.some(
            (centreTest) => centreTest.id === testIdNumber
        );

        if (!testAvailable) {
            return res.status(400).send(
                "This diagnostic test is not available at this centre"
            );
        }

        const existingBooking = await prisma.booking.findFirst({
            where: {
                userId: req.user.id,
                testId: testIdNumber,
                centreId: centreIdNumber,
                appointmentDate: date,
                status: {
                    notIn: ["CANCELLED", "FAILED"]
                }
            }
        });

        if (existingBooking) {
            return res.status(409).send(
                "You already have a booking for this test at this time"
            );
        }

        const booking = await prisma.booking.create({
            data: {
                userId: req.user.id,
                testId: testIdNumber,
                centreId: centreIdNumber,
                appointmentDate: date,
                amount: test.price
            }
        });

        console.log(`Booking created: ${booking.id}`);

        res.status(201).json({
            message: "Booking created successfully",
            booking
        });

    } catch (err) {
        console.log("Create booking error:", err);
        res.status(500).send("Internal server error");
    }
};

const getMyBookings = async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: {
                userId: req.user.id
            },
            include: {
                test: true,
                centre: true,
                payment: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.status(200).json(bookings);

    } catch (err) {
        console.log("Get bookings error:", err);
        res.status(500).send("Internal server error");
    }
};

const getBooking = async (req, res) => {
    try {
        const bookingId = Number(req.params.bookingId);

        const booking = await prisma.booking.findUnique({
            where: {
                id: bookingId
            },
            include: {
                test: true,
                centre: true,
                payment: true
            }
        });

        if (!booking) {
            return res.status(404).send("Booking not found");
        }

        if (booking.userId !== req.user.id) {
            return res.status(403).send("Access denied");
        }

        res.status(200).json(booking);

    } catch (err) {
        console.log("Get booking error:", err);
        res.status(500).send("Internal server error");
    }
};

const cancelBooking = async (req, res) => {
    try {
        const bookingId = Number(req.params.bookingId);

        const booking = await prisma.booking.findUnique({
            where: {
                id: bookingId
            }
        });

        if (!booking) {
            return res.status(404).send("Booking not found");
        }

        if (booking.userId !== req.user.id) {
            return res.status(403).send("Access denied");
        }

        if (booking.status === "CANCELLED") {
            return res.status(400).send("Booking is already cancelled");
        }

        if (booking.status === "CONFIRMED") {
            return res.status(400).send(
                "Confirmed booking cannot be cancelled through this endpoint"
            );
        }

        const updatedBooking = await prisma.booking.update({
            where: {
                id: bookingId
            },
            data: {
                status: "CANCELLED"
            }
        });

        console.log(`Booking cancelled: ${bookingId}`);

        res.status(200).json(updatedBooking);

    } catch (err) {
        console.log("Cancel booking error:", err);
        res.status(500).send("Internal server error");
    }
};

export {
    createBooking,
    getMyBookings,
    getBooking,
    cancelBooking
};