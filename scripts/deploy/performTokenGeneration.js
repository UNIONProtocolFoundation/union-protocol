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

    console.log("--- TOKEN GENERATION ---")

    if (deployConfig.unionGovernanceTokenContract == "") {
        console.error("Configuration is missing UnionGovernanceToken address. Deploy it first!")
        process.exit(1)
    }
    else {
        console.log("Using address " + deployConfig.unionGovernanceTokenContract + " as UnionGovernanceToken")
    }

    if (deployConfig.unionTokenSaleContract == "") {
        console.error("Configuration is missing UnionTokenSale address. Deploy it first!")
        process.exit(1)
    }
    else {
        console.log("Using address " + deployConfig.unionTokenSaleContract + " as UnionTokenSale")
    }

    if (deployConfig.voluntaryLockContract == "") {
        console.error("Configuration is missing voluntaryLock address. Deploy it first!")
        process.exit(1)
    }
    else {
        console.log("Using address " + deployConfig.voluntaryLockContract + " as VoluntaryLock")
    }

    if (deployConfig.dateTimeLib == "") {
        console.error("Configuration is missing DateTime library address. Deploy it first!")
        process.exit(1)
    }
    else {
        console.log("Using address " + deployConfig.dateTimeLib + " as DateTime library")
    }

    const UnnToken = await ethers.getContractFactory("UnionGovernanceToken")
    unnToken = await UnnToken.attach(deployConfig.unionGovernanceTokenContract)

    const UnionTokenSale = await ethers.getContractFactory("UnionProtocolTokenSale", {
        libraries: {
            DateTime: deployConfig.dateTimeLib
        }
    });
    unionTokenSale = await UnionTokenSale.attach(deployConfig.unionTokenSaleContract)

    // Give allowance for Sale contract to spend Admin wallet UNN
    const adminUnnBalance = await unnToken.balanceOf(admin.address)
    console.log("\nGiving allowance for Sale contract to spend Admin Wallet tokens (" + ethers.utils.formatUnits(adminUnnBalance, 18) + " UNN)")
    await unnToken.connect(admin).approve(unionTokenSale.address, adminUnnBalance)

    await sleep(3000)

    // Perform Token generation
    console.log("\nPerforming token generation")
    await unionTokenSale.performTokenGeneration()

    await sleep(3000)

    // Transfer tokens to predefined addresses
    console.log("Transfering tokens to predefined addresses")
    await unionTokenSale.transferTokensToPredefinedAddresses()

    await sleep(3000)

    // Put some tokens on publicSaleBonusWallet
    const tokensFromMiningIncentivesToPublicSale = tokens('10000000')
    console.log("\nTransfering tokens from MiningIncentives wallet to PublicSaleBonus wallet (" + ethers.utils.formatUnits(tokensFromMiningIncentivesToPublicSale, 18) + " UNN)")
    await unnToken.connect(miningIncentivesWallet).transfer(publicSaleBonusWallet.address, tokensFromMiningIncentivesToPublicSale)

    await sleep(3000)

    // Put some tokens on intrest wallet
    const tokensFromMiningIncentivesToInterest = tokens('8000000')
    console.log("Transfering tokens from MiningIncentives wallet to Interest wallet (" + ethers.utils.formatUnits(tokensFromMiningIncentivesToInterest, 18) + " UNN)")
    await unnToken.connect(miningIncentivesWallet).transfer(interestWallet.address, tokensFromMiningIncentivesToInterest)

    await sleep(3000)

    // Give allowance for voluntaryLockContract to spend interestWallet UNN
    const tokensFromInterestToVoluntary = tokens('8000000')
    console.log("Giving allowance for VoluntaryLock contract to spend Interest Wallet tokens (" + ethers.utils.formatUnits(tokensFromInterestToVoluntary, 18) + " UNN)")
    await unnToken.connect(interestWallet).approve(deployConfig.voluntaryLockContract, tokensFromInterestToVoluntary)

    await sleep(3000)

    // Give allowance for unionTokenSale to spend publicSaleWallet UNN
    const publicSaleBalance = await tokens('50000000')
    console.log("Giving allowance for UnionTokenSale contract to spend PublicSale Wallet tokens (" + ethers.utils.formatUnits(publicSaleBalance, 18) + " UNN)")
    await unnToken.connect(publicSaleWallet).approve(deployConfig.unionTokenSaleContract, publicSaleBalance)

    await sleep(3000)

    // Give allowance for UnionTokenSale to spend publicSaleWallet UNN
    const publicSaleBonusBalance = tokens('10000000')
    console.log("Giving allowance for UnionTokenSale contract to spend PublicSaleBonus Wallet tokens (" + ethers.utils.formatUnits(publicSaleBonusBalance, 18) + " UNN)")
    await unnToken.connect(publicSaleBonusWallet).approve(deployConfig.unionTokenSaleContract, publicSaleBonusBalance)

    console.log("\n--- SUCCESS ---")
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })