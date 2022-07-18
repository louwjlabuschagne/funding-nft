// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract NFT is ERC721, AccessControl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    bytes32 internal constant MINTER_ROLE = keccak256("MINTER_ROLE");
    mapping(uint256 => uint256) public erc20Balances; //tokenId to erc20 balance

    constructor(string memory name_, string memory symbol_)
        ERC721(name_, symbol_)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to) public onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 newItemId = _tokenIds.current();
        _tokenIds.increment();
        _mint(to, newItemId);
        return newItemId;
    }

    function pushFunds(
        uint256 tokenId,
        uint256 amount,
        address erc20
    ) public {
        // Checks
        require(ownerOf(tokenId) != address(0), "ERC721: invalid token ID");

        uint256 balance = IERC20(erc20).balanceOf(msg.sender);
        require(balance >= amount, "Insufficient funds");

        require(
            //  allowance(address owner, address spender)
            IERC20(erc20).allowance(msg.sender, address(this)) >= amount,
            "Not approved for enough ERC20"
        );

        // Effects
        erc20Balances[tokenId] += amount;

        // Integrations
        require(
            IERC20(erc20).transferFrom(msg.sender, address(this), amount),
            "ERC20 transfer failed"
        );
    }

    function pullFunds(
        uint256 tokenId,
        uint256 amount,
        address erc20
    ) public {
        // Checks

        require(erc20Balances[tokenId] >= amount, "Insufficient funds");

        address owner = ownerOf(tokenId);
        require(owner != address(0), "ERC721: invalid token ID");

        // Effects
        erc20Balances[tokenId] -= amount;

        // Integrations
        require(IERC20(erc20).transfer(owner, amount), "ERC20 transfer failed");
    }

    // Just here for override purposes, don't copy-paste and use
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
