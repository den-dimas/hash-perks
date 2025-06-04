require("dotenv").config();
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");
const businessRoutes = require("./routes/business");
const userRoutes = require("./routes/user");
const businessService = require("./services/businessService");
const authService = require("./services/authService");
const productService = require("./services/productService"); // NEW: Import productService

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Initialize services that need to load data on start
businessService.loadBusinessContracts(); // Load existing business-contract mappings
authService.loadData(); // Load users and businesses data (now includes dummy balance)
productService.loadProductCatalog(); // NEW: Load product catalog data

// API Routes
app.use("/api/v1", apiRoutes); // Existing loyalty routes (might be empty or specific)
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/business", businessRoutes);
app.use("/api/v1/user", userRoutes);

// Simple root route
app.get("/", (req, res) => {
  res.send("HashPerks API Server is running!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`HashPerks API Server listening on port ${PORT}`);
});
