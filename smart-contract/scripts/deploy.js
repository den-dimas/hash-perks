const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the deployer account (Hardhat's default signer)
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy LoyaltyTokenFactory
  const LoyaltyTokenFactory = await ethers.getContractFactory("LoyaltyTokenFactory");
  const loyaltyTokenFactory = await LoyaltyTokenFactory.deploy();
  await loyaltyTokenFactory.waitForDeployment(); // Use waitForDeployment() for ethers v6+

  const factoryAddress = loyaltyTokenFactory.target; // Use .target for ethers v6+
  console.log("LoyaltyTokenFactory deployed to:", factoryAddress);

  // Save contract addresses and ABIs to a JSON file
  const contractsDir = path.join(__dirname, "../../api/contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // FIX: Get ABI directly from interface.fragments and stringify it
  const factoryAbi = JSON.stringify(loyaltyTokenFactory.interface.fragments, null, 2);
  const loyaltyTokenAbi = JSON.stringify(
    (await ethers.getContractFactory("LoyaltyToken")).interface.fragments,
    null,
    2
  );

  const contractAddressesPath = path.join(contractsDir, "contract-addresses.json");
  const factoryAbiPath = path.join(contractsDir, "LoyaltyTokenFactory_ABI.json");
  const loyaltyTokenAbiPath = path.join(contractsDir, "LoyaltyToken_ABI.json");

  fs.writeFileSync(contractAddressesPath, JSON.stringify({ LoyaltyTokenFactory: factoryAddress }, null, 2));
  fs.writeFileSync(factoryAbiPath, factoryAbi);
  fs.writeFileSync(loyaltyTokenAbiPath, loyaltyTokenAbi);

  console.log("Contract addresses saved to:", contractAddressesPath);
  console.log("LoyaltyTokenFactory ABI saved to:", factoryAbiPath);
  console.log("LoyaltyToken ABI saved to:", loyaltyTokenAbiPath);

  // Also copy LoyaltyToken_ABI.json to frontend/public
  const frontendAbiPath = path.join(__dirname, "../../frontend/public/LoyaltyToken_ABI.json");
  fs.copyFileSync(loyaltyTokenAbiPath, frontendAbiPath);
  console.log("LoyaltyToken ABI copied to frontend/public.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
