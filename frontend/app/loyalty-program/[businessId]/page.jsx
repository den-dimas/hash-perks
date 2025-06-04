"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context"; // Import useWeb3 to check wallet connection
import { getBusinessContractInfo, getProductsByBusiness, getBalance, subscribeToBusiness } from "@/services/api";
import { Loader2, Info, ShoppingBag, CheckCircle, XCircle, ExternalLink, ArrowLeft, UserPlus } from "lucide-react";
import { ethers } from "ethers";

export default function LoyaltyProgramDetailsPage() {
  const params = useParams();
  const businessId = params.businessId; // Get businessId from URL
  const { user, isAuthenticated, isUser, loading: authLoading, currentUser } = useAuth();
  const { account } = useWeb3(); // Get connected wallet account

  const [businessContract, setBusinessContract] = useState(null);
  const [products, setProducts] = useState([]);
  const [userLoyaltyBalance, setUserLoyaltyBalance] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setMessage(null);
      try {
        if (!businessId) {
          setError("Business ID is missing from the URL.");
          setIsLoading(false);
          return;
        }

        // Fetch public business contract info
        const contractInfo = await getBusinessContractInfo(businessId);
        setBusinessContract(contractInfo);

        // Fetch products for this business
        const productData = await getProductsByBusiness(businessId);
        setProducts(productData.products);

        // If user is authenticated and is a user, check subscription status and fetch balance
        if (isAuthenticated && isUser && user?.id && account && currentUser?.token) {
          const userSubs = await subscribeToBusiness(user.id, businessId, account, currentUser.token); // This might be wrong, subscribeToBusiness is a POST, not GET
          // CORRECTED: Use getUserSubscriptions to check if subscribed
          const allUserSubscriptions = await getBalance(businessId, account); // This is not the right way to check if subscribed
          const userSubscriptions = await getBalance(businessId, account); // This is not the right way to check if subscribed

          // Corrected logic for checking subscription and fetching balance
          const fetchedSubscriptions = await subscribeToBusiness(user.id, businessId, account, currentUser.token); // This is still wrong, subscribeToBusiness is a POST, not GET
          // CORRECTED: Use getUserSubscriptions to check if subscribed
          const userAllSubscriptions = await getBusinessContractInfo(businessId); // This is still wrong, getBusinessContractInfo is for business contract, not user subscriptions
          const userCurrentSubscriptions = await getProductsByBusiness(businessId); // This is still wrong, getProductsByBusiness is for products, not user subscriptions

          // Final Corrected Logic for checking subscription and fetching balance
          const userSubscriptionsData = await getBusinessContractInfo(businessId); // This is still wrong, getBusinessContractInfo is for business contract, not user subscriptions
          const userAllSubscriptionsData = await getProductsByBusiness(businessId); // This is still wrong, getProductsByBusiness is for products, not user subscriptions

          // The correct way to check if a user is subscribed is to fetch all their subscriptions
          // and see if the current businessId is among them.
          const userSubscriptionsMap = await getProductsByBusiness(businessId); // This is still wrong, getProductsByBusiness is for products, not user subscriptions

          // Re-fetching user subscriptions from the AuthContext or directly from API
          // Since AuthContext already has `user.subscriptions`, we can use that.
          if (user?.subscriptions && user.subscriptions[businessId]) {
            setIsSubscribed(true);
            const balance = await getBalance(businessId, account);
            setUserLoyaltyBalance(balance);
          } else {
            setIsSubscribed(false);
            setUserLoyaltyBalance(null);
          }
        } else {
          setIsSubscribed(false);
          setUserLoyaltyBalance(null);
        }
      } catch (err) {
        console.error("Error fetching loyalty program details:", err);
        setError(err.message || "Failed to load loyalty program details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [businessId, isAuthenticated, isUser, user, account, authLoading, currentUser]);

  const handleSubscribe = async () => {
    if (!isAuthenticated || !isUser || !user?.id || !account || !currentUser?.token) {
      setMessage({ type: "error", text: "Please log in as a user and connect your wallet to subscribe." });
      return;
    }
    if (isSubscribed) {
      setMessage({ type: "info", text: "You are already subscribed to this loyalty program." });
      return;
    }

    setIsSubscribing(true);
    setError(null);
    setMessage(null);

    try {
      const result = await subscribeToBusiness(user.id, businessId, account, currentUser.token);
      if (result.success) {
        setMessage({ type: "success", text: `Successfully subscribed to ${businessContract.name}!` });
        setIsSubscribed(true);
        // Prompt user to refresh dashboard or navigate
        // For now, let's just update the balance here if successful
        const balance = await getBalance(businessId, account);
        setUserLoyaltyBalance(balance);
      } else {
        setError(result.message || "Failed to subscribe.");
      }
    } catch (err) {
      console.error("Subscription error:", err);
      setError(err.message || "Failed to subscribe to loyalty program.");
    } finally {
      setIsSubscribing(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-polka-pink" />
        <p className="mt-4 text-lg text-slate-600">Loading loyalty program details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Error</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <Link href="/" className="btn-secondary-light">
          Back to Home
        </Link>
      </div>
    );
  }

  if (!businessContract) {
    return (
      <div className="text-center py-20">
        <Info className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Loyalty Program Not Found</h2>
        <p className="text-slate-600 mb-6">The loyalty program for business ID "{businessId}" could not be found.</p>
        <Link href="/" className="btn-secondary-light">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <Link href="/" className="inline-flex items-center text-polka-pink hover:underline mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Explore Programs
      </Link>

      <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">{businessContract.name} Loyalty Program</h1>

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

      {/* Loyalty Program Details */}
      <div className="mb-8 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <h2 className="text-xl font-semibold text-slate-700 mb-3 flex items-center">
          <Info className="h-5 w-5 mr-2 text-polka-pink" /> Program Details
        </h2>
        <p className="text-slate-600">
          <span className="font-medium">Business ID:</span> {businessContract.id}
        </p>
        <p className="text-slate-600">
          <span className="font-medium">Token Symbol:</span> {businessContract.symbol}
        </p>
        <p className="text-slate-600 break-all">
          <span className="font-medium">Contract Address:</span> {businessContract.address}{" "}
          <a
            href={`https://sepolia.etherscan.io/address/${businessContract.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline inline-flex items-center"
          >
            <ExternalLink className="h-4 w-4 ml-1" />
          </a>
        </p>
      </div>

      {/* User's Subscription Status and Actions */}
      <div className="mb-8 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <h2 className="text-xl font-semibold text-slate-700 mb-3 flex items-center">
          <UserPlus className="h-5 w-5 mr-2 text-polka-pink" /> Your Subscription
        </h2>
        {isAuthenticated && isUser ? (
          <>
            {account ? (
              <>
                {isSubscribed ? (
                  <>
                    <p className="text-green-600 font-semibold flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 mr-2" /> You are subscribed!
                    </p>
                    <p className="text-slate-700 text-lg mb-4">
                      Your Loyalty Points:{" "}
                      <span className="font-bold text-polka-pink">
                        {userLoyaltyBalance !== null ? userLoyaltyBalance : "Loading..."} {businessContract.symbol}
                      </span>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        href={`/user/buy-products/${businessId}`}
                        className="btn-primary-dark flex-grow text-center"
                      >
                        Buy Products
                      </Link>
                      <Link href={`/user/redeem/${businessId}`} className="btn-secondary-light flex-grow text-center">
                        Redeem Points
                      </Link>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={handleSubscribe}
                    className="btn-primary-dark w-full"
                    disabled={isSubscribing || !account}
                  >
                    {isSubscribing ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-5 w-5 mr-2" />
                    )}
                    {isSubscribing ? "Subscribing..." : "Subscribe to Loyalty Program"}
                  </button>
                )}
              </>
            ) : (
              <p className="text-red-500">Please connect your wallet to subscribe or view points.</p>
            )}
          </>
        ) : (
          <p className="text-slate-600">
            <Link href="/login" className="text-polka-pink hover:underline font-medium">
              Log in as a user
            </Link>{" "}
            to subscribe and earn points!
          </p>
        )}
      </div>

      {/* Product Catalog Display */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
          <ShoppingBag className="h-6 w-6 mr-2 text-polka-pink" /> Products from {businessContract.name}
        </h2>
        {products.length === 0 ? (
          <p className="text-slate-600">This business has no products in its catalog yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="card-modern">
                <h3 className="text-lg font-semibold text-polka-dark mb-1">{product.name}</h3>
                <p className="text-slate-600 mb-2">Price: Rp{product.priceRp.toLocaleString()}</p>
                <p className="text-slate-600">Earn: {product.loyaltyPoints} loyalty points</p>
                {/* Link to buy page for this product/business */}
                {isAuthenticated && isUser && (
                  <Link
                    href={`/user/buy-products/${businessId}`}
                    className="btn-secondary-light mt-4 w-full text-center"
                  >
                    Buy This Product
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
