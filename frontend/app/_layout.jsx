// File: ./frontend/app/_layout.jsx
"use client";

import "./globals.css";

import { Web3Provider } from "@/contexts/Web3Context";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/app/(components)/layout/Navbar";

import { WagmiConfig, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const hardhatLocal = {
  id: 1337,
  name: "Hardhat Localhost",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
  blockExplorers: {
    default: { name: "Hardhat Explorer", url: "http://localhost:8545" },
  },
};

const wagmiConfig = createConfig({
  chains: [hardhatLocal, mainnet, sepolia],
  transports: {
    [hardhatLocal.id]: http("http://127.0.0.1:8545"),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function ClientRootLayout({ children }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Web3Provider>
          <AuthProvider>
            <Navbar />
            <main className="px-4 py-4 min-h-[calc(100vh-10rem)] bg-light-bg-secondary">{children}</main>
            <footer className="text-center py-8 border-t border-gray-200 text-light-text-secondary">
              <p className="text-sm">© {new Date().getFullYear()} HashPerks. Secure and Transparent Rewards.</p>
            </footer>
          </AuthProvider>
        </Web3Provider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}
