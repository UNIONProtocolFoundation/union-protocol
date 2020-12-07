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
    const tokenSupply = tokens('1000000000')   // 1 000 000 000 

    console.log("--- DEPLOY GOVERNANCE CONTRACT ---")
    console.log("Deploying with initial supply of " + ethers.utils.formatUnits(tokenSupply, 18) + " UNN")

    // Deploy UnnToken
    const UnnToken = await ethers.getContractFactory("UnionGovernanceToken")
    unnToken = await UnnToken.deploy(admin.address, tokenSupply)
    await unnToken.deployed()

    console.log("\nUnionGovernanceToken deployed on address: " + unnToken.address)
    console.log("Deploy transaction hash: "+ unnToken.deployTransaction.hash)

    console.log("\nSaving configuration...")
    deployConfig.unionGovernanceTokenContract = unnToken.address
    fs.writeFileSync(path.join(__dirname, 'config', 'deployConfig.json'), JSON.stringify(deployConfig))
    console.log("Configuration saved!")

    await unnToken.setCanTransfer(false)
    console.log("\nCanTransfer set to \"false\"")

    await unnToken.setReversion(true)
    console.log("Revision set to \"true\"")
    
    console.log("\n--- SUCCESS ---")
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })