"use client";

import Link from "next/link";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, LogOut, Loader2, User, Briefcase } from "lucide-react";

export function Navbar() {
  const { account, connectWallet, disconnectWallet, isLoading: isWeb3Loading } = useWeb3();
  // Destructure user and business directly from useAuth
  const { currentUser, user, business, isAuthenticated, isUser, isBusiness, logout, loading: authLoading } = useAuth();

  const displayAddress = account
    ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
    : "Connect Wallet";

  return (
    <nav className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo/Brand - Reverted to original styling */}
        <Link href="/" className="text-2xl font-bold text-polka-pink hover:text-polka-dark transition-colors">
          HashPerks
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-slate-600 hover:text-polka-pink transition-colors text-lg font-medium">
            Home
          </Link>

          {/* Conditional Dashboard Links based on Auth State */}
          {authLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          ) : (
            <>
              {isAuthenticated &&
                isUser && ( // Use isUser directly
                  <Link
                    href="/user/dashboard"
                    className="text-slate-600 hover:text-polka-pink transition-colors text-lg font-medium flex items-center"
                  >
                    <User className="h-5 w-5 mr-1" /> User Dashboard
                  </Link>
                )}
              {isAuthenticated &&
                isBusiness && ( // Use isBusiness directly
                  <Link
                    href="/business/dashboard"
                    className="text-slate-600 hover:text-polka-pink transition-colors text-lg font-medium flex items-center"
                  >
                    <Briefcase className="h-5 w-5 mr-1" /> Business Dashboard
                  </Link>
                )}
            </>
          )}
        </div>

        {/* Wallet & Auth Buttons */}
        <div className="flex items-center space-x-4">
          {/* Wallet Connection Button */}
          <button
            onClick={account ? disconnectWallet : connectWallet}
            className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200
              ${account ? "bg-red-500 hover:bg-red-600 text-white" : "bg-polka-dark hover:bg-slate-800 text-white"}
              ${isWeb3Loading ? "opacity-60 cursor-not-allowed" : ""}`}
            disabled={isWeb3Loading}
          >
            {isWeb3Loading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : account ? (
              <LogOut className="h-5 w-5 mr-2" />
            ) : (
              <Wallet className="h-5 w-5 mr-2" />
            )}
            {displayAddress}
          </button>

          {/* Login/Logout based on AuthContext */}
          {authLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          ) : isAuthenticated ? (
            <button onClick={logout} className="btn-secondary-light flex items-center">
              <LogOut className="h-5 w-5 mr-2" /> Logout ({currentUser?.id})
            </button>
          ) : (
            <Link href="/login" className="btn-primary-dark">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
