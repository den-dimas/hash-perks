const fs = require("fs");
const path = require("path");

const USER_SUBSCRIPTIONS_FILE = path.join(__dirname, "../data/user-subscriptions.json");

let userSubscriptions = {}; // In-memory store for userId -> { businessId: { walletAddress, subscribedAt } }

const loadUserSubscriptions = () => {
  if (fs.existsSync(USER_SUBSCRIPTIONS_FILE)) {
    userSubscriptions = JSON.parse(fs.readFileSync(USER_SUBSCRIPTIONS_FILE, "utf8"));
    console.log("UserService: Loaded existing user subscriptions:", userSubscriptions);
  } else {
    console.log("UserService: No existing user subscriptions file found. Initializing empty subscriptions.");
    userSubscriptions = {};
    fs.writeFileSync(USER_SUBSCRIPTIONS_FILE, JSON.stringify({}, null, 2)); // Create empty file
  }
};

const saveUserSubscriptions = () => {
  fs.writeFileSync(USER_SUBSCRIPTIONS_FILE, JSON.stringify(userSubscriptions, null, 2));
  console.log("UserService: User subscriptions saved to:", USER_SUBSCRIPTIONS_FILE);
};

const subscribeUserToBusiness = async (userId, businessId, userWalletAddress) => {
  if (!userSubscriptions[userId]) {
    userSubscriptions[userId] = {};
  }
  if (userSubscriptions[userId][businessId]) {
    throw new Error(`User ${userId} is already subscribed to business ${businessId}.`);
  }

  userSubscriptions[userId][businessId] = {
    walletAddress: userWalletAddress,
    subscribedAt: new Date().toISOString(),
  };
  saveUserSubscriptions();
  return userSubscriptions[userId][businessId];
};

const getUserSubscriptions = (userId) => {
  return userSubscriptions[userId] || {};
};

module.exports = {
  loadUserSubscriptions,
  subscribeUserToBusiness,
  getUserSubscriptions,
};
