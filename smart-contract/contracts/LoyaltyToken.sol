// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract LoyaltyToken is Context, Ownable {
    string public name;
    string public symbol;
    uint8 public decimals;

    mapping(address => uint256) private _balances;
    uint256 private _totalSupply;

    event PointsIssued(address indexed customer, uint256 amount);
    event PointsRedeemed(address indexed customer, uint256 amount);

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        address initialOwner
    ) Ownable(initialOwner) {
        name = tokenName;
        symbol = tokenSymbol;
        decimals = tokenDecimals;
    }

    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    function issuePoints(
        address customer,
        uint256 amount
    ) public virtual onlyOwner {
        // Ensure only the owner can issue points
        require(
            customer != address(0),
            "LoyaltyToken: issue to the zero address"
        );
        require(amount > 0, "LoyaltyToken: issue zero or negative amount");

        _totalSupply += amount;
        _balances[customer] += amount;

        emit PointsIssued(customer, amount);
    }

    function redeemPoints(address customer, uint256 amount) public virtual {
        // Anyone can redeem their own points
        require(
            customer != address(0),
            "LoyaltyToken: redeem from the zero address"
        );
        require(amount > 0, "LoyaltyToken: redeem zero or negative amount");
        require(
            _balances[customer] >= amount,
            "LoyaltyToken: insufficient balance"
        );

        _balances[customer] -= amount;
        _totalSupply -= amount; // Decrease total supply on redemption

        emit PointsRedeemed(customer, amount);
    }
}
