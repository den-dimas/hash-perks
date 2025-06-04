// File: ./frontend/app/user/dashboard/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDummyBalance, getUserSubscriptions, getUserTransactions } from "@/services/api";
import Link from "next/link";
import {
  Loader2,
  DollarSign,
  Gift,
  History,
  Store,
  PlusCircle,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function UserDashboard() {
  const { user, isAuthenticated, isUser, loading: authLoading, currentUser, refreshCurrentUser } = useAuth();
  const [dummyBalance, setDummyBalance] = useState(0);
  const [subscriptions, setSubscriptions] = useState({});
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

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setMessage(null);
      try {
        const balanceResponse = await getDummyBalance(user.id, currentUser.token);
        setDummyBalance(balanceResponse.balanceRp);

        const userSubscriptions = await getUserSubscriptions(user.id, currentUser.token);
        setSubscriptions(userSubscriptions);

        const userTransactions = await getUserTransactions(user.id, currentUser.token);
        setTransactions(userTransactions.transactions);
      } catch (err) {
        console.error("Error fetching user dashboard data:", err);
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id && currentUser?.token) {
      fetchData();
    }
  }, [user, isAuthenticated, isUser, authLoading, currentUser, refreshCurrentUser]);

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-light-bg-primary">
        <Loader2 className="h-12 w-12 animate-spin text-accent-green" />
        <p className="mt-4 text-lg text-light-text-secondary">Loading user dashboard...</p>
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
      <h1 className="text-3xl font-bold text-light-text-primary mb-6 text-center">User Dashboard: {user.id}</h1>

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
        <Link href="/user/add-balance" className="btn-secondary px-4 py-2 text-sm">
          <PlusCircle className="h-4 w-4 mr-1" /> Add Balance
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-light-text-primary mb-4 flex items-center">
          <Store className="h-6 w-6 mr-2 text-accent-green" /> Your Subscribed Businesses
        </h2>
        {Object.keys(subscriptions).length === 0 ? (
          <div className="text-center py-6 bg-light-bg-primary rounded-xl shadow-subtle-shadow border border-gray-200">
            <p className="text-light-text-secondary mb-4">You are not subscribed to any loyalty programs yet.</p>
            <Link href="/" className="btn-primary">
              Explore Programs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(subscriptions).map(([businessId, subInfo]) => (
              <div key={businessId} className="card-modern p-4">
                <h3 className="text-lg font-semibold text-accent-green mb-1">{businessId}</h3>
                <p className="text-light-text-secondary break-all">Wallet: {subInfo.walletAddress}</p>
                <p className="text-light-text-secondary text-sm">
                  Subscribed: {new Date(subInfo.subscribedAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/user/buy-products/${businessId}`}
                    className="btn-primary flex-grow text-center text-sm px-3 py-2"
                  >
                    Buy Products
                  </Link>
                  <Link
                    href={`/user/redeem/${businessId}`}
                    className="btn-secondary flex-grow text-center text-sm px-3 py-2"
                  >
                    Redeem Points
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-light-text-primary mb-4 flex items-center">
          <History className="h-6 w-6 mr-2 text-accent-green" /> Your Transaction History
        </h2>
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
                    {txn.type === "subscribe" && (
                      <span className="text-status-info">Subscribed to {txn.businessId}</span>
                    )}
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
                      <span className="text-status-success">
                        Added Rp{txn.amount.toLocaleString()} to dummy balance
                      </span>
                    )}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
