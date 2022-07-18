const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Manager", async () => {
  let owner;
  let notOwner;

  beforeEach(async () => {
    [owner, notOwner] = await ethers.getSigners();
  });

  it("Can deploy manager", async () => {
    const Manager = await ethers.getContractFactory("Manager");
    manager = await Manager.deploy();
    await manager.deployed();
  });
});
