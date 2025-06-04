// File: ./api/services/loyaltyService.js
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const businessService = require("./businessService"); // To get business details
const transactionService = require("./transactionService");

// Load contract ABIs and addresses
const contractAddressesPath = path.join(__dirname, "../contracts/contract-addresses.json");
const factoryAbiPath = path.join(__dirname, "../contracts/LoyaltyTokenFactory_ABI.json");
const loyaltyTokenAbiPath = path.join(__dirname, "../contracts/LoyaltyToken_ABI.json");

// Ensure files exist before reading
if (!fs.existsSync(contractAddressesPath)) {
  console.error(`ERROR: contract-addresses.json not found at ${contractAddressesPath}. Please deploy contracts.`);
}
if (!fs.existsSync(factoryAbiPath)) {
  console.error(`ERROR: LoyaltyTokenFactory_ABI.json not found at ${factoryAbiPath}. Please deploy contracts.`);
}
if (!fs.existsSync(loyaltyTokenAbiPath)) {
  console.error(`ERROR: LoyaltyToken_ABI.json not found at ${loyaltyTokenAbiPath}. Please deploy contracts.`);
}

const contractAddresses = fs.existsSync(contractAddressesPath)
  ? JSON.parse(fs.readFileSync(contractAddressesPath, "utf8"))
  : {};
const factoryAbi = fs.existsSync(factoryAbiPath) ? JSON.parse(fs.readFileSync(factoryAbiPath, "utf8")) : [];
const loyaltyTokenAbi = fs.existsSync(loyaltyTokenAbiPath)
  ? JSON.parse(fs.readFileSync(loyaltyTokenAbiPath, "utf8"))
  : [];

const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

// The backend wallet that will sign transactions for issuing points (the "owner" of the factory)
const backendWallet = new ethers.Wallet(process.env.BACKEND_WALLET_PRIVATE_KEY, provider);

// LoyaltyTokenFactory contract instance
const loyaltyTokenFactory = contractAddresses.LoyaltyTokenFactory
  ? new ethers.Contract(contractAddresses.LoyaltyTokenFactory, factoryAbi, backendWallet)
  : null; // Set to null if factory address is not found

// Function to get a LoyaltyToken contract instance for a specific business
const getLoyaltyTokenContract = async (businessId, _provider = provider) => {
  // Added _provider parameter
  console.log(`LoyaltyService: getLoyaltyTokenContract called for business ID: ${businessId}`);
  const businessDetails = businessService.getBusinessDetails(businessId);

  if (!businessDetails) {
    console.error(`LoyaltyService: getLoyaltyTokenContract - Business details not found for ID: ${businessId}`);
    throw new Error(`Loyalty contract details not found for business ID: ${businessId}`);
  }
  if (!businessDetails.address || !ethers.isAddress(businessDetails.address)) {
    console.error(
      `LoyaltyService: getLoyaltyTokenContract - Invalid or missing contract address for business ID: ${businessId}. Address: ${businessDetails.address}`
    );
    throw new Error(`Loyalty contract address is invalid or missing for business ID: ${businessId}`);
  }

  console.log(
    `LoyaltyService: Creating contract instance for business ${businessId} at address: ${businessDetails.address}`
  );
  return new ethers.Contract(businessDetails.address, loyaltyTokenAbi, _provider); // Use the provided provider/signer
};

// Function to issue points (backend-initiated)
const issuePoints = async (businessId, customerAddress, amount) => {
  if (!loyaltyTokenFactory) {
    throw new Error("LoyaltyTokenFactory contract not initialized. Check deployment and environment variables.");
  }
  console.log(
    `LoyaltyService: issuePoints called for business ID: ${businessId}, customer: ${customerAddress}, amount: ${amount}`
  );

  // Get the contract instance connected to the backendWallet for signing
  const loyaltyTokenContractWithSigner = await getLoyaltyTokenContract(businessId, backendWallet);

  try {
    const contractOwner = await loyaltyTokenContractWithSigner.owner();
    console.log(`LoyaltyService: issuePoints - Contract owner for ${businessId}: ${contractOwner}`);

    if (contractOwner.toLowerCase() !== backendWallet.address.toLowerCase()) {
      console.error(
        `LoyaltyService: issuePoints - Backend wallet (${backendWallet.address}) is NOT the owner (${contractOwner}) of contract ${loyaltyTokenContractWithSigner.target}.`
      );
      throw new Error(
        `Backend wallet is not the owner of contract ${loyaltyTokenContractWithSigner.target}. Cannot issue points.`
      );
    }

    const decimals = await loyaltyTokenContractWithSigner.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);

    console.log(`LoyaltyService: Issuing ${amount} points to ${customerAddress} for business ${businessId}...`);
    const tx = await loyaltyTokenContractWithSigner.issuePoints(customerAddress, amountWei);
    const receipt = await tx.wait();
    console.log(`LoyaltyService: Points issued. Transaction hash: ${tx.hash}`);

    const businessDetails = businessService.getBusinessDetails(businessId);
    transactionService.addTransaction(
      "issue",
      businessId,
      customerAddress,
      customerAddress,
      amount,
      businessDetails.symbol
    );

    return tx;
  } catch (error) {
    console.error("LoyaltyService: Error during issuePoints transaction:", error);
    throw error;
  }
};

