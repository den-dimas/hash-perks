const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // For generating unique product IDs

const productsFilePath = path.join(__dirname, "../data/products.json");

let productsCatalog = {}; // In-memory store for all business product catalogs

// Load product data from the JSON file
const loadProductCatalog = () => {
  try {
    if (fs.existsSync(productsFilePath)) {
      const data = fs.readFileSync(productsFilePath, "utf8");
      productsCatalog = JSON.parse(data);
      console.log("Product catalog loaded successfully.");
    } else {
      console.log("No products.json found, starting with empty catalog.");
      productsCatalog = {};
    }
  } catch (error) {
    console.error("Error loading product catalog:", error);
    productsCatalog = {}; // Fallback to empty if there's a parsing error
  }
};

// Save product data to the JSON file
const saveProductCatalog = () => {
  try {
    fs.writeFileSync(productsFilePath, JSON.stringify(productsCatalog, null, 2), "utf8");
    console.log("Product catalog saved successfully.");
  } catch (error) {
    console.error("Error saving product catalog:", error);
  }
};

// Get products for a specific business
const getProductsByBusinessId = (businessId) => {
  return productsCatalog[businessId] || [];
};

// Add a new product to a business's catalog
const addProduct = (businessId, name, priceRp, loyaltyPoints) => {
  if (!productsCatalog[businessId]) {
    productsCatalog[businessId] = [];
  }

  const newProduct = {
    id: uuidv4(), // Generate a unique ID for the product
    name,
    priceRp: parseFloat(priceRp), // Ensure price is a number
    loyaltyPoints: parseInt(loyaltyPoints, 10), // Ensure loyalty points is an integer
    createdAt: new Date().toISOString(),
  };

  productsCatalog[businessId].push(newProduct);
  saveProductCatalog(); // Save changes to disk
  return newProduct;
};

// Get a single product by businessId and productId
const getProductById = (businessId, productId) => {
  const businessProducts = productsCatalog[businessId] || [];
  return businessProducts.find((product) => product.id === productId);
};

// Initialize by loading data on startup
loadProductCatalog();

module.exports = {
  loadProductCatalog,
  saveProductCatalog,
  getProductsByBusinessId,
  addProduct,
  getProductById,
};
