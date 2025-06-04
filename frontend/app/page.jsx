// File: ./frontend/app/page.jsx
"use client";

import { useEffect, useState } from "react";
import { getBusinesses } from "@/services/api";
import { Loader2, ExternalLink, Sparkles, Handshake, DollarSign, ShieldCheck, Zap, TrendingUp } from "lucide-react"; // Added new icons
import Link from "next/link";

export default function Home() {
  const [businesses, setBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getBusinesses();
        const filteredBusinesses = Object.entries(data)
          .filter(([id]) => id !== "defaultBusinessId")
          .map(([id, info]) => ({ id, ...info }));
        setBusinesses(filteredBusinesses);
      } catch (err) {
        console.error("Error fetching businesses:", err);
        setError(err.message || "Failed to load loyalty programs.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-light-bg-primary">
        <Loader2 className="h-12 w-12 animate-spin text-accent-green" />
        <p className="mt-4 text-lg text-light-text-secondary">Loading loyalty programs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-light-bg-secondary rounded-2xl shadow-large-shadow p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-status-error mb-4">Error Loading Programs</h2>
        <p className="text-light-text-secondary mb-6">{error}</p>
      </div>
    );
  }

  return (
    <div className="">
      {/* Hero Section */}
      <section className="relative text-center px-12 py-10 md:py-16 bg-hero-gradient-light rounded-3xl shadow-large-shadow mb-16 overflow-hidden border border-blue-100">
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold text-light-text-primary mb-6 leading-tight">
            Revolutionize Your Rewards with <span className="text-accent-green">HashPerks</span>
          </h1>
          <p className="text-xl md:text-2xl text-light-text-secondary mb-10 max-w-3xl mx-auto">
            Decentralized loyalty programs powered by blockchain. Secure, transparent, and truly rewarding for
            businesses and customers.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register" className="btn-primary">
              Get Started as a Business
            </Link>
            <Link href="#explore-programs" className="btn-secondary">
              Explore Programs
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 mb-16">
        <h2 className="text-4xl font-bold text-center text-light-text-primary mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card-modern text-center">
            <Sparkles className="h-12 w-12 text-accent-green mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-light-text-primary mb-3">Businesses Create Tokens</h3>
            <p className="text-light-text-secondary">
              Businesses easily deploy their own custom loyalty tokens on the blockchain.
            </p>
          </div>
          <div className="card-modern text-center">
            <Handshake className="h-12 w-12 text-accent-green mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-light-text-primary mb-3">Customers Earn & Redeem</h3>
            <p className="text-light-text-secondary">
              Customers earn tokens for purchases and can redeem them for exclusive perks.
            </p>
          </div>
          <div className="card-modern text-center">
            <ShieldCheck className="h-12 w-12 text-accent-green mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-light-text-primary mb-3">Transparent & Secure</h3>
            <p className="text-light-text-secondary">
              All transactions are recorded on an immutable ledger, ensuring trust and security.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 mb-16 bg-light-bg-secondary rounded-2xl shadow-medium-shadow p-8 border border-gray-200">
        <h2 className="text-4xl font-bold text-center text-light-text-primary mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex items-start card-modern p-6">
            <Zap className="h-8 w-8 text-accent-green mr-4 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-light-text-primary mb-2">Instant Point Issuance</h3>
              <p className="text-light-text-secondary">
                Issue loyalty points instantly and securely to customer wallets.
              </p>
            </div>
          </div>
          <div className="flex items-start card-modern p-6">
            <DollarSign className="h-8 w-8 text-accent-green mr-4 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-light-text-primary mb-2">Flexible Redemption</h3>
              <p className="text-light-text-secondary">
                Customers can redeem points for products, discounts, or unique experiences.
              </p>
            </div>
          </div>
          <div className="flex items-start card-modern p-6">
            <TrendingUp className="h-8 w-8 text-accent-green mr-4 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-light-text-primary mb-2">Enhanced Customer Engagement</h3>
              <p className="text-light-text-secondary">
                Build stronger relationships with a transparent and rewarding system.
              </p>
            </div>
          </div>
          <div className="flex items-start card-modern p-6">
            <ShieldCheck className="h-8 w-8 text-accent-green mr-4 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-light-text-primary mb-2">Fraud Prevention</h3>
              <p className="text-light-text-secondary">
                Blockchain's immutability drastically reduces fraud in loyalty programs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Programs Section (Original content, adapted to new styling) */}
      <section id="explore-programs" className="py-16">
        <h2 className="text-4xl font-bold text-center text-light-text-primary mb-10 leading-tight">
          Discover Loyalty Programs
        </h2>

        {businesses.length === 0 ? (
          <div className="text-center py-10 bg-light-bg-secondary rounded-2xl shadow-medium-shadow p-8 border border-gray-200">
            <p className="text-xl text-light-text-secondary">No loyalty programs available yet.</p>
            <p className="text-md text-light-text-secondary mt-2">
              Businesses can register and deploy their programs to be listed here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {businesses.map((business) => (
              <div key={business.id} className="card-modern">
                <h3 className="text-2xl font-bold text-accent-green mb-3">{business.name}</h3>
                <p className="text-light-text-primary text-lg mb-2">
                  <span className="font-semibold">ID:</span> {business.id}
                </p>
                <p className="text-light-text-primary text-lg mb-4">
                  <span className="font-semibold">Token:</span> {business.symbol}
                </p>
                <p className="text-light-text-secondary text-sm break-all mb-4">
                  <span className="font-semibold">Contract:</span> {business.address}{" "}
                  <a
                    href={`https://sepolia.etherscan.io/address/${business.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-blue-light hover:underline inline-flex items-center text-xs"
                  >
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </p>
                <Link href={`/loyalty-program/${business.id}`} className="btn-primary w-full text-center py-2.5">
                  View Details & Products
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Call to Action Section */}
      <section className="py-16 text-center bg-accent-green-light rounded-3xl shadow-large-shadow p-12 border border-accent-green-dark">
        <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Loyalty Program?</h2>
        <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto">
          Join HashPerks today and empower your business with a cutting-edge, blockchain-powered reward system.
        </p>
        <Link href="/register" className="btn-secondary bg-white text-accent-green hover:bg-gray-100 border-white">
          Register Your Business Now
        </Link>
      </section>
    </div>
  );
}
