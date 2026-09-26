import express from "express";

import {
    createBooking,
    getMyBookings,
    getBooking,
    cancelBooking
} from "../controllers/bookingController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createBooking);

router.get("/my", authMiddleware, getMyBookings);

router.get("/:bookingId", authMiddleware, getBooking);

router.put("/:bookingId/cancel", authMiddleware, cancelBooking);

export default router;