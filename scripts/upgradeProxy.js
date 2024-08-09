const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
  const PROXY_ADDR = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const OlympicBetV2 = await ethers.getContractFactory("OlympicBetV2");
  console.log("Upgrading OlympicBetV2...");
  const olympicBetV2 = await upgrades.upgradeProxy(PROXY_ADDR, OlympicBetV2);
  console.log("OlympicBetV2 upgraded to", olympicBetV2);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
