import express from "express";
import { getTrips } from "../controllers/tripController";

const router = express.Router();

router.get("/", getTrips);

// Пока остальные маршруты не нужны - можно закомментировать
// router.post("/", createTrip);
// router.patch("/:id", updateTrip);
// router.delete("/:id", deleteTrip);

export default router;
