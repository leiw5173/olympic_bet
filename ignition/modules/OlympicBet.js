const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("LockModule", (m) => {
  const olympicBet = m.contract("OlympicBet", [], {});

  return { olympicBet };
});
