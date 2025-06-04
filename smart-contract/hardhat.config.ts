import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: "0.8.24",
  defaultNetwork: "hardhat", // Default to the local Hardhat Network
  networks: {
    hardhat: {
      chainId: 1337, // Standard for local network
    },
    localhost: {
      // For connecting to a separate Ganache instance or Hardhat node
      url: "http://127.0.0.1:8545", // Default Ganache RPC URL
    },
  },
};

