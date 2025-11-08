import express from "express";
import { calculateTripRoute } from "../controllers/mapController";

const router = express.Router();

router.post("/calculate-route", calculateTripRoute);

export default router;
