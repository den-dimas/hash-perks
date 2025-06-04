// File: ./frontend/app/loyalty-program/[businessId]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import {
  getBusinessContractInfo,
  getProductsByBusiness,
  getBalance,
  subscribeToBusiness,
  getUserSubscriptions,
} from "@/services/api";
import { Loader2, Info, ShoppingBag, CheckCircle, XCircle, ExternalLink, ArrowLeft, UserPlus } from "lucide-react";
import { ethers } from "ethers";

export default function LoyaltyProgramDetailsPage() {
  const params = useParams();
  const businessId = params.businessId;
  const { user, isAuthenticated, isUser, loading: authLoading, currentUser } = useAuth();
  const { account } = useWeb3();

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

        const contractInfo = await getBusinessContractInfo(businessId);
        setBusinessContract(contractInfo);

        const productData = await getProductsByBusiness(businessId);
        setProducts(productData.products);

        if (isAuthenticated && isUser && user?.id && account && currentUser?.token) {
          const userSubscriptions = await getUserSubscriptions(user.id, currentUser.token);
          const isCurrentlySubscribed = !!userSubscriptions[businessId];
          setIsSubscribed(isCurrentlySubscribed);

          if (isCurrentlySubscribed) {
            const balance = await getBalance(businessId, account);
            setUserLoyaltyBalance(balance);
          } else {
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-light-bg-primary">
        <Loader2 className="h-12 w-12 animate-spin text-accent-green" />
        <p className="mt-4 text-lg text-light-text-secondary">Loading loyalty program details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-light-bg-secondary rounded-2xl shadow-medium-shadow p-8 border border-gray-200">
        <XCircle className="h-16 w-16 text-status-error mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-light-text-primary mb-4">Error</h2>
        <p className="text-light-text-secondary mb-6">{error}</p>
        <Link href="/" className="btn-secondary">
          Back to Home
        </Link>
      </div>
    );
  }

  if (!businessContract) {
    return (
      <div className="text-center py-20 bg-light-bg-secondary rounded-2xl shadow-medium-shadow p-8 border border-gray-200">
        <Info className="h-16 w-16 text-status-info mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-light-text-primary mb-4">Loyalty Program Not Found</h2>
        <p className="text-light-text-secondary mb-6">
          The loyalty program for business ID "{businessId}" could not be found.
        </p>
        <Link href="/" className="btn-secondary">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-light-bg-secondary rounded-2xl shadow-medium-shadow border border-gray-200">
      <Link href="/" className="inline-flex items-center text-accent-blue-light hover:underline mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Explore Programs
      </Link>

      <h1 className="text-3xl font-bold text-light-text-primary mb-6 text-center">
        {businessContract.name} Loyalty Program
      </h1>

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

      {/* Loyalty Program Details */}
      <div className="mb-8 p-4 bg-light-bg-primary rounded-xl shadow-subtle-shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-light-text-primary mb-3 flex items-center">
          <Info className="h-5 w-5 mr-2 text-accent-green" /> Program Details
        </h2>
        <p className="text-light-text-secondary">
          <span className="font-medium">Business ID:</span> {businessContract.id}
        </p>
        <p className="text-light-text-secondary">
          <span className="font-medium">Token Symbol:</span> {businessContract.symbol}
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
      </div>

      {/* User's Subscription Status and Actions */}
      <div className="mb-8 p-4 bg-light-bg-primary rounded-xl shadow-subtle-shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-light-text-primary mb-3 flex items-center">
          <UserPlus className="h-5 w-5 mr-2 text-accent-green" /> Your Subscription
        </h2>
        {isAuthenticated && isUser ? (
          <>
            {account ? (
              <>
                {isSubscribed ? (
                  <>
                    <p className="text-status-success font-semibold flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 mr-2" /> You are subscribed!
                    </p>
                    <p className="text-light-text-primary text-lg mb-4">
                      Your Loyalty Points:{" "}
                      <span className="font-bold text-accent-green">
                        {userLoyaltyBalance !== null ? userLoyaltyBalance : "Loading..."} {businessContract.symbol}
                      </span>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href={`/user/buy-products/${businessId}`} className="btn-primary flex-grow text-center">
                        Buy Products
                      </Link>
                      <Link href={`/user/redeem/${businessId}`} className="btn-secondary flex-grow text-center">
                        Redeem Points
                      </Link>
                    </div>
                  </>
                ) : (
                  <button onClick={handleSubscribe} className="btn-primary w-full" disabled={isSubscribing || !account}>
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
              <p className="text-status-error">Please connect your wallet to subscribe or view points.</p>
            )}
          </>
        ) : (
          <p className="text-light-text-secondary">
            <Link href="/login" className="text-accent-blue-light hover:underline font-medium">
              Log in as a user
            </Link>{" "}
            to subscribe and earn points!
          </p>
        )}
      </div>

      {/* Product Catalog Display */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-light-text-primary mb-4 flex items-center">
          <ShoppingBag className="h-6 w-6 mr-2 text-accent-green" /> Products from {businessContract.name}
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
                {isAuthenticated && isUser && (
                  <Link href={`/user/buy-products/${businessId}`} className="btn-secondary mt-4 w-full text-center">
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
