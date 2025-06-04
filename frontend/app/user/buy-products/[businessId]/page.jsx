"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getProductsByBusiness, getDummyBalance, buyProduct } from "@/services/api";
import { Loader2, ShoppingBag, DollarSign, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

export default function BuyProductsPage() {
  const params = useParams();
  const businessId = params.businessId; // Get businessId from URL
  const { user, isAuthenticated, isUser, loading: authLoading, currentUser, refreshCurrentUser } = useAuth();

  const [products, setProducts] = useState([]);
  const [businessName, setBusinessName] = useState(""); // To display business name
  const [dummyBalance, setDummyBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!isAuthenticated || !isUser) {
      setMessage({ type: "error", text: "Please log in as a user to access this page." });
      setIsLoading(false);
      return;
    }

    const fetchProductsAndBalance = async () => {
      setIsLoading(true);
      setError(null);
      setMessage(null);
      try {
        if (!user?.id || !currentUser?.token || !businessId) {
          setError("Authentication token or business ID missing. Please log in.");
          setIsLoading(false);
          return;
        }

        // Fetch products for the specific business
        const productsData = await getProductsByBusiness(businessId);
        setProducts(productsData.products);

        // Assuming business name comes with product data or we can fetch it separately
        // For now, let's just use businessId or assume business name can be derived.
        // If your getProductsByBusiness doesn't return business name, you might need a separate API call.
        // For simplicity, we'll just set it to businessId for now.
        setBusinessName(businessId); // Placeholder

        // Fetch user's dummy balance
        const balanceResponse = await getDummyBalance(user.id, currentUser.token);
        setDummyBalance(balanceResponse.balanceRp);
      } catch (err) {
        console.error("Error fetching products or balance:", err);
        setError(err.message || "Failed to load products or balance.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id && currentUser?.token && businessId) {
      fetchProductsAndBalance();
    }
  }, [user, isAuthenticated, isUser, authLoading, currentUser, businessId]);

  const handleBuyProduct = async (productId, priceRp) => {
    if (!user?.id || !currentUser?.token || !businessId || !productId) {
      setError("User, token, business, or product ID missing.");
      return;
    }

    if (dummyBalance < priceRp) {
      setError(
        `Insufficient balance. This product costs Rp${priceRp.toLocaleString()}, your balance is Rp${dummyBalance.toLocaleString()}. Please top up.`
      );
      return;
    }

    setIsBuying(true); // Disable all buy buttons
    setError(null);
    setMessage(null);

    try {
      const result = await buyProduct(user.id, businessId, productId, currentUser.token);
      setDummyBalance(result.newBalanceRp);
      refreshCurrentUser(); // Refresh currentUser context to update balance display in Navbar/Dashboard
      setMessage({ type: "success", text: result.message });

      // Refresh loyalty points for the subscribed business on user dashboard (optional, but good UX)
      // This would require triggering a re-fetch of subscriptions in AuthContext or from user dashboard.
      // For now, the backend confirms issuance, and user dashboard will reflect it on next load.
    } catch (err) {
      console.error("Error buying product:", err);
      setError(err.message || "Failed to buy product.");
      setMessage({ type: "error", text: err.message || "Failed to buy product." });
    } finally {
      setIsBuying(false); // Re-enable buy buttons
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-polka-pink" />
        <p className="mt-4 text-lg text-slate-600">Loading products...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isUser) {
    return (
      <div className="text-center py-20">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Access Denied</h2>
        <p className="text-slate-600 mb-6">You must be logged in as a user to view this page.</p>
        <Link href="/login" className="btn-primary-dark">
          Login as User
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <Link href="/user/dashboard" className="inline-flex items-center text-polka-pink hover:underline mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">Products from {businessName}</h1>

      {message && (
        <div
          className={`p-4 mb-4 rounded-md flex items-center ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : message.type === "error"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
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
        <div className="p-4 mb-4 rounded-md bg-red-100 text-red-800 flex items-center">
          <XCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <div className="mb-8 p-4 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-700 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-polka-pink" /> Your Current Balance
        </h2>
        <p className="text-2xl font-bold text-slate-800">Rp{dummyBalance.toLocaleString()}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Available Products</h2>
        {products.length === 0 ? (
          <p className="text-slate-600">This business has no products in its catalog yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="card-modern flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-polka-dark mb-1">{product.name}</h3>
                  <p className="text-slate-600 mb-2">Price: Rp{product.priceRp.toLocaleString()}</p>
                  <p className="text-slate-600">Earn: {product.loyaltyPoints} loyalty points</p>
                </div>
                <button
                  onClick={() => handleBuyProduct(product.id, product.priceRp)}
                  className="btn-primary-dark mt-4 w-full flex items-center justify-center"
                  disabled={isBuying || dummyBalance < product.priceRp} // Disable if buying or insufficient funds
                >
                  {isBuying ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <ShoppingBag className="h-5 w-5 mr-2" />
                  )}
                  {isBuying ? "Buying..." : "Buy Now"}
                </button>
                {dummyBalance < product.priceRp && (
                  <p className="text-red-500 text-xs mt-1 text-center">Insufficient balance</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
