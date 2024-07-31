const { parseEther } = require("ethers");
const { ethers } = require("hardhat");
require("dotenv").config();

const PROXY_ADDR = process.env.PROXY_ADDR;
const LOCAL_PROXY_ADDR = process.env.LOCAL_PROXY_ADDR;

async function main() {
  const [deployer, alice, bob] = await ethers.getSigners();

  const olympicBet = await ethers.getContractAt("OlympicBet", PROXY_ADDR);
  const countries = ["Spain", "France", "Germany", "Italy", "China"];

  const tx = await olympicBet
    .connect(deployer)
    .createEvent(
      ethers.parseEther("1"),
      "Who is the winner of test game?",
      countries,
      1721959200,
      { value: ethers.parseEther("1") }
    );
  await tx.wait();

  const [
    eventId,
    prize,
    question,
    countriesSet,
    deadline,
    participants,
    winners,
    status,
  ] = await olympicBet.getE(5);
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
