require("dotenv").config();
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");
const businessRoutes = require("./routes/business"); // Business routes now handle registration
const userRoutes = require("./routes/user");
const businessService = require("./services/businessService"); // MODIFIED: Primary business data manager
const authService = require("./services/authService"); // MODIFIED: Only handles user auth directly
const productService = require("./services/productService");
const transactionService = require("./services/transactionService");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Initialize services that need to load data on start
// Order matters: businessService loads ALL business data first
businessService.loadBusinesses(); // MODIFIED: Call the new loadBusinesses function
authService.loadData(); // Only loads user data now
productService.loadProductCatalog();
transactionService.loadTransactions();

// API Routes
app.use("/api/v1", apiRoutes);
app.use("/api/v1/auth", authRoutes); // Auth routes for login/register user
app.use("/api/v1/business", businessRoutes); // Business routes for registration, dashboard, etc.
app.use("/api/v1/user", userRoutes);

// Simple root route
app.get("/", (req, res) => {
  res.send("HashPerks API Server is running!");
});

// Not Found Handler (should be after all routes)
app.use((req, res, next) => {
  res
    .status(404)
    .json({ error: "Not Found", message: `The requested URL ${req.originalUrl} was not found on this server.` });
});

// Global Error Handler (must have 4 arguments: err, req, res, next)
app.use((err, req, res, next) => {
  console.error("Global error handler caught an error:");
  console.error(err.stack || err.message || err); // Log the full error stack
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred.",
  });
});

// Global unhandled promise rejection handler
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // In production, you might want to gracefully shut down.
  // process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  if (!process.env.BACKEND_WALLET_PRIVATE_KEY) {
    console.warn(
      "Warning: BACKEND_WALLET_PRIVATE_KEY is not set in backend/.env. Operations requiring signing by the backend will fail."
    );
  }
  if (!process.env.FACTORY_DEPLOYER_PRIVATE_KEY) {
    console.warn("Warning: FACTORY_DEPLOYER_PRIVATE_KEY is not set in backend/.env. Factory operations will fail.");
  }
  if (!process.env.BLOCKCHAIN_RPC_URL) {
    console.warn("Warning: BLOCKCHAIN_RPC_URL is not set in backend/.env. Blockchain interactions will fail.");
  }
});
