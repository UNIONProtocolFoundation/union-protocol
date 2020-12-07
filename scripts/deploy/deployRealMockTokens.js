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
        interestWallet,
        publicUser1,
        publicUser2,
        publicUser3,
    ] = await ethers.getSigners(16)

    const deployConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'deployConfig.json')))

    console.log("--- DEPLOY REAL MOCK TOKENS ---")

    //deploy test ERC20 contract serving as USDT mock
    console.log("\nDeploying USDT contract")
    const USDTMockTokenContract = await ethers.getContractFactory("TetherToken");
    usdtToken = await USDTMockTokenContract.deploy('100000000000000000', 'Tether', 'USDT', 6);
    await usdtToken.deployed();
    console.log("USDT deployed on address: " + usdtToken.address)
    console.log("Deploy transaction hash: " + usdtToken.deployTransaction.hash)

    //deploy test ERC20 contract serving as DAI mock
    console.log("\nDeploying DAI contract")
    const DAIMockTokenContract = await ethers.getContractFactory("Dai");
    daiToken = await DAIMockTokenContract.deploy((await ethers.provider.getNetwork()).chainId);
    await daiToken.deployed();
    await daiToken.mint(admin.address, tokens('100000000000'));
    console.log("DAI deployed on address: " + daiToken.address)
    console.log("Deploy transaction hash: " + daiToken.deployTransaction.hash)

    console.log("\nPopulating test wallets with some Mocked DAI and USDT")
    await usdtToken.transfer(publicUser1.address, '10000000000000')
    await usdtToken.transfer(publicUser2.address, '10000000000000')
    await usdtToken.transfer(publicUser3.address, '10000000000000')
    await daiToken.transfer(publicUser1.address, tokens('10000000'))
    await daiToken.transfer(publicUser2.address, tokens('10000000'))
    await daiToken.transfer(publicUser3.address, tokens('10000000'))

    // save config
    console.log("\nSaving configuration...")
    deployConfig.daiTokenContract = daiToken.address
    deployConfig.usdtTokenContract = usdtToken.address
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