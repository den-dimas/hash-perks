// File: ./frontend/app/user/add-balance/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { addDummyBalance, getDummyBalance } from "@/services/api";
import { Loader2, DollarSign, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

export default function AddBalancePage() {
  const router = useRouter();
  const { user, isAuthenticated, isUser, loading: authLoading, currentUser, refreshCurrentUser } = useAuth();

  const [amount, setAmount] = useState("");
  const [currentBalance, setCurrentBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
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

    const fetchBalance = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const balanceResponse = await getDummyBalance(user.id, currentUser.token);
        setCurrentBalance(balanceResponse.balanceRp);
      } catch (err) {
        console.error("Error fetching dummy balance:", err);
        setError(err.message || "Failed to load current balance.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id && currentUser?.token) {
      fetchBalance();
    }
  }, [user, isAuthenticated, isUser, authLoading, currentUser, refreshCurrentUser]);

  const handleAddBalance = async (e) => {
    e.preventDefault();
    if (!user?.id || !currentUser?.token || !amount) {
      setError("Amount and user authentication are required.");
      return;
    }

    setIsAdding(true);
    setError(null);
    setMessage(null);

    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Amount must be a positive number.");
      }

      const result = await addDummyBalance(user.id, parsedAmount, currentUser.token);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        setCurrentBalance(result.newBalanceRp);
        setAmount("");
        refreshCurrentUser();
      } else {
        setError(result.message || "Failed to add balance.");
      }
    } catch (err) {
      console.error("Error adding balance:", err);
      setError(err.message || "An error occurred while adding balance.");
    } finally {
      setIsAdding(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-light-bg-primary">
        <Loader2 className="h-12 w-12 animate-spin text-accent-green" />
        <p className="mt-4 text-lg text-light-text-secondary">Loading balance page...</p>
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
    <div className="max-w-md mx-auto p-6 bg-light-bg-secondary rounded-2xl shadow-medium-shadow border border-gray-200">
      <Link href="/user/dashboard" className="inline-flex items-center text-accent-blue-light hover:underline mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-light-text-primary mb-6 text-center">Add Dummy Balance</h1>

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
        <h2 className="text-xl font-semibold text-light-text-primary mb-3">Your Current Balance:</h2>
        <p className="text-2xl font-bold text-accent-green">Rp{currentBalance.toLocaleString()}</p>
      </div>

      <form onSubmit={handleAddBalance} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-light-text-primary mb-1">
            Amount to Add (Rp):
          </label>
          <input
            type="number"
            id="amount"
            className="input-field-modern"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 100000"
            min="1"
            step="any"
            required
            disabled={isAdding}
          />
        </div>
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={isAdding || parseFloat(amount) <= 0 || !user?.id || !currentUser?.token}
        >
          {isAdding ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <DollarSign className="h-5 w-5 mr-2" />}
          {isAdding ? "Adding Balance..." : "Add Balance"}
        </button>
      </form>
    </div>
  );
}
