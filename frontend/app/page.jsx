// File: ./frontend/app/page.jsx
"use client";
import { useEffect, useState } from "react";
import { getBusinesses } from "@/services/api";
import { BusinessCard } from "@/app/(components)/business/BusinessCard";
import { Loader2, ServerCrash, ArrowRight, DatabaseZap } from "lucide-react";
import Link from "next/link";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAuth } from "@/contexts/AuthContext"; // NEW

export default function HomePage() {
  const [businesses, setBusinesses] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { connectWallet, account } = useWeb3();
  const { user, business, isAuthenticated, isUser, isBusiness } = useAuth(); // NEW

  useEffect(() => {
    async function fetchBusinesses() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getBusinesses();
        // Filter out any default or invalid businesses if they somehow persist
        const filteredBusinesses = Object.fromEntries(
          Object.entries(data).filter(([id, businessInfo]) => id !== "defaultBusinessId" && businessInfo.address)
        );
        setBusinesses(filteredBusinesses);
      } catch (err) {
        setError(err.message || "Failed to load businesses.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBusinesses();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section
        className="relative text-white py-20 sm:py-32 md:py-40 overflow-hidden"
        style={{ backgroundImage: "var(--hero-gradient)" }}
      >
        {/* Optional: Subtle graphic element */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-polka-pink/30 rounded-full filter blur-3xl opacity-50"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-polka-pink/20 rounded-full filter blur-3xl opacity-40"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Unlock Loyalty Potential
          </h1>
          <p className="max-w-xl md:max-w-2xl mx-auto text-lg sm:text-xl text-slate-700/90 mb-10">
            HashPerks leverages blockchain to revolutionize loyalty programs, offering transparency, security, and
            unprecedented control for businesses and customers alike.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {!isAuthenticated && (
              <>
                {/* Updated links to point to the generic /register page */}
                <Link href="/register" className="btn-on-gradient-dark">
                  Register Your Business <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link href="/register" className="btn-on-gradient-light">
                  Join as Customer <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </>
            )}
            {isAuthenticated && (
              <p className="text-lg font-semibold text-slate-800">
                Welcome, {user ? user.id : business ? business.id : "Guest"}!
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Businesses Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-slate-800">Explore Loyalty Programs</h2>

          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-polka-pink" />
              <p className="ml-4 text-lg text-slate-600">Loading businesses...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-10 text-red-500">
              <ServerCrash className="h-12 w-12 mx-auto mb-4" />
              <p className="text-xl font-semibold">Error: {error}</p>
              <p className="text-md text-slate-500">Please try again later or check the server status.</p>
            </div>
          )}

          {!isLoading && !error && Object.keys(businesses).length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <DatabaseZap className="h-12 w-12 mx-auto mb-4" />
              <p className="text-xl font-semibold">No businesses registered yet.</p>
              <p className="text-md">Be the first to create a loyalty program!</p>
              <Link href="/register" className="mt-6 inline-flex items-center text-polka-pink hover:underline">
                Register Your Business <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          )}

          {!isLoading && !error && Object.keys(businesses).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(businesses).map(([businessId, businessInfo]) => (
                <BusinessCard key={businessId} business={{ id: businessId, ...businessInfo }} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
