const fs = require("fs");
const path = require("path");

const USERS_FILE = path.join(__dirname, "../data/users.json");
const BUSINESSES_FILE = path.join(__dirname, "../data/businesses.json");

let users = {}; // In-memory store for userId -> { password }
let businesses = {}; // In-memory store for businessId -> { password }

const loadData = () => {
  console.log("AuthService: Loading data...");
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    console.log("AuthService: Loaded existing users:", users);
  } else {
    console.log("AuthService: No existing users file found. Initializing empty users.");
    users = {}; // Ensure it's an empty object if file doesn't exist
    fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2)); // Create empty file
  }

  if (fs.existsSync(BUSINESSES_FILE)) {
    businesses = JSON.parse(fs.readFileSync(BUSINESSES_FILE, "utf8"));
    console.log("AuthService: Loaded existing businesses:", businesses);
  } else {
    console.log("AuthService: No existing businesses file found. Initializing empty businesses.");
    businesses = {}; // Ensure it's an empty object if file doesn't exist
    fs.writeFileSync(BUSINESSES_FILE, JSON.stringify({}, null, 2)); // Create empty file
  }
};

const saveUsers = () => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  console.log("AuthService: Users saved to:", USERS_FILE);
};

const saveBusinesses = () => {
  fs.writeFileSync(BUSINESSES_FILE, JSON.stringify(businesses, null, 2));
  console.log("AuthService: Businesses saved to:", BUSINESSES_FILE);
};

const registerUser = (userId, password) => {
  console.log(`AuthService: Attempting to register user: ${userId}`);
  if (users[userId]) {
    console.warn(`AuthService: User ID '${userId}' already exists.`);
    throw new Error("User ID already exists.");
  }
  users[userId] = { password };
  saveUsers();
  console.log(`AuthService: User '${userId}' registered successfully.`);
  return { id: userId };
};

const registerBusiness = (businessId, password) => {
  console.log(`AuthService: Attempting to register business: ${businessId}`);
  console.log("AuthService: Current businesses in memory before check:", businesses);
  if (businesses[businessId]) {
    console.warn(`AuthService: Business ID '${businessId}' already exists.`);
    throw new Error("Business ID already exists.");
  }
  businesses[businessId] = { password };
  saveBusinesses();
  console.log(`AuthService: Business '${businessId}' registered successfully.`);
  return { id: businessId };
};

const authenticateUser = (userId, password) => {
  const user = users[userId];
  if (user && user.password === password) {
    return { id: userId, role: "user" };
  }
  return null;
};

const authenticateBusiness = (businessId, password) => {
  const business = businesses[businessId];
  if (business && business.password === password) {
    return { id: businessId, role: "business" };
  }
  return null;
};

// NEW: Login function for users
const loginUser = (userId, password) => {
  console.log(`AuthService: Attempting user login for: ${userId}`);
  const user = authenticateUser(userId, password);
  if (user) {
    console.log(`AuthService: User '${userId}' authenticated successfully.`);
    return { success: true, message: "User authenticated", user };
  } else {
    console.log(`AuthService: User '${userId}' authentication failed.`);
    return { success: false, message: "Invalid user ID or password." };
  }
};

// NEW: Login function for businesses
const loginBusiness = (businessId, password) => {
  console.log(`AuthService: Attempting business login for: ${businessId}`);
  const business = authenticateBusiness(businessId, password);
  if (business) {
    console.log(`AuthService: Business '${businessId}' authenticated successfully.`);
    return { success: true, message: "Business authenticated", business };
  } else {
    console.log(`AuthService: Business '${businessId}' authentication failed.`);
    return { success: false, message: "Invalid business ID or password." };
  }
};

const getUserById = (userId) => {
  console.log(`AuthService: Checking for user by ID: ${userId}`);
  console.log("AuthService: Current users in memory:", users);
  if (users[userId]) {
    return { id: userId, role: "user" };
  }
  return null;
};

const getBusinessById = (businessId) => {
  console.log(`AuthService: Checking for business by ID: ${businessId}`);
  console.log("AuthService: Current businesses in memory:", businesses);
  if (businesses[businessId]) {
    return { id: businessId, role: "business" };
  }
  return null;
};

module.exports = {
  loadData,
  registerUser,
  registerBusiness,
  authenticateUser,
  authenticateBusiness,
  loginUser, // Export new login function
  loginBusiness, // Export new login function
  getUserById,
  getBusinessById,
};
