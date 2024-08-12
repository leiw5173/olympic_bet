const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
  const PROXY_ADDR = "0x843A9C9d1f3B148a1dBB3D62705aaD24f3658676";

  const OlympicBetV2 = await ethers.getContractFactory("OlympicBetV2");
  console.log("Upgrading OlympicBetV2...");
  const olympicBetV2 = await upgrades.upgradeProxy(PROXY_ADDR, OlympicBetV2);
  console.log("OlympicBetV2 upgraded to", olympicBetV2.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
