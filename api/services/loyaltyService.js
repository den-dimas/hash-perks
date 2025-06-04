const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const businessService = require("./businessService"); // To get contract addresses

// Load contract ABIs and addresses
const contractAddressesPath = path.join(__dirname, "../contracts/contract-addresses.json");
const factoryAbiPath = path.join(__dirname, "../contracts/LoyaltyTokenFactory_ABI.json");
const loyaltyTokenAbiPath = path.join(__dirname, "../contracts/LoyaltyToken_ABI.json");

// Ensure files exist before reading
if (!fs.existsSync(contractAddressesPath)) {
  console.error(`Error: contract-addresses.json not found at ${contractAddressesPath}. Please deploy contracts.`);
  process.exit(1); // Exit if critical file is missing
}
if (!fs.existsSync(factoryAbiPath)) {
  console.error(`Error: LoyaltyTokenFactory_ABI.json not found at ${factoryAbiPath}. Please deploy contracts.`);
  process.exit(1);
}
if (!fs.existsSync(loyaltyTokenAbiPath)) {
  console.error(`Error: LoyaltyToken_ABI.json not found at ${loyaltyTokenAbiPath}. Please deploy contracts.`);
  process.exit(1);
}

const contractAddresses = JSON.parse(fs.readFileSync(contractAddressesPath, "utf8"));
const factoryAbi = JSON.parse(fs.readFileSync(factoryAbiPath, "utf8"));
const loyaltyTokenAbi = JSON.parse(fs.readFileSync(loyaltyTokenAbiPath, "utf8"));

// Ensure factory address is loaded
if (!contractAddresses.LoyaltyTokenFactory) {
  console.error("Error: LoyaltyTokenFactory address not found in contract-addresses.json.");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

// The backend wallet that will sign transactions for issuing points (the "owner" of the factory)
// This private key should belong to the account that deployed the LoyaltyTokenFactory.
const backendWallet = new ethers.Wallet(process.env.BACKEND_WALLET_PRIVATE_KEY, provider);

// LoyaltyTokenFactory contract instance
const loyaltyTokenFactory = new ethers.Contract(
  contractAddresses.LoyaltyTokenFactory,
  factoryAbi,
  backendWallet // Factory interactions are signed by the backend wallet
);

// Function to get a LoyaltyToken contract instance for a specific business
const getLoyaltyTokenContract = async (businessId) => {
  const businessContractInfo = businessService.getBusinessContract(businessId);
  if (!businessContractInfo || !businessContractInfo.address) {
    throw new Error(`Loyalty contract address not found for business ID: ${businessId}`);
  }
  return new ethers.Contract(businessContractInfo.address, loyaltyTokenAbi, backendWallet);
};

// Function to issue points
const issuePoints = async (businessId, customerAddress, amount) => {
  const loyaltyTokenContract = await getLoyaltyTokenContract(businessId);
  // Ensure the backend wallet is the owner of this specific loyalty token contract
  // This check is crucial for security and to prevent one business from issuing points for another.
  const contractOwner = await loyaltyTokenContract.owner();
  if (contractOwner.toLowerCase() !== backendWallet.address.toLowerCase()) {
    // This error should now theoretically not happen if deployLoyaltyTokenViaFactory is fixed
    throw new Error(`Backend wallet is not the owner of contract ${loyaltyTokenContract.target}. Cannot issue points.`);
  }

  // Convert amount to the correct BigInt format for the contract
  const decimals = await loyaltyTokenContract.decimals();
  const amountWei = ethers.parseUnits(amount.toString(), decimals);

  console.log(`Issuing ${amount} points to ${customerAddress} for business ${businessId}...`);
  console.log(`Contract Address: ${loyaltyTokenContract.target}`);
  console.log(`Backend Wallet Address: ${backendWallet.address}`);
  console.log(`Contract Owner: ${contractOwner}`);
  console.log(`Amount (wei): ${amountWei.toString()}`);

  try {
    const tx = await loyaltyTokenContract.issuePoints(customerAddress, amountWei);
    console.log(`Transaction sent. Hash: ${tx.hash}`);
    const receipt = await tx.wait(); // Wait for the transaction to be mined
    console.log(`Points issued. Transaction hash: ${tx.hash}`);
    console.log("Transaction Receipt:", receipt); // Log the full receipt
    return tx;
  } catch (error) {
    console.error("Error during issuePoints transaction:");
    console.error("  Message:", error.message);
    if (error.reason) console.error("  Reason:", error.reason);
    if (error.code) console.error("  Code:", error.code);
    if (error.data) console.error("  Data:", error.data);
    if (error.transaction) console.error("  Transaction details:", error.transaction);
    throw error; // Re-throw to be handled by the controller
  }
};

// Function to redeem points
const redeemPoints = async (businessId, customerAddress, amount, privateKey) => {
  const loyaltyTokenContract = await getLoyaltyTokenContract(businessId);

  // In a real application, the customer would sign this transaction on the frontend.
  // For this example, we're using a privateKey passed from the frontend for simplicity.
  // This is INSECURE for production.
  if (!privateKey) {
    throw new Error("Private key is required for redemption in this simplified example.");
  }

  const customerWallet = new ethers.Wallet(privateKey, provider);
  const loyaltyTokenContractWithSigner = loyaltyTokenContract.connect(customerWallet);

  // Check if the customerWallet address matches the customerAddress provided
  if (customerWallet.address.toLowerCase() !== customerAddress.toLowerCase()) {
    throw new Error("Provided private key does not match the customer address.");
  }

  // Convert amount to the correct BigInt format for the contract
  const decimals = await loyaltyTokenContract.decimals();
  const amountWei = ethers.parseUnits(amount.toString(), decimals);

  console.log(`Redeeming ${amount} points from ${customerAddress} for business ${businessId}...`);
  try {
    const tx = await loyaltyTokenContractWithSigner.redeemPoints(customerAddress, amountWei);
    console.log(`Redemption transaction sent. Hash: ${tx.hash}`);
    const receipt = await tx.wait(); // Wait for the transaction to be mined
    console.log(`Points redeemed. Transaction hash: ${tx.hash}`);
    console.log("Transaction Receipt:", receipt); // Log the full receipt
    return tx;
  } catch (error) {
    console.error("Error during redeemPoints transaction:");
    console.error("  Message:", error.message);
    if (error.reason) console.error("  Reason:", error.reason);
    if (error.code) console.error("  Code:", error.code);
    if (error.data) console.error("  Data:", error.data);
    if (error.transaction) console.error("  Transaction details:", error.transaction);
    throw error; // Re-throw to be handled by the controller
  }
};

// Function to get balance
const getBalance = async (businessId, customerAddress) => {
  const businessContractInfo = businessService.getBusinessContract(businessId);
  if (!businessContractInfo || !businessContractInfo.address) {
    // If the business contract info is not found locally, try fetching from factory
    // This handles cases where business is registered but API restarted and data not loaded
    try {
      // Assuming businessId is the contract address here if fetching directly
      // This part might need refinement if businessId is NOT the contract address.
      // For now, we assume getLoyaltyProgramDetailsFromFactory can work with businessId
      // if it internally maps it to a contract address, or if businessId IS the address.
      // Given the current setup, businessId is not the contract address, so this might fail.
      // The primary source of truth for business contract info should be businessService.
      // Let's ensure businessService.getBusinessContract is reliable.
      const details = await getLoyaltyProgramDetailsFromFactory(businessContractInfo.address); // Use the address from local info
      businessContractInfo = details; // Update businessContractInfo if found
    } catch (e) {
      console.warn(`Could not find local contract info or fetch from factory for business ID: ${businessId}`, e);
      throw new Error(`Loyalty contract address not found for business ID: ${businessId}`);
    }
  }
  const loyaltyTokenContract = new ethers.Contract(businessContractInfo.address, loyaltyTokenAbi, provider);
  const balanceWei = await loyaltyTokenContract.balanceOf(customerAddress);
  const decimals = await loyaltyTokenContract.decimals();
  return ethers.formatUnits(balanceWei, decimals);
};

// Function to deploy a new loyalty token contract via the factory
const deployLoyaltyTokenViaFactory = async (tokenName, tokenSymbol, tokenDecimals, initialOwnerAddress) => {
  console.log("Attempting to deploy new loyalty token via factory...");
  console.log(
    `  Token Name: ${tokenName}, Symbol: ${tokenSymbol}, Decimals: ${tokenDecimals}, Original Owner: ${initialOwnerAddress}`
  );
  console.log(`  Factory Address: ${loyaltyTokenFactory.target}`);
  console.log(`  Backend Wallet (Factory Caller & NEW Token Owner): ${backendWallet.address}`); // Clarified role

  try {
    // Check backend wallet balance
    const balance = await provider.getBalance(backendWallet.address);
    console.log(`  Backend Wallet Balance: ${ethers.formatEther(balance)} ETH`);
    if (balance === 0n) {
      // Use 0n for BigInt comparison
      throw new Error(`Backend wallet ${backendWallet.address} has 0 ETH. Cannot deploy contract.`);
    }

    // Estimate gas for the transaction
    const estimatedGas = await loyaltyTokenFactory.createLoyaltyToken.estimateGas(
      tokenName,
      tokenSymbol,
      tokenDecimals,
      backendWallet.address // MODIFIED: Set backendWallet.address as the initialOwner
    );
    console.log(`  Estimated Gas for deployment: ${estimatedGas.toString()}`);

    const tx = await loyaltyTokenFactory.createLoyaltyToken(
      tokenName,
      tokenSymbol,
      tokenDecimals,
      backendWallet.address // MODIFIED: Set backendWallet.address as the initialOwner
    );
    console.log(`  Deployment transaction sent. Hash: ${tx.hash}`);

    let receipt;
    try {
      receipt = await tx.wait(); // Wait for the transaction to be mined
      console.log(`  Deployment transaction mined. Block: ${receipt.blockNumber}`);
      console.log("  Full Deployment Transaction Receipt:", receipt); // Log the full receipt
    } catch (waitError) {
      console.error("Error waiting for deployment transaction to be mined:");
      console.error("  Message:", waitError.message);
      if (waitError.reason) console.error("  Reason:", waitError.reason);
      if (waitError.code) console.error("  Code:", waitError.code);
      if (waitError.data) console.error("  Data:", waitError.data);
      if (waitError.transaction) console.error("  Transaction details:", waitError.transaction);
      if (waitError.receipt && waitError.receipt.status === 0) {
        console.error("  Transaction reverted on-chain. Check contract logic or gas limits.");
      }
      throw waitError;
    }

    // Find the event to get the new contract address
    const event = receipt.logs.find(
      (log) => loyaltyTokenFactory.interface.parseLog(log)?.name === "LoyaltyTokenCreated"
    );
    if (!event) {
      console.error("LoyaltyTokenCreated event not found in transaction receipt.");
      console.error("This might indicate the contract creation failed or the event was not emitted.");
      throw new Error("LoyaltyTokenCreated event not found. Contract deployment likely failed or event not emitted.");
    }
    const newContractAddress = loyaltyTokenFactory.interface.parseLog(event).args.tokenAddress;

    console.log(`New LoyaltyToken deployed at address: ${newContractAddress}`);
    return newContractAddress;
  } catch (error) {
    console.error("Critical Error during deployLoyaltyTokenViaFactory function execution:");
    console.error("  Message:", error.message);
    if (error.reason) console.error("  Reason:", error.reason);
    if (error.code) console.error("  Code:", error.code);
    if (error.data) console.error("  Data:", error.data);
    if (error.transaction) console.error("  Transaction details:", error.transaction);
    if (error.code === "CALL_EXCEPTION" && error.reason === null && error.data) {
      console.error("  Possible contract revert data (raw):", error.data);
    } else if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
      console.error("  Gas limit could not be estimated. This often means the transaction will revert.");
    } else if (error.code === "INSUFFICIENT_FUNDS") {
      console.error("  Insufficient funds in backend wallet to pay for gas.");
    }
    throw error;
  }
};

// Function to get loyalty program details from the factory (e.g., for a specific token address)
const getLoyaltyProgramDetailsFromFactory = async (tokenAddress) => {
  const loyaltyTokenContract = new ethers.Contract(tokenAddress, loyaltyTokenAbi, provider);
  const name = await loyaltyTokenContract.name();
  const symbol = await loyaltyTokenContract.symbol();
  const decimals = await loyaltyTokenContract.decimals();
  const owner = await loyaltyTokenContract.owner();
  return { name, symbol, decimals: Number(decimals), owner, address: tokenAddress };
};

// Function to get all deployed business IDs from the factory
const getAllDeployedBusinessIdsFromFactory = async () => {
  const businesses = businessService.getAllBusinesses();
  return Object.keys(businesses);
};

module.exports = {
  issuePoints,
  redeemPoints,
  getBalance,
  deployLoyaltyTokenViaFactory,
  getLoyaltyProgramDetailsFromFactory,
  getAllDeployedBusinessIdsFromFactory,
};
