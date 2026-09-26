import express from "express";

import {
    createPayment,
    paymentWebhook
} from "../controllers/paymentController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createPayment);

router.post("/webhook", paymentWebhook);

export default router;