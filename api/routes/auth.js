const express = require("express");
const router = express.Router();
const authService = require("../services/authService");

// User Login Route
router.post("/login/user", (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ success: false, message: "User ID and password are required." });
  }

  try {
    const user = authService.verifyUser(userId, password);
    if (user) {
      res.json({
        success: true,
        message: "User logged in successfully.",
        user: {
          id: user.id,
          role: user.role,
          dummyBalanceRp: user.dummyBalanceRp,
          subscriptions: user.subscriptions,
        },
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid user ID or password." });
    }
  } catch (error) {
    console.error("Error during user login:", error);
    res.status(500).json({ success: false, message: error.message || "An unexpected error occurred during login." });
  }
});

// Business Login Route
router.post("/login/business", (req, res) => {
  const { businessId, password } = req.body;
  if (!businessId || !password) {
    return res.status(400).json({ success: false, message: "Business ID and password are required." });
  }

  try {
    const business = authService.verifyBusiness(businessId, password);
    if (business) {
      res.json({
        success: true,
        message: "Business logged in successfully.",
        business: {
          id: business.id,
          role: business.role,
        },
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid business ID or password." });
    }
  } catch (error) {
    console.error("Error during business login:", error);
    res.status(500).json({ success: false, message: error.message || "An unexpected error occurred during login." });
  }
});

// User Registration Route
router.post("/register/user", (req, res) => {
  // <-- THIS IS THE TARGET ENDPOINT
  const { userId, password, walletAddress } = req.body;

  if (!userId || !password || !walletAddress) {
    return res.status(400).json({ success: false, message: "User ID, password, and wallet address are required." });
  }

  try {
    const newUser = authService.registerUser(userId, password, walletAddress);
    if (newUser) {
      res.status(201).json({ success: true, message: "User registered successfully.", user: newUser });
    } else {
      res.status(400).json({ success: false, message: "User registration failed due to an unknown reason." });
    }
  } catch (error) {
    console.error("Error during user registration:", error);
    if (error.message.includes("already exists") || error.message.includes("already registered")) {
      return res.status(409).json({ success: false, message: error.message });
    }
    res
      .status(500)
      .json({ success: false, message: error.message || "An unexpected error occurred during registration." });
  }
});

// Business Registration Route
router.post("/register/business", (req, res) => {
  // <-- THIS IS THE TARGET ENDPOINT
  const { businessId, businessName, businessSymbol, walletAddress, password } = req.body;

  if (!businessId || !businessName || !businessSymbol || !walletAddress || !password) {
    return res.status(400).json({ success: false, message: "All business registration fields are required." });
  }

  try {
    const newBusiness = authService.registerBusiness(businessId, businessName, businessSymbol, walletAddress, password);
    if (newBusiness) {
      res.status(201).json({ success: true, message: "Business registered successfully.", business: newBusiness });
    } else {
      res.status(400).json({ success: false, message: "Business registration failed due to an unknown reason." });
    }
  } catch (error) {
    console.error("Error during business registration:", error);
    if (error.message.includes("already exists") || error.message.includes("already registered")) {
      return res.status(409).json({ success: false, message: error.message });
    }
    res
      .status(500)
      .json({ success: false, message: error.message || "An unexpected error occurred during business registration." });
  }
});

module.exports = router;
