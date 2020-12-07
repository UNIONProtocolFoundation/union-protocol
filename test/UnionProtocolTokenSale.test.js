const { expect } = require("chai");
const { ethers } = require("hardhat");
const expectRevert = require('./utils/expectRevert')
const { tokens, calculateUSDToUNN } = require('./utils/testHelpers')
const BN = require("bn.js");
const { create, all } = require('mathjs')
const config = {}
const mathjs = create(all, config)

describe("UnionProtocolTokenSale", () => {
    let unionProtocolTokenSaleInstance,
        unnGovernanceToken,
        daiToken,
        usdtToken,
        owner,
        governor,
        publicUser1,
        publicUser2,
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
        supplyReservePoolWallet;

    // let daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    // let usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

    const tokenSupply = tokens('1000000000');

    /**
     * TEST ENVIRONMENT PREPARATION
     */
    beforeEach(async () => {
        // Load Accounts
        [
            owner,
            governor,
            publicUser1,
            publicUser2,
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
        ] = await ethers.getSigners(20);

        //deploy test ERC20 contract serving as DAI mock
        // const DAIMockTokenContract = await ethers.getContractFactory("DAIMockToken");
        // daiToken = await DAIMockTokenContract.connect(publicUser1).deploy(tokens('10000000'));
        // await daiToken.deployed();

        const DAIMockTokenContract = await ethers.getContractFactory("Dai");
        daiToken = await DAIMockTokenContract.deploy((await ethers.provider.getNetwork()).chainId);
        await daiToken.deployed();
        await daiToken.mint(owner.address, tokens('100000000000'));
        await daiToken.transfer(publicUser1.address,tokens('100000000000'));

        //deploy test ERC20 contract serving as USDT mock
        // const USDTMockTokenContract = await ethers.getContractFactory("USDTMockToken");
        // usdtToken = await USDTMockTokenContract.connect(publicUser1).deploy(tokens('10000000'));
        // await usdtToken.deployed();

        const USDTMockTokenContract = await ethers.getContractFactory("TetherToken");
        usdtToken = await USDTMockTokenContract.deploy('100000000000000000', 'Tether', 'USDT', 6);
        await usdtToken.deployed();
        await usdtToken.transfer(publicUser1.address, '100000000000000000')

        const DateTime = await ethers.getContractFactory("DateTime");
        const dateTimeLib = await DateTime.deploy();
        await dateTimeLib.deployed();

        //deploy token contract
        const UnnToken = await ethers.getContractFactory("UnionGovernanceToken");
        unnGovernanceToken = await UnnToken.deploy(owner.address, tokenSupply);
        await unnGovernanceToken.deployed();
        await unnGovernanceToken.setCanTransfer(false);
        await unnGovernanceToken.setReversion(true);

        // deploy sales contract
        let UnionTokenSaleContract = await ethers.getContractFactory("UnionProtocolTokenSale", {
            libraries: {
                DateTime: dateTimeLib.address
            }
        });
        unionProtocolTokenSaleInstance = await UnionTokenSaleContract.deploy(
            unnGovernanceToken.address,
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
        // adding sales contract as allocator
        await unnGovernanceToken.setAsAllocator(
            unionProtocolTokenSaleInstance.address
        );
        await unnGovernanceToken.setAsAllocator(
            ecosystemPartnersTeamWallet.address
        );
        await unnGovernanceToken.grantRole(
            unnGovernanceToken.ROLE_LOCK(),
            unionProtocolTokenSaleInstance.address
        )
        // owner must approve all his funds to the sales contract for performing sales start event
        await unnGovernanceToken.approve(
            unionProtocolTokenSaleInstance.address,
            tokenSupply
        );
        await unnGovernanceToken.connect(publicSaleWallet).approve(
            unionProtocolTokenSaleInstance.address,
            tokenSupply
        );
    });

    /**
     * BASIC CONTRACT TESTS
     */
    it("Should return basic default values from deployed contract", async function() {
        let currentTokenNumber = await unionProtocolTokenSaleInstance.getCurrentTokenNumber();
        expect(currentTokenNumber).to.equal(950000001);

        let bonusTokenFactor = await unionProtocolTokenSaleInstance.getBonusTokenFactor();
        expect(bonusTokenFactor).to.equal(20);

        let bonusTokenLockPeriod = await unionProtocolTokenSaleInstance.getBonusTokenLockPeriod();
        expect(bonusTokenLockPeriod).to.equal(12);
    })

    /**
     * BONUS TOKEN CONFIGURATION
     */
    it("Should change bonus locked tokens' bonus factor", async function() {
        const newFactor = 50;
        await unionProtocolTokenSaleInstance.setBonusTokenFactor(newFactor);
        let bonusTokenFactor = await unionProtocolTokenSaleInstance.getBonusTokenFactor();
        expect(bonusTokenFactor).to.equal(newFactor);
    });

    it("Should change bonus locked tokens' lock period", async function() {
        const newLockPeriod = 24;
        await unionProtocolTokenSaleInstance.setBonusTokenLockPeriod(newLockPeriod);
        let bonusTokenLockPeriod = await unionProtocolTokenSaleInstance.getBonusTokenLockPeriod();
        expect(bonusTokenLockPeriod).to.equal(newLockPeriod);
    });

    it("Should throw an error when illegal bonus factor is set", async function() {
        await expectRevert(
            unionProtocolTokenSaleInstance.setBonusTokenLockPeriod(61),
            "illegal lock period value"
        );
        await expectRevert(
            unionProtocolTokenSaleInstance.setBonusTokenLockPeriod(0),
            "illegal lock period value"
        );
    });

    it("Should throw an error when illegal bonus token lock factor is set", async function() {
        await expectRevert(
            unionProtocolTokenSaleInstance.setBonusTokenFactor(501),
            "illegal bonus token factor value"
        );
        await expectRevert(
            unionProtocolTokenSaleInstance.setBonusTokenFactor(0),
            "illegal bonus token factor value"
        );
    });

    /**
     * WALLET ADDRESS SETTINGS
     */
    it("Should properly change all wallet addresses", async function() {
        let address;

        await unionProtocolTokenSaleInstance.setSeedRoundAddress("0x233196a462a9ba4557496Ce646810d33a9cbaB94");
        address = await unionProtocolTokenSaleInstance.getSeedRoundAddress();
        expect(address).to.equal("0x233196a462a9ba4557496Ce646810d33a9cbaB94");

        await unionProtocolTokenSaleInstance.setPrivateRound1Address("0x5109095D759AC917999CDE8ce77153b6DCb7ce49");
        address = await unionProtocolTokenSaleInstance.getPrivateRound1Address();
        expect(address).to.equal("0x5109095D759AC917999CDE8ce77153b6DCb7ce49");

        await unionProtocolTokenSaleInstance.setPrivateRound2Address("0xBF899AC1702D9f8420F54C75Cdc80C1f7f850a1c");
        address = await unionProtocolTokenSaleInstance.getPrivateRound2Address();
        expect(address).to.equal("0xBF899AC1702D9f8420F54C75Cdc80C1f7f850a1c");

        await unionProtocolTokenSaleInstance.setPublicSaleAddress("0x6187BE235810bE3AE0c05f48cE45b0Be4469A9f1");
        address = await unionProtocolTokenSaleInstance.getPublicSaleAddress();
        expect(address).to.equal("0x6187BE235810bE3AE0c05f48cE45b0Be4469A9f1");

        await unionProtocolTokenSaleInstance.setEcosystemPartnersTeamAddress("0x3888D3Ca22763409144367139E092dCCa623B352");
        address = await unionProtocolTokenSaleInstance.getEcosystemPartnersTeamAddress();
        expect(address).to.equal("0x3888D3Ca22763409144367139E092dCCa623B352");

        await unionProtocolTokenSaleInstance.setMiningIncentivesPoolAddress("0x59B26ad3aC4D89fa3D49bB55cAeB4A6d4B7BA36b");
        address = await unionProtocolTokenSaleInstance.getMiningIncentivesPoolAddress();
        expect(address).to.equal("0x59B26ad3aC4D89fa3D49bB55cAeB4A6d4B7BA36b");

        await unionProtocolTokenSaleInstance.setMarketLiquidityPoolAddress("0x1955b99e73853DBd04C5a75709FBB8170E6bEe16");
        address = await unionProtocolTokenSaleInstance.getMarketLiquidityPoolAddress();
        expect(address).to.equal("0x1955b99e73853DBd04C5a75709FBB8170E6bEe16");

        await unionProtocolTokenSaleInstance.setSupplyReservePoolAddress("0x74cd8B09612b814d42107c11DAD5EB16956dAA89");
        address = await unionProtocolTokenSaleInstance.getSupplyReservePoolAddress();
        expect(address).to.equal("0x74cd8B09612b814d42107c11DAD5EB16956dAA89");
    });

    /**
     * ROLES AND ACCESS CONTROL
     */
    it("Should grant governor role properly", async function() {
        await unionProtocolTokenSaleInstance.grantRole(
            unionProtocolTokenSaleInstance.ROLE_GOVERN(),
            governor.address
        )
        let savedGovernor = await unionProtocolTokenSaleInstance.getRoleMember(
            await unionProtocolTokenSaleInstance.ROLE_GOVERN(),
            0
        )
        expect(savedGovernor.toString()).to.equal(governor.address);
    });

    /**
     * SUPPORTED TOKENS CONFIGURATION
     */
    it("Should add and remove a supported token", async function() {
        const tokenName = "DAI";
        const tokenDecimals = 18;

        await unionProtocolTokenSaleInstance.addSupportedToken(
            ethers.utils.formatBytes32String(tokenName),
            daiToken.address,
            tokenDecimals
        )
        const supportedTokenAddressAdded = await unionProtocolTokenSaleInstance.getSupportedTokenAddress(
            ethers.utils.formatBytes32String(tokenName)
        )
        expect(supportedTokenAddressAdded.toString()).to.equal(daiToken.address);

        const supportedTokenDecimalsAdded = await unionProtocolTokenSaleInstance.getSupportedTokenDecimals(
            ethers.utils.formatBytes32String(tokenName)
        )
        expect(supportedTokenDecimalsAdded).to.equal(tokenDecimals);

        await unionProtocolTokenSaleInstance.removeSupportedToken(ethers.utils.formatBytes32String(tokenName));
        const supportedTokenAddressRemoved = await unionProtocolTokenSaleInstance.getSupportedTokenAddress(
            ethers.utils.formatBytes32String(tokenName)
        );
        const supportedTokenDecimalsRemoved = await unionProtocolTokenSaleInstance.getSupportedTokenDecimals(
            ethers.utils.formatBytes32String(tokenName)
        )
        expect(supportedTokenAddressRemoved.toString()).to.equal(ethers.constants.AddressZero);
        expect(supportedTokenDecimalsRemoved).to.equal(ethers.constants.Zero);
    });

    it("Should throw an error when trying to add the same token more than once", async function (){
        const tokenName = "DAI";
        const tokenDecimals = 18;

        await unionProtocolTokenSaleInstance.addSupportedToken(
            ethers.utils.formatBytes32String(tokenName),
            daiToken.address,
            tokenDecimals
        )

        await expectRevert(
            unionProtocolTokenSaleInstance.addSupportedToken(
                ethers.utils.formatBytes32String(tokenName),
                daiToken.address,
                tokenDecimals
            ),
            "UPTS_ERROR: Token already exists. Remove it before modifying",
        );

        await unionProtocolTokenSaleInstance.removeSupportedToken(ethers.utils.formatBytes32String(tokenName));

        await unionProtocolTokenSaleInstance.addSupportedToken(
            ethers.utils.formatBytes32String(tokenName),
            daiToken.address,
            6
        );

        const supportedTokenDecimals = await unionProtocolTokenSaleInstance.getSupportedTokenDecimals(
            ethers.utils.formatBytes32String(tokenName)
        );
        expect(supportedTokenDecimals).to.equal(6);
    });

    /**
     * PERMITTING USERS TO BUY TOKENS
     */
    it("Should add and remove user from permitted list", async function() {
        let isPermitted = true;
        let isPrecheck = true;
        let tokenAmount = 1000;
        await unionProtocolTokenSaleInstance.addToPermittedList(
            publicUser1.address,
            isPermitted,
            isPrecheck,
            tokenAmount
        );
        let AddedSavedIsPermitted = await unionProtocolTokenSaleInstance.getAddressPermittedApprovalStatus(
            publicUser1.address
        );
        let AddedSavedIsPrecheck = await unionProtocolTokenSaleInstance.getAddressPermittedPrecheck(
            publicUser1.address
        );
        let AddedSavedTokenAmount = await unionProtocolTokenSaleInstance.getAddressRemainingPermittedAmount(
            publicUser1.address
        );
        expect(AddedSavedIsPermitted).to.equal(isPermitted);
        expect(AddedSavedIsPrecheck).to.equal(isPrecheck);
        expect(AddedSavedTokenAmount).to.equal(tokenAmount);

        await unionProtocolTokenSaleInstance.removeFromPermittedList(publicUser1.address);
        let savedIsPermitted = await unionProtocolTokenSaleInstance.getAddressPermittedApprovalStatus(
            publicUser1.address
        );
        let savedIsPrecheck = await unionProtocolTokenSaleInstance.getAddressPermittedPrecheck(
            publicUser1.address
        );
        let savedTokenAmount = await unionProtocolTokenSaleInstance.getAddressRemainingPermittedAmount(
            publicUser1.address
        );
        expect(savedIsPermitted).to.equal(false);
        expect(savedIsPrecheck).to.equal(false);
        expect(savedTokenAmount).to.equal(0);
    });

    /**
     * TOKEN GENERATION & SALE
     */
    it("Should perform a token generation", async function() {
        await unionProtocolTokenSaleInstance.performTokenGeneration();
        let isTokenGenerationPerformed = await unionProtocolTokenSaleInstance.isTokenGenerationPerformed();
        expect(isTokenGenerationPerformed).to.equal(true);
    });

    it("Should transfer tokens to predefined addressess", async function() {
        // PREREQUISITES START
        await unionProtocolTokenSaleInstance.performTokenGeneration();
        // PREREQUISITES END

        await unionProtocolTokenSaleInstance.transferTokensToPredefinedAddresses();

        let seedWalletBalance = await unnGovernanceToken.balanceOf(seedWallet.address);
        expect(seedWalletBalance.toString()).to.equal(tokens('100000000'));

        let privateSale1WalletBalance = await unnGovernanceToken.balanceOf(privateSale1Wallet.address);
        expect(privateSale1WalletBalance.toString()).to.equal(tokens('200000000'));

        let privateSale2WalletBalance = await unnGovernanceToken.balanceOf(privateSale2Wallet.address);
        expect(privateSale2WalletBalance.toString()).to.equal(tokens('50000000'));

        let publicSaleWalletBalance = await unnGovernanceToken.balanceOf(publicSaleWallet.address);
        expect(publicSaleWalletBalance.toString()).to.equal(tokens('50000000'));

        let ecosystemPartnersTeamWalletBalance = await unnGovernanceToken.balanceOf(ecosystemPartnersTeamWallet.address);
        expect(ecosystemPartnersTeamWalletBalance.toString()).to.equal(tokens('100000000'));

        let miningIncentivesWalletBalance = await unnGovernanceToken.balanceOf(miningIncentivesWallet.address);
        expect(miningIncentivesWalletBalance.toString()).to.equal(tokens('150000000'));

        let marketLiquidityWalletBalance = await unnGovernanceToken.balanceOf(marketLiquidityWallet.address);
        expect(marketLiquidityWalletBalance.toString()).to.equal(tokens('100000000'));

        let supplyReservePoolWalletBalance = await unnGovernanceToken.balanceOf(supplyReservePoolWallet.address);
        expect(supplyReservePoolWalletBalance.toString()).to.equal(tokens('250000000'));

        // token allocation should not be performed more than once
        await expectRevert(
            unionProtocolTokenSaleInstance.transferTokensToPredefinedAddresses(),
            "UPTS_ERROR: token allocation has already been performed"
        )
    });

    it("Should start and end sale properly", async function() {
        // PREREQUISITES START
        await unionProtocolTokenSaleInstance.performTokenGeneration();
        await unionProtocolTokenSaleInstance.transferTokensToPredefinedAddresses();
        // PREREQUISITES END
        await unionProtocolTokenSaleInstance.startSale();
        let isSaleStarted1 = await unionProtocolTokenSaleInstance.isSaleStarted();
        expect(isSaleStarted1).to.equal(true);

        await unionProtocolTokenSaleInstance.endSale();
        let isSaleStarted2 = await unionProtocolTokenSaleInstance.isSaleStarted();
        expect(isSaleStarted2).to.equal(false);
    });
    it("Should end sale properly", async function() {

    });

    /**
     * TOKEN PURCHASE
     */
    it("Should get correct current token number after the purchase starts", async function() {
        let currentTokenNumber = await unionProtocolTokenSaleInstance.getCurrentTokenNumber();
        expect(currentTokenNumber).to.equal(950000001);
    });

    it("Should check the token price based on token number", async function() {
        let tokenPrice = await unionProtocolTokenSaleInstance.getTokenPrice(950000001);
        expect(tokenPrice.toString()).to.equal("35000000000000186");
        tokenPrice = await unionProtocolTokenSaleInstance.getTokenPrice(950000002);
        expect(tokenPrice.toString()).to.equal("35000009300000372");
        tokenPrice = await unionProtocolTokenSaleInstance.getTokenPrice(960000001);
        expect(tokenPrice.toString()).to.equal("128000001860000186");
        tokenPrice = await unionProtocolTokenSaleInstance.getTokenPrice(970000001);
        expect(tokenPrice.toString()).to.equal("221000003720000186");
        tokenPrice = await unionProtocolTokenSaleInstance.getTokenPrice(980000001);
        expect(tokenPrice.toString()).to.equal("314000005580000186");
        tokenPrice = await unionProtocolTokenSaleInstance.getTokenPrice(990000001);
        expect(tokenPrice.toString()).to.equal("407000007440000186");
        tokenPrice = await unionProtocolTokenSaleInstance.getTokenPrice(1000000000);
        expect(tokenPrice.toString()).to.equal("500000000000000000");
    })

    it("Should throw an error when token number is out of sale range", async function() {
        await expectRevert(
            unionProtocolTokenSaleInstance.getTokenPrice(950000000),
            "token number is out of sale bounds"
        );
        await expectRevert(
            unionProtocolTokenSaleInstance.getTokenPrice(1000000001),
            "token number is out of sale bounds"
        );
    });

    it("Should properly calculate total buy price for requested number of tokens", async function() {
        let buyPrice = await unionProtocolTokenSaleInstance.getBuyPriceInUSD(10);
        expect(buyPrice.toString()).to.equal("350000418500010230");
    });

    it("Should properly calculate total buy price for requested number of tokens in DAI", async function() {
        // PREREQUISITES
        await unionProtocolTokenSaleInstance.addSupportedToken(
            ethers.utils.formatBytes32String("DAI"),
            daiToken.address,
            18
        );
        // PREQREQUISITES END
        let buyPrice = await unionProtocolTokenSaleInstance.getBuyPriceInUSD( 10 );
        expect(buyPrice.toString()).to.equal("350000418500010230");
    });

    it("Should throw errors when illegal number of tokens are requested to purchase", async function() {
        await expectRevert(
            unionProtocolTokenSaleInstance.getBuyPriceInUSD(0),
            "number of tokens for purchase is below minimum"
        );
        await expectRevert(
            unionProtocolTokenSaleInstance.getBuyPriceInUSD(50000001),
            "number of tokens for purchase is above maximum"
        );
    });

    it("Should return maximum integer UNN Token amount for given USD contribution", async function () {
        const tokenScale = 10 ** 18;

        const contributionInUSD1 = '100000000000000000000';
        const contributionInUSD2 = '29373000000000000000000';
        const contributionInUSD3 = '87000000000000000000000';

        const helperUnnTokenAmount1 = (calculateUSDToUNN(contributionInUSD1, 950000001));
        const helperUnnTokenAmount2 = (calculateUSDToUNN(contributionInUSD2, 950000001));
        const helperUnnTokenAmount3 = (calculateUSDToUNN(contributionInUSD3, 950000001));

        const smartContractTokenAmount1 = (await unionProtocolTokenSaleInstance.getTokenAmountForUSDContribution(contributionInUSD1)).toString();
        const smartContractTokenAmount2 = (await unionProtocolTokenSaleInstance.getTokenAmountForUSDContribution(contributionInUSD2)).toString();
        const smartContractTokenAmount3 = (await unionProtocolTokenSaleInstance.getTokenAmountForUSDContribution(contributionInUSD3)).toString();

        expect(smartContractTokenAmount1.toString()).to.equal(helperUnnTokenAmount1.toString());
        expect(smartContractTokenAmount2.toString()).to.equal(helperUnnTokenAmount2.toString());
        expect(smartContractTokenAmount3.toString()).to.equal(helperUnnTokenAmount3.toString());
    })

    /**
     * TOKEN PURCHASE PROCESS
     */
    it("Should properly buy tokens for DAI stablecoin in public sale", async function() {
        const purchaseUSDAmount = "2000";
        const stablecoin = {
            symbol: ethers.utils.formatBytes32String("DAI"),
            address: daiToken.address,
            decimals: 18
        }

        const numberOfIntegerTokensToPurchase = calculateUSDToUNN(
            tokens(purchaseUSDAmount),
            await unionProtocolTokenSaleInstance.getCurrentTokenNumber()
        );
        const bonusTokenFactor = await unionProtocolTokenSaleInstance.getBonusTokenFactor();
        const bonusTokensAmount = new BN(numberOfIntegerTokensToPurchase.toString()).mul(new BN(bonusTokenFactor.toString())).mul(new BN((10 ** 18).toString()).div(new BN("100")));

        // PREREQUISITES START
        await unionProtocolTokenSaleInstance.performTokenGeneration();
        await unionProtocolTokenSaleInstance.transferTokensToPredefinedAddresses();
        await unionProtocolTokenSaleInstance.addSupportedToken(
            stablecoin.symbol,
            stablecoin.address,
            stablecoin.decimals
        );
        await unionProtocolTokenSaleInstance.startSale();
        await unionProtocolTokenSaleInstance.addToPermittedList(
            publicUser1.address,
            true,
            true,
            1000000
        );
        await unnGovernanceToken.connect(ecosystemPartnersTeamWallet).transfer(
            publicSaleBonusWallet.address,
            tokens("50000000")
        )
        await unnGovernanceToken.connect(publicSaleBonusWallet).approve(
            unionProtocolTokenSaleInstance.address,
            (await unnGovernanceToken.balanceOf(publicSaleBonusWallet.address)).toString()
        )
        // PREREQUISITES END

        let buyingPriceInPermittedStableCoin = (
            await unionProtocolTokenSaleInstance.getBuyPriceInPermittedStablecoin(
                stablecoin.symbol,
                numberOfIntegerTokensToPurchase.toString())
        ).toString()

        await daiToken.connect(publicUser1).approve(unionProtocolTokenSaleInstance.address, buyingPriceInPermittedStableCoin);

         // Purchase
        await unionProtocolTokenSaleInstance.connect(publicUser1).purchaseTokens(
            stablecoin.symbol,
            tokens(purchaseUSDAmount)
        );

        //check if publicUser1 received tokens
        expect(
            (await unnGovernanceToken.balanceOf(publicUser1.address)).toString()
        ).to.equal(tokens(numberOfIntegerTokensToPurchase.toString()));
        // check if locked balance is correct
        expect(
            (await unnGovernanceToken.lockedBalanceOf(publicUser1.address)).toString()
        ).to.equal(bonusTokensAmount.toString());
        // check if DAI correctly transfered to sales contribution wallet
        expect(
            (await daiToken.balanceOf(preCheckContributionWallet.address)).toString()
        ).to.equal(buyingPriceInPermittedStableCoin);

        // ------------------------------ 2ND PURCHASE ------------------------------------------
       const numberOfIntegerTokensToPurchase2 = calculateUSDToUNN(
            tokens(purchaseUSDAmount),
            await unionProtocolTokenSaleInstance.getCurrentTokenNumber()
        );

        const bonusTokensAmount2 = new BN(numberOfIntegerTokensToPurchase2.toString()).mul(new BN(bonusTokenFactor.toString())).mul(new BN((10 ** 18).toString()).div(new BN("100")));

        let buyingPriceInStableCoin2 = (
            await unionProtocolTokenSaleInstance.getBuyPriceInPermittedStablecoin(
                stablecoin.symbol,
                numberOfIntegerTokensToPurchase2.toString())
        ).toString()
       await daiToken.connect(publicUser1).approve(unionProtocolTokenSaleInstance.address, buyingPriceInStableCoin2);
       await unionProtocolTokenSaleInstance.connect(publicUser1).purchaseTokens(
            stablecoin.symbol,
            tokens(purchaseUSDAmount)
        );

        //check if publicUser1 received tokens
        expect(
            (await unnGovernanceToken.balanceOf(publicUser1.address)).toString()
        ).to.equal(tokens((numberOfIntegerTokensToPurchase + numberOfIntegerTokensToPurchase2).toString()));
        // check if locked balance is correct
        expect(
            (await unnGovernanceToken.lockedBalanceOf(publicUser1.address)).toString()
        ).to.equal(bonusTokensAmount.add(bonusTokensAmount2).toString());
        // check if DAI correctly transfered to sales contribution wallet
        expect(
            (await daiToken.balanceOf(preCheckContributionWallet.address)).toString()
        ).to.equal((new BN(buyingPriceInPermittedStableCoin).add(new BN(buyingPriceInStableCoin2))).toString());

        // ------------------------------- 3RD PURCHASE ---------------------------------------------
        const numberOfIntegerTokensToPurchase3 = calculateUSDToUNN(
            tokens(purchaseUSDAmount),
            await unionProtocolTokenSaleInstance.getCurrentTokenNumber()
        );

        const bonusTokensAmount3 = new BN(numberOfIntegerTokensToPurchase3.toString()).mul(new BN(bonusTokenFactor.toString())).mul(new BN((10 ** 18).toString()).div(new BN("100")));

       let buyingPriceInStableCoin3 = (
            await unionProtocolTokenSaleInstance.getBuyPriceInPermittedStablecoin(
                stablecoin.symbol,
                numberOfIntegerTokensToPurchase3.toString())
        ).toString()
       await daiToken.connect(publicUser1).approve(unionProtocolTokenSaleInstance.address, buyingPriceInStableCoin3);
        await unionProtocolTokenSaleInstance.connect(publicUser1).purchaseTokens(
            stablecoin.symbol,
            tokens(purchaseUSDAmount)
        );

        //check if publicUser1 received tokens
        expect(
            (await unnGovernanceToken.balanceOf(publicUser1.address)).toString()
        ).to.equal(tokens(
            (
                numberOfIntegerTokensToPurchase
                + numberOfIntegerTokensToPurchase2
                + numberOfIntegerTokensToPurchase3
            ).toString()
        ));
        // check if locked balance is correct
        expect(
            (await unnGovernanceToken.lockedBalanceOf(publicUser1.address)).toString()
        ).to.equal(bonusTokensAmount.add(bonusTokensAmount2).add(bonusTokensAmount3).toString());
        // check if DAI correctly transfered to sales contribution wallet
        expect(
            (await daiToken.balanceOf(preCheckContributionWallet.address)).toString()
        ).to.equal((
            new BN(buyingPriceInPermittedStableCoin).add(new BN(buyingPriceInStableCoin2)).add(new BN(buyingPriceInStableCoin3))
        ).toString());
    });

    it("Should properly buy tokens for USDT stablecoin in public sale", async function() {
        const purchaseUSDAmount = "2000";
        const stablecoin = {
            symbol: ethers.utils.formatBytes32String("USDT"),
            address: usdtToken.address,
            decimals: 6
        }

        const numberOfTokensToPurchaseInETH = calculateUSDToUNN(
            tokens(purchaseUSDAmount),
            await unionProtocolTokenSaleInstance.getCurrentTokenNumber()
        );
        const bonusTokenFactor = await unionProtocolTokenSaleInstance.getBonusTokenFactor();
        const bonusTokensAmount = new BN(numberOfTokensToPurchaseInETH.toString()).mul(new BN(bonusTokenFactor.toString())).mul(new BN((10 ** 18).toString()).div(new BN("100")));

        // PREREQUISITES START
        await unionProtocolTokenSaleInstance.performTokenGeneration();
        await unionProtocolTokenSaleInstance.transferTokensToPredefinedAddresses();
        await unionProtocolTokenSaleInstance.addSupportedToken(
            stablecoin.symbol,
            stablecoin.address,
            stablecoin.decimals
        );
        await unionProtocolTokenSaleInstance.startSale();
        await unionProtocolTokenSaleInstance.addToPermittedList(
            publicUser1.address,
            true,
            false,
            1000000
        );
        await unnGovernanceToken.connect(ecosystemPartnersTeamWallet).transfer(
            publicSaleBonusWallet.address,
            tokens("50000000")
        )
        await unnGovernanceToken.connect(publicSaleBonusWallet).approve(
            unionProtocolTokenSaleInstance.address,
            (await unnGovernanceToken.balanceOf(publicSaleBonusWallet.address)).toString()
        )
        // PREREQUISITES END

        let buyingPriceInUSD = (
            await unionProtocolTokenSaleInstance.getBuyPriceInUSD(numberOfTokensToPurchaseInETH.toString())
        ).toString();
        let buyingPriceInStableCoin = (
            await unionProtocolTokenSaleInstance.getBuyPriceInPermittedStablecoin(
                stablecoin.symbol,
                numberOfTokensToPurchaseInETH.toString())
        ).toString();

        await usdtToken.connect(publicUser1).approve(unionProtocolTokenSaleInstance.address, buyingPriceInStableCoin);

         // Purchase
        await unionProtocolTokenSaleInstance.connect(publicUser1).purchaseTokens(
            stablecoin.symbol,
            tokens(purchaseUSDAmount)
        );

        //check if publicUser1 received tokens
        expect(
            (await unnGovernanceToken.balanceOf(publicUser1.address)).toString()
        ).to.equal(tokens(numberOfTokensToPurchaseInETH.toString()));
        // check if locked balance is correct
        expect(
            (await unnGovernanceToken.lockedBalanceOf(publicUser1.address)).toString()
        ).to.equal(bonusTokensAmount.toString());
        // check if DAI correctly transfered to sales contribution wallet
        expect(
            (await usdtToken.balanceOf(saleContributionWallet.address)).toString()
        ).to.equal(buyingPriceInStableCoin);

        // ------------------------------ 2ND PURCHASE ------------------------------------------
       const numberOfIntegerTokensToPurchase2 = calculateUSDToUNN(
            tokens(purchaseUSDAmount),
            await unionProtocolTokenSaleInstance.getCurrentTokenNumber()
        );

        const bonusTokensAmount2 = new BN(numberOfIntegerTokensToPurchase2.toString()).mul(new BN(bonusTokenFactor.toString())).mul(new BN((10 ** 18).toString()).div(new BN("100")));

        let buyingPriceInStableCoin2 = (
            await unionProtocolTokenSaleInstance.getBuyPriceInPermittedStablecoin(
                stablecoin.symbol,
                numberOfIntegerTokensToPurchase2.toString()
            )).toString()
       await usdtToken.connect(publicUser1).approve(unionProtocolTokenSaleInstance.address, buyingPriceInStableCoin2);
       await unionProtocolTokenSaleInstance.connect(publicUser1).purchaseTokens(
            stablecoin.symbol,
            tokens(purchaseUSDAmount)
        );

        //check if publicUser1 received tokens
        expect(
            (await unnGovernanceToken.balanceOf(publicUser1.address)).toString()
        ).to.equal(tokens((numberOfTokensToPurchaseInETH + numberOfIntegerTokensToPurchase2).toString()));
        // check if locked balance is correct
        expect(
            (await unnGovernanceToken.lockedBalanceOf(publicUser1.address)).toString()
        ).to.equal(bonusTokensAmount.add(bonusTokensAmount2).toString());
        // check if DAI correctly transfered to sales contribution wallet
        expect(
            (await usdtToken.balanceOf(saleContributionWallet.address)).toString()
        ).to.equal((new BN(buyingPriceInStableCoin).add(new BN(buyingPriceInStableCoin2))).toString());


        // ------------------------------- 3RD PURCHASE ---------------------------------------------
        const numberOfIntegerTokensToPurchase3 = calculateUSDToUNN(
            tokens(purchaseUSDAmount),
            await unionProtocolTokenSaleInstance.getCurrentTokenNumber()
        );

        const bonusTokensAmount3 = new BN(numberOfIntegerTokensToPurchase3.toString()).mul(new BN(bonusTokenFactor.toString())).mul(new BN((10 ** 18).toString()).div(new BN("100")));

       let buyingPriceInStableCoin3 = (
            await unionProtocolTokenSaleInstance.getBuyPriceInPermittedStablecoin(
                stablecoin.symbol,
                numberOfIntegerTokensToPurchase3.toString())
        ).toString()
       await usdtToken.connect(publicUser1).approve(unionProtocolTokenSaleInstance.address, buyingPriceInStableCoin3);
        await unionProtocolTokenSaleInstance.connect(publicUser1).purchaseTokens(
            stablecoin.symbol,
            tokens(purchaseUSDAmount)
        );

        //check if publicUser1 received tokens
        expect(
            (await unnGovernanceToken.balanceOf(publicUser1.address)).toString()
        ).to.equal(tokens(
            (
                numberOfTokensToPurchaseInETH
                + numberOfIntegerTokensToPurchase2
                + numberOfIntegerTokensToPurchase3
            ).toString()
        ));
        // check if locked balance is correct
        expect(
            (await unnGovernanceToken.lockedBalanceOf(publicUser1.address)).toString()
        ).to.equal(bonusTokensAmount.add(bonusTokensAmount2).add(bonusTokensAmount3).toString());
        // check if DAI correctly transfered to sales contribution wallet
        expect(
            (await usdtToken.balanceOf(saleContributionWallet.address)).toString()
        ).to.equal((
            new BN(buyingPriceInStableCoin).add(new BN(buyingPriceInStableCoin2)).add(new BN(buyingPriceInStableCoin3))
        ).toString());
    });
});
