require("@nomiclabs/hardhat-waffle")
require("hardhat-gas-reporter")

task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.6.12",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: {
        mnemonic: "vessel fine siege duck actress session effort tower federal attitude race wink"
      }
    }
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: '99f32a19-565a-444a-8238-e89dc9a0d7c3'
  }
};
