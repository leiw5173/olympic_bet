require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");
require("@nomicfoundation/hardhat-verify");

const NEOX_TESTNET_RPC_URL = process.env.NEOX_TESTNET_RPC_URL;
const NEOX_RPC_URL = process.env.NEOX_RPC_URL;
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
      gas: 25e9,
      gasPrice: 20e10,
    },
    neox: {
      url: NEOX_RPC_URL,
      chainId: 47763,
      accounts: [DEPLOYER_PRIV_KEY, ALICE_PRIV_KEY, BOB_PRIV_KEY],
      gas: 25e9,
      gasPrice: 20e10,
    },
  },
  etherscan: {
    apiKey: {
      neoxt: "YOUR_API_KEY",
      neox: "YOUR_API_KEY",
    },
    customChains: [
      {
        network: "neoxt",
        chainId: 12227332,
        urls: {
          apiURL: "https://xt4scan.ngd.network/api",
          browserURL: "https://xt4scan.ngd.network/",
        },
      },
      {
        network: "neox",
        chainId: 47763,
        urls: {
          apiURL: "https://xexplorer.neo.org/api",
          browserURL: "https://xexplorer.neo.org/",
        },
      },
    ],
  },
};
