"use client"; // <--- This file is now explicitly a Client Component

// No need to import Inter or metadata here, as they are handled by the parent Server Component layout.
import "./globals.css"; // Keep global styles import

import { Web3Provider } from "@/contexts/Web3Context";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/app/(components)/layout/Navbar";

// Import Wagmi necessary components
import { WagmiConfig, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Define a custom Hardhat/localhost chain for Wagmi
const hardhatLocal = {
  id: 1337, // This should match the chainId in your hardhat.config.js
  name: "Hardhat Localhost",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] }, // This should match your hardhat.config.js localhost URL
  },
  blockExplorers: {
    default: { name: "Hardhat Explorer", url: "http://localhost:8545" }, // Placeholder URL
  },
};

// Create Wagmi config and QueryClient inside the Client Component
// This ensures functions are not passed across the Server/Client Component boundary
const wagmiConfig = createConfig({
  chains: [hardhatLocal, mainnet, sepolia], // Include your local chain and any other chains you might use
  transports: {
    [hardhatLocal.id]: http("http://127.0.0.1:8545"), // Explicitly define transport for local chain
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

// This component is now responsible for providing client-side contexts
export default function ClientRootLayout({ children }) {
  return (
    // The <html> and <body> tags are handled by the parent Server Component layout.
    // We only wrap the content with the necessary providers here.
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Web3Provider>
          <AuthProvider>
            <Navbar />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 min-h-[calc(100vh-10rem)]">
              {children}
            </main>
            <footer className="text-center py-8 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                © {new Date().getFullYear()} HashPerks. Secure and Transparent Rewards.
              </p>
            </footer>
          </AuthProvider>
        </Web3Provider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}
