// File: ./frontend/app/user/buy-products/[businessId]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { getProductsByBusiness, buyProduct, getDummyBalance, getBusinessContractInfo } from "@/services/api";
import { Loader2, ShoppingBag, CheckCircle, XCircle, DollarSign, ArrowLeft } from "lucide-react";

export default function BuyProductsPage() {
  const params = useParams();
  const businessId = params.businessId;
  const router = useRouter();
  const { user, isAuthenticated, isUser, loading: authLoading, currentUser, refreshCurrentUser } = useAuth();
  const { account } = useWeb3();

  const [businessName, setBusinessName] = useState("");
  const [products, setProducts] = useState([]);
  const [dummyBalance, setDummyBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [buyingProductId, setBuyingProductId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!isAuthenticated || !isUser || !user?.id || !currentUser?.token) {
      setMessage({ type: "error", text: "Please log in as a user to access this page." });
      setIsLoading(false);
      return;
    }

    const fetchProductData = async () => {
      setIsLoading(true);
      setError(null);
      setMessage(null);
      try {
        if (!businessId) {
          setError("Business ID is missing from the URL.");
          setIsLoading(false);
          return;
        }

        const businessInfo = await getBusinessContractInfo(businessId);
        setBusinessName(businessInfo.name || businessId);

        const productData = await getProductsByBusiness(businessId);
        setProducts(productData.products);

        const balanceResponse = await getDummyBalance(user.id, currentUser.token);
        setDummyBalance(balanceResponse.balanceRp);
      } catch (err) {
        console.error("Error fetching product data:", err);
        setError(err.message || "Failed to load products.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id && currentUser?.token) {
      fetchProductData();
    }
  }, [businessId, isAuthenticated, isUser, user, authLoading, currentUser, refreshCurrentUser]);

  const handleBuyProduct = async (productId) => {
    if (!user?.id || !currentUser?.token || !businessId) {
      setError("User ID, authentication token, or business ID missing. Please log in.");
      return;
    }

    setBuyingProductId(productId);
    setError(null);
    setMessage(null);

    try {
      const result = await buyProduct(user.id, businessId, productId, currentUser.token);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        setDummyBalance(result.newBalanceRp);
        refreshCurrentUser();
      } else {
        setError(result.message || "Failed to purchase product.");
      }
    } catch (err) {
      console.error("Error buying product:", err);
      setError(err.message || "Failed to purchase product.");
    } finally {
      setBuyingProductId(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-light-bg-primary">
        <Loader2 className="h-12 w-12 animate-spin text-accent-green" />
        <p className="mt-4 text-lg text-light-text-secondary">Loading products...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isUser) {
    return (
      <div className="text-center py-20 bg-light-bg-secondary rounded-2xl shadow-medium-shadow p-8 border border-gray-200">
        <XCircle className="h-16 w-16 text-status-error mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-light-text-primary mb-4">Access Denied</h2>
        <p className="text-light-text-secondary mb-6">You must be logged in as a user to view this page.</p>
        <Link href="/login" className="btn-primary">
          Login as User
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-light-bg-secondary rounded-2xl shadow-medium-shadow border border-gray-200">
      <Link href="/user/dashboard" className="inline-flex items-center text-accent-blue-light hover:underline mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-light-text-primary mb-6 text-center">Buy Products from {businessName}</h1>

      {message && (
        <div
          className={
            message.type === "success"
              ? "message-box-success"
              : message.type === "error"
              ? "message-box-error"
              : "message-box-info"
          }
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5 mr-2" />
          ) : message.type === "error" ? (
            <XCircle className="h-5 w-5 mr-2" />
          ) : (
            <Info className="h-5 w-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      {error && (
        <div className="message-box-error">
          <XCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <div className="mb-8 p-4 bg-light-bg-primary rounded-xl shadow-subtle-shadow border border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-light-text-primary flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-accent-green" /> Your Current Balance:
        </h2>
        <p className="text-2xl font-bold text-light-text-primary">Rp{dummyBalance.toLocaleString()}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-light-text-primary mb-4 flex items-center">
          <ShoppingBag className="h-6 w-6 mr-2 text-accent-green" /> Available Products
        </h2>
        {products.length === 0 ? (
          <p className="text-light-text-secondary">This business has no products in its catalog yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="card-modern">
                <h3 className="text-lg font-semibold text-accent-green mb-1">{product.name}</h3>
                <p className="text-light-text-secondary mb-2">Price: Rp{product.priceRp.toLocaleString()}</p>
                <p className="text-light-text-secondary">Earn: {product.loyaltyPoints} loyalty points</p>
                <button
                  onClick={() => handleBuyProduct(product.id)}
                  disabled={buyingProductId === product.id || !account || !user?.id || !currentUser?.token}
                  className="btn-primary mt-4 w-full flex items-center justify-center"
                >
                  {buyingProductId === product.id ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <ShoppingBag className="h-5 w-5 mr-2" />
                  )}
                  {buyingProductId === product.id ? "Processing..." : `Buy for Rp${product.priceRp.toLocaleString()}`}
                </button>
                {!account && <p className="text-status-error text-xs mt-2 text-center">Connect wallet to buy.</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
