// File: ./frontend/app/(components)/auth/RegisterForm.jsx
"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { Loader2, CheckCircle, XCircle, Wallet } from "lucide-react";
import { ethers } from "ethers";

export function RegisterForm({ type, onUserRegister, onBusinessRegister }) {
  const [userId, setUserId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessSymbol, setBusinessSymbol] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const [message, setMessage] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { connectWallet, account, isLoading: isWeb3Loading } = useWeb3();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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
        result = await onUserRegister(userId, password, walletAddress);
      } else {
        if (!businessId || !businessName || !businessSymbol) {
          setFormError("Business ID, Name, and Symbol are required.");
          setIsLoading(false);
          return;
        }
        result = await onBusinessRegister(businessId, businessName, businessSymbol, walletAddress, password);
      }

      if (result && result.success) {
        setMessage({ type: "success", text: result.message || "Registration successful!" });
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
        <div className={message.type === "success" ? "message-box-success" : "message-box-error"}>
          {message.type === "success" ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
          {message.text}
        </div>
      )}

      {formError && (
        <div className="message-box-error">
          <XCircle className="h-5 w-5 mr-2" />
          {formError}
        </div>
      )}

      {type === "user" ? (
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-light-text-primary mb-1">
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
        <>
          <div>
            <label htmlFor="businessId" className="block text-sm font-medium text-light-text-primary mb-1">
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
            <label htmlFor="businessName" className="block text-sm font-medium text-light-text-primary mb-1">
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
            <label htmlFor="businessSymbol" className="block text-sm font-medium text-light-text-primary mb-1">
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
        <label htmlFor="password" className="block text-sm font-medium text-light-text-primary mb-1">
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
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-light-text-primary mb-1">
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
        <label htmlFor="walletAddress" className="block text-sm font-medium text-light-text-primary mb-1">
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
            disabled={isLoading || isWeb3Loading || account}
          />
          {mounted && !account && (
            <button
              type="button"
              onClick={connectWallet}
              className="btn-secondary flex-shrink-0 px-4 py-2 text-sm"
              disabled={isWeb3Loading || isLoading}
            >
              {isWeb3Loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wallet className="h-5 w-5" />}
              <span className="ml-2 hidden sm:inline">Connect Wallet</span>
            </button>
          )}
          {mounted && account && (
            <span className="text-status-success flex items-center text-sm">
              <CheckCircle className="h-4 w-4 mr-1" /> Connected
            </span>
          )}
        </div>
        {mounted && !account && (
          <p className="text-sm text-light-text-secondary mt-1">Connect your wallet to auto-fill your address.</p>
        )}
      </div>

      <button type="submit" className="btn-primary w-full" disabled={isLoading || isWeb3Loading}>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
        {type === "user" ? "Register as User" : "Register Business"}
      </button>
    </form>
  );
}
