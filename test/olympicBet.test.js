const { assert, expect } = require("chai");
const { ethers, network, upgrades } = require("hardhat");
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
        olympicBet = await upgrades.deployProxy(OlympiBet, []);
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

          // 创建区块链状态快照
          snapshotId = await ethers.provider.send("evm_snapshot", []);

          const newTimestamp = 1723402001;
          await ethers.provider.send("evm_setNextBlockTimestamp", [
            newTimestamp,
          ]);
          await ethers.provider.send("evm_mine");
        });
        afterEach(async () => {
          // 恢复区块链状态
          await ethers.provider.send("evm_revert", [snapshotId]);
        });
        it("Should set event winners correctly", async () => {
          const eventId = 1;
          const rightAnswer = "France";
          await olympicBet
            .connect(deployer)
            .setEventWinners(eventId, rightAnswer);
          const [, , , , , , winners, status] = await olympicBet.getE(eventId);
          assert.equal(winners[0], a.address);
          assert.equal(winners[1], b.address);
          assert.equal(winners[2], c.address);
          assert.equal(winners.length, 3);
          assert.equal(status, 1);
        });
        it("Should emit EventWinnersSet event", async () => {
          const eventId = 1;
          const rightAnswer = "France";
          await expect(
            olympicBet.connect(deployer).setEventWinners(eventId, rightAnswer)
          )
            .to.emit(olympicBet, "EventWinnerSet")
            .withArgs(eventId, [a.address, b.address, c.address], 1);
        });
        it("Should revert if event status is wrong", async () => {
          const eventId = 1;
          const rightAnswer = "France";
          await olympicBet
            .connect(deployer)
            .setEventWinners(eventId, rightAnswer);
          await expect(
            olympicBet.connect(deployer).setEventWinners(eventId, rightAnswer)
          ).to.be.revertedWith("Even Status should be Open");
        });
        it("Should revert if not deployer call the function", async () => {
          const eventId = 1;
          const rightAnswer = "France";
          await expect(
            olympicBet.connect(a).setEventWinners(eventId, rightAnswer)
          ).to.be.revertedWith("Not authorized");
        });
        it("Should revert if not reach the deadline", async () => {
          const eventId = 1;
          const rightAnswer = "France";
          await ethers.provider.send("evm_revert", [snapshotId]);
          await expect(
            olympicBet.connect(deployer).setEventWinners(eventId, rightAnswer)
          ).to.be.revertedWith("Event hasn't finished yet!");
        });
      });
      describe("Pay Winners", function () {
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

          // 创建区块链状态快照
          snapshotId = await ethers.provider.send("evm_snapshot", []);

          const newTimestamp = 1723402001;
          await ethers.provider.send("evm_setNextBlockTimestamp", [
            newTimestamp,
          ]);
          await ethers.provider.send("evm_mine");
        });
        afterEach(async () => {
          // 恢复区块链状态
          await ethers.provider.send("evm_revert", [snapshotId]);
        });
        it("Should pay winners successfully", async () => {
          const eventId = 1;
          const rightAnswer = "France";
          await olympicBet
            .connect(deployer)
            .setEventWinners(eventId, rightAnswer);

          const aBalanceBefore = await a.provider.getBalance(a.address);
          const bBalanceBefore = await ethers.provider.getBalance(b.address);
          const cBalanceBefore = await ethers.provider.getBalance(c.address);
          await olympicBet.connect(deployer).payWinners(eventId);
          const aBalanceAfter = await ethers.provider.getBalance(a.address);
          const bBalanceAfter = await ethers.provider.getBalance(b.address);
          const cBalanceAfter = await ethers.provider.getBalance(c.address);

          const [, , , , , , , status] = await olympicBet.getE(eventId);
          assert.equal(status, 2);
          assert.equal(
            aBalanceAfter - aBalanceBefore,
            ethers.parseEther("3.333333333333333333")
          );
          assert.equal(
            bBalanceAfter - bBalanceBefore,
            ethers.parseEther("3.333333333333333333")
          );
          assert.equal(
            cBalanceAfter - cBalanceBefore,
            ethers.parseEther("3.333333333333333333")
          );
        });
        it("Should emit WinnersPaid event", async () => {
          const eventId = 1;
          const rightAnswer = "France";
          await olympicBet
            .connect(deployer)
            .setEventWinners(eventId, rightAnswer);

          await expect(olympicBet.connect(deployer).payWinners(eventId))
            .to.emit(olympicBet, "WinnersPaid")
            .withArgs(eventId, 2);
        });
        it("Should revert if no winners to pay", async () => {
          const eventId = 1;
          const rightAnswer = "England";
          await olympicBet
            .connect(deployer)
            .setEventWinners(eventId, rightAnswer);

          await expect(
            olympicBet.connect(deployer).payWinners(eventId)
          ).to.be.revertedWith("No winners to pay");
        });
      });
      describe("Withdraw Funds", function () {
        beforeEach(async () => {
          // 创建区块链状态快照
          snapshotId = await ethers.provider.send("evm_snapshot", []);

          const amount = ethers.parseEther("10");
          await olympicBet.connect(a).payEntryFee({ value: amount });
        });
        afterEach(async () => {
          // 恢复区块链状态
          await ethers.provider.send("evm_revert", [snapshotId]);
        });
        it("Should withdraw funds successfully", async () => {
          const newTimestamp = 1723392001;
          await ethers.provider.send("evm_setNextBlockTimestamp", [
            newTimestamp,
          ]);
          await ethers.provider.send("evm_mine");
          const aBalanceBefore = await a.provider.getBalance(a.address);
          const balanceOfABefore = await olympicBet.getBalance(a.address);
          const tx = await olympicBet.connect(a).withdrawFunds();
          const receipt = await tx.wait();
          const gasCost = BigInt(receipt.gasUsed) * BigInt(receipt.gasPrice);
          const aBalanceAfter = await a.provider.getBalance(a.address);
          const balanceOfAAfter = await olympicBet.getBalance(a.address);
          assert.equal(
            aBalanceAfter - aBalanceBefore,
            balanceOfABefore - gasCost
          );
          assert.equal(balanceOfAAfter, 0);
        });
        it("Should revert if time is not reached", async () => {
          expect(olympicBet.connect(a).withdrawFunds()).to.be.revertedWith(
            "Olympic is not over yet!"
          );
        });
        it("Should revert if not enough balance", async () => {
          const newTimestamp = 1723392001;
          await ethers.provider.send("evm_setNextBlockTimestamp", [
            newTimestamp,
          ]);
          await ethers.provider.send("evm_mine");
          await expect(
            olympicBet.connect(b).withdrawFunds()
          ).to.be.revertedWith("You have no balance to withdraw");
        });
      });
    });
