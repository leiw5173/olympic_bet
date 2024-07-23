const { ethers } = require("hardhat");
require("dotenv").config();

const PROXY_ADDR = process.env.PROXY_ADDR;
const LOCAL_PROXY_ADDR = process.env.LOCAL_PROXY_ADDR;

async function main() {
  const [deployer, alice, bob] = await ethers.getSigners();

  const olympicBet = await ethers.getContractAt("OlympicBet", LOCAL_PROXY_ADDR);

  const tx = await olympicBet
    .connect(bob)
    .payEntryFee({ value: ethers.parseEther("10") });
  await tx.wait();

  const aliceBalance = await olympicBet.getBalance(alice.address);
  console.log("Alice balance: ", ethers.formatEther(aliceBalance));

  const bobBalance = await olympicBet.getBalance(bob.address);
  console.log("Bob balance: ", ethers.formatEther(bobBalance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
