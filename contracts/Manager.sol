// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./NFT.sol";
import "./Token.sol";

contract Manager is AccessControl {
    bool public init;
    bytes32 internal constant ERC20_MINTER_ROLE =
        keccak256("ERC20_MINTER_ROLE");
    bytes32 internal constant ERC721_MINTER_ROLE =
        keccak256("ERC721_MINTER_ROLE");
    bytes32 internal constant ERC721_CREATOR_ROLE =
        keccak256("ERC721_CREATOR_ROLE");
    address public erc20 = address(0);
    address[] public erc721s;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ERC20_MINTER_ROLE, msg.sender);
        _grantRole(ERC721_MINTER_ROLE, msg.sender);
        _grantRole(ERC721_CREATOR_ROLE, msg.sender);
    }

    function initialise(address _erc20) public {
        require(!init, "Manager already initialised");
        init = true;
        erc20 = _erc20;
    }

    function createNFT(string memory name_, string memory symbol_)
        public
        onlyRole(ERC721_CREATOR_ROLE)
        returns (address)
    {
        NFT nft = new NFT(name_, symbol_);
        address nftAddress = address(nft);
        erc721s.push(nftAddress);
        return nftAddress;
    }

    function mintERC20(address to, uint256 amount)
        public
        onlyRole(ERC20_MINTER_ROLE)
    {
        Token(erc20).mint(to, amount);
    }

    function mintERC721(address erc721, address to)
        public
        onlyRole(ERC721_MINTER_ROLE)
    {
        NFT(erc721).mint(to);
    }

    function forward(address toAddr, bytes memory data)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (bytes memory)
    {
        (bool success, bytes memory returnData) = toAddr.call{value: 0}(data);
        require(success, "Failed to call contract");
        return returnData;
    }
}
