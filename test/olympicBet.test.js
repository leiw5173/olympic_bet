const { assert, expect } = require("chai");
const { ethers, network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("OlympicBet", async () => {
      const MULTIPLIER = 10 ** 18;
      let deployer, a, b, c, d, e;
      let olympicBet;

      beforeEach(async () => {
        [deployer, a, b, c, d, e] = await ethers.getSigners();
        const OlympiBet = await ethers.getContractFactory("OlympicBet");
        olympicBet = await OlympiBet.deploy();
      });

      describe("Pay Entry Fee", function () {
        it("Should pay right amount", async () => {
          const amount = ethers.parseEther("10");
          await olympicBet.connect(a).payEntryFee({ value: amount });
          const balance = await olympicBet.getBalance(a.address);
          assert.equal(balance, amount);
        });
        it("Should emit EntryFeePaid event", async () => {
          const amount = ethers.parseEther("10");
          await expect(olympicBet.connect(a).payEntryFee({ value: amount }))
            .to.emit(olympicBet, "EntryFeePaid")
            .withArgs(a.address, amount);
        });
        it("Should revert if not enough ethers", async () => {
          const amount = ethers.parseEther("9");
          await expect(
            olympicBet.connect(a).payEntryFee({ value: amount })
          ).to.be.revertedWith("You need to deposite 10 GAS to participate!");
        });
      });

      describe("Create Event", function () {
        beforeEach(async () => {
          const amount = ethers.parseEther("10");
          await olympicBet.connect(a).payEntryFee({ value: amount });
        });
        it("should create a right event", async () => {
          const prize = ethers.parseEther("10");
          const question = "Which country will win the most gold medals?";
          const countries = [
            "France",
            "Germany",
            "Italy",
            "Spain",
            "United Kingdom",
          ];
          const deadline = "1723392000";
          await olympicBet
            .connect(deployer)
            .createEvent(prize, question, countries, deadline);
          const event = await olympicBet.getEvent(1);
          assert.equal(event.eventId, 1);
          assert.equal(event.prize, prize);
          assert.equal(event.question, question);
          assert.equal(event.countries.length, countries.length);
          assert.equal(event.deadline, deadline);
          assert.equal(event.status, 0);
        });
      });
    });
