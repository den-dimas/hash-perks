const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const transactionsFilePath = path.join(__dirname, "../data/transactions.json");

let transactions = []; // In-memory store for all transactions

// Load transaction data from the JSON file
const loadTransactions = () => {
  try {
    if (fs.existsSync(transactionsFilePath)) {
      const data = fs.readFileSync(transactionsFilePath, "utf8");
      transactions = JSON.parse(data);
      console.log("Transaction history loaded successfully.");
    } else {
      console.log("No transactions.json found, starting with empty transaction history.");
      transactions = [];
    }
  } catch (error) {
    console.error("Error loading transaction history:", error);
    transactions = []; // Fallback to empty if there's a parsing error
  }
};

// Save transaction data to the JSON file
const saveTransactions = () => {
  try {
    fs.writeFileSync(transactionsFilePath, JSON.stringify(transactions, null, 2), "utf8");
    console.log("Transaction history saved successfully.");
  } catch (error) {
    console.error("Error saving transaction history:", error);
  }
};

// Add a new transaction record
const addTransaction = (
  type,
  businessId,
  userId,
  customerWalletAddress,
  amount,
  loyaltyTokenSymbol,
  productId = null,
  productName = null
) => {
  const newTransaction = {
    id: uuidv4(),
    type, // 'issue', 'redeem', 'purchase'
    businessId,
    userId, // The user ID from authService
    customerWalletAddress, // The wallet address that received/sent points
    amount, // Amount of points (for issue/redeem) or price (for purchase)
    loyaltyTokenSymbol, // Symbol of the loyalty token
    productId, // Optional: for 'purchase' transactions
    productName, // Optional: for 'purchase' transactions
    timestamp: new Date().toISOString(),
  };
  transactions.push(newTransaction);
  saveTransactions();
  return newTransaction;
};

// Get transactions by user ID
const getTransactionsByUserId = (userId) => {
  return transactions.filter((txn) => txn.userId === userId);
};

// Get transactions by business ID
const getTransactionsByBusinessId = (businessId) => {
  return transactions.filter((txn) => txn.businessId === businessId);
};

// Initialize by loading data on startup
loadTransactions();

module.exports = {
  loadTransactions,
  saveTransactions,
  addTransaction,
  getTransactionsByUserId,
  getTransactionsByBusinessId,
};
