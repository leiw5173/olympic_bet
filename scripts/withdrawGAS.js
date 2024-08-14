const { ethers } = require("hardhat");
require("dotenv").config();

const PROXY_ADDR = process.env.PROXY_ADDR;
const LOCAL_PROXY_ADDR = process.env.LOCAL_PROXY_ADDR;

async function main() {
  const [deployer, alice, bob] = await ethers.getSigners();
  const provider = ethers.provider;
  const olympicBet = await ethers.getContractAt("OlympicBetV2", PROXY_ADDR);

  console.log(
    "Balance before",
    ethers.formatEther(await provider.getBalance(deployer.getAddress()))
  );

  const tx = await olympicBet
    .connect(deployer)
    .withdrawGAS(ethers.parseEther("35"));
  await tx.wait();

  console.log("GAS withdraw successfully!");

  console.log(
    "Balance After: ",
    ethers.formatEther(await provider.getBalance(deployer.getAddress()))
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
