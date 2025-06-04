const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const usersFilePath = path.join(__dirname, "../data/users.json");
const businessesFilePath = path.join(__dirname, "../data/businesses.json");

let users = {};
let businesses = {};

// Load user and business data from JSON files
const loadData = () => {
  try {
    if (fs.existsSync(usersFilePath)) {
      const userData = fs.readFileSync(usersFilePath, "utf8");
      users = JSON.parse(userData);
      console.log("User data loaded successfully.");
    } else {
      console.log("No users.json found, starting with empty users.");
      users = {};
    }

    if (fs.existsSync(businessesFilePath)) {
      const businessData = fs.readFileSync(businessesFilePath, "utf8");
      businesses = JSON.parse(businessData);
      console.log("Business data loaded successfully.");
    } else {
      console.log("No businesses.json found, starting with empty businesses.");
      businesses = {};
    }
  } catch (error) {
    console.error("Error loading auth data:", error);
    users = {};
    businesses = {};
  }
};

// Save user data to JSON file
const saveUsers = () => {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), "utf8");
    console.log("User data saved successfully.");
  } catch (error) {
    console.error("Error saving user data:", error);
  }
};

// Save business data to JSON file
const saveBusinesses = () => {
  try {
    fs.writeFileSync(businessesFilePath, JSON.stringify(businesses, null, 2), "utf8");
    console.log("Business data saved successfully.");
  } catch (error) {
    console.error("Error saving business data:", error);
  }
};

// User Registration
// MODIFIED: registerUser now accepts walletAddress
const registerUser = (userId, password, walletAddress) => {
  if (users[userId]) {
    throw new Error("User ID already exists.");
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[userId] = {
    id: userId,
    password: hashedPassword,
    role: "user",
    dummyBalanceRp: 0,
    subscriptions: {},
    walletAddress: walletAddress, // NEW: Store wallet address for the user
  };
  saveUsers();
  return { id: userId, role: "user", dummyBalanceRp: 0, subscriptions: {}, walletAddress: walletAddress };
};

// Business Registration (no change needed here for walletAddress, as it's ownerAddress)
const registerBusiness = (businessId, password) => {
  if (businesses[businessId]) {
    throw new Error("Business ID already exists.");
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  businesses[businessId] = {
    id: businessId,
    password: hashedPassword,
    role: "business",
  };
  saveBusinesses();
  return { id: businessId, role: "business" };
};

// User Login
const verifyUser = (userId, password) => {
  const user = users[userId];
  if (user && bcrypt.compareSync(password, user.password)) {
    return {
      id: user.id,
      role: user.role,
      dummyBalanceRp: user.dummyBalanceRp,
      subscriptions: user.subscriptions,
      walletAddress: user.walletAddress,
    };
  }
  return null;
};

// Business Login
const verifyBusiness = (businessId, password) => {
  const business = businesses[businessId];
  if (business && bcrypt.compareSync(password, business.password)) {
    return { id: business.id, role: business.role };
  }
  return null;
};

// Get user by ID
const getUserById = (userId) => {
  return users[userId];
};

// Get business by ID
const getBusinessById = (businessId) => {
  return businesses[businessId];
};

// Update user subscriptions
const updateUserSubscription = (userId, businessId, walletAddress) => {
  if (!users[userId]) {
    throw new Error("User not found.");
  }
  users[userId].subscriptions[businessId] = {
    walletAddress,
    subscribedAt: new Date().toISOString(),
  };
  saveUsers();
  return users[userId].subscriptions[businessId];
};

// Get user subscriptions
const getUserSubscriptions = (userId) => {
  if (!users[userId]) {
    throw new Error("User not found.");
  }
  return users[userId].subscriptions;
};

// Add dummy balance to a user
const addDummyBalance = (userId, amount) => {
  if (!users[userId]) {
    throw new Error("User not found.");
  }
  if (amount <= 0) {
    throw new Error("Amount must be positive.");
  }
  users[userId].dummyBalanceRp += amount;
  saveUsers();
  return users[userId].dummyBalanceRp;
};

// Deduct dummy balance from a user
const deductDummyBalance = (userId, amount) => {
  if (!users[userId]) {
    throw new Error("User not found.");
  }
  if (users[userId].dummyBalanceRp < amount) {
    throw new Error("Insufficient dummy balance.");
  }
  users[userId].dummyBalanceRp -= amount;
  saveUsers();
  return users[userId].dummyBalanceRp;
};

// Initialize by loading data on startup
loadData();

module.exports = {
  loadData,
  registerUser,
  registerBusiness,
  verifyUser,
  verifyBusiness,
  getUserById,
  getBusinessById,
  updateUserSubscription,
  getUserSubscriptions,
  addDummyBalance,
  deductDummyBalance,
};
