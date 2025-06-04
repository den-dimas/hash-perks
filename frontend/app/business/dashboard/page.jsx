// File: ./frontend/app/business/dashboard/page.jsx
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
  getBusinessTransactions,
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
  History,
} from "lucide-react";
import Link from "next/link";
import { ethers } from "ethers";

export default function BusinessDashboard() {
  const { business, isAuthenticated, isBusiness, loading: authLoading, currentUser } = useAuth();
  const { account, provider, signer } = useWeb3();

  const [businessContract, setBusinessContract] = useState(null);
  const [customerAddress, setCustomerAddress] = useState("");
  const [issueAmount, setIssueAmount] = useState("");
  const [customerBalance, setCustomerBalance] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Product Catalog State
  const [products, setProducts] = useState([]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductLoyaltyPoints, setNewProductLoyaltyPoints] = useState("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Transaction History State
  const [transactions, setTransactions] = useState([]);

  const currentBusinessId = business?.id;

  useEffect(() => {
    console.log("BusinessDashboard useEffect triggered.");
    console.log("  authLoading:", authLoading);
    console.log("  isAuthenticated:", isAuthenticated);
    console.log("  isBusiness:", isBusiness);
    console.log("  business?.id (from AuthContext):", business?.id);
    console.log("  currentUser?.token (from AuthContext):", currentUser?.token);

    if (authLoading) {
      setIsLoadingData(true);
      return;
    }

    if (!isAuthenticated || !isBusiness || !currentBusinessId) {
      console.log("BusinessDashboard: Access Denied condition met.");
      setMessage({ type: "error", text: `Access Denied: You must be logged in as a business to view this page.` });
      setIsLoadingData(false);
      return;
    }

    const fetchBusinessData = async () => {
      setIsLoadingData(true);
      setError(null);
      setMessage(null);
      try {
        if (currentBusinessId && currentUser?.token) {
          console.log("BusinessDashboard: Fetching business data for ID:", currentBusinessId);
          const contractInfo = await getBusinessContractInfo(currentBusinessId, currentUser.token, true);
          setBusinessContract(contractInfo);

          const productData = await getProductsByBusiness(currentBusinessId);
          setProducts(productData.products);

          const transactionHistory = await getBusinessTransactions(currentBusinessId, currentUser.token);
          setTransactions(transactionHistory.transactions);
          console.log("BusinessDashboard: Data fetched successfully.");
        } else {
          console.error("BusinessDashboard: Missing critical data for fetch (currentBusinessId or token).");
          setError("Business ID or authentication token not found in authentication context.");
          setBusinessContract(null);
        }
      } catch (err) {
        console.error("BusinessDashboard: Error fetching business dashboard data:", err);
        setError(err.message || "Failed to load business dashboard data.");
        setBusinessContract(null);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (!authLoading && isAuthenticated && isBusiness && currentBusinessId && currentUser?.token) {
      fetchBusinessData();
    }
  }, [isAuthenticated, isBusiness, authLoading, currentUser, business, currentBusinessId]);

  const handleIssuePoints = async (e) => {
    e.preventDefault();
    if (!businessContract || !customerAddress || !issueAmount || !account || !currentUser?.token) {
      setError("Please fill all fields, connect your wallet, and ensure you are logged in.");
      return;
    }

    setIsIssuing(true);
    setError(null);
    setMessage(null);

    try {
      if (!ethers.isAddress(customerAddress)) {
        throw new Error("Invalid customer wallet address format.");
      }

      const amount = parseFloat(issueAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Amount must be a positive number.");
      }

      await issuePoints(currentBusinessId, customerAddress, amount, currentUser.token);
      setMessage({ type: "success", text: `Successfully issued ${amount} points to ${customerAddress}!` });
      setIssueAmount("");

      const updatedTransactions = await getBusinessTransactions(currentBusinessId, currentUser.token);
      setTransactions(updatedTransactions.transactions);

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
    setCustomerBalance(null);

    try {
      if (!ethers.isAddress(customerAddress)) {
        throw new Error("Invalid customer wallet address format.");
      }
      const balance = await getBalance(currentBusinessId, customerAddress);
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

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!currentBusinessId || !currentUser?.token || !newProductName || !newProductPrice || !newProductLoyaltyPoints) {
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

      const result = await addProductToCatalog(currentBusinessId, productData, currentUser.token);
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

  if (authLoading || isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-light-bg-primary">
        <Loader2 className="h-12 w-12 animate-spin text-accent-green" />
        <p className="mt-4 text-lg text-light-text-secondary">Loading business dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isBusiness || !currentBusinessId) {
    console.log("BusinessDashboard: Rendering Access Denied message.");
    return (
      <div className="text-center py-20 bg-light-bg-secondary rounded-2xl shadow-medium-shadow p-8 border border-gray-200">
        <XCircle className="h-16 w-16 text-status-error mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-light-text-primary mb-4">Access Denied</h2>
        <p className="text-light-text-secondary mb-6">You must be logged in as a business to view this page.</p>
        <Link href="/login" className="btn-primary">
          Login as Business
        </Link>
      </div>
    );
  }

  if (!businessContract) {
    return (
      <div className="text-center py-20 bg-light-bg-secondary rounded-2xl shadow-medium-shadow p-8 border border-gray-200">
        <Info className="h-16 w-16 text-status-info mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-light-text-primary mb-4">No Loyalty Program Found or Error</h2>
        <p className="text-light-text-secondary mb-6">
          It seems your business ({currentBusinessId}) does not have an associated loyalty program contract deployed
          yet, or there was an error fetching its details.
        </p>
        {error && <p className="text-status-error text-sm mt-2">Error details: {error}</p>}
        <p className="text-light-text-secondary mb-6">
          Please ensure your business was registered correctly, which includes deploying your loyalty token.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-light-bg-secondary rounded-2xl shadow-medium-shadow border border-gray-200">
      <h1 className="text-3xl font-bold text-light-text-primary mb-6 text-center">
        Business Dashboard: {currentBusinessId}
      </h1>

      {message && (
        <div className={message.type === "success" ? "message-box-success" : "message-box-error"}>
          {message.type === "success" ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
          {message.text}
        </div>
      )}

      {error && (
        <div className="message-box-error">
          <XCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <div className="mb-8 p-4 bg-light-bg-primary rounded-xl shadow-subtle-shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-light-text-primary mb-3 flex items-center">
          <Wallet className="h-5 w-5 mr-2 text-accent-green" /> Connected Wallet
        </h2>
        {account ? (
          <p className="text-light-text-secondary break-all">
            <span className="font-medium">Address:</span> {account}
          </p>
        ) : (
          <p className="text-status-error">Wallet not connected. Please connect your wallet to issue points.</p>
        )}
      </div>

      <div className="mb-8 p-4 bg-light-bg-primary rounded-xl shadow-subtle-shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-light-text-primary mb-3 flex items-center">
          <Info className="h-5 w-5 mr-2 text-accent-green" /> Loyalty Program Details
        </h2>
        <p className="text-light-text-secondary">
          <span className="font-medium">Name:</span> {businessContract.name}
        </p>
        <p className="text-light-text-secondary">
          <span className="font-medium">Symbol:</span> {businessContract.symbol}
        </p>
        <p className="text-light-text-secondary break-all">
          <span className="font-medium">Contract Address:</span> {businessContract.address}{" "}
          <a
            href={`https://sepolia.etherscan.io/address/${businessContract.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue-light hover:underline inline-flex items-center"
          >
            <ExternalLink className="h-4 w-4 ml-1" />
          </a>
        </p>
        <p className="text-light-text-secondary break-all">
          <span className="font-medium">Contract Owner:</span> {businessContract.owner}
        </p>
      </div>

      {/* Product Catalog Management */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-light-text-primary mb-4 flex items-center">
          <ShoppingBag className="h-6 w-6 mr-2 text-accent-green" /> Product Catalog
        </h2>

        {/* Add New Product Form */}
        <div className="p-4 bg-light-bg-primary rounded-xl shadow-subtle-shadow border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-light-text-primary mb-3 flex items-center">
            <PlusCircle className="h-5 w-5 mr-2 text-accent-green" /> Add New Product
          </h3>
          <form onSubmit={handleAddProduct} className="space-y-3">
            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-light-text-primary mb-1">
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
              <label htmlFor="productPrice" className="block text-sm font-medium text-light-text-primary mb-1">
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
              <label htmlFor="productLoyaltyPoints" className="block text-sm font-medium text-light-text-primary mb-1">
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
              className="btn-primary w-full"
              disabled={isAddingProduct || !currentBusinessId || !currentUser?.token}
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
        <h3 className="text-xl font-semibold text-light-text-primary mb-3">Your Products</h3>
        {products.length === 0 ? (
          <p className="text-light-text-secondary">No products added to your catalog yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => (
              <div key={product.id} className="card-modern">
                <h4 className="text-lg font-semibold text-accent-green">{product.name}</h4>
                <p className="text-light-text-secondary">Price: Rp{product.priceRp.toLocaleString()}</p>
                <p className="text-light-text-secondary">Loyalty Points: {product.loyaltyPoints}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing Issue Loyalty Points Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-light-text-primary mb-4">Manually Issue Loyalty Points</h2>
        <form onSubmit={handleIssuePoints} className="space-y-4">
          <div>
            <label htmlFor="customerAddress" className="block text-sm font-medium text-light-text-primary mb-1">
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
            <label htmlFor="issueAmount" className="block text-sm font-medium text-light-text-primary mb-1">
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
            className="btn-primary w-full"
            disabled={isIssuing || !account || !businessContract || !currentUser?.token}
          >
            {isIssuing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
            {isIssuing ? "Issuing Points..." : "Issue Points"}
          </button>
          {!account && <p className="text-status-error text-sm mt-2">Please connect your wallet to issue points.</p>}
          {!currentUser?.token && <p className="text-status-error text-sm mt-2">Please log in to issue points.</p>}
        </form>
      </div>

      {/* Existing Check Customer Balance Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-light-text-primary mb-4">Check Customer Balance</h2>
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
            className="btn-secondary px-6 py-2.5"
            disabled={isFetchingBalance || !customerAddress || !businessContract}
          >
            {isFetchingBalance ? <Loader2 className="h-5 w-5 animate-spin" /> : <DollarSign className="h-5 w-5" />}
          </button>
        </div>
        {customerBalance !== null && (
          <p className="mt-4 text-lg font-semibold text-light-text-primary">
            Current Balance: {customerBalance} {businessContract.symbol}
          </p>
        )}
      </div>

      {/* Transaction History Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-light-text-primary mb-4 flex items-center">
          <History className="h-6 w-6 mr-2 text-accent-green" /> Business Transaction History
        </h2>
        {transactions.length === 0 ? (
          <p className="text-light-text-secondary">No transactions recorded yet for this business.</p>
        ) : (
          <div className="space-y-4">
            {transactions
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((txn) => (
                <div key={txn.id} className="card-modern p-4">
                  <p className="text-sm text-light-text-secondary">{new Date(txn.timestamp).toLocaleString()}</p>
                  <p className="text-md font-semibold text-light-text-primary">
                    {txn.type === "issue" && (
                      <span className="text-status-success">
                        Issued {txn.amount} {txn.loyaltyTokenSymbol} points
                      </span>
                    )}
                    {txn.type === "redeem" && (
                      <span className="text-status-error">
                        Redeemed {txn.amount} {txn.loyaltyTokenSymbol} points
                      </span>
                    )}
                    {txn.type === "purchase" && (
                      <span className="text-status-info">
                        Customer "{txn.userId}" purchased "{txn.productName}" for Rp{txn.amount.toLocaleString()}
                      </span>
                    )}{" "}
                    to <span className="font-bold">{txn.customerWalletAddress}</span>
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
