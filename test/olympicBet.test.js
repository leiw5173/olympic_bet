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
      describe("Place Bet", function () {
        beforeEach(async () => {
          const prize = ethers.parseEther("10");
          const question = "Which country will win the most gold medals?";
          const countries = [
            "France",
            "Germany",
            "Italy",
            "Spain",
            "United Kingdom",
          ];
          const deadline = 1723402000;
          await olympicBet
            .connect(deployer)
            .createEvent(prize, question, countries, deadline, {
              value: prize,
            });

          // 创建区块链状态快照
          snapshotId = await ethers.provider.send("evm_snapshot", []);
        });
        afterEach(async () => {
          // 恢复区块链状态
          await ethers.provider.send("evm_revert", [snapshotId]);
        });
        it("Should place bet successfully", async () => {
          const amount = ethers.parseEther("10");
          await olympicBet.connect(a).payEntryFee({ value: amount });
          const eventId = 1;
          const country = "France";
          await olympicBet.connect(a).placeBet(eventId, country);
          const bet = await olympicBet.getBet(a.address, eventId);
          const [, , , , , participants, ,] = await olympicBet.getE(eventId);
          assert.equal(bet.eventId, eventId);
          assert.equal(bet.prediction, country);
          assert.equal(bet.isPlaced, true);
          assert.equal(participants[0], a.address);
        });
        it("Should emit BetPlaced event", async () => {
          const amount = ethers.parseEther("10");
          await olympicBet.connect(a).payEntryFee({ value: amount });
          const eventId = 1;
          const country = "France";
          await expect(olympicBet.connect(a).placeBet(eventId, country))
            .to.emit(olympicBet, "BetPlaced")
            .withArgs(eventId, country, true, a.address);
        });
        it("Should revert if didn't pay entry fee", async () => {
          const eventId = 1;
          const country = "France";
          await expect(
            olympicBet.connect(b).placeBet(eventId, country)
          ).to.be.revertedWith("Entry Fee not paid");
        });
        it("Should revert if already placed bet", async () => {
          const amount = ethers.parseEther("10");
          await olympicBet.connect(a).payEntryFee({ value: amount });
          const eventId = 1;
          const country = "France";
          await olympicBet.connect(a).placeBet(eventId, country);
          await expect(
            olympicBet.connect(a).placeBet(eventId, country)
          ).to.be.revertedWith("Bet already placed");
        });
        it("Should revert if place bet after deadline", async () => {
          const amount = ethers.parseEther("10");
          await olympicBet.connect(a).payEntryFee({ value: amount });
          const eventId = 1;
          const country = "France";
          const newTimestamp = 1723402001;
          await ethers.provider.send("evm_setNextBlockTimestamp", [
            newTimestamp,
          ]);
          await ethers.provider.send("evm_mine"); // Mine a new block to ensure the timestamp is updated
          await expect(
            olympicBet.connect(a).placeBet(eventId, country)
          ).to.be.revertedWith("Event has ended");
        });
      });
      describe("Set Event Winners", function () {
        beforeEach(async () => {
          const prize = ethers.parseEther("10");
          const question = "Which country will win the most gold medals?";
          const countries = [
            "France",
            "Germany",
            "Italy",
            "Spain",
            "United Kingdom",
          ];
          const deadline = 1723402000;
          await olympicBet
            .connect(deployer)
            .createEvent(prize, question, countries, deadline, {
              value: prize,
            });
          const amount = ethers.parseEther("10");
          await olympicBet.connect(a).payEntryFee({ value: amount });
          await olympicBet.connect(b).payEntryFee({ value: amount });
          await olympicBet.connect(c).payEntryFee({ value: amount });
          await olympicBet.connect(d).payEntryFee({ value: amount });
          await olympicBet.connect(e).payEntryFee({ value: amount });

          const eventId = 1;
          const country = "France";
          const country1 = "Germany";

          await olympicBet.connect(a).placeBet(eventId, country);
          await olympicBet.connect(b).placeBet(eventId, country);
          await olympicBet.connect(c).placeBet(eventId, country);
          await olympicBet.connect(d).placeBet(eventId, country1);
          await olympicBet.connect(e).placeBet(eventId, country1);

          await ethers.provider.send("evm_setNextBlockTimestamp", [
            newTimestamp,
          ]);
          await ethers.provider.send("evm_mine");
        });
        it("Should set event winners correctly", async () => {
          const eventId = 1;
          const rightAnswer = "France";
          await olympicBet
            .connect(deployer)
            .setEventWinners(eventId, rightAnswer);
          const [, , , , , , , winners, status] = await olympicBet.getE(
            eventId
          );
          assert.equal(winners[0], a.address);
          assert.equal(winners[1], b.address);
          assert.equal(winners[2], c.address);
          assert.equal(winners.length, 3);
          assert.equal(status, 1);
        });
      });
    });
