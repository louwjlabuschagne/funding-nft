# Funding NFT

## Introduction

A repo showing how to use a Manager contract to

- manage minting of ERC20 tokens
- deploying NFTs (just ERC721 for now)
- allocating ERC20 tokens to tokens in the NFT

The main purpose of this repo is to show how a manager contract can create an NFT and get the MINTER_ROLE at creation time within that NFT, but additional minters can be added later using the `.forward` method in the manager contract.

We also show how to add ERC20 tokens to a spesific token within an NFT contract and how to withdraw ERC20 tokens from a spesific token within an NFT contract.

## Hardhat

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
GAS_REPORT=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```