// MODIFIED: Function to record points redemption (frontend-initiated)
const recordRedemption = async (businessId, customerAddress, amount, loyaltyTokenSymbol) => {
  console.log(
    `LoyaltyService: recordRedemption called for business ID: ${businessId}, customer: ${customerAddress}, amount: ${amount}`
  );
  try {
    transactionService.addTransaction(
      "redeem",
      businessId,
      customerAddress, // userId is customerAddress in this context
      customerAddress,
      amount,
      loyaltyTokenSymbol
    );
    console.log(`LoyaltyService: Redemption recorded for ${customerAddress} at ${businessId}.`);
  } catch (error) {
    console.error("LoyaltyService: Error recording redemption:", error);
    throw error;
  }
};

// Function to get balance (can be called by frontend or backend)
const getBalance = async (businessId, customerAddress) => {
  if (!loyaltyTokenFactory) {
    throw new Error("LoyaltyTokenFactory contract not initialized. Check deployment and environment variables.");
  }
  console.log(`LoyaltyService: getBalance called for business ID: ${businessId}, customer: ${customerAddress}`);

  const businessDetails = businessService.getBusinessDetails(businessId);
  if (!businessDetails || !businessDetails.address || !ethers.isAddress(businessDetails.address)) {
    console.error(
      `LoyaltyService: getBalance - Invalid or missing contract address for business ID: ${businessId}. Address: ${businessDetails.address}`
    );
    throw new Error(`Loyalty contract address is invalid or missing for business ID: ${businessId}`);
  }
  console.log(
    `LoyaltyService: getBalance - Fetching balance for ${customerAddress} from contract ${businessDetails.address}`
  );

  const loyaltyTokenContract = new ethers.Contract(businessDetails.address, loyaltyTokenAbi, provider);
  try {
    const balanceWei = await loyaltyTokenContract.balanceOf(customerAddress);
    const decimals = await loyaltyTokenContract.decimals();
    console.log(`LoyaltyService: getBalance - Raw balanceWei: ${balanceWei.toString()}, Decimals: ${decimals}`);
    return ethers.formatUnits(balanceWei, decimals);
  } catch (error) {
    console.error(
      `LoyaltyService: getBalance - Error calling balanceOf for ${customerAddress} on ${businessDetails.address}:`,
      error
    );
    throw error;
  }
};

// Function to deploy a new loyalty token contract via the factory
const deployLoyaltyTokenViaFactory = async (tokenName, tokenSymbol, tokenDecimals, initialOwnerAddress) => {
  if (!loyaltyTokenFactory) {
    throw new Error("LoyaltyTokenFactory contract not initialized. Cannot deploy tokens.");
  }
  console.log("LoyaltyService: Attempting to deploy new loyalty token via factory...");
  console.log(
    `  Token Name: ${tokenName}, Symbol: ${tokenSymbol}, Decimals: ${tokenDecimals}, Original Owner: ${initialOwnerAddress}`
  );
  console.log(`  Factory Address: ${loyaltyTokenFactory.target}`);
  console.log(`  Backend Wallet (Factory Caller & NEW Token Owner): ${backendWallet.address}`);

  try {
    const balance = await provider.getBalance(backendWallet.address);
    console.log(`  Backend Wallet Balance: ${ethers.formatEther(balance)} ETH`);
    if (balance === 0n) {
      throw new Error(`Backend wallet ${backendWallet.address} has 0 ETH. Cannot deploy contract.`);
    }

    const estimatedGas = await loyaltyTokenFactory.createLoyaltyToken.estimateGas(
      tokenName,
      tokenSymbol,
      tokenDecimals,
      backendWallet.address
    );
    console.log(`  Estimated Gas for deployment: ${estimatedGas.toString()}`);

    const tx = await loyaltyTokenFactory.createLoyaltyToken(
      tokenName,
      tokenSymbol,
      tokenDecimals,
      backendWallet.address
    );
    console.log(`  Deployment transaction sent. Hash: ${tx.hash}`);

    let receipt;
    try {
      receipt = await tx.wait();
      console.log(`  Deployment transaction mined. Block: ${receipt.blockNumber}`);
      console.log("  Full Deployment Transaction Receipt:", receipt);
    } catch (waitError) {
      console.error("LoyaltyService: Error waiting for deployment transaction to be mined:");
      throw waitError;
    }

    const event = receipt.logs.find(
      (log) => loyaltyTokenFactory.interface.parseLog(log)?.name === "LoyaltyTokenCreated"
    );
    if (!event) {
      throw new Error("LoyaltyTokenCreated event not found. Contract deployment likely failed or event not emitted.");
    }
    const newContractAddress = loyaltyTokenFactory.interface.parseLog(event).args.tokenAddress;

    console.log(`LoyaltyService: New LoyaltyToken deployed at address: ${newContractAddress}`);
    return newContractAddress;
  } catch (error) {
    console.error("LoyaltyService: Critical Error during deployLoyaltyTokenViaFactory function execution:", error);
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
  recordRedemption, // Export the new function
  getBalance,
  deployLoyaltyTokenViaFactory,
  getLoyaltyProgramDetailsFromFactory,
  getAllDeployedBusinessIdsFromFactory,
  getLoyaltyTokenContract, // Export this for frontend to use ABI
};
