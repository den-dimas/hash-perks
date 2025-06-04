const express = require("express");
const router = express.Router();
const businessService = require("../services/businessService");
const authService = require("../services/authService");
const loyaltyService = require("../services/loyaltyService"); // Import loyaltyService
const { authenticateBusiness } = require("../middleware/authMiddleware");

// Register a new business and deploy its loyalty token contract
router.post("/register", async (req, res) => {
  const { businessId, name, symbol, ownerAddress, password } = req.body;

  if (!businessId || !name || !symbol || !ownerAddress || !password) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  // Check if businessId already exists
  if (authService.getBusinessById(businessId)) {
    return res.status(409).json({ error: "Business ID already exists." });
  }

  try {
    // 1. Register business in auth service (for login)
    authService.registerBusiness(businessId, password);

    // 2. Deploy loyalty token contract and save its info
    const contractInfo = await businessService.addBusinessContract(
      businessId,
      name,
      symbol,
      ownerAddress,
      loyaltyService.deployLoyaltyTokenViaFactory
    );

    res.status(201).json({
      message: "Business registered and loyalty contract deployed successfully.",
      business: {
        id: businessId,
        name: name,
        symbol: symbol,
        contractAddress: contractInfo.address,
        ownerAddress: contractInfo.owner,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error registering business:", error);
    res.status(500).json({ success: false, error: "Failed to register business", details: error.message });
  }
});

// Get details of a specific business (requires authentication)
router.get("/:businessId", authenticateBusiness, (req, res) => {
  const { businessId } = req.params;
  const callingBusiness = req.business;

  if (callingBusiness.id !== businessId) {
    return res.status(403).json({ error: "Forbidden", message: "You can only view your own business details." });
  }

  const businessDetails = businessService.getBusinessContract(businessId);
  if (!businessDetails) {
    return res.status(404).json({ error: "Business not found." });
  }
  res.json({ id: businessId, ...businessDetails });
});

// Issue points (requires business authentication)
router.post("/:businessId/issue-points", authenticateBusiness, async (req, res) => {
  const { businessId } = req.params;
  const { customerAddress, amount } = req.body;
  const callingBusiness = req.business;

  if (callingBusiness.id !== businessId) {
    return res.status(403).json({ error: "Forbidden", message: "You can only issue points for your own business." });
  }

  if (!customerAddress || amount === undefined) {
    return res.status(400).json({ error: "Missing required fields: customerAddress, amount." });
  }

  try {
    await loyaltyService.issuePoints(businessId, customerAddress, amount);
    res.status(200).json({ message: "Points issued successfully.", success: true });
  } catch (error) {
    console.error("Error issuing points:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to issue points." });
  }
});

// Redeem points (requires business authentication, or could be a user route)
router.post("/:businessId/redeem-points", authenticateBusiness, async (req, res) => {
  const { businessId } = req.params;
  const { customerAddress, amount, privateKey } = req.body; // privateKey for simplified backend redemption
  const callingBusiness = req.business;

  if (callingBusiness.id !== businessId) {
    return res.status(403).json({ error: "Forbidden", message: "You can only redeem points for your own business." });
  }

  if (!customerAddress || amount === undefined || !privateKey) {
    return res.status(400).json({ error: "Missing required fields: customerAddress, amount, privateKey." });
  }

  try {
    await loyaltyService.redeemPoints(businessId, customerAddress, amount, privateKey);
    res.status(200).json({ message: "Points redeemed successfully.", success: true });
  } catch (error) {
    console.error("Error redeeming points:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to redeem points." });
  }
});

// Get balance for a customer at a specific business
router.get("/:businessId/balance/:customerAddress", async (req, res) => {
  const { businessId, customerAddress } = req.params;
  try {
    const balance = await loyaltyService.getBalance(businessId, customerAddress);
    // MODIFIED: Return an object with a 'balance' key
    res.json({ balance: balance });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ error: "Failed to fetch balance", details: error.message });
  }
});

module.exports = router;
