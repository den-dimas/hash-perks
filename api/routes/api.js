const express = require("express");
const router = express.Router();
const loyaltyController = require("../controllers/loyaltyController");
const { authenticateBusiness } = require("../middleware/authMiddleware"); // Import auth middleware

// --- Business / Contract Info ---
router.get("/businesses", loyaltyController.listBusinesses); // List all known businesses and their contracts
router.get("/businesses/:businessId/contract-info", loyaltyController.getBusinessContractInfo);

// --- Loyalty Point Operations ---
// Issue points (typically a business owner action, proxied by backend)
// Added authenticateBusiness middleware to ensure only authenticated businesses can issue points
router.post("/businesses/:businessId/issue-points", authenticateBusiness, loyaltyController.issuePoints);
// Get balance for a customer at a specific business
router.get("/businesses/:businessId/balance/:customerAddress", loyaltyController.getBalance);
// Redeem points (customer action, see controller/service notes on signing)
router.post("/businesses/:businessId/redeem-points", loyaltyController.redeemPoints);

module.exports = router;
