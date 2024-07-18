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
        it("Should create a right event", async () => {
          const prize = ethers.parseEther("10");
          const question = "Which country will win the most gold medals?";
          const countries = [
            "France",
            "Germany",
            "Italy",
            "Spain",
            "United Kingdom",
          ];
          const deadline = 1723302000;
          await olympicBet
            .connect(deployer)
            .createEvent(prize, question, countries, deadline, {
              value: prize,
            });
          const [
            eventId,
            setPrize,
            setQuestion,
            setCountries,
            setDeadline,
            ,
            ,
            status,
          ] = await olympicBet.getE(1);

          const eventCount = await olympicBet.getEventCount();

          assert.equal(eventId, 1);
          assert.equal(setPrize, prize);
          assert.equal(setQuestion, question);
          assert.equal(setCountries[0], countries[0]);
          assert.equal(setCountries[1], countries[1]);
          assert.equal(setCountries[2], countries[2]);
          assert.equal(setCountries[3], countries[3]);
          assert.equal(setCountries[4], countries[4]);
          assert.equal(setDeadline, deadline);
          assert.equal(status, 0);
          assert.equal(eventCount, 2);
        });
        it("Should emit EventCreated event", async () => {
          const prize = ethers.parseEther("10");
          const question = "Which country will win the most gold medals?";
          const countries = [
            "France",
            "Germany",
            "Italy",
            "Spain",
            "United Kingdom",
          ];
          const deadline = 1723302000;
          await expect(
            olympicBet
              .connect(deployer)
              .createEvent(prize, question, countries, deadline, {
                value: prize,
              })
          )
            .to.emit(olympicBet, "EventCreated")
            .withArgs(1, prize, question, countries, deadline, 0);
        });
        it("Should revert if not deployer call the function", async () => {
          const prize = ethers.parseEther("10");
          const question = "Which country will win the most gold medals?";
          const countries = [
            "France",
            "Germany",
            "Italy",
            "Spain",
            "United Kingdom",
          ];
          const deadline = 1723302000;
          await expect(
            olympicBet
              .connect(a)
              .createEvent(prize, question, countries, deadline, {
                value: prize,
              })
          ).to.be.revertedWith("Not authorized");
        });
        it("Should revert if deadline is less than current time", async () => {
          const prize = ethers.parseEther("10");
          const question = "Which country will win the most gold medals?";
          const countries = [
            "France",
            "Germany",
            "Italy",
            "Spain",
            "United Kingdom",
          ];
          const deadline = 1623302000;
          await expect(
            olympicBet
              .connect(deployer)
              .createEvent(prize, question, countries, deadline, {
                value: prize,
              })
          ).to.be.revertedWith("Deadline must be in the future");
        });
        it("Should revert if not enough GAS", async () => {
          const prize = ethers.parseEther("10");
          const question = "Which country will win the most gold medals?";
          const countries = [
            "France",
            "Germany",
            "Italy",
            "Spain",
            "United Kingdom",
          ];
          const deadline = 1723302000;
          await expect(
            olympicBet
              .connect(deployer)
              .createEvent(prize, question, countries, deadline, {
                value: ethers.parseEther("9"),
              })
          ).to.be.revertedWith("Please send enough GAS to contract");
        });
      });
    });
