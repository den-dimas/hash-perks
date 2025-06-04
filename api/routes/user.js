const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const userService = require("../services/userService"); // Assuming you have a userService
const { authenticateUser } = require("../middleware/authMiddleware");

// NEW: Register a new user
router.post("/register", (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: "Missing required fields: userId, password." });
  }

  try {
    const newUser = authService.registerUser(userId, password);
    res.status(201).json({
      message: "User registered successfully.",
      user: { id: newUser.id },
      success: true,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(409).json({ success: false, error: error.message || "Failed to register user." });
  }
});

// Get user details (requires authentication)
router.get("/:userId", authenticateUser, (req, res) => {
  const { userId } = req.params;
  const callingUser = req.user; // User object from auth middleware

  // Ensure the authenticated user is requesting their own details
  if (callingUser.id !== userId) {
    return res.status(403).json({ error: "Forbidden", message: "You can only view your own user details." });
  }

  const userDetails = authService.getUserById(userId); // Assuming getUserById returns enough info
  if (!userDetails) {
    return res.status(404).json({ error: "User not found." });
  }
  res.json({ id: userId, ...userDetails });
});

// Subscribe a user to a business's loyalty program
router.post("/:userId/subscribe", authenticateUser, async (req, res) => {
  const { userId } = req.params;
  const { businessId, userWalletAddress } = req.body;
  const callingUser = req.user;

  if (callingUser.id !== userId) {
    return res.status(403).json({ error: "Forbidden", message: "You can only subscribe for your own account." });
  }

  if (!businessId || !userWalletAddress) {
    return res.status(400).json({ error: "Missing required fields: businessId, userWalletAddress." });
  }

  try {
    const subscription = await userService.subscribeUserToBusiness(userId, businessId, userWalletAddress);
    res.status(200).json({
      message: `Successfully subscribed user ${userId} to business ${businessId}.`,
      subscription,
      success: true,
    });
  } catch (error) {
    console.error("Error subscribing user to business:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to subscribe to business." });
  }
});

// Get user's subscriptions
router.get("/:userId/subscriptions", authenticateUser, (req, res) => {
  const { userId } = req.params;
  const callingUser = req.user;

  if (callingUser.id !== userId) {
    return res.status(403).json({ error: "Forbidden", message: "You can only view your own subscriptions." });
  }

  const subscriptions = userService.getUserSubscriptions(userId);
  res.status(200).json(subscriptions);
});

module.exports = router;
