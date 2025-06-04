const fs = require("fs");
const path = require("path");
// REMOVED: const loyaltyService = require("./loyaltyService"); // This caused circular dependency

const BUSINESS_CONTRACTS_FILE = path.join(__dirname, "../data/business-contracts.json");

let businessContracts = {}; // In-memory store for businessId -> contractAddress mapping

const loadBusinessContracts = () => {
  if (fs.existsSync(BUSINESS_CONTRACTS_FILE)) {
    businessContracts = JSON.parse(fs.readFileSync(BUSINESS_CONTRACTS_FILE, "utf8"));
    console.log("Loaded existing business contracts:", businessContracts);
  } else {
    console.log("No existing business contracts file found. Starting fresh.");
    businessContracts = {}; // Ensure it's empty if file doesn't exist
  }
};

const saveBusinessContracts = () => {
  fs.writeFileSync(BUSINESS_CONTRACTS_FILE, JSON.stringify(businessContracts, null, 2));
  console.log("Business contracts saved to:", BUSINESS_CONTRACTS_FILE);
};

// MODIFIED: Now accepts deployLoyaltyTokenViaFactory as an argument
const addBusinessContract = async (businessId, name, symbol, ownerAddress, deployLoyaltyTokenViaFactoryFn) => {
  // Deploy a new loyalty token contract via the factory
  const tokenDecimals = 18; // Defaulting to 18 decimals for ERC20 tokens

  // Use the passed function to deploy the token
  const tokenAddress = await deployLoyaltyTokenViaFactoryFn(
    name,
    symbol,
    tokenDecimals,
    ownerAddress // The owner of the newly deployed token will be the business owner's wallet
  );

  businessContracts[businessId] = {
    address: tokenAddress,
    name: name,
    symbol: symbol,
    owner: ownerAddress, // Store the business owner's wallet address as the contract owner
  };
  saveBusinessContracts();
  return businessContracts[businessId];
};

const getBusinessContract = (businessId) => {
  return businessContracts[businessId];
};

const getAllBusinesses = () => {
  // Returns an object where keys are businessIds and values are their contract info
  return businessContracts;
};

module.exports = {
  loadBusinessContracts,
  saveBusinessContracts,
  addBusinessContract,
  getBusinessContract,
  getAllBusinesses,
};
