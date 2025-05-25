// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./LoyaltyToken.sol"; // Import your LoyaltyToken contract

/**
 * @title LoyaltyProgramFactory
 * @dev A factory contract to deploy and manage LoyaltyToken instances for businesses.
 * Only the owner of this factory can deploy new loyalty programs.
 */
contract LoyaltyProgramFactory is Ownable {
    // Struct to store basic details of each deployed loyalty program
    struct LoyaltyProgram {
        address tokenAddress;
        string name;
        string symbol;
        address ownerAddress; // The business owner's address (owner of the LoyaltyToken contract)
        bool exists; // To check if the program exists
    }

    // Mapping from a unique business ID (e.g., string) to LoyaltyProgram details
    // For simplicity, we'll use a string businessId. In a real app, this might be a hash or a more complex ID.
    mapping(string => LoyaltyProgram) public deployedPrograms;
    string[] public businessIds; // To keep track of all registered business IDs

    // Event emitted when a new loyalty program is deployed
    event LoyaltyProgramDeployed(
        string indexed businessId,
        address indexed tokenAddress,
        string name,
        string symbol,
        address indexed ownerAddress
    );

    constructor(address initialOwner) Ownable(initialOwner) {
        // The initialOwner of the factory contract (e.g., HashPerks platform owner)
    }

    /**
     * @dev Deploys a new LoyaltyToken contract for a business.
     * Only callable by the owner of this factory contract.
     * @param _businessId A unique identifier for the business.
     * @param _tokenName The name of the loyalty token (e.g., "Starbucks Stars").
     * @param _tokenSymbol The symbol of the loyalty token (e.g., "SBUX").
     * @param _tokenDecimals The number of decimals for the token (typically 0 for loyalty points).
     * @param _businessOwner The address of the actual business owner who will own the new LoyaltyToken contract.
     */
    function deployLoyaltyProgram(
        string memory _businessId,
        string memory _tokenName,
        string memory _tokenSymbol,
        uint8 _tokenDecimals,
        address _businessOwner
    ) public onlyOwner returns (address) {
        // Ensure the businessId is unique
        require(
            bytes(_businessId).length > 0,
            "Factory: Business ID cannot be empty"
        );
        require(
            !deployedPrograms[_businessId].exists,
            "Factory: Business ID already exists"
        );
        require(
            _businessOwner != address(0),
            "Factory: Business owner cannot be zero address"
        );

        // Deploy a new LoyaltyToken contract
        LoyaltyToken newToken = new LoyaltyToken(
            _tokenName,
            _tokenSymbol,
            _tokenDecimals,
            _businessOwner // The business owner will be the owner of this new token contract
        );

        // Store the details of the deployed program
        deployedPrograms[_businessId] = LoyaltyProgram({
            tokenAddress: address(newToken),
            name: _tokenName,
            symbol: _tokenSymbol,
            ownerAddress: _businessOwner,
            exists: true
        });
        businessIds.push(_businessId); // Add to the list of IDs

        emit LoyaltyProgramDeployed(
            _businessId,
            address(newToken),
            _tokenName,
            _tokenSymbol,
            _businessOwner
        );

        return address(newToken);
    }

    /**
     * @dev Returns the details of a deployed loyalty program.
     * @param _businessId The unique identifier of the business.
     */
    function getLoyaltyProgramDetails(
        string memory _businessId
    )
        public
        view
        returns (
            address tokenAddress,
            string memory name,
            string memory symbol,
            address ownerAddress
        )
    {
        require(
            deployedPrograms[_businessId].exists,
            "Factory: Program does not exist"
        );
        LoyaltyProgram storage program = deployedPrograms[_businessId];
        return (
            program.tokenAddress,
            program.name,
            program.symbol,
            program.ownerAddress
        );
    }

    /**
     * @dev Returns the list of all deployed business IDs.
     */
    function getAllBusinessIds() public view returns (string[] memory) {
        return businessIds;
    }
}
