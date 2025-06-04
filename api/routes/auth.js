const express = require("express");
const router = express.Router();
const authService = require("../services/authService");

// User Registration handled by business.js and user.js for now.
// This file focuses on login.

// NEW: User Login Route
router.post("/login/user", (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ success: false, message: "User ID and password are required." });
  }

  const result = authService.loginUser(userId, password);
  if (result.success) {
    // In a real application, you'd generate and send a JWT token here.
    // For this example, we just return a success message.
    res.json({ success: true, message: "User logged in successfully.", user: result.user });
  } else {
    res.status(401).json({ success: false, message: result.message });
  }
});

// NEW: Business Login Route
router.post("/login/business", (req, res) => {
  const { businessId, password } = req.body;
  if (!businessId || !password) {
    return res.status(400).json({ success: false, message: "Business ID and password are required." });
  }

  const result = authService.loginBusiness(businessId, password);
  if (result.success) {
    // In a real application, you'd generate and send a JWT token here.
    // For this example, we just return a success message.
    res.json({ success: true, message: "Business logged in successfully.", business: result.business });
  } else {
    res.status(401).json({ success: false, message: result.message });
  }
});

module.exports = router;
