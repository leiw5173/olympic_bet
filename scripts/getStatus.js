const { ethers } = require("hardhat");
require("dotenv").config();

const PROXY_ADDR = process.env.PROXY_ADDR;
const LOCAL_PROXY_ADDR = process.env.LOCAL_PROXY_ADDR;

async function main() {
  const [deployer, alice, bob] = await ethers.getSigners();
  const olympicBet = await ethers.getContractAt("OlympicBetV2", PROXY_ADDR);
  let status1 = 0;

  const eventCount = await olympicBet.getEventCount();
  console.log("Event Count: ", eventCount);

  for (let i = 0; i < eventCount; i++) {
    const [, , , , , , , status] = await olympicBet.getE(i);
    if (status == 1) status1++;
  }

  console.log("Status 1: ", status1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
