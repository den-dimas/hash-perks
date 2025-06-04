"use client";

import { useEffect, useState } from "react";
import { getBusinesses } from "@/services/api";
import { Loader2, ExternalLink } from "lucide-react"; // Import ExternalLink for Etherscan link
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
        // Filter out the 'defaultBusinessId' if it's not meant to be publicly listed
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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-polka-pink" />
        <p className="mt-4 text-lg text-slate-600">Loading loyalty programs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Programs</h2>
        <p className="text-slate-600 mb-6">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-extrabold text-center text-polka-dark mb-10 leading-tight">
        Explore Loyalty Programs
      </h1>

      {businesses.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-slate-600">No loyalty programs available yet.</p>
          <p className="text-md text-slate-500 mt-2">Businesses can register and deploy their programs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {businesses.map((business) => (
            <div
              key={business.id}
              className="bg-white rounded-xl shadow-lg p-6 border border-slate-100 transform hover:scale-105 transition-transform duration-300 ease-in-out"
            >
              <h2 className="text-2xl font-bold text-polka-pink mb-3">{business.name}</h2>
              <p className="text-slate-700 text-lg mb-2">
                <span className="font-semibold">ID:</span> {business.id}
              </p>
              <p className="text-slate-700 text-lg mb-4">
                <span className="font-semibold">Token:</span> {business.symbol}
              </p>
              <p className="text-slate-600 text-sm break-all mb-4">
                <span className="font-semibold">Contract:</span> {business.address}{" "}
                <a
                  href={`https://sepolia.etherscan.io/address/${business.address}`} // Replace with your actual block explorer
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline inline-flex items-center text-xs"
                >
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </p>
              {/* MODIFIED: Link to the new public loyalty program details page */}
              <Link href={`/loyalty-program/${business.id}`} className="btn-primary-dark w-full text-center py-2.5">
                View Details & Products
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
