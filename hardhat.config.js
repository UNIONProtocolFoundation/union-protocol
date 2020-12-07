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
    compilers: [
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.5.12"
      },
      {
        version: "0.4.17"
      }
    ]
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    ganache: {
      url: "http://127.0.0.1:7545"
    }
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: '99f32a19-565a-444a-8238-e89dc9a0d7c3'
  }
};
