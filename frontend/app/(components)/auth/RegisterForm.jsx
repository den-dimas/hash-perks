"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAccount } from "wagmi"; // Import useAccount from wagmi
import { Loader2, CheckCircle, XCircle, Wallet } from "lucide-react";
import { ethers } from "ethers"; // For address validation

// RegisterForm component now accepts specific handlers for user and business registration
export function RegisterForm({ type, onUserRegister, onBusinessRegister }) {
  // State for form fields
  const [userId, setUserId] = useState(""); // For user registration
  const [businessId, setBusinessId] = useState(""); // For business registration
  const [businessName, setBusinessName] = useState(""); // For business registration
  const [businessSymbol, setBusinessSymbol] = useState(""); // For business registration
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState(""); // For both user and business owner address

  const [message, setMessage] = useState(null); // For success/error messages
  const [formError, setFormError] = useState(null); // For form validation errors
  const [isLoading, setIsLoading] = useState(false);

  const { connectWallet, account, isLoading: isWeb3Loading } = useWeb3();

  // CRITICAL: Call useAccount unconditionally at the top level, as per React Rules of Hooks.
  // The value will be defensively used based on 'mounted' state.
  const { address: wagmiConnectedWalletAddress } = useAccount();

  // State to track if the component has fully mounted on the client
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync walletAddress state with connected account from Web3Context
  useEffect(() => {
    if (mounted && account) {
      setWalletAddress(account);
    }
  }, [mounted, account]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setFormError(null);
    setIsLoading(true);

    // Basic form validation
    if (!password || !confirmPassword) {
      setFormError("Password and Confirm Password are required.");
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      setIsLoading(false);
      return;
    }
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      setFormError("A valid wallet address is required.");
      setIsLoading(false);
      return;
    }

    let result;
    try {
      if (type === "user") {
        if (!userId) {
          setFormError("User ID is required.");
          setIsLoading(false);
          return;
        }
        // Call the passed-in user registration handler
        result = await onUserRegister(userId, password, walletAddress);
      } else {
        // type === 'business'
        if (!businessId || !businessName || !businessSymbol) {
          setFormError("Business ID, Name, and Symbol are required.");
          setIsLoading(false);
          return;
        }
        // Call the passed-in business registration handler
        result = await onBusinessRegister(businessId, businessName, businessSymbol, walletAddress, password);
      }

      if (result && result.success) {
        setMessage({ type: "success", text: result.message || "Registration successful!" });
        // Clear form fields on success
        setUserId("");
        setBusinessId("");
        setBusinessName("");
        setBusinessSymbol("");
        setPassword("");
        setConfirmPassword("");
        setWalletAddress("");
      } else {
        setMessage({ type: "error", text: result.message || "Registration failed." });
      }
    } catch (err) {
      console.error("Registration submission error:", err);
      setMessage({ type: "error", text: err.message || "An unexpected error occurred during registration." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-md flex items-center ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
          {message.text}
        </div>
      )}

      {formError && (
        <div className="p-4 rounded-md bg-red-100 text-red-800 flex items-center">
          <XCircle className="h-5 w-5 mr-2" />
          {formError}
        </div>
      )}

      {type === "user" ? (
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-slate-700 mb-1">
            User ID:
          </label>
          <input
            type="text"
            id="userId"
            className="input-field-modern"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Choose a unique user ID"
            required
            disabled={isLoading}
          />
        </div>
      ) : (
        // Business registration fields
        <>
          <div>
            <label htmlFor="businessId" className="block text-sm font-medium text-slate-700 mb-1">
              Business ID:
            </label>
            <input
              type="text"
              id="businessId"
              className="input-field-modern"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              placeholder="Unique ID for your business"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 mb-1">
              Business Name:
            </label>
            <input
              type="text"
              id="businessName"
              className="input-field-modern"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., My Coffee Shop"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="businessSymbol" className="block text-sm font-medium text-slate-700 mb-1">
              Loyalty Token Symbol:
            </label>
            <input
              type="text"
              id="businessSymbol"
              className="input-field-modern"
              value={businessSymbol}
              onChange={(e) => setBusinessSymbol(e.target.value)}
              placeholder="e.g., COFFEE (3-5 characters)"
              maxLength={5}
              required
              disabled={isLoading}
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
          Password:
        </label>
        <input
          type="password"
          id="password"
          className="input-field-modern"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
          Confirm Password:
        </label>
        <input
          type="password"
          id="confirmPassword"
          className="input-field-modern"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="walletAddress" className="block text-sm font-medium text-slate-700 mb-1">
          Your Wallet Address (Owner/Customer):
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            id="walletAddress"
            className="input-field-modern flex-grow"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            required
            disabled={isLoading || isWeb3Loading || account} // Disable if already connected
          />
          {mounted &&
            !account && ( // Only show connect button if not connected and mounted
              <button
                type="button"
                onClick={connectWallet}
                className="btn-secondary-light flex-shrink-0"
                disabled={isWeb3Loading || isLoading}
              >
                {isWeb3Loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wallet className="h-5 w-5" />}
                <span className="ml-2 hidden sm:inline">Connect Wallet</span>
              </button>
            )}
          {mounted && account && (
            <span className="text-green-600 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 mr-1" /> Connected
            </span>
          )}
        </div>
        {mounted && !account && (
          <p className="text-sm text-slate-500 mt-1">Connect your wallet to auto-fill your address.</p>
        )}
      </div>

      <button type="submit" className="btn-primary-dark w-full" disabled={isLoading || isWeb3Loading}>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
        {type === "user" ? "Register as User" : "Register Business"}
      </button>
    </form>
  );
}
