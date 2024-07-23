const { ethers } = require("hardhat");
require("dotenv").config();

const PROXY_ADDR = process.env.PROXY_ADDR;
const LOCAL_PROXY_ADDR = process.env.LOCAL_PROXY_ADDR;

async function main() {
  const [deployer, alice, bob] = await ethers.getSigners();

  const olympicBet = await ethers.getContractAt("OlympicBet", LOCAL_PROXY_ADDR);

  const tx1 = await olympicBet.connect(alice).placeBet(1, "France");
  await tx1.wait();

  const tx = await olympicBet.connect(bob).placeBet(1, "France");
  await tx.wait();

  console.log("Bet placed successfully!");
  const aliceBet = await olympicBet.getBet(alice.address, 1);
  console.log("Alice's bet:", aliceBet);
  const botBet = await olympicBet.getBet(bob.address, 1);
  console.log("Bob's bet:", botBet);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
