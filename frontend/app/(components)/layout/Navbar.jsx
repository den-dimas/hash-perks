// File: ./frontend/app/(components)/layout/Navbar.jsx
"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, Briefcase, Home } from "lucide-react";

export function Navbar() {
  const { currentUser, isAuthenticated, isUser, isBusiness, logout } = useAuth();

  return (
    <nav className="bg-light-bg-secondary p-4 shadow-subtle-shadow border-b border-gray-200">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-light-text-primary text-2xl font-bold hover:text-accent-green transition-colors">
          HashPerks
        </Link>
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="text-light-text-secondary hover:text-accent-blue-light transition-colors flex items-center"
          >
            <Home className="h-5 w-5 mr-1" /> Explore
          </Link>
          {isAuthenticated ? (
            <>
              {isUser && (
                <Link
                  href="/user/dashboard"
                  className="text-light-text-secondary hover:text-accent-blue-light transition-colors flex items-center"
                >
                  <User className="h-5 w-5 mr-1" /> User Dashboard
                </Link>
              )}
              {isBusiness && (
                <Link
                  href="/business/dashboard"
                  className="text-light-text-secondary hover:text-accent-blue-light transition-colors flex items-center"
                >
                  <Briefcase className="h-5 w-5 mr-1" /> Business Dashboard
                </Link>
              )}
              <button onClick={logout} className="btn-secondary px-4 py-2 text-sm rounded-md flex items-center">
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-light-text-secondary hover:text-accent-blue-light transition-colors">
                Login
              </Link>
              <Link href="/register" className="btn-primary px-4 py-2 text-sm rounded-md">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
