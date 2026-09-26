import crypto from "crypto";
import prisma from "../config/db.js";

const createPayment = async (req, res) => {
    try {
        const { bookingId, status } = req.body;

        if (!bookingId || !status) {
            return res.status(400).send(
                "Booking ID and payment status are required"
            );
        }

        if (!["SUCCESS", "FAILED"].includes(status)) {
            return res.status(400).send(
                "Payment status must be SUCCESS or FAILED"
            );
        }

        const booking = await prisma.booking.findUnique({
            where: {
                id: Number(bookingId)
            },
            include: {
                payment: true
            }
        });

        if (!booking) {
            return res.status(404).send("Booking not found");
        }

        if (booking.userId !== req.user.id) {
            return res.status(403).send("Access denied");
        }

        if (booking.payment) {
            return res.status(409).send("Payment already exists for this booking");
        }

        if (booking.status === "CANCELLED") {
            return res.status(400).send("Cannot pay for a cancelled booking");
        }

        const transactionId = crypto.randomUUID();

        const payment = await prisma.payment.create({
            data: {
                bookingId: booking.id,
                amount: booking.amount,
                status: status,
                transactionId: transactionId
            }
        });

        await prisma.booking.update({
            where: {
                id: booking.id
            },
            data: {
                status: status === "SUCCESS" ? "CONFIRMED" : "FAILED"
            }
        });

        console.log(
            `Payment ${status}: booking ${booking.id}, transaction ${transactionId}`
        );

        res.status(201).json({
            message: "Payment processed successfully",
            payment: {
                id: payment.id,
                bookingId: payment.bookingId,
                amount: payment.amount,
                status: payment.status,
                transactionId: payment.transactionId
            }
        });

    } catch (err) {
        console.log("Payment error:", err);
        res.status(500).send("Internal server error");
    }
};

const paymentWebhook = async (req, res) => {
    try {
        const {
            transactionId,
            bookingId,
            status
        } = req.body;

        if (!transactionId || !bookingId || !status) {
            return res.status(400).send(
                "Transaction ID, booking ID and status are required"
            );
        }

        if (!["SUCCESS", "FAILED"].includes(status)) {
            return res.status(400).send(
                "Payment status must be SUCCESS or FAILED"
            );
        }

        const existingPayment = await prisma.payment.findUnique({
            where: {
                transactionId: transactionId
            }
        });

        if (existingPayment) {
            if (existingPayment.bookingId !== Number(bookingId)) {
                return res.status(409).send(
                    "Transaction ID belongs to another booking"
                );
            }

            console.log(
                `Duplicate webhook ignored: ${transactionId}`
            );

            return res.status(200).json({
                message: "Webhook already processed"
            });
        }

        const booking = await prisma.booking.findUnique({
            where: {
                id: Number(bookingId)
            }
        });

        if (!booking) {
            return res.status(404).send("Booking not found");
        }

        const payment = await prisma.$transaction(async (transaction) => {
            const newPayment = await transaction.payment.create({
                data: {
                    bookingId: booking.id,
                    amount: booking.amount,
                    status: status,
                    transactionId: transactionId
                }
            });

            await transaction.booking.update({
                where: {
                    id: booking.id
                },
                data: {
                    status: status === "SUCCESS"
                        ? "CONFIRMED"
                        : "FAILED"
                }
            });

            return newPayment;
        });

        console.log(
            `Webhook processed: ${transactionId}`
        );

        res.status(200).json({
            message: "Webhook processed successfully",
            payment: {
                id: payment.id,
                bookingId: payment.bookingId,
                status: payment.status,
                transactionId: payment.transactionId
            }
        });

    } catch (err) {
        console.log("Webhook error:", err);

        if (err.code === "P2002") {
            return res.status(200).json({
                message: "Webhook already processed"
            });
        }

        res.status(500).send("Internal server error");
    }
};

export {
    createPayment,
    paymentWebhook
};