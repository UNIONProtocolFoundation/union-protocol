const path = require('path');
const fs = require('fs');
const { config } = require('process');

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
    const approvedAddresses = fs.readFileSync(path.join(__dirname, 'config', 'addresses.txt'), { encoding: 'utf8', flag: 'r' }).split("\n")

    console.log("--- ACCOUNTS ---")
    console.log("Admin                       (" + admin.address + "): " + ethers.utils.formatEther(await admin.getBalance()) + " ETH")
    console.log("PreCheckContributionWallet  (" + preCheckContributionWallet.address + "): " + ethers.utils.formatEther(await preCheckContributionWallet.getBalance()) + " ETH")
    console.log("SaleContributionWallet      (" + saleContributionWallet.address + "): " + ethers.utils.formatEther(await saleContributionWallet.getBalance()) + " ETH")
    console.log("SeedWallet                  (" + seedWallet.address + "): " + ethers.utils.formatEther(await seedWallet.getBalance()) + " ETH")
    console.log("PrivateSale1Wallet          (" + privateSale1Wallet.address + "): " + ethers.utils.formatEther(await privateSale1Wallet.getBalance()) + " ETH")
    console.log("PrivateSale2Wallet          (" + privateSale2Wallet.address + "): " + ethers.utils.formatEther(await privateSale2Wallet.getBalance()) + " ETH")
    console.log("PublicSaleWallet            (" + publicSaleWallet.address + "): " + ethers.utils.formatEther(await publicSaleWallet.getBalance()) + " ETH")
    console.log("PublicSaleBonusWallet       (" + publicSaleBonusWallet.address + "): " + ethers.utils.formatEther(await publicSaleBonusWallet.getBalance()) + " ETH")
    console.log("EcosystemPartnersTeamWallet (" + ecosystemPartnersTeamWallet.address + "): " + ethers.utils.formatEther(await ecosystemPartnersTeamWallet.getBalance()) + " ETH")
    console.log("MiningIncentivesWallet      (" + miningIncentivesWallet.address + "): " + ethers.utils.formatEther(await miningIncentivesWallet.getBalance()) + " ETH")
    console.log("MarketLiquidityWallet       (" + marketLiquidityWallet.address + "): " + ethers.utils.formatEther(await marketLiquidityWallet.getBalance()) + " ETH")
    console.log("SupplyReservePoolWallet     (" + supplyReservePoolWallet.address + "): " + ethers.utils.formatEther(await supplyReservePoolWallet.getBalance()) + " ETH")
    console.log("InterestWallet              (" + interestWallet.address + "): " + ethers.utils.formatEther(await interestWallet.getBalance()) + " ETH")

    console.log("\n--- PUBLIC TOKENS ---")
    console.log("DAI token:                     " + (deployConfig.daiTokenContract == "" ? "NOT SET" : deployConfig.daiTokenContract))
    console.log("USDT token:                    " + (deployConfig.usdtTokenContract == "" ? "NOT SET" : deployConfig.usdtTokenContract))

    console.log("\n--- DEPLOY CONFIG ---")
    console.log("UnionGovernanceTokenContract:  " + (deployConfig.unionGovernanceTokenContract == "" ? "NOT SET" : deployConfig.unionGovernanceTokenContract))
    console.log("UnionTokenSaleContract:        " + (deployConfig.unionTokenSaleContract == "" ? "NOT SET" : deployConfig.unionTokenSaleContract))
    console.log("DateTimeLib:                   " + (deployConfig.dateTimeLib == "" ? "NOT SET" : deployConfig.dateTimeLib))
    console.log("VoluntaryLockContract:         " + (deployConfig.voluntaryLockContract == "" ? "NOT SET" : deployConfig.voluntaryLockContract))

    console.log("\n--- APPROVED ADDRESSES ---")
    console.log("List contains " + approvedAddresses.length + " addresses")

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })