"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";

// Create a context for Web3
const Web3Context = createContext(null);

// Web3 Provider component
export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use refs to store the latest provider and signer instances.
  // This allows event handlers to access the current instances without
  // being dependent on the state variables directly, preventing re-renders
  // in the useEffect's dependency array.
  const providerRef = useRef(null);
  const signerRef = useRef(null);

  // Update refs whenever state changes
  useEffect(() => {
    providerRef.current = provider;
  }, [provider]);

  useEffect(() => {
    signerRef.current = signer;
  }, [signer]);

  // Function to disconnect wallet (stable with useCallback)
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setError(null);
    console.log("Wallet disconnected (app state cleared).");
  }, []);

  // Function to connect wallet (user-initiated, stable with useCallback)
  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (window.ethereum) {
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethProvider); // This updates the state and subsequently providerRef.current
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const selectedAccount = accounts[0];
        setAccount(selectedAccount);
        const ethSigner = await ethProvider.getSigner();
        setSigner(ethSigner); // This updates the state and subsequently signerRef.current
        console.log("Wallet connected:", selectedAccount);
      } else {
        setError("MetaMask or a compatible wallet is not detected. Please install one.");
        console.warn("MetaMask or a compatible wallet is not detected.");
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setError(err.message || "Failed to connect wallet. Please ensure your wallet is unlocked and try again.");
      disconnectWallet(); // Clear state on connection failure
    } finally {
      setIsLoading(false);
    }
  }, [disconnectWallet]);

  // Handler for accounts changed event (stable with useCallback)
  const handleAccountsChanged = useCallback(
    async (accounts) => {
      if (accounts.length > 0) {
        const newAccount = accounts[0];
        setAccount(newAccount); // Always update account state

        // If a provider instance exists in the ref, try to get a new signer for the new account.
        // This avoids depending directly on the 'provider' state variable in this callback's dependencies.
        if (providerRef.current) {
          try {
            const newSigner = await providerRef.current.getSigner();
            setSigner(newSigner);
          } catch (err) {
            console.error("Error getting signer on accountsChanged:", err);
            setSigner(null); // Clear signer if error
          }
        } else {
          // If no provider exists in the ref, it means the wallet wasn't fully initialized
          // or was disconnected. Attempt a full re-connection to establish provider and signer.
          connectWallet();
        }
      } else {
        // No accounts found, disconnect
        disconnectWallet();
      }
    },
    [connectWallet, disconnectWallet]
  ); // Dependencies are other stable callbacks

  // Handler for chain changed event (stable with useCallback)
  const handleChainChanged = useCallback(() => {
    console.log("Chain changed. Reloading page.");
    window.location.reload();
  }, []); // No dependencies needed as it performs a full page reload

  // Effect to initialize wallet connection on app load and set up event listeners
  useEffect(() => {
    const initializeOnLoad = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (window.ethereum) {
          // Check if accounts are already connected (does not prompt user)
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            const selectedAccount = accounts[0];
            setAccount(selectedAccount);

            const ethProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(ethProvider);
            const ethSigner = await ethProvider.getSigner();
            setSigner(ethSigner);
            console.log("Wallet auto-connected on load:", selectedAccount);
          } else {
            console.log("No accounts found on load. Wallet not auto-connected.");
          }

          // Attach event listeners using the stable useCallback handlers
          window.ethereum.on("accountsChanged", handleAccountsChanged);
          window.ethereum.on("chainChanged", handleChainChanged);
        } else {
          setError("MetaMask or a compatible wallet is not detected. Please install one.");
          console.warn("MetaMask or a compatible wallet is not detected.");
        }
      } catch (err) {
        console.error("Error during wallet initialization on load:", err);
        setError(err.message || "Failed to initialize wallet on load.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeOnLoad();

    // Cleanup function for event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged]); // Dependencies are the stable callback functions

  // The value exposed by the context provider
  const value = {
    provider,
    signer,
    account,
    error,
    isLoading,
    connectWallet,
    disconnectWallet,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

// Custom hook to use the Web3 context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};
