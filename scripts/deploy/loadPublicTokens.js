const { tokens } = require('./../../test//utils/testHelpers')
const path = require('path');
const fs = require('fs');

async function main() {

    // Get accounts
    const [
        admin,
        preCheckContributionWallet,
        saleContributionWallet,
        seedWallet,
        privateSale1Wallet,
        privateSale2Wallet,
        publicSaleWallet,
        publicSaleBonusWallet,
        ecosystemPartnersTeamWallet,
        miningIncentivesWallet,
        marketLiquidityWallet,
        supplyReservePoolWallet,
        interestWallet
    ] = await ethers.getSigners(13)

    const deployConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'deployConfig.json')))

    console.log("--- LOAD PUBLIC TOKENS ---")

    const daiAddress = '0x6b175474e89094c44da98b954eedeac495271d0f'
    const usdtAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7'

    // save config
    console.log("\nSaving configuration...")
    deployConfig.daiTokenContract = daiAddress
    deployConfig.usdtTokenContract = usdtAddress
    fs.writeFileSync(path.join(__dirname, 'config', 'deployConfig.json'), JSON.stringify(deployConfig))
    console.log("Configuration saved!")

    console.log("\n--- SUCCESS ---")

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })