// backend/src/routes/master.js
import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { upload, optimizeImage, saveDocument } from "../utils/upload.js";

// Controllers
import {
    getAllHotels,
    getHotelById,
    createHotel,
    updateHotel,
    deleteHotel,
    importHotels,
} from "../controllers/masterController.js";
import {
    getAllAirlines,
    getAirlineById,
    createAirline,
    updateAirline,
    deleteAirline,
} from "../controllers/airlineController.js";
import {
    getAllAirports,
    getAirportById,
    createAirport,
    updateAirport,
    deleteAirport,
} from "../controllers/airportController.js";
import {
    getAllBanks,
    getActiveBanks,
    createBank,
    updateBank,
    toggleBankStatus,
    deleteBank,
} from "../controllers/bankController.js";
import {
    getAllTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
} from "../controllers/testimonialController.js";
import {
    getAllFAQs,
    createFAQ,
    updateFAQ,
    deleteFAQ,
} from "../controllers/faqController.js";
import {
    getAllGallery,
    createGallery,
    updateGallery,
    deleteGallery,
} from "../controllers/galleryController.js";
import {
    getCompanyProfile,
    updateCompanyProfile,
    uploadCompanyLogo,
} from "../controllers/companyController.js";
import * as agentLevelController from "../controllers/agentLevelController.js";
import * as agentRequirementController from "../controllers/agentRequirementController.js";
import * as agentPurposeController from "../controllers/agentPurposeController.js";
import * as periodController from "../controllers/periodController.js";

const router = express.Router();

// =====================================================
// HOTELS
// =====================================================
router.get("/hotels", getAllHotels);
router.post("/hotels", authenticate, authorize(["ADMIN"]), upload.single("image"), optimizeImage("hotels"), createHotel);
router.get("/hotels/:id", getHotelById);
router.put("/hotels/:id", authenticate, authorize(["ADMIN"]), upload.single("image"), optimizeImage("hotels"), updateHotel);
router.delete("/hotels/:id", authenticate, authorize(["ADMIN"]), deleteHotel);
router.post("/import/hotels", authenticate, authorize(["ADMIN"]), upload.single("file"), importHotels);

// =====================================================
// AIRLINES
// =====================================================
router.get("/airlines", getAllAirlines);
router.post("/airlines", authenticate, authorize(["ADMIN"]), upload.single("logo"), optimizeImage("airlines"), createAirline);
router.get("/airlines/:id", getAirlineById);
router.put("/airlines/:id", authenticate, authorize(["ADMIN"]), upload.single("logo"), optimizeImage("airlines"), updateAirline);
router.delete("/airlines/:id", authenticate, authorize(["ADMIN"]), deleteAirline);

// =====================================================
// AIRPORTS
// =====================================================
router.get("/airports", getAllAirports);
router.post("/airports", authenticate, authorize(["ADMIN"]), createAirport);
router.get("/airports/:id", getAirportById);
router.put("/airports/:id", authenticate, authorize(["ADMIN"]), updateAirport);
router.delete("/airports/:id", authenticate, authorize(["ADMIN"]), deleteAirport);

// =====================================================
// BANKS
// =====================================================
router.get("/banks", authenticate, authorize(["ADMIN", "FINANCE", "STAFF"]), getAllBanks);
router.get("/banks/active", getActiveBanks);
router.post("/banks", authenticate, authorize(["ADMIN"]), createBank);
router.put("/banks/:id", authenticate, authorize(["ADMIN"]), updateBank);
router.patch("/banks/:id/toggle", authenticate, authorize(["ADMIN"]), toggleBankStatus);
router.delete("/banks/:id", authenticate, authorize(["ADMIN"]), deleteBank);

// =====================================================
// TESTIMONIALS
// =====================================================
router.get("/testimonials", getAllTestimonials);
router.post("/testimonials", authenticate, authorize(["ADMIN"]), createTestimonial);
router.put("/testimonials/:id", authenticate, authorize(["ADMIN"]), updateTestimonial);
router.delete("/testimonials/:id", authenticate, authorize(["ADMIN"]), deleteTestimonial);

// =====================================================
// FAQ
// =====================================================
router.get("/faqs", getAllFAQs);
router.post("/faqs", authenticate, authorize(["ADMIN"]), createFAQ);
router.put("/faqs/:id", authenticate, authorize(["ADMIN"]), updateFAQ);
router.delete("/faqs/:id", authenticate, authorize(["ADMIN"]), deleteFAQ);

// =====================================================
// GALLERY
// =====================================================
router.get("/gallery", getAllGallery);
router.post("/gallery", authenticate, authorize(["ADMIN"]), createGallery);
router.put("/gallery/:id", authenticate, authorize(["ADMIN"]), updateGallery);
router.delete("/gallery/:id", authenticate, authorize(["ADMIN"]), deleteGallery);

// =====================================================
// COMPANY PROFILE
// =====================================================
router.get("/company", getCompanyProfile);
router.put("/company", authenticate, authorize(["ADMIN"]), updateCompanyProfile);
router.post("/company/logo", authenticate, authorize(["ADMIN"]), upload.single("logo"), saveDocument("company"), uploadCompanyLogo);

// =====================================================
// AGENT LEVELS
// =====================================================
router.get("/agent-levels", authenticate, authorize(["ADMIN", "AGEN", "STAFF", "FINANCE"]), agentLevelController.getAll);
router.post("/agent-levels", authenticate, authorize(["ADMIN"]), agentLevelController.create);
router.get("/agent-levels/:id", authenticate, authorize(["ADMIN", "AGEN", "STAFF", "FINANCE"]), agentLevelController.getById);
router.put("/agent-levels/:id", authenticate, authorize(["ADMIN"]), agentLevelController.update);
router.delete("/agent-levels/:id", authenticate, authorize(["ADMIN"]), agentLevelController.deleteLevel);

// =====================================================
// AGENT REQUIREMENTS
// =====================================================
router.get("/agent-requirements", authenticate, authorize(["ADMIN", "AGEN", "STAFF", "FINANCE"]), agentRequirementController.getAll);
router.post("/agent-requirements", authenticate, authorize(["ADMIN"]), agentRequirementController.create);
router.put("/agent-requirements/:id", authenticate, authorize(["ADMIN"]), agentRequirementController.update);
router.delete("/agent-requirements/:id", authenticate, authorize(["ADMIN"]), agentRequirementController.deleteRequirement);

// =====================================================
// AGENT PURPOSES
// =====================================================
router.get("/agent-purposes", authenticate, authorize(["ADMIN", "AGEN", "STAFF", "FINANCE"]), agentPurposeController.getAll);
router.post("/agent-purposes", authenticate, authorize(["ADMIN"]), agentPurposeController.create);
router.put("/agent-purposes/:id", authenticate, authorize(["ADMIN"]), agentPurposeController.update);
router.delete("/agent-purposes/:id", authenticate, authorize(["ADMIN"]), agentPurposeController.deletePurpose);

// =====================================================
// PERIODS
// =====================================================
router.get("/periods", authenticate, authorize(["ADMIN", "AGEN", "STAFF", "FINANCE"]), periodController.getAll);
router.post("/periods", authenticate, authorize(["ADMIN"]), periodController.create);
router.get("/periods/:id", authenticate, authorize(["ADMIN", "AGEN", "STAFF", "FINANCE"]), periodController.getById);
router.put("/periods/:id", authenticate, authorize(["ADMIN"]), periodController.update);
router.delete("/periods/:id", authenticate, authorize(["ADMIN"]), periodController.deletePeriod);

export default router;
