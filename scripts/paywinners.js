const { ethers } = require("hardhat");
require("dotenv").config();

const PROXY_ADDR = process.env.PROXY_ADDR;
const LOCAL_PROXY_ADDR = process.env.LOCAL_PROXY_ADDR;

async function main() {
  const [deployer, alice, bob] = await ethers.getSigners();

  console.log(
    "Alice balance before:",
    ethers.formatEther(await ethers.provider.getBalance(alice.address))
  );
  console.log(
    "Bob balance before:",
    ethers.formatEther(await ethers.provider.getBalance(bob.address))
  );

  const olympicBet = await ethers.getContractAt("OlympicBet", LOCAL_PROXY_ADDR);

  const tx = await olympicBet.connect(deployer).payWinners(1);
  await tx.wait();

  console.log("Winners paid successfully!");
  console.log(
    "Alice balance after:",
    ethers.formatEther(await ethers.provider.getBalance(alice.address))
  );
  console.log(
    "Bob balance after:",
    ethers.formatEther(await ethers.provider.getBalance(bob.address))
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
