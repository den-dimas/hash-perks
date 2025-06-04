// File: ./api/routes/business.js
const express = require("express");
const router = express.Router();
const businessService = require("../services/businessService");
const authService = require("../services/authService");
const loyaltyService = require("../services/loyaltyService");
const productService = require("../services/productService");
const transactionService = require("../services/transactionService");
const { authenticateBusiness } = require("../middleware/authMiddleware");

// Business Registration Route
router.post("/register", async (req, res) => {
  const { businessId, name, symbol, ownerAddress, password } = req.body;

  if (!businessId || !name || !symbol || !ownerAddress || !password) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (businessService.getBusinessDetails(businessId)) {
    return res.status(409).json({ error: "Business ID already exists." });
  }

  try {
    const newBusiness = await businessService.registerBusinessAndDeployContract(
      businessId,
      name,
      symbol,
      ownerAddress,
      password,
      loyaltyService.deployLoyaltyTokenViaFactory
    );

    res.status(201).json({
      message: "Business registered and loyalty contract deployed successfully.",
      business: {
        id: newBusiness.id,
        name: newBusiness.name,
        symbol: newBusiness.symbol,
        contractAddress: newBusiness.address,
        ownerAddress: newBusiness.ownerAddress,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error registering business:", error);
    res.status(500).json({ success: false, error: "Failed to register business", details: error.message });
  }
});

// Public endpoint to get business details (no authentication required)
router.get("/:businessId", (req, res) => {
  const { businessId } = req.params;
  const businessDetails = businessService.getBusinessDetails(businessId);
  if (!businessDetails) {
    return res.status(404).json({ error: "Business not found." });
  }
  res.json({ id: businessId, ...businessDetails });
});

// Authenticated endpoint to get business details (for business dashboard)
router.get("/:businessId/details", authenticateBusiness, (req, res) => {
  const { businessId } = req.params;
  const callingBusiness = req.business;

  if (callingBusiness.id !== businessId) {
    return res.status(403).json({ error: "Forbidden", message: "You can only view your own business details." });
  }

  const businessDetails = businessService.getBusinessDetails(businessId);
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

// REMOVED: Redeem points route from here. User redemption is now handled directly on frontend.
// router.post("/:businessId/redeem-points", authenticateBusiness, async (req, res) => { ... });

// Get balance for a customer at a specific business (public endpoint)
router.get("/:businessId/balance/:customerAddress", async (req, res) => {
  const { businessId, customerAddress } = req.params;
  try {
    const balance = await loyaltyService.getBalance(businessId, customerAddress);
    res.json({ balance: balance });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ error: "Failed to fetch balance", details: error.message });
  }
});

// Add a product to a business's catalog
router.post("/:businessId/products", authenticateBusiness, (req, res) => {
  const { businessId } = req.params;
  const { name, priceRp, loyaltyPoints } = req.body;
  const callingBusiness = req.business;

  if (callingBusiness.id !== businessId) {
    return res
      .status(403)
      .json({ error: "Forbidden", message: "You can only add products to your own business catalog." });
  }

  if (!name || priceRp === undefined || loyaltyPoints === undefined) {
    return res.status(400).json({ error: "Missing required fields: name, priceRp, loyaltyPoints." });
  }
  if (isNaN(parseFloat(priceRp)) || parseFloat(priceRp) <= 0) {
    return res.status(400).json({ error: "Invalid priceRp. Must be a positive number." });
  }
  if (isNaN(parseInt(loyaltyPoints, 10)) || parseInt(loyaltyPoints, 10) < 0) {
    return res.status(400).json({ error: "Invalid loyaltyPoints. Must be a non-negative integer." });
  }

  try {
    const newProduct = productService.addProduct(businessId, name, priceRp, loyaltyPoints);
    res.status(201).json({ message: "Product added successfully.", product: newProduct, success: true });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to add product." });
  }
});

// Get all products for a specific business (public endpoint)
router.get("/:businessId/products", (req, res) => {
  const { businessId } = req.params;
  try {
    const products = productService.getProductsByBusinessId(businessId);
    res.status(200).json({ products, success: true });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch products." });
  }
});

// Get business's transaction history (requires business authentication)
router.get("/:businessId/transactions", authenticateBusiness, (req, res) => {
  const { businessId } = req.params;
  const callingBusiness = req.business;

  if (callingBusiness.id !== businessId) {
    return res.status(403).json({ error: "Forbidden", message: "You can only view your own business transactions." });
  }

  try {
    const businessTransactions = transactionService.getTransactionsByBusinessId(businessId);
    res.status(200).json({ transactions: businessTransactions, success: true });
  } catch (error) {
    console.error("Error fetching business transactions:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch business transactions." });
  }
});

// Get all businesses (public endpoint)
router.get("/", (req, res) => {
  try {
    const allBusinesses = businessService.getAllBusinesses();
    res.status(200).json(allBusinesses);
  } catch (error) {
    console.error("Error fetching all businesses:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch all businesses." });
  }
});

module.exports = router;
