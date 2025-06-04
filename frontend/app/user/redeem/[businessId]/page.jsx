// File: ./frontend/app/user/redeem/[businessId]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { getBusinessContractInfo, getBalance, recordRedemption } from "@/services/api"; // Import recordRedemption
import { Loader2, Gift, CheckCircle, XCircle, ArrowLeft, DollarSign } from "lucide-react";
import { ethers } from "ethers";

// Assuming LoyaltyToken_ABI.json is publicly accessible in /public directory
import loyaltyTokenAbi from "@/public/LoyaltyToken_ABI.json";

export default function RedeemPointsPage() {
  const params = useParams();
  const businessId = params.businessId;
  const router = useRouter();
  const { user, isAuthenticated, isUser, loading: authLoading, currentUser, refreshCurrentUser } = useAuth();
  const { account, signer } = useWeb3(); // Get signer from Web3Context

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

    if (!isAuthenticated || !isUser || !user?.id || !currentUser?.token) {
      setMessage({ type: "error", text: "Please log in as a user to access this page." });
      setIsLoading(false);
      return;
    }

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

        // Fetch business contract info (public call)
        const contractInfo = await getBusinessContractInfo(businessId);
        setBusinessContract(contractInfo);

        // Fetch user's loyalty balance for this business
        if (account) {
          const balance = await getBalance(businessId, account);
          setCurrentBalance(balance);
        } else {
          setCurrentBalance(null);
        }
      } catch (err) {
        console.error("Error fetching redeem page data:", err);
        setError(err.message || "Failed to load redemption page.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id && currentUser?.token) {
      fetchData();
    }
  }, [businessId, isAuthenticated, isUser, user, account, authLoading, currentUser, refreshCurrentUser]);

  const handleRedeemPoints = async (e) => {
    e.preventDefault();
    // Ensure all necessary data and connections are available
    if (!businessContract || !account || !redeemAmount || !signer || !user?.id || !currentUser?.token) {
      setError("Please fill all fields, connect your wallet, and ensure you are logged in.");
      return;
    }

    setIsRedeeming(true);
    setError(null);
    setMessage(null);

    try {
      const amount = parseFloat(redeemAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Amount to redeem must be a positive number.");
      }
      if (currentBalance !== null && amount > parseFloat(currentBalance)) {
        throw new Error("Insufficient loyalty points to redeem.");
      }

      // 1. Get the loyalty token contract instance connected to the user's signer
      if (!businessContract.address) {
        throw new Error("Business loyalty contract address is missing.");
      }
      const loyaltyTokenContract = new ethers.Contract(businessContract.address, loyaltyTokenAbi, signer);

      // 2. Convert amount to Wei (or appropriate token units)
      const decimals = await loyaltyTokenContract.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);

      // 3. Send the redeemPoints transaction from the user's wallet
      console.log(`Sending redemption transaction for ${amount} ${businessContract.symbol} from ${account}...`);
      const tx = await loyaltyTokenContract.redeemPoints(account, amountWei); // User redeems from their own balance
      const receipt = await tx.wait(); // Wait for the transaction to be mined
      console.log("Redemption transaction successful:", receipt);

      // 4. Record the redemption on the backend for history tracking
      await recordRedemption(user.id, businessId, account, amount, businessContract.symbol, currentUser.token);

      setMessage({ type: "success", text: `Successfully redeemed ${amount} ${businessContract.symbol} points!` });
      setRedeemAmount("");
      // Refresh balance after redemption
      const updatedBalance = await getBalance(businessId, account);
      setCurrentBalance(updatedBalance);
      refreshCurrentUser(); // Refresh AuthContext if needed (e.g., for dummy balance)
    } catch (err) {
      console.error("Error redeeming points:", err);
      // Check for common ethers.js errors
      if (err.code === "UNPREDICTABLE_GAS_LIMIT" || err.code === "CALL_EXCEPTION") {
        setError("Transaction failed. Check if you have enough points or if the contract allows this redemption.");
      } else if (err.code === "ACTION_REJECTED") {
        setError("Transaction rejected by wallet.");
      } else {
        setError(err.message || "Failed to redeem points.");
      }
      setMessage({ type: "error", text: error || "Failed to redeem points." });
    } finally {
      setIsRedeeming(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-light-bg-primary">
        <Loader2 className="h-12 w-12 animate-spin text-accent-green" />
        <p className="mt-4 text-lg text-light-text-secondary">Loading redemption page...</p>
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

  if (!businessContract) {
    return (
      <div className="text-center py-20 bg-light-bg-secondary rounded-2xl shadow-medium-shadow p-8 border border-gray-200">
        <Info className="h-16 w-16 text-status-info mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-light-text-primary mb-4">Loyalty Program Not Found</h2>
        <p className="text-light-text-secondary mb-6">
          The loyalty program for business ID "{businessId}" could not be found.
        </p>
        <Link href="/user/dashboard" className="btn-secondary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-light-bg-secondary rounded-2xl shadow-medium-shadow border border-gray-200">
      <Link href={`/user/dashboard`} className="inline-flex items-center text-accent-blue-light hover:underline mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-light-text-primary mb-6 text-center">
        Redeem {businessContract.symbol} Points from {businessContract.name}
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

      {error && (
        <div className="message-box-error">
          <XCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <div className="mb-8 p-4 bg-light-bg-primary rounded-xl shadow-subtle-shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-light-text-primary mb-3">Your Current Loyalty Balance:</h2>
        <p className="text-2xl font-bold text-accent-green">
          {currentBalance !== null ? currentBalance : "Loading..."} {businessContract.symbol}
        </p>
        {!account && <p className="text-status-error text-sm mt-2">Connect your wallet to see your balance.</p>}
      </div>

      <form onSubmit={handleRedeemPoints} className="space-y-4">
        <div>
          <label htmlFor="redeemAmount" className="block text-sm font-medium text-light-text-primary mb-1">
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
          className="btn-primary w-full"
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
      </form>
    </div>
  );
}
