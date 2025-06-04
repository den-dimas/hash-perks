"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import {
  getBusinessContractInfo,
  issuePoints,
  getBalance,
  addProductToCatalog,
  getProductsByBusiness,
} from "@/services/api";
import {
  Loader2,
  Wallet,
  DollarSign,
  Send,
  Info,
  XCircle,
  CheckCircle,
  ExternalLink,
  PlusCircle,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { ethers } from "ethers";

export default function BusinessDashboard() {
  const { business, isAuthenticated, isBusiness, loading: authLoading, currentUser } = useAuth(); // Get currentUser for token
  const { account, provider, signer } = useWeb3();
  const [businessContract, setBusinessContract] = useState(null);
  const [customerAddress, setCustomerAddress] = useState("");
  const [issueAmount, setIssueAmount] = useState("");
  const [customerBalance, setCustomerBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Overall loading for the page
  const [isIssuing, setIsIssuing] = useState(false);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // NEW: Product Catalog State
  const [products, setProducts] = useState([]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductLoyaltyPoints, setNewProductLoyaltyPoints] = useState("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  useEffect(() => {
    // Only proceed if auth is not loading and user is authenticated as a business
    if (authLoading) {
      setIsLoading(true); // Keep loading if auth is still determining state
      return;
    }

    // CRITICAL CHECK: Ensure it's a BUSINESS and authenticated
    if (!isAuthenticated || !isBusiness) {
      setMessage({ type: "error", text: "Please log in as a business to access this page." });
      setIsLoading(false);
      return;
    }

    const fetchBusinessData = async () => {
      setIsLoading(true); // Start loading for data fetch
      setError(null);
      setMessage(null);
      try {
        // Ensure business.id and currentUser.token are available before making the API call
        if (business?.id && currentUser?.token) {
          const contractInfo = await getBusinessContractInfo(business.id, currentUser.token); // Pass token
          setBusinessContract(contractInfo);

          // NEW: Fetch product catalog for this business
          const productData = await getProductsByBusiness(business.id);
          setProducts(productData.products);
        } else {
          // This case should ideally not be hit if isAuthenticated and isBusiness are true
          // but if business.id or token is somehow missing, it's an issue.
          setError("Business ID or authentication token not found in authentication context.");
          setBusinessContract(null);
        }
      } catch (err) {
        console.error("Error fetching business dashboard data:", err);
        setError(err.message || "Failed to load business dashboard data.");
        setBusinessContract(null);
      } finally {
        setIsLoading(false); // End loading after data fetch attempt
      }
    };

    // Fetch data only if business object is available and not already loading its data
    if (business?.id && currentUser?.token) {
      // Only fetch if business.id and token are confirmed to exist
      fetchBusinessData();
    }
  }, [business, isAuthenticated, isBusiness, authLoading, currentUser]); // Depend on business and authLoading, currentUser

  const handleIssuePoints = async (e) => {
    e.preventDefault();
    // Ensure all necessary data, including the token, is available
    if (!businessContract || !customerAddress || !issueAmount || !account || !currentUser?.token) {
      setError("Please fill all fields, connect your wallet, and ensure you are logged in.");
      return;
    }

    setIsIssuing(true);
    setError(null);
    setMessage(null);

    try {
      // Validate customer address format
      if (!ethers.isAddress(customerAddress)) {
        throw new Error("Invalid customer wallet address format.");
      }

      // Convert amount to a number and validate
      const amount = parseFloat(issueAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Amount must be a positive number.");
      }

      // Call the API to issue points, passing the token
      await issuePoints(business.id, customerAddress, amount, currentUser.token); // Pass currentUser.token
      setMessage({ type: "success", text: `Successfully issued ${amount} points to ${customerAddress}!` });
      setIssueAmount(""); // Clear amount field

      // Optionally, refresh balance after issuing
      await handleGetBalance();
    } catch (err) {
      console.error("Error issuing points:", err);
      setError(err.message || "Failed to issue points.");
      setMessage({ type: "error", text: err.message || "Failed to issue points." });
    } finally {
      setIsIssuing(false);
    }
  };

  const handleGetBalance = async () => {
    if (!businessContract || !customerAddress) {
      setError("Please enter a customer address.");
      return;
    }

    setIsFetchingBalance(true);
    setError(null);
    setMessage(null);
    setCustomerBalance(null); // Clear previous balance

    try {
      if (!ethers.isAddress(customerAddress)) {
        throw new Error("Invalid customer wallet address format.");
      }
      const balance = await getBalance(business.id, customerAddress);
      setCustomerBalance(balance);
      setMessage({ type: "success", text: `Balance for ${customerAddress}: ${balance} points.` });
    } catch (err) {
      console.error("Error fetching balance:", err);
      setError(err.message || "Failed to fetch balance.");
      setMessage({ type: "error", text: err.message || "Failed to fetch balance." });
    } finally {
      setIsFetchingBalance(false);
    }
  };

  // NEW: Handle adding a new product to the catalog
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!business?.id || !currentUser?.token || !newProductName || !newProductPrice || !newProductLoyaltyPoints) {
      setError("Please fill all product fields and ensure you are logged in.");
      return;
    }

    setIsAddingProduct(true);
    setError(null);
    setMessage(null);

    try {
      const price = parseFloat(newProductPrice);
      const points = parseInt(newProductLoyaltyPoints, 10);

      if (isNaN(price) || price <= 0) {
        throw new Error("Product price must be a positive number.");
      }
      if (isNaN(points) || points < 0) {
        throw new Error("Loyalty points must be a non-negative integer.");
      }

      const productData = {
        name: newProductName,
        priceRp: price,
        loyaltyPoints: points,
      };

      const result = await addProductToCatalog(business.id, productData, currentUser.token);
      setProducts((prev) => [...prev, result.product]);
      setMessage({ type: "success", text: `Product "${result.product.name}" added successfully!` });
      setNewProductName("");
      setNewProductPrice("");
      setNewProductLoyaltyPoints("");
    } catch (err) {
      console.error("Error adding product:", err);
      setError(err.message || "Failed to add product.");
      setMessage({ type: "error", text: err.message || "Failed to add product." });
    } finally {
      setIsAddingProduct(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-polka-pink" />
        <p className="mt-4 text-lg text-slate-600">Loading business dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isBusiness) {
    return (
      <div className="text-center py-20">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Access Denied</h2>
        <p className="text-slate-600 mb-6">You must be logged in as a business to view this page.</p>
        <Link href="/login" className="btn-primary-dark">
          Login as Business
        </Link>
      </div>
    );
  }

  if (!businessContract) {
    return (
      <div className="text-center py-20">
        <Info className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-4">No Loyalty Program Found or Error</h2>
        <p className="text-slate-600 mb-6">
          It seems your business ({business?.id}) does not have an associated loyalty program contract deployed yet, or
          there was an error fetching its details.
        </p>
        {error && <p className="text-red-500 text-sm mt-2">Error details: {error}</p>}
        <p className="text-slate-600 mb-6">
          Please ensure your business was registered correctly, which includes deploying your loyalty token.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">Business Dashboard: {business?.id}</h1>

      {message && (
        <div
          className={`p-4 mb-4 rounded-md flex items-center ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
          {message.text}
        </div>
      )}

      {error && (
        <div className="p-4 mb-4 rounded-md bg-red-100 text-red-800 flex items-center">
          <XCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <div className="mb-8 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <h2 className="text-xl font-semibold text-slate-700 mb-3 flex items-center">
          <Wallet className="h-5 w-5 mr-2 text-polka-pink" /> Connected Wallet
        </h2>
        {account ? (
          <p className="text-slate-600 break-all">
            <span className="font-medium">Address:</span> {account}
          </p>
        ) : (
          <p className="text-red-500">Wallet not connected. Please connect your wallet to issue points.</p>
        )}
      </div>

      <div className="mb-8 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <h2 className="text-xl font-semibold text-slate-700 mb-3 flex items-center">
          <Info className="h-5 w-5 mr-2 text-polka-pink" /> Loyalty Program Details
        </h2>
        <p className="text-slate-600">
          <span className="font-medium">Name:</span> {businessContract.name}
        </p>
        <p className="text-slate-600">
          <span className="font-medium">Symbol:</span> {businessContract.symbol}
        </p>
        <p className="text-slate-600 break-all">
          <span className="font-medium">Contract Address:</span> {businessContract.address}{" "}
          <a
            href={`https://sepolia.etherscan.io/address/${businessContract.address}`} // Replace with your actual block explorer if not Sepolia
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline inline-flex items-center"
          >
            <ExternalLink className="h-4 w-4 ml-1" />
          </a>
        </p>
        <p className="text-slate-600 break-all">
          <span className="font-medium">Contract Owner:</span> {businessContract.owner}
        </p>
      </div>

      {/* NEW: Product Catalog Management */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
          <ShoppingBag className="h-6 w-6 mr-2 text-polka-pink" /> Product Catalog
        </h2>

        {/* Add New Product Form */}
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 mb-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-3 flex items-center">
            <PlusCircle className="h-5 w-5 mr-2 text-polka-pink" /> Add New Product
          </h3>
          <form onSubmit={handleAddProduct} className="space-y-3">
            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-slate-700 mb-1">
                Product Name:
              </label>
              <input
                type="text"
                id="productName"
                className="input-field-modern"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="e.g., Noodle"
                required
                disabled={isAddingProduct}
              />
            </div>
            <div>
              <label htmlFor="productPrice" className="block text-sm font-medium text-slate-700 mb-1">
                Price (Rp):
              </label>
              <input
                type="number"
                id="productPrice"
                className="input-field-modern"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                placeholder="e.g., 5000"
                min="0.01"
                step="any"
                required
                disabled={isAddingProduct}
              />
            </div>
            <div>
              <label htmlFor="productLoyaltyPoints" className="block text-sm font-medium text-slate-700 mb-1">
                Loyalty Points:
              </label>
              <input
                type="number"
                id="productLoyaltyPoints"
                className="input-field-modern"
                value={newProductLoyaltyPoints}
                onChange={(e) => setNewProductLoyaltyPoints(e.target.value)}
                placeholder="e.g., 5"
                min="0"
                step="1"
                required
                disabled={isAddingProduct}
              />
            </div>
            <button
              type="submit"
              className="btn-primary-dark w-full"
              disabled={isAddingProduct || !business?.id || !currentUser?.token}
            >
              {isAddingProduct ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <PlusCircle className="h-5 w-5 mr-2" />
              )}
              {isAddingProduct ? "Adding Product..." : "Add Product"}
            </button>
          </form>
        </div>

        {/* Existing Products List */}
        <h3 className="text-xl font-semibold text-slate-700 mb-3">Your Products</h3>
        {products.length === 0 ? (
          <p className="text-slate-600">No products added to your catalog yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => (
              <div key={product.id} className="card-modern">
                <h4 className="text-lg font-semibold text-polka-dark">{product.name}</h4>
                <p className="text-slate-600">Price: Rp{product.priceRp.toLocaleString()}</p>
                <p className="text-slate-600">Loyalty Points: {product.loyaltyPoints}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing Issue Loyalty Points Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Manually Issue Loyalty Points</h2>
        <form onSubmit={handleIssuePoints} className="space-y-4">
          <div>
            <label htmlFor="customerAddress" className="block text-sm font-medium text-slate-700 mb-1">
              Customer Wallet Address:
            </label>
            <input
              type="text"
              id="customerAddress"
              className="input-field-modern"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="e.g., 0xAbc123..."
              disabled={isIssuing}
            />
          </div>
          <div>
            <label htmlFor="issueAmount" className="block text-sm font-medium text-slate-700 mb-1">
              Amount to Issue:
            </label>
            <input
              type="number"
              id="issueAmount"
              className="input-field-modern"
              value={issueAmount}
              onChange={(e) => setIssueAmount(e.target.value)}
              placeholder="e.g., 100"
              min="1"
              step="any"
              disabled={isIssuing}
            />
          </div>
          <button
            type="submit"
            className="btn-primary-dark w-full"
            disabled={isIssuing || !account || !businessContract || !currentUser?.token}
          >
            {isIssuing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
            {isIssuing ? "Issuing Points..." : "Issue Points"}
          </button>
          {!account && <p className="text-red-500 text-sm mt-2">Please connect your wallet to issue points.</p>}
          {!currentUser?.token && <p className="text-red-500 text-sm mt-2">Please log in to issue points.</p>}
        </form>
      </div>

      {/* Existing Check Customer Balance Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Check Customer Balance</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            className="input-field-modern flex-grow"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="Enter customer wallet address"
            disabled={isFetchingBalance}
          />
          <button
            onClick={handleGetBalance}
            className="btn-secondary-light px-6 py-2.5"
            disabled={isFetchingBalance || !customerAddress || !businessContract}
          >
            {isFetchingBalance ? <Loader2 className="h-5 w-5 animate-spin" /> : <DollarSign className="h-5 w-5" />}
          </button>
        </div>
        {customerBalance !== null && (
          <p className="mt-4 text-lg font-semibold text-slate-800">
            Current Balance: {customerBalance} {businessContract.symbol}
          </p>
        )}
      </div>
    </div>
  );
}
