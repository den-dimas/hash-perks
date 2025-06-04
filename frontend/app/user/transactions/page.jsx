// File: ./frontend/app/user/transactions/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getUserTransactions } from "@/services/api";
import { Loader2, History, XCircle, ArrowLeft, Info } from "lucide-react";

export default function UserTransactionsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isUser, loading: authLoading, currentUser } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

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

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userTransactions = await getUserTransactions(user.id, currentUser.token);
        setTransactions(userTransactions.transactions);
      } catch (err) {
        console.error("Error fetching user transactions:", err);
        setError(err.message || "Failed to load transaction history.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id && currentUser?.token) {
      fetchTransactions();
    }
  }, [user, isAuthenticated, isUser, authLoading, currentUser]);

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-light-bg-primary">
        <Loader2 className="h-12 w-12 animate-spin text-accent-green" />
        <p className="mt-4 text-lg text-light-text-secondary">Loading transaction history...</p>
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

      <h1 className="text-3xl font-bold text-light-text-primary mb-6 text-center">Your Transaction History</h1>

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

      {transactions.length === 0 ? (
        <p className="text-light-text-secondary">No transactions recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {transactions
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map((txn) => (
              <div key={txn.id} className="card-modern p-4">
                <p className="text-sm text-light-text-secondary">{new Date(txn.timestamp).toLocaleString()}</p>
                <p className="text-md font-semibold text-light-text-primary">
                  {txn.type === "subscribe" && <span className="text-status-info">Subscribed to {txn.businessId}</span>}
                  {txn.type === "purchase" && (
                    <span className="text-status-success">
                      Purchased "{txn.productName}" from {txn.businessId} for Rp{txn.amount.toLocaleString()}
                    </span>
                  )}
                  {txn.type === "redeem" && (
                    <span className="text-status-error">
                      Redeemed {txn.amount} {txn.loyaltyTokenSymbol} points from {txn.businessId}
                    </span>
                  )}
                  {txn.type === "add_balance" && (
                    <span className="text-status-success">Added Rp{txn.amount.toLocaleString()} to dummy balance</span>
                  )}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
