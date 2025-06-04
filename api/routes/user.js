// File: ./api/routes/user.js
const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const loyaltyService = require("../services/loyaltyService");
const productService = require("../services/productService");
const transactionService = require("../services/transactionService");
const businessService = require("../services/businessService");
const { authenticateUser } = require("../middleware/authMiddleware");

// Get user subscriptions (requires user authentication)
router.get("/:userId/subscriptions", authenticateUser, (req, res) => {
  const { userId } = req.params;
  const callingUser = req.user;

  if (callingUser.id !== userId) {
    return res.status(403).json({ error: "Forbidden", message: "You can only view your own subscriptions." });
  }

  try {
    const subscriptions = authService.getUserSubscriptions(userId);
    res.json(subscriptions);
  } catch (error) {
    console.error("Error getting user subscriptions:", error);
    res.status(500).json({ error: "Failed to get user subscriptions", details: error.message });
  }
});

// Subscribe user to a business loyalty program (requires user authentication)
router.post("/:userId/subscribe", authenticateUser, async (req, res) => {
  const { userId } = req.params;
  const { businessId, userWalletAddress } = req.body;
  const callingUser = req.user;

  if (callingUser.id !== userId) {
    return res.status(403).json({ error: "Forbidden", message: "You can only subscribe your own account." });
  }
  if (!businessId || !userWalletAddress) {
    return res.status(400).json({ error: "Missing required fields: businessId, userWalletAddress." });
  }

  try {
    const subscription = authService.updateUserSubscription(userId, businessId, userWalletAddress);
    res.status(200).json({
      message: `Successfully subscribed to ${businessId}.`,
      subscription,
      success: true,
    });
  } catch (error) {
    console.error("Error subscribing user:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to subscribe to business." });
  }
});

// Add dummy balance to a user's account
router.post("/:userId/add-balance", authenticateUser, (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;
  const callingUser = req.user;

  if (callingUser.id !== userId) {
    return res.status(403).json({ error: "Forbidden", message: "You can only add balance to your own account." });
  }
  if (amount === undefined || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: "Invalid amount. Must be a positive number." });
  }

  try {
    const newBalance = authService.addDummyBalance(userId, parseFloat(amount));
    res
      .status(200)
      .json({ message: `Successfully added Rp${amount} to your balance.`, newBalanceRp: newBalance, success: true });
  } catch (error) {
    console.error("Error adding dummy balance:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to add dummy balance." });
  }
});

// Get user's current dummy balance
router.get("/:userId/balance-rp", authenticateUser, (req, res) => {
  const { userId } = req.params;
  const callingUser = req.user;

  if (callingUser.id !== userId) {
    return res.status(403).json({ error: "Forbidden", message: "You can only view your own balance." });
  }

  try {
    const user = authService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json({ balanceRp: user.dummyBalanceRp, success: true });
  } catch (error) {
    console.error("Error fetching dummy balance:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch dummy balance." });
  }
});

// Buy a product (deducts dummy balance, issues loyalty points)
router.post("/:userId/buy-product", authenticateUser, async (req, res) => {
  const { userId } = req.params;
  const { businessId, productId } = req.body;
  const callingUser = req.user;

  if (callingUser.id !== userId) {
    return res.status(403).json({ error: "Forbidden", message: "You can only buy products for your own account." });
  }
  if (!businessId || !productId) {
    return res.status(400).json({ error: "Missing required fields: businessId, productId." });
  }

  console.log(
    `UserRoutes: Buy product request for User ID: ${userId}, Business ID: ${businessId}, Product ID: ${productId}`
  );

  try {
    const user = authService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // 1. Get product details
    const product = productService.getProductById(businessId, productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found in business catalog." });
    }

    // 2. Check if user is subscribed to the business
    const userSubscription = user.subscriptions[businessId];
    if (!userSubscription || !userSubscription.walletAddress) {
      console.error(
        `UserRoutes: User ${userId} is not subscribed to business ${businessId} or missing wallet address in subscription.`
      );
      return res
        .status(400)
        .json({
          error: "User is not subscribed to this business's loyalty program or subscription details are incomplete.",
        });
    }
    console.log(
      `UserRoutes: User ${userId} subscription found for ${businessId}. Wallet: ${userSubscription.walletAddress}`
    );

    // 3. Check dummy balance
    if (user.dummyBalanceRp < product.priceRp) {
      return res
        .status(400)
        .json({
          error: `Insufficient balance. Product costs Rp${product.priceRp}, your balance is Rp${user.dummyBalanceRp}.`,
        });
    }

    // 4. Deduct dummy balance
    const updatedBalance = authService.deductDummyBalance(userId, product.priceRp);

    // 5. Issue loyalty points to the user's subscribed wallet
    console.log(
      `UserRoutes: Calling loyaltyService.issuePoints for businessId: ${businessId}, customerWalletAddress: ${userSubscription.walletAddress}, points: ${product.loyaltyPoints}`
    );
    await loyaltyService.issuePoints(businessId, userSubscription.walletAddress, product.loyaltyPoints);

    // Record the purchase transaction
    const businessDetails = businessService.getBusinessDetails(businessId);
    transactionService.addTransaction(
      "purchase",
      businessId,
      userId,
      userSubscription.walletAddress,
      product.priceRp,
      businessDetails.symbol,
      productId,
      product.name
    );

    res.status(200).json({
      message: `Successfully purchased "${product.name}" from ${businessId}. Rp${product.priceRp} deducted. ${product.loyaltyPoints} loyalty points issued.`,
      newBalanceRp: updatedBalance,
      loyaltyPointsIssued: product.loyaltyPoints,
      success: true,
    });
  } catch (error) {
    console.error("UserRoutes: Error buying product:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to buy product." });
  }
});

// NEW: Route to record a user's redemption (called by frontend after blockchain tx)
router.post("/:userId/record-redemption", authenticateUser, async (req, res) => {
  const { userId } = req.params;
  const { businessId, customerAddress, amount, loyaltyTokenSymbol } = req.body;
  const callingUser = req.user;

  if (callingUser.id !== userId) {
    return res
      .status(403)
      .json({ error: "Forbidden", message: "You can only record redemptions for your own account." });
  }
  if (!businessId || !customerAddress || amount === undefined || !loyaltyTokenSymbol) {
    return res.status(400).json({ error: "Missing required fields for redemption record." });
  }

  try {
    await loyaltyService.recordRedemption(businessId, customerAddress, amount, loyaltyTokenSymbol);
    res.status(200).json({ message: "Redemption recorded successfully.", success: true });
  } catch (error) {
    console.error("Error recording redemption:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to record redemption." });
  }
});

// Get user's transaction history
router.get("/:userId/transactions", authenticateUser, (req, res) => {
  const { userId } = req.params;
  const callingUser = req.user;

  if (callingUser.id !== userId) {
    return res.status(403).json({ error: "Forbidden", message: "You can only view your own transactions." });
  }

  try {
    const userTransactions = transactionService.getTransactionsByUserId(userId);
    res.status(200).json({ transactions: userTransactions, success: true });
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch user transactions." });
  }
});

module.exports = router;
