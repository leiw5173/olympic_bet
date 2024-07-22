const { ethers, upgrades } = require("hardhat");

async function main() {
  const OlympicBet = await ethers.getContractFactory("OlympicBet");
  const proxy = await upgrades.deployProxy(OlympicBet, []);
  await proxy.waitForDeployment();
  console.log("OlympicBet deployed to:", await proxy.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
