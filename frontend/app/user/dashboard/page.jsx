"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import {
  getBusinessContractInfo,
  getUserSubscriptions,
  subscribeToBusiness,
  getBalance,
  addDummyBalance,
  getDummyBalance,
} from "@/services/api"; // MODIFIED: Import new API calls
import { Loader2, Wallet, CheckCircle, XCircle, Info, ArrowRight, DollarSign, PlusCircle } from "lucide-react"; // MODIFIED: Add new icons
import Link from "next/link";
import { ethers } from "ethers";

export default function UserDashboard() {
  const { user, isAuthenticated, isUser, loading: authLoading, currentUser, refreshCurrentUser } = useAuth(); // MODIFIED: Add refreshCurrentUser
  const { account, provider, signer } = useWeb3();
  const [subscriptions, setSubscriptions] = useState({});
  const [availableBusinesses, setAvailableBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // NEW: Dummy Balance State
  const [dummyBalance, setDummyBalance] = useState(0);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [isToppingUp, setIsToppingUp] = useState(false);

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

    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      setMessage(null);
      try {
        if (!user?.id || !account || !currentUser?.token) {
          setError(
            "User ID, connected wallet, or authentication token missing. Please ensure you are logged in and wallet is connected."
          );
          setSubscriptions({});
          setAvailableBusinesses([]);
          setIsLoading(false);
          return;
        }

        // Fetch user's current subscriptions, passing the token
        const userSubs = await getUserSubscriptions(user.id, currentUser.token);
        setSubscriptions(userSubs);

        // NEW: Fetch dummy balance
        const balanceResponse = await getDummyBalance(user.id, currentUser.token);
        setDummyBalance(balanceResponse.balanceRp);

        // Fetch all businesses to determine which ones the user can subscribe to
        const allBusinesses = await getBusinessContractInfo("all");
        const businessesArray = Object.entries(allBusinesses).map(([id, info]) => ({ id, ...info }));

        // Filter out businesses the user is already subscribed to
        const unsubscribedBusinesses = businessesArray.filter(
          (business) => !userSubs[business.id] && business.id !== "defaultBusinessId"
        );
        setAvailableBusinesses(unsubscribedBusinesses);

        if (unsubscribedBusinesses.length > 0) {
          setSelectedBusinessId(unsubscribedBusinesses[0].id);
        }

        // Fetch balances for subscribed businesses
        const updatedSubscriptions = { ...userSubs };
        for (const businessId in userSubs) {
          if (userSubs.hasOwnProperty(businessId)) {
            try {
              const balance = await getBalance(businessId, userSubs[businessId].walletAddress);
              updatedSubscriptions[businessId].balance = balance;
            } catch (balanceError) {
              console.error(`Failed to fetch balance for ${businessId}:`, balanceError);
              updatedSubscriptions[businessId].balance = "N/A";
            }
          }
        }
        setSubscriptions(updatedSubscriptions);
      } catch (err) {
        console.error("Error fetching user dashboard data:", err);
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id && account && currentUser?.token) {
      fetchDashboardData();
    } else if (user?.id && !account && currentUser?.token) {
      setMessage({ type: "info", text: "Please connect your wallet to view your loyalty points and subscribe." });
      setIsLoading(false);
    }
  }, [user, isAuthenticated, isUser, account, authLoading, currentUser]);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!selectedBusinessId || !account || !currentUser?.token) {
      setError("Please select a business, connect your wallet, and ensure you are logged in.");
      return;
    }

    setIsSubscribing(true);
    setError(null);
    setMessage(null);

    try {
      await subscribeToBusiness(user.id, selectedBusinessId, account, currentUser.token);

      setMessage({ type: "success", text: `Successfully subscribed to ${selectedBusinessId}!` });

      // Refresh subscriptions and available businesses
      const userSubs = await getUserSubscriptions(user.id, currentUser.token);
      setSubscriptions(userSubs);

      const allBusinesses = await getBusinessContractInfo("all");
      const businessesArray = Object.entries(allBusinesses).map(([id, info]) => ({ id, ...info }));
      const unsubscribedBusinesses = businessesArray.filter(
        (business) => !userSubs[business.id] && business.id !== "defaultBusinessId"
      );
      setAvailableBusinesses(unsubscribedBusinesses);
      setSelectedBusinessId(unsubscribedBusinesses.length > 0 ? unsubscribedBusinesses[0].id : "");

      // Fetch balance for the newly subscribed business
      const updatedSubscriptions = { ...userSubs };
      if (updatedSubscriptions[selectedBusinessId]) {
        try {
          const balance = await getBalance(selectedBusinessId, updatedSubscriptions[selectedBusinessId].walletAddress);
          updatedSubscriptions[selectedBusinessId].balance = balance;
        } catch (balanceError) {
          console.error(`Failed to fetch balance for ${selectedBusinessId}:`, balanceError);
          updatedSubscriptions[selectedBusinessId].balance = "N/A";
        }
      }
      setSubscriptions(updatedSubscriptions);
    } catch (err) {
      console.error("Subscription error:", err);
      setError(err.message || "Failed to subscribe to business.");
      setMessage({ type: "error", text: err.message || "Failed to subscribe to business." });
    } finally {
      setIsSubscribing(false);
    }
  };

  // NEW: Handle top-up of dummy balance
  const handleTopUpBalance = async (e) => {
    e.preventDefault();
    if (!user?.id || !currentUser?.token || !topUpAmount) {
      setError("Please enter an amount and ensure you are logged in.");
      return;
    }

    setIsToppingUp(true);
    setError(null);
    setMessage(null);

    try {
      const amount = parseFloat(topUpAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Amount must be a positive number.");
      }

      const result = await addDummyBalance(user.id, amount, currentUser.token);
      setDummyBalance(result.newBalanceRp);
      // Also update currentUser context's balance
      refreshCurrentUser();
      setMessage({ type: "success", text: `Successfully added Rp${amount.toLocaleString()} to your balance!` });
      setTopUpAmount("");
    } catch (err) {
      console.error("Error topping up balance:", err);
      setError(err.message || "Failed to add balance.");
      setMessage({ type: "error", text: err.message || "Failed to add balance." });
    } finally {
      setIsToppingUp(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-polka-pink" />
        <p className="mt-4 text-lg text-slate-600">Loading user dashboard...</p>
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
      <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">User Dashboard: {user?.id}</h1>

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

      <div className="mb-8 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <h2 className="text-xl font-semibold text-slate-700 mb-3 flex items-center">
          <Wallet className="h-5 w-5 mr-2 text-polka-pink" /> Connected Wallet
        </h2>
        {account ? (
          <p className="text-slate-600 break-all">
            <span className="font-medium">Address:</span> {account}
          </p>
        ) : (
          <p className="text-red-500">
            Wallet not connected. Please connect your wallet to view your loyalty points and subscribe.
          </p>
        )}
      </div>

      {/* NEW: Dummy Balance Section */}
      <div className="mb-8 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <h2 className="text-xl font-semibold text-slate-700 mb-3 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-polka-pink" /> My Dummy Balance
        </h2>
        <p className="text-2xl font-bold text-slate-800 mb-4">Rp{dummyBalance.toLocaleString()}</p>
        <form onSubmit={handleTopUpBalance} className="flex space-x-2">
          <input
            type="number"
            className="input-field-modern flex-grow"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            placeholder="Amount to top up (Rp)"
            min="1"
            step="any"
            required
            disabled={isToppingUp}
          />
          <button
            type="submit"
            className="btn-primary-dark px-4 py-2.5 flex items-center"
            disabled={isToppingUp || !user?.id || !currentUser?.token}
          >
            {isToppingUp ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
          </button>
        </form>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">My Subscriptions</h2>
        {Object.keys(subscriptions).length === 0 ? (
          <p className="text-slate-600">You are not subscribed to any loyalty programs yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(subscriptions).map(([businessId, sub]) => (
              <div key={businessId} className="card-modern">
                <h3 className="text-lg font-semibold text-polka-dark mb-2">{businessId}</h3>
                <p className="text-sm text-slate-600">Wallet: {sub.walletAddress}</p>
                <p className="text-sm text-slate-600">
                  Subscribed On: {new Date(sub.subscribedAt).toLocaleDateString()}
                </p>
                <p className="text-md font-bold text-slate-800 mt-2">
                  Points: {sub.balance !== undefined ? sub.balance : "Loading..."}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <Link
                    href={`/user/redeem/${businessId}`}
                    className="inline-flex items-center text-polka-pink hover:underline text-sm"
                  >
                    Redeem Points <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                  {/* NEW: Link to buy products from this business */}
                  <Link href={`/user/buy-products/${businessId}`} className="btn-secondary-light text-sm px-3 py-1.5">
                    Buy Products
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Subscribe to New Businesses</h2>
        {availableBusinesses.length === 0 ? (
          <p className="text-slate-600">No new businesses available to subscribe to.</p>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-4">
            <div>
              <label htmlFor="businessSelect" className="block text-sm font-medium text-slate-700 mb-1">
                Select Business:
              </label>
              <select
                id="businessSelect"
                className="input-field-modern"
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                disabled={isSubscribing}
              >
                {availableBusinesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name} ({business.symbol})
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary-dark w-full" disabled={isSubscribing || !account}>
              {isSubscribing ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              {isSubscribing ? "Subscribing..." : "Subscribe to Loyalty Program"}
            </button>
            {!account && <p className="text-red-500 text-sm mt-2">Please connect your wallet to subscribe.</p>}
          </form>
        )}
      </div>
    </div>
  );
}
