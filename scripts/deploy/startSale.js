const { tokens } = require('./../../test//utils/testHelpers')
const path = require('path');
const fs = require('fs');

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

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

    console.log("--- START SALE ---")

    if (deployConfig.unionTokenSaleContract == "") {
        console.error("Configuration is missing UnionTokenSale address. Deploy it first!")
        process.exit(1)
    }
    else {
        console.log("Using address " + deployConfig.unionTokenSaleContract + " as UnionTokenSale")
    }

    if (deployConfig.dateTimeLib == "") {
        console.error("Configuration is missing DateTime library address. Deploy it first!")
        process.exit(1)
    }
    else {
        console.log("Using address " + deployConfig.dateTimeLib + " as DateTime library")
    }

    if (deployConfig.daiTokenContract == "") {
        console.error("Configuration is missing DAI token address. Deploy or set it first!")
        process.exit(1)
    }
    else {
        console.log("Using address " + deployConfig.daiTokenContract + " as DAI token")
    }


    if (deployConfig.usdtTokenContract == "") {
        console.error("Configuration is missing USDT token address. Deploy or set it first!")
        process.exit(1)
    }
    else {
        console.log("Using address " + deployConfig.usdtTokenContract + " as USDT token")
    }

    const UnnToken = await ethers.getContractFactory("UnionGovernanceToken")
    unnToken = await UnnToken.attach(deployConfig.unionGovernanceTokenContract)

    const UnionTokenSale = await ethers.getContractFactory("UnionProtocolTokenSale", {
        libraries: {
            DateTime: deployConfig.dateTimeLib
        }
    })
    unionTokenSale = await UnionTokenSale.attach(deployConfig.unionTokenSaleContract)

    // Add supported tokens for token sale
    console.log("\nAdding DAI as supported token for Sale contract")
    await unionTokenSale.addSupportedToken(
        ethers.utils.formatBytes32String("DAI"),
        deployConfig.daiTokenContract,
        18
    )

    await sleep(3000)

    console.log("Adding USDT as supported token for Sale contract")
    await unionTokenSale.addSupportedToken(
        ethers.utils.formatBytes32String("USDT"),
        deployConfig.usdtTokenContract,
        6
    )

    await sleep(3000)

    // Start sale 
    console.log("\nStarting sale")
    await unionTokenSale.startSale();


    console.log("\n--- SUCCESS ---")
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })