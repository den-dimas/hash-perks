const loyaltyService = require("../services/loyaltyService");
const businessService = require("../services/businessService"); // Import business service

// List all known businesses and their contracts
const listBusinesses = async (req, res) => {
  try {
    const businesses = businessService.getAllBusinesses(); // Get all registered businesses
    res.json(businesses);
  } catch (error) {
    console.error("Error listing businesses:", error);
    res.status(500).json({ error: "Failed to list businesses", details: error.message });
  }
};

// Get contract info for a specific business
const getBusinessContractInfo = async (req, res) => {
  const { businessId } = req.params;
  try {
    const contractInfo = businessService.getBusinessContract(businessId);
    if (!contractInfo) {
      return res.status(404).json({ error: "Business not found", message: "No contract info for this business ID." });
    }
    res.json(contractInfo);
  } catch (error) {
    console.error(`Error fetching contract info for business ${businessId}:`, error);
    res.status(500).json({ error: "Failed to retrieve contract info", details: error.message });
  }
};

// Issue points to a customer
const issuePoints = async (req, res) => {
  const { businessId } = req.params;
  const { customerAddress, amount } = req.body;
  const callingBusiness = req.business; // Business object attached by authenticateBusiness middleware

  // Security check: Ensure the calling business is authorized to issue points for this businessId
  if (!callingBusiness || callingBusiness.id !== businessId) {
    return res
      .status(403)
      .json({ error: "Forbidden", message: "You are not authorized to issue points for this business." });
  }

  try {
    const tx = await loyaltyService.issuePoints(businessId, customerAddress, amount);
    res.status(200).json({ message: "Points issued successfully", transactionHash: tx.hash });
  } catch (error) {
    console.error("Error issuing points:", error);
    // More detailed error handling for blockchain errors
    let errorMessage = "Failed to issue points.";
    if (error.reason) {
      errorMessage += ` Reason: ${error.reason}`;
    } else if (error.data && error.data.message) {
      errorMessage += ` Details: ${error.data.message}`;
    } else if (error.message) {
      errorMessage += ` Details: ${error.message}`;
    }
    res.status(500).json({ error: errorMessage, details: error.message });
  }
};

// Get customer balance for a specific business
const getBalance = async (req, res) => {
  const { businessId, customerAddress } = req.params;
  try {
    const balance = await loyaltyService.getBalance(businessId, customerAddress);
    res.json({ businessId, customerAddress, balance });
  } catch (error) {
    console.error("Error getting balance:", error);
    res.status(500).json({ error: "Failed to get balance", details: error.message });
  }
};

// Redeem points for a customer
const redeemPoints = async (req, res) => {
  const { businessId } = req.params;
  const { customerAddress, amount } = req.body; // customerAddress is the wallet address of the user redeeming
  const { privateKey } = req.body; // This is for simplified testing. In a real app, customer would sign on frontend.

  try {
    const tx = await loyaltyService.redeemPoints(businessId, customerAddress, amount, privateKey);
    res.status(200).json({ message: "Points redeemed successfully", transactionHash: tx.hash });
  } catch (error) {
    console.error("Error redeeming points:", error);
    let errorMessage = "Failed to redeem points.";
    if (error.reason) {
      errorMessage += ` Reason: ${error.reason}`;
    } else if (error.data && error.data.message) {
      errorMessage += ` Details: ${error.data.message}`;
    } else if (error.message) {
      errorMessage += ` Details: ${error.message}`;
    }
    res.status(500).json({ error: errorMessage, details: error.message });
  }
};

module.exports = {
  listBusinesses,
  getBusinessContractInfo,
  issuePoints,
  getBalance,
  redeemPoints,
};
