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

    console.log("--- DEPLOY SALE CONTRACT ---")

    if (deployConfig.unionGovernanceTokenContract == "") {
        console.error("Configuration is missing UnionGovernanceToken address. Deploy it first!")
        process.exit(1)
    }
    else {
        console.log("Using address " + deployConfig.unionGovernanceTokenContract + " as UnionGovernanceToken")
    }

    // Deploy DateTime lib
    console.log("\nDeploying DateTime library")
    const DateTime = await ethers.getContractFactory("DateTime");
    const dateTimeLib = await DateTime.deploy();
    await dateTimeLib.deployed();

    console.log("DateTime library deployed on address: " + dateTimeLib.address)
    console.log("Deploy transaction hash: "+ dateTimeLib.deployTransaction.hash)

    // Deploy UnionProtocolTokenSale
    console.log("\nDeploying UnionTokenSale contract")

    const unionTokenSale = await ethers.getContractFactory("UnionProtocolTokenSale", {
        libraries: {
            DateTime: dateTimeLib.address
        }
    });
    const unionProtocolTokenSaleInstance = await unionTokenSale.deploy(
        deployConfig.unionGovernanceTokenContract,
        preCheckContributionWallet.address,
        saleContributionWallet.address,
        seedWallet.address,
        privateSale1Wallet.address,
        privateSale2Wallet.address,
        publicSaleWallet.address,
        publicSaleBonusWallet.address,
        ecosystemPartnersTeamWallet.address,
        miningIncentivesWallet.address,
        marketLiquidityWallet.address,
        supplyReservePoolWallet.address
    );
    await unionProtocolTokenSaleInstance.deployed();
    console.log("UnionTokenSale deployed on address: " + unionProtocolTokenSaleInstance.address)
    console.log("Deploy transaction hash: "+ unionProtocolTokenSaleInstance.deployTransaction.hash)

    console.log("\nSaving configuration...")
    deployConfig.unionTokenSaleContract = unionProtocolTokenSaleInstance.address
    deployConfig.dateTimeLib = dateTimeLib.address
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