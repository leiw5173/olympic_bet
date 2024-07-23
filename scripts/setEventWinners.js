const { ethers } = require("hardhat");
require("dotenv").config();

const PROXY_ADDR = process.env.PROXY_ADDR;
const LOCAL_PROXY_ADDR = process.env.LOCAL_PROXY_ADDR;

async function main() {
  const [deployer, alice, bob] = await ethers.getSigners();

  const olympicBet = await ethers.getContractAt("OlympicBet", LOCAL_PROXY_ADDR);

  const newTimestamp = 1723402001;
  await ethers.provider.send("evm_setNextBlockTimestamp", [newTimestamp]);
  await ethers.provider.send("evm_mine");

  const tx = await olympicBet.connect(deployer).setEventWinners(1, "France");
  await tx.wait();

  console.log("Event winners set successfully!");

  const [
    eventId,
    prize,
    question,
    countriesSet,
    deadline,
    participants,
    winners,
    status,
  ] = await olympicBet.getE(1);
  console.log("Event ID: ", eventId);
  console.log("Prize: ", ethers.formatEther(prize));
  console.log("Question: ", question);
  console.log("Countries: ", countriesSet);
  console.log("Deadline: ", deadline);
  console.log("Participants: ", participants);
  console.log("Winners: ", winners);
  console.log("Status: ", status);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
