// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./LoyaltyToken.sol"; // Import the LoyaltyToken contract

contract LoyaltyTokenFactory is Ownable {
    // Event emitted when a new LoyaltyToken is created
    event LoyaltyTokenCreated(
        address indexed owner,
        address indexed tokenAddress,
        string name,
        string symbol
    );

    constructor() Ownable(msg.sender) {} // Deployer of the factory is its owner

    /**
     * @dev Creates and deploys a new LoyaltyToken contract.
     * @param _tokenName The name of the loyalty token.
     * @param _tokenSymbol The symbol of the loyalty token.
     * @param _tokenDecimals The number of decimals for the loyalty token.
     * @param _initialOwner The address that will own the newly created LoyaltyToken contract.
     * This should typically be the business's designated wallet or the backend wallet.
     */
    function createLoyaltyToken(
        string memory _tokenName,
        string memory _tokenSymbol,
        uint8 _tokenDecimals,
        address _initialOwner
    ) public onlyOwner returns (address) {
        // Only the factory owner can create new tokens
        LoyaltyToken newToken = new LoyaltyToken(
            _tokenName,
            _tokenSymbol,
            _tokenDecimals,
            _initialOwner
        );

        emit LoyaltyTokenCreated(
            _initialOwner,
            address(newToken),
            _tokenName,
            _tokenSymbol
        );

        return address(newToken);
    }
}
