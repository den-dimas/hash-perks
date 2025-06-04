const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
// No longer importing businessService directly here to avoid circular dependencies
// Business details will be passed in from routes or other services that manage them.

const usersFilePath = path.join(__dirname, "../data/users.json");

let users = {};

// Load user data from JSON file (only users now)
const loadData = () => {
  try {
    if (fs.existsSync(usersFilePath)) {
      const userData = fs.readFileSync(usersFilePath, "utf8");
      users = JSON.parse(userData);
      console.log("AuthService: User data loaded successfully.");
    } else {
      console.log("AuthService: No users.json found, starting with empty users.");
      users = {};
    }
    // No longer loading businesses.json here
  } catch (error) {
    console.error("AuthService: Error loading user data:", error);
    users = {};
  }
};

// Save user data to JSON file
const saveUsers = () => {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), "utf8");
    console.log("AuthService: User data saved successfully.");
  } catch (error) {
    console.error("AuthService: Error saving user data:", error);
  }
};

// User Registration
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
    walletAddress: walletAddress,
  };
  saveUsers();
  return { id: userId, role: "user", dummyBalanceRp: 0, subscriptions: {}, walletAddress: walletAddress };
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

// Business Login (now takes the full business object from businessService)
const verifyBusiness = (business, password) => {
  // MODIFIED: Takes 'business' object directly
  if (!business) {
    return null; // Business not found by businessService
  }
  // Compare the provided plain password with the hashed password stored in the business object
  const passwordMatch = bcrypt.compareSync(password, business.password);

  if (passwordMatch) {
    return { id: business.id, role: business.role };
  } else {
    return null;
  }
};

// Get user by ID
const getUserById = (userId) => {
  return users[userId];
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
  loadData, // Only loads user data now
  registerUser,
  verifyUser,
  verifyBusiness, // Now takes business object
  getUserById,
  updateUserSubscription,
  getUserSubscriptions,
  addDummyBalance,
  deductDummyBalance,
};
