import express from "express";
import { getLogs } from "../controllers/LogActivity.js";

const router = express.Router();

router.get("/logs", getLogs);

export default router;
