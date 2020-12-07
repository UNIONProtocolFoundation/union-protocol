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

    console.log("--- ADD TO APPROVED LIST ---")

    if (deployConfig.unionTokenSaleContract == "") {
        console.error("Configuration is missing UnionTokenSale address. Deploy it first!")
        process.exit(1)
    }
    else {
        console.log("Using address " + deployConfig.unionTokenSaleContract + " as unionTokenSale")
    }

    if (deployConfig.dateTimeLib == "") {
        console.error("Configuration is missing DateTime library address. Deploy it first!")
        process.exit(1)
    }
    else {
        console.log("Using address " + deployConfig.dateTimeLib + " as DateTime library")
    }

    const UnionTokenSale = await ethers.getContractFactory("UnionProtocolTokenSale", {
        libraries: {
            DateTime: deployConfig.dateTimeLib
        }
    });
    unionTokenSale = await UnionTokenSale.attach(deployConfig.unionTokenSaleContract)

    console.log("\nLoading list of apprived users from file")
    const apprivedData = fs.readFileSync(path.join(__dirname, 'config', 'addresses.txt'), { encoding: 'utf8', flag: 'r' }).split("\n")

    for (let row of apprivedData) {
        await sleep(500)
        if(row != ""){
            console.log('Adding user ' + row + ' to approved list')
            await unionTokenSale.addToPermittedList(row, true, true, 2500000)
        }
    }

    console.log("\n--- SUCCESS ---")
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })