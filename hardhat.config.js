require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");

const NEOX_TESTNET_RPC_URL = process.env.NEOX_TESTNET_RPC_URL;
const DEPLOYER_PRIV_KEY = process.env.DEPLOYER_PRIV_KEY;
const ALICE_PRIV_KEY = process.env.ALICE_PRIV_KEY;
const BOB_PRIV_KEY = process.env.BOB_PRIV_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    neoxt: {
      url: NEOX_TESTNET_RPC_URL,
      chainId: 12227332,
      accounts: [DEPLOYER_PRIV_KEY, ALICE_PRIV_KEY, BOB_PRIV_KEY],
    },
  },
};
