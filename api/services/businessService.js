const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs"); // NEW: Import bcrypt for hashing passwords

const businessesFilePath = path.join(__dirname, "../data/businesses.json");

let businesses = {}; // In-memory store for ALL business data (including auth and contract info)

// Load business data from the JSON file
const loadBusinesses = () => {
  // RENAMED from loadBusinessContracts
  try {
    if (fs.existsSync(businessesFilePath)) {
      const data = fs.readFileSync(businessesFilePath, "utf8");
      businesses = JSON.parse(data);
      console.log("BusinessService: All business data loaded successfully. Loaded IDs:", Object.keys(businesses));
    } else {
      console.log("BusinessService: No businesses.json found, starting with empty business data.");
      businesses = {};
    }
  } catch (error) {
    console.error("BusinessService: Error loading all business data:", error);
    businesses = {}; // Fallback to empty if there's a parsing error
  }
};

// Save business data to the JSON file
const saveBusinesses = () => {
  // RENAMED from saveBusinessContracts
  try {
    fs.writeFileSync(businessesFilePath, JSON.stringify(businesses, null, 2), "utf8");
    console.log("BusinessService: All business data saved successfully.");
  } catch (error) {
    console.error("BusinessService: Error saving all business data:", error);
  }
};

// NEW: Register a new business and deploy its loyalty token contract
const registerBusinessAndDeployContract = async (
  businessId,
  name,
  symbol,
  ownerAddress,
  password,
  deployLoyaltyTokenFn
) => {
  if (businesses[businessId]) {
    throw new Error("Business ID already exists.");
  }

  const hashedPassword = bcrypt.hashSync(password, 10); // Hash the password here

  console.log(`BusinessService: Attempting to deploy loyalty token for business ID: ${businessId}`);
  let contractAddress;
  try {
    contractAddress = await deployLoyaltyTokenFn(name, symbol, 18, ownerAddress); // Assuming 18 decimals for ERC20
    console.log(`BusinessService: Deployed contract address for ${businessId}: ${contractAddress}`);
  } catch (deployError) {
    console.error(`BusinessService: Failed to deploy loyalty token for ${businessId}:`, deployError);
    throw new Error(`Failed to deploy loyalty token contract: ${deployError.message}`);
  }

  // Store ALL business data, including authentication details and contract info
  businesses[businessId] = {
    id: businessId,
    name: name,
    symbol: symbol,
    ownerAddress: ownerAddress,
    password: hashedPassword, // Store the hashed password
    role: "business", // Explicitly set role
    address: contractAddress, // Contract address
    decimals: 18, // Decimals of the token
  };
  saveBusinesses();
  console.log(`BusinessService: Stored complete business data for ${businessId}:`, businesses[businessId]);
  return businesses[businessId]; // Return the full business object
};

// NEW: Get business details for authentication (includes hashed password)
const getBusinessForAuth = (businessId) => {
  console.log(`BusinessService: Getting business for auth for ID: ${businessId}`);
  return businesses[businessId]; // Returns the full business object
};

// Get full business details (including contract info, but not password hash for public use)
const getBusinessDetails = (businessId) => {
  // RENAMED from getBusinessContract
  console.log(`BusinessService: Getting full details for business ID: ${businessId}`);
  const business = businesses[businessId];
  if (!business) {
    console.log(`BusinessService: No details found for business ID: ${businessId}`);
    return null;
  }
  // Return a copy without the password hash for external use
  const { password, ...details } = business;
  return details;
};

// Get all business details (for the home page)
const getAllBusinesses = () => {
  // RENAMED from getAllBusinessContracts
  console.log("BusinessService: Getting all business details.");
  // Return a map of businessId to business details (without password hashes)
  const allPublicBusinesses = {};
  for (const id in businesses) {
    if (businesses.hasOwnProperty(id)) {
      const { password, ...details } = businesses[id];
      allPublicBusinesses[id] = details;
    }
  }
  return allPublicBusinesses;
};

// Initialize by loading data on startup
loadBusinesses(); // Call the new load function

module.exports = {
  loadBusinesses, // Export the new load function
  saveBusinesses, // Export the new save function
  registerBusinessAndDeployContract, // Export the new registration function
  getBusinessForAuth, // Export for auth service
  getBusinessDetails, // Export for general business details
  getAllBusinesses, // Export for public listing
};
