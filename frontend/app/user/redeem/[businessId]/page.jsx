"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { getBusinessContractInfo, getBalance, redeemPoints } from "@/services/api";
import { Loader2, DollarSign, Gift, XCircle, CheckCircle, Info, ArrowLeft } from "lucide-react"; // Added ArrowLeft
import Link from "next/link";
import { ethers } from "ethers"; // Import ethers

export default function RedeemPointsPage() {
  const router = useRouter();
  const { businessId } = useParams(); // Get businessId from URL
  const { user, isAuthenticated, isUser, loading: authLoading, currentUser } = useAuth(); // Get currentUser for token
  const { account, provider, signer } = useWeb3();

  const [businessContract, setBusinessContract] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(null);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    // CRITICAL CHECK: Ensure it's a USER and authenticated
    if (!isAuthenticated || !isUser) {
      setMessage({ type: "error", text: "Please log in as a user to access this page." });
      setIsLoading(false);
      return;
    }

    const fetchRedeemData = async () => {
      setIsLoading(true);
      setError(null);
      setMessage(null);
      try {
        if (!businessId || !account || !user?.id) {
          // Ensure user.id is also available
          throw new Error("Business ID, connected wallet, or user ID missing.");
        }

        // Fetch business contract info (no token needed as this is public info)
        const contractInfo = await getBusinessContractInfo(businessId);
        setBusinessContract(contractInfo);

        // Fetch user's balance for this specific business, using their connected wallet address
        const balance = await getBalance(businessId, account);
        setCurrentBalance(balance);
      } catch (err) {
        console.error("Error fetching redeem page data:", err);
        setError(err.message || "Failed to load redemption details.");
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if user is authenticated, is a user, and has a connected wallet
    if (user?.id && account && businessId && currentUser?.token) {
      // Ensure token is available
      fetchRedeemData();
    } else if (user?.id && !account && currentUser?.token) {
      setMessage({ type: "info", text: "Please connect your wallet to view your loyalty points." });
      setIsLoading(false);
    }
  }, [user, isAuthenticated, isUser, account, businessId, authLoading, currentUser]); // Added currentUser to dependencies

  const handleRedeemPoints = async (e) => {
    e.preventDefault();
    if (!businessContract || !redeemAmount || !account || !signer) {
      setError("Please fill all fields, connect your wallet, and ensure signer is available.");
      return;
    }

    setIsRedeeming(true);
    setError(null);
    setMessage(null);

    try {
      const amount = parseFloat(redeemAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Amount must be a positive number.");
      }
      if (amount > parseFloat(currentBalance)) {
        throw new Error("Redemption amount exceeds your current balance.");
      }

      // Load ABI (LoyaltyToken_ABI.json is in public folder)
      const LoyaltyTokenABI = await fetch("/LoyaltyToken_ABI.json").then((res) => res.json());

      const loyaltyTokenContract = new ethers.Contract(businessContract.address, LoyaltyTokenABI, signer);
      const amountWei = ethers.parseUnits(amount.toString(), businessContract.decimals);

      console.log(`Attempting to redeem ${amount} points from ${account} for business ${businessId}...`);
      const tx = await loyaltyTokenContract.redeemPoints(account, amountWei);
      await tx.wait();

      setMessage({ type: "success", text: `Successfully redeemed ${amount} points!` });
      setRedeemAmount("");
      // Refresh balance after successful redemption
      const updatedBalance = await getBalance(businessId, account);
      setCurrentBalance(updatedBalance);
    } catch (err) {
      console.error("Error redeeming points:", err);
      setError(err.message || "Failed to redeem points.");
      setMessage({ type: "error", text: err.message || "Failed to redeem points." });
    } finally {
      setIsRedeeming(false);
    }
  };

  // Show loading spinner if auth is still loading or page data is loading
  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-polka-pink" />
        <p className="mt-4 text-lg text-slate-600">Loading redemption page...</p>
      </div>
    );
  }

  // If not authenticated or not a user, show access denied
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

  if (!businessContract) {
    return (
      <div className="text-center py-20">
        <Info className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Business Not Found</h2>
        <p className="text-slate-600 mb-6">The loyalty program for business ID "{businessId}" could not be found.</p>
        <Link href="/user/dashboard" className="btn-secondary-light">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <Link href="/user/dashboard" className="inline-flex items-center text-polka-pink hover:underline mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">Redeem Points for {businessContract.name}</h1>

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

      <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50 text-center">
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Your Current Balance</h2>
        <p className="text-4xl font-extrabold text-polka-pink">
          {currentBalance !== null ? currentBalance : "Loading..."} {businessContract.symbol}
        </p>
        {!account && <p className="text-red-500 text-sm mt-2">Connect your wallet to see your balance.</p>}
      </div>

      <form onSubmit={handleRedeemPoints} className="space-y-4">
        <div>
          <label htmlFor="redeemAmount" className="block text-sm font-medium text-slate-700 mb-1">
            Amount to Redeem:
          </label>
          <input
            type="number"
            id="redeemAmount"
            className="input-field-modern"
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(e.target.value)}
            placeholder={`Max: ${currentBalance || 0}`}
            min="1"
            step="any"
            disabled={isRedeeming || !account || currentBalance === null}
          />
        </div>
        <button
          type="submit"
          className="btn-primary-dark w-full"
          disabled={
            isRedeeming ||
            !account ||
            currentBalance === null ||
            parseFloat(redeemAmount) <= 0 ||
            parseFloat(redeemAmount) > parseFloat(currentBalance)
          }
        >
          {isRedeeming ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Gift className="h-5 w-5 mr-2" />}
          {isRedeeming ? "Redeeming Points..." : "Redeem Points"}
        </button>
        {!account && <p className="text-red-500 text-sm mt-2">Please connect your wallet to redeem points.</p>}
      </form>
    </div>
  );
}
