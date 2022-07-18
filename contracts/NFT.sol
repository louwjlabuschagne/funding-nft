// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract NFT is ERC721, AccessControl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    bytes32 internal constant MINTER_ROLE = keccak256("MINTER_ROLE");
    mapping(uint256 => uint256) erc20Balances; //tokenId to erc20 balance

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

    function pushFunds(uint256 tokenId, uint256 amount) public {
        // Checks
        require(ownerOf(tokenId) != address(0), "ERC721: invalid token ID");

        // Effects
        erc20Balances[tokenId] += amount;

        // Integrations
    }

    function pullFunds(uint256 tokenId, uint256 amount) public {
        // Checks
        address owner = ownerOf(tokenId);
        require(owner != address(0), "ERC721: invalid token ID");

        // Effects
        erc20Balances[tokenId] -= amount;

        // Integrations
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
