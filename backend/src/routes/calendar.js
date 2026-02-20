// backend/src/routes/calendar.js
import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import {
    getEventsByRange,
    getEventsByPackage,
    createEvent,
    updateEvent,
    deleteEvent,
    bulkCreateItinerary,
    getUpcomingEvents,
    syncAllPackages,
} from "../controllers/calendarController.js";

const router = express.Router();

// All roles
router.get("/events", authenticate, getEventsByRange);
router.get("/upcoming", authenticate, getUpcomingEvents);
router.get("/package/:packageId", authenticate, getEventsByPackage);

// Admin only
router.post("/events", authenticate, authorize(["ADMIN"]), createEvent);
router.put("/events/:id", authenticate, authorize(["ADMIN"]), updateEvent);
router.delete("/events/:id", authenticate, authorize(["ADMIN"]), deleteEvent);
router.post("/itinerary/bulk", authenticate, authorize(["ADMIN"]), bulkCreateItinerary);
router.post("/sync-packages", authenticate, authorize(["ADMIN"]), syncAllPackages);

export default router;
