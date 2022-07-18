const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  constants, // Common constants, like the zero address and largest integers
} = require("@openzeppelin/test-helpers");

const DEFAULT_ADMIN_ROLE = ethers.utils.formatBytes32String(0);
const ERC20_MINTER_ROLE = ethers.utils.solidityKeccak256(
  ["string"],
  ["ERC20_MINTER_ROLE"]
);
const ERC721_MINTER_ROLE = ethers.utils.solidityKeccak256(
  ["string"],
  ["ERC721_MINTER_ROLE"]
);
const ERC721_CREATOR_ROLE = ethers.utils.solidityKeccak256(
  ["string"],
  ["ERC721_CREATOR_ROLE"]
);
const MINTER_ROLE = ethers.utils.solidityKeccak256(["string"], ["MINTER_ROLE"]);

console.log(`AdminRole:          ${DEFAULT_ADMIN_ROLE}`);
console.log(`MinterRole:         ${MINTER_ROLE}`);
console.log(`ERC20MinterRole:    ${ERC20_MINTER_ROLE}`);
console.log(`ERC721MinterRole:   ${ERC721_MINTER_ROLE}`);
console.log(`ERC721CreatorRole:  ${ERC721_CREATOR_ROLE}`);

describe("Manager", async () => {
  let owner;
  let notOwner;

  beforeEach(async () => {
    [owner, notOwner] = await ethers.getSigners();
  });

  it("Can deploy manager", async () => {
    console.log(`Owner:    ${owner.address}`);
    console.log(`NotOwner: ${notOwner.address}`);
    const Manager = await ethers.getContractFactory("Manager");
    manager = await Manager.deploy();
    await manager.deployed();
  });

  it("Can mint erc20 token", async () => {
    const Manager = await ethers.getContractFactory("Manager");
    manager = await Manager.deploy();
    await manager.deployed();
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    await token.deployed();

    await manager.initialise(token.address);

    // grant manager MINTER_ROLE on token
    await token.grantRole(MINTER_ROLE, manager.address);

    let amount = ethers.utils.parseEther("1");
    await manager.mintERC20(notOwner.address, amount);

    let balance = await token.balanceOf(notOwner.address);
    expect(balance).to.equal(amount, "Balance should be 1");
  });
});

describe("ERC721 interaction", async () => {
  let owner;
  let notOwner;
  let token;
  let manager;

  beforeEach(async () => {
    [owner, notOwner] = await ethers.getSigners();
    const Manager = await ethers.getContractFactory("Manager");
    manager = await Manager.deploy();
    await manager.deployed();
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    await token.deployed();

    await manager.initialise(token.address);
  });

  it("Can create new 721 through manager as owner", async () => {
    let name = "Test Token";
    let symbol = "TTT";
    let nft = await manager.createNFT(name, symbol);

    expect(nft).to.not.equal(constants.ZERO_ADDRESS);
  });

  it("Can mint 721 through manager as owner", async () => {
    let name = "Test Token";
    let symbol = "TTT";
    let tx = await manager.createNFT(name, symbol);

    // This is a bit of a weird way to get the response from the createNFT method using ethers
    // I can only assume that because there are 2 transaction happening with the createNFT method, i.e.
    // 1. createNFT
    // 2. new NFT
    let reciept = await tx.wait();
    let nftAddress = reciept.logs[0].address;

    // we can assert that the nftAddress we got back through the logs is correct using the following
    let erc721 = await manager.erc721s(0);
    expect(erc721).to.equal(nftAddress, "NFT address should be correct");

    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.attach(nftAddress);

    await manager.mintERC721(nft.address, notOwner.address);

    let ownerOfToken = await nft.ownerOf(0);
    expect(ownerOfToken).to.equal(notOwner.address, "Owner should be notOwner");
  });

  it("Can grant arbitrary address MINTER_ROLE on NFT through .forward", async () => {
    let name = "Test Token";
    let symbol = "TTT";
    let tx1 = await manager.createNFT(name, symbol);
    let reciept = await tx1.wait();
    let nftAddress = reciept.logs[0].address;
    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.attach(nftAddress);

    let ABI = ["function grantRole(bytes32 role, address account)"];
    let iface = new ethers.utils.Interface(ABI);

    let toAddr = nftAddress;
    let data = iface.encodeFunctionData("grantRole", [
      MINTER_ROLE,
      notOwner.address,
    ]);

    await expect(
      manager.connect(notOwner).forward(toAddr, data)
    ).to.be.revertedWith(
      `AccessControl: account ${notOwner.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
    );

    let hasRole = await nft.hasRole(MINTER_ROLE, notOwner.address);
    expect(hasRole).to.equal(false, "Shouldn't have MINTER_ROLE yet");

    await manager.forward(toAddr, data);

    hasRole = await nft.hasRole(MINTER_ROLE, notOwner.address);
    expect(hasRole).to.equal(true, "Should have MINTER_ROLE");
  });
});

describe("ERC20 interaction", async () => {
  let owner;
  let notOwner;
  let nftOwner;
  let erc20Owner;
  let token;
  let manager;
  let nft;

  beforeEach(async () => {
    [owner, notOwner, nftOwner, erc20Owner] = await ethers.getSigners();
    const Manager = await ethers.getContractFactory("Manager");
    manager = await Manager.deploy();
    await manager.deployed();
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    await token.deployed();

    await manager.initialise(token.address);

    let name = "Test Token";
    let symbol = "TTT";
    let tx = await manager.createNFT(name, symbol);
    let reciept = await tx.wait();
    let nftAddress = reciept.logs[0].address;
    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.attach(nftAddress);

    await manager.mintERC721(nft.address, nftOwner.address);
  });

  it("Can push and pull erc20 through token", async () => {
    let tokenId = 0;
    let ownerOf = await nft.ownerOf(tokenId);
    expect(ownerOf).to.equal(nftOwner.address, "Owner should be nftOwner");

    let nftOwnerErc20Balance = await token.balanceOf(nftOwner.address);
    expect(nftOwnerErc20Balance).to.equal(0, "NFT owner should have 0 balance");

    // Fund erc20Owner with 1 Ethers worth of tokens
    let amount = ethers.utils.parseEther("1");
    await token.mint(erc20Owner.address, amount);
    let erc20OwnerErc20Balance = await token.balanceOf(erc20Owner.address);
    expect(erc20OwnerErc20Balance).to.equal(
      ethers.utils.parseEther("1"),
      "ERC20 owner should have 1 balance"
    );

    // push 1 ethers erc20 token into nft token 0

    let balanceInNFT = await nft.erc20Balances(tokenId);
    expect(balanceInNFT).to.equal(0, "Balance should be 0");

    await token.connect(erc20Owner).approve(nft.address, amount);
    await nft.connect(erc20Owner).pushFunds(tokenId, amount, token.address);
    balanceInNFT = await nft.erc20Balances(tokenId);
    expect(balanceInNFT).to.equal(amount, "Balance should be 1");

    // anyone call pull the pull the funds for a token
    await nft.connect(notOwner).pullFunds(tokenId, amount, token.address);

    // but only the owner will receive it
    nftOwnerErc20Balance = await token.balanceOf(nftOwner.address);
    expect(nftOwnerErc20Balance).to.equal(
      amount,
      "NFT owner should have 1 balance"
    );
  });
});
