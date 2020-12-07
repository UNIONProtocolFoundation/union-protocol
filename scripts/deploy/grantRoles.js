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

    console.log("--- GRANT ROLES ---")

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
        console.log("Using address " + deployConfig.unionTokenSaleContract + " as unionTokenSale")
    }

    if (deployConfig.voluntaryLockContract == "") {
        console.error("Configuration is missing voluntaryLock address. Deploy it first!")
        process.exit(1)
    }
    else {
        console.log("Using address " + deployConfig.voluntaryLockContract + " as voluntaryLock")
    }

    const UnnToken = await ethers.getContractFactory("UnionGovernanceToken")
    unnToken = await UnnToken.attach(deployConfig.unionGovernanceTokenContract)

    // Give LOCK role to contracts
    console.log("\nGranting role LOCK to UnionTokenSale contract")
    await unnToken.grantRole(unnToken.ROLE_LOCK(), deployConfig.unionTokenSaleContract)

    console.log("Granting role LOCK to VoluntaryLock contract")
    await unnToken.grantRole(await unnToken.ROLE_LOCK(), deployConfig.voluntaryLockContract)

    // Give ALLOCATOR role to contracts
    console.log("Granting role ALLOCATOR to UnionTokenSale contract")
    await unnToken.setAsAllocator(deployConfig.unionTokenSaleContract)

    console.log("Granting role ALLOCATOR to VoluntaryLock contract")
    await unnToken.setAsAllocator(deployConfig.voluntaryLockContract)

    // Specify wallet addresses to be configured as allocators
    console.log("Granting role ALLOCATOR to Admin wallet")
    await unnToken.setAsAllocator(admin.address)

    console.log("Granting role ALLOCATOR to PreCheckContribution wallet")
    await unnToken.setAsAllocator(preCheckContributionWallet.address)

    console.log("Granting role ALLOCATOR to SaleContribution wallet")
    await unnToken.setAsAllocator(saleContributionWallet.address)

    console.log("Granting role ALLOCATOR to Seed wallet")
    await unnToken.setAsAllocator(seedWallet.address)

    console.log("Granting role ALLOCATOR to PrivateSale1 wallet")
    await unnToken.setAsAllocator(privateSale1Wallet.address)

    console.log("Granting role ALLOCATOR to PrivateSale2 wallet")
    await unnToken.setAsAllocator(privateSale2Wallet.address)

    console.log("Granting role ALLOCATOR to PublicSale wallet")
    await unnToken.setAsAllocator(publicSaleWallet.address)

    console.log("Granting role ALLOCATOR to PublicSaleBonus wallet")
    await unnToken.setAsAllocator(publicSaleBonusWallet.address)

    console.log("Granting role ALLOCATOR to EcosystemPartnersTeam wallet")
    await unnToken.setAsAllocator(ecosystemPartnersTeamWallet.address)

    console.log("Granting role ALLOCATOR to MiningIncentives wallet")
    await unnToken.setAsAllocator(miningIncentivesWallet.address)

    console.log("Granting role ALLOCATOR to MarketLiquidity wallet")
    await unnToken.setAsAllocator(marketLiquidityWallet.address)

    console.log("Granting role ALLOCATOR to SupplyReservePool wallet")
    await unnToken.setAsAllocator(supplyReservePoolWallet.address)

    console.log("Granting role ALLOCATOR to Interest wallet")
    await unnToken.setAsAllocator(interestWallet.address)

    console.log("\n--- SUCCESS ---")
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })