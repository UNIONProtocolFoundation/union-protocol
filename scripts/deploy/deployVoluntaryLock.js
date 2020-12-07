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

    console.log("--- DEPLOY VOLUNTARY LOCK CONTRACT ---")

    if (deployConfig.unionGovernanceTokenContract == "") {
        console.error("Configuration is missing UnionGovernanceToken address. Deploy it first!")
        process.exit(1)
    }
    else {
        console.log("Using address " + deployConfig.unionGovernanceTokenContract + " as UnionGovernanceToken")
    }

    console.log("\nDeploying VoluntaryLock contract")

    // Deploy VoluntaryLockContract
    const VoluntaryLockContract = await ethers.getContractFactory("VoluntaryLockContract")
    voluntaryLockContract = await VoluntaryLockContract.deploy(deployConfig.unionGovernanceTokenContract, interestWallet.address)
    await voluntaryLockContract.deployed()
    console.log("VoluntaryLock deployed on address: " + voluntaryLockContract.address)
    console.log("Deploy transaction hash: "+ voluntaryLockContract.deployTransaction.hash)

    console.log("\nSaving configuration...")
    deployConfig.voluntaryLockContract = voluntaryLockContract.address
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