import express from "express";
import {
    getPayments,
    getPaymentById,
    createPayment,
} from "../controllers/Payments.js";
import { verifyUser, adminOnly } from "../middleware/AuthUser.js";

const router = express.Router();

router.get('/payments', verifyUser, adminOnly, getPayments);
router.get('/payments/:id', verifyUser, adminOnly, getPaymentById);
router.post('/payments', verifyUser, createPayment);

export default router;