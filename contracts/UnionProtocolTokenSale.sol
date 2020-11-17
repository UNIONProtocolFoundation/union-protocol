// Copyright (c) 2020 The UNION Protocol Foundation
// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "hardhat/console.sol";

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Context } from "@openzeppelin/contracts/GSN/Context.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { UnionGovernanceToken } from "./UnionGovernanceToken.sol";
import { DateTime } from "./util/DateTime.sol";

/**
 * @title UNION Protocol Token Sale Contract
 */
contract UnionProtocolTokenSale is Context, AccessControl {
  
  using Address for address;
  using SafeMath for uint256;

  UnionGovernanceToken public unnGovernanceToken;

  bytes32 public constant ROLE_ADMIN = DEFAULT_ADMIN_ROLE; // default admin role from AccessControl
  bytes32 public constant ROLE_GOVERN = keccak256("ROLE_GOVERN");
  bytes32 public constant ROLE_MINT = keccak256("ROLE_MINT");

  address private constant BURN_ADDRESS = address(0);
  address public UPTO_CONTRACT_ADDRESS;

  address private a_owner;

  //contract wallet addresses
  address private a_seedRoundAddress;
  address private a_privateRound1Address;
  address private a_privateRound2Address;
  address private a_publicSaleAddress;
  address private a_publicSaleBonusAddress;
  address private a_ecosystemPartnersTeamAddress;
  address private a_miningIncentivesPoolAddress;
  address private a_marketLiquidityPoolAddress;
  address private a_supplyReservePoolAddress;

  
  bool private b_saleStarted = false;
  bool private b_tokenGenerationPerformed = false;
  uint256 private uint256_tokenSupplyScale = 10**18;
  mapping(address => PermittedAccount) m_permittedAccounts;
  mapping(address => uint256) private m_saleWalletBalances;
  address private a_precheckContributionWallet;
  address private a_saleContributionWallet;
  uint256 private uint256_currentTokenNumber = 950000001;
  uint256 private uint256_publicSaleFirstTokenNumber = 950000001;
  uint256 private uint256_publicSaleLastTokenNumber = 1000000000;
  uint256 private uint256_minNumberOfTokensToBePurchasedInETH = 1;
  uint256 private uint256_maxNumberOfTokensToBePurchasedInETH = 50000000;

  //token sale lock parameters
  uint256 private uint256_bonusTokenFactor = 20;
  uint256 private uint256_bonusTokenLockPeriodInMonths = 12;

  /**
   * @notice Struct for permitted account
   * @member permittedAddress
   * @member isApproved
   * @member isPrecheck
   * @member amount
   */
  struct PermittedAccount {
    address permittedAddress;
    bool isApproved;
    bool isPrecheck;
    uint256 amount;
  }

  /**
   * @notice Struct for tracing token transfer transactions
   * @member transactionTimestamp
   * @member tokenRecipient
   * @member tokenReceived
   * @member tokenAmountReceived
   * @member amountUNNSent
   * @member success
   */
  struct TokenTransferRecord {
    uint256 transactionTimestamp;
    address tokenRecipient;
    bytes32 tokenReceived;
    uint256 tokenAmountReceived;
    uint256 amountUNNSent;
    uint256 amountBonusUNNSent;
    bool success;
  }

  /**
   * @dev mapping from a transaction id to initiating senders
   */
  mapping(address => uint[]) public m_transactionIndexesToSender;

  /**
   * @dev a list of all successful/unsuccessful token transfers
   */
  TokenTransferRecord[] public l_tokenTransactions;

  /**
   * @dev mapping of supported tokens for receipt
   */
  mapping(bytes32 => address) public m_supportedTokens;


  /**
 * @dev constructor
 * @param _unnGovernanceToken Union Governance Token address
 * @param _precheckContributionWallet wallet for funds received from participants who have been prechecked
 * @param _saleContributionWallet wallet for funds received from participants who KYC during sale
 */
  constructor(
    UnionGovernanceToken _unnGovernanceToken,
    address _precheckContributionWallet,
    address _saleContributionWallet,
    address _seedWallet,
    address _privateSale1Wallet,
    address _privateSale2Wallet,
    address _publicSaleWallet,
    address _publicSaleBonusWallet,
    address _ecosystemPartnersTeamWallet,
    address _miningIncentivesWallet,
    address _marketLiquidityWallet,
    address _supplyReservePoolWallet
  ) public {
    UPTO_CONTRACT_ADDRESS = address(this);
    a_owner = _msgSender();
    _setupRole(ROLE_ADMIN, _msgSender());
    unnGovernanceToken = _unnGovernanceToken;
    // wallets setup
    a_precheckContributionWallet = _precheckContributionWallet;
    a_saleContributionWallet = _saleContributionWallet;
    a_seedRoundAddress = _seedWallet;
    a_privateRound1Address = _privateSale1Wallet;
    a_privateRound2Address = _privateSale2Wallet;
    a_publicSaleAddress = _publicSaleWallet;
    a_publicSaleBonusAddress = _publicSaleBonusWallet;
    a_ecosystemPartnersTeamAddress = _ecosystemPartnersTeamWallet;
    a_miningIncentivesPoolAddress = _miningIncentivesWallet;
    a_marketLiquidityPoolAddress = _marketLiquidityWallet;
    a_supplyReservePoolAddress = _supplyReservePoolWallet;

    emit UnionProtocolTokenSaleContractInstalled(true);
  }


  /**
   * @dev add token to list of supported tokens
   * @param _tokenSymbol symbol of token supported as identifier in mapping
   * @param _tokenAddress address of token supported as value in mapping
   */
  function addSupportedToken(bytes32 _tokenSymbol, address _tokenAddress) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    require(_tokenAddress != BURN_ADDRESS);

    m_supportedTokens[_tokenSymbol] = _tokenAddress; 
  }

  /**
   * @dev remove token from list of supported tokens
   * @param _tokenSymbol symbol of token being removed
   */
  function removeSupportedToken(bytes32 _tokenSymbol) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    delete(m_supportedTokens[_tokenSymbol]);
  }

  
  /**
   * @dev get the address for a supported, given token symbol
   * @param _tokenSymbol symbol of token address being queried
   */
  function getSupportedTokenAddress(bytes32 _tokenSymbol) public view returns (address) {
    return m_supportedTokens[_tokenSymbol];
  }

  /**
  * @dev set the bonus token percentage
  * @param _newFactor new percentage value of tokens bought for bonus token amount
  */
  function setBonusTokenFactor(uint256 _newFactor) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    require(_newFactor >= 1 && _newFactor <= 500, "UPTS_ERROR: illegal bonus token factor value");

    uint256_bonusTokenFactor = _newFactor;
    emit BonusTokenFactorChanged(_newFactor);
  }

  /**
  * @dev returns the bonus token factor
  */
  function getBonusTokenFactor() public view returns (uint256) {
    return uint256_bonusTokenFactor;
  }

  /**
  * @dev sets the bonus token lock period
  * @param _newPeriod new period to be set in months
  */
  function setBonusTokenLockPeriod(uint256 _newPeriod) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    require(_newPeriod >= 1 && _newPeriod <= 60, "UPTS_ERROR: illegal lock period value");

    uint256_bonusTokenLockPeriodInMonths = _newPeriod;
    emit BonusTokenLockPeriodChanged(_newPeriod);
  }

  function getBonusTokenLockPeriod() public view returns (uint256) {
    return uint256_bonusTokenLockPeriodInMonths;
  }

  /**
   * @dev Add a user wallet to the permitted list to allow for purchasing
   * @param _address address being added to the permitted participant list
   * @param _isApproved whether address has been approved
   * @param _isPrecheck whether address was part of earlier KYC independent of sale period
   * @param _amount amount for which the user has been approved
   */
  function addToPermittedList(address _address, bool _isApproved, bool _isPrecheck, uint256 _amount) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    require(_address != BURN_ADDRESS);
    PermittedAccount storage account = m_permittedAccounts[_address];
    account.permittedAddress = _address;
    account.isApproved = _isApproved;
    account.isPrecheck = _isPrecheck;
    account.amount = _amount;

    emit UnionProtocolTokenSaleNewAccountPermittedListModification(_address, _isApproved, _isPrecheck, _amount);
  }

  /**
  *
  */
  function _calculateBonusTokenAmount(uint256 _tokenAmount) private view returns (uint256) {
    return _tokenAmount.mul(uint256_tokenSupplyScale).mul(uint256_bonusTokenFactor).div(100);
  }


  /**
   * @dev Check whether address is approved for purchase
   * @param _address Address being checked for approval
   * @return bool whether address is approved for purchase
   */
  function getAddressPermittedApprovalStatus(address _address) public view returns (bool) {
   return m_permittedAccounts[_address].isApproved;
}

  /**
  * @dev Check whether address is prechecked before proper KYC
  * @param _address Address being checked
  * @return bool whether address was prechecked
  */
  function getAddressPermittedPrecheck(address _address) public view returns (bool) {
    return m_permittedAccounts[_address].isPrecheck;
  }

  /**
   * @dev Provides remaining allowance for a permitted address -- addresses that are not permitted return 0
   * @param _address Address being verified for remaining balance at approved kyc, addresses that have not been approved will have amounts of 0.
   */
  function getAddressRemainingPermittedAmount(address _address) public view returns (uint256) {
    return m_permittedAccounts[_address].amount;
  }


  /**
   * @dev removes account from permitted accounts map
   * @param _address address being removed from permitted account map
   */
  function removeFromPermittedList(address _address) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    require(_address != BURN_ADDRESS);
    require(m_permittedAccounts[_address].permittedAddress != BURN_ADDRESS);

    delete(m_permittedAccounts[_address]);
  }

  /**
  * @dev configure wallet preallocation
  */
  function performTokenGeneration() public {
    require(hasRole(ROLE_ADMIN, _msgSender()));
    require(
      a_seedRoundAddress != BURN_ADDRESS &&
      a_privateRound1Address != BURN_ADDRESS &&
      a_privateRound2Address != BURN_ADDRESS &&
      a_publicSaleAddress != BURN_ADDRESS &&
      a_ecosystemPartnersTeamAddress != BURN_ADDRESS &&
      a_miningIncentivesPoolAddress != BURN_ADDRESS &&
      a_marketLiquidityPoolAddress != BURN_ADDRESS &&
      a_supplyReservePoolAddress != BURN_ADDRESS
    );
    require(!isTokenGenerationPerformed());

    m_saleWalletBalances[a_ecosystemPartnersTeamAddress] = 100000000 * uint256_tokenSupplyScale; // * uint256_tokenSupplyScale;
    m_saleWalletBalances[a_miningIncentivesPoolAddress] =  150000000 * uint256_tokenSupplyScale; // * uint256_tokenSupplyScale;
    m_saleWalletBalances[a_marketLiquidityPoolAddress] =   100000000 * uint256_tokenSupplyScale; // * uint256_tokenSupplyScale;
    m_saleWalletBalances[a_supplyReservePoolAddress] =     250000000 * uint256_tokenSupplyScale; // * uint256_tokenSupplyScale;
    m_saleWalletBalances[a_seedRoundAddress] =     100000000 * uint256_tokenSupplyScale; // * uint256_tokenSupplyScale;
    m_saleWalletBalances[a_privateRound1Address] = 200000000 * uint256_tokenSupplyScale; // * uint256_tokenSupplyScale;
    m_saleWalletBalances[a_privateRound2Address] = 50000000 * uint256_tokenSupplyScale; // * uint256_tokenSupplyScale;
    m_saleWalletBalances[a_publicSaleAddress] =    50000000 * uint256_tokenSupplyScale; // * uint256_tokenSupplyScale;

    uint256 initialSupply = 
      m_saleWalletBalances[a_ecosystemPartnersTeamAddress] +
      m_saleWalletBalances[a_miningIncentivesPoolAddress]  +
      m_saleWalletBalances[a_marketLiquidityPoolAddress]   +
      m_saleWalletBalances[a_supplyReservePoolAddress]     +
      m_saleWalletBalances[a_seedRoundAddress]             +
      m_saleWalletBalances[a_privateRound1Address]         +
      m_saleWalletBalances[a_privateRound2Address]         +
      m_saleWalletBalances[a_publicSaleAddress];

    require(initialSupply == 1000000000 * 10 ** 18);

    b_tokenGenerationPerformed = true;
    emit UnionProtocolTokenSaleTokenGenerationComplete(true);
  }

  function isTokenGenerationPerformed() public view returns (bool) {
    return b_tokenGenerationPerformed;
  }


  /**
   * @dev Transfers tokens to predefined addresses
   */
  function transferTokensToPredefinedAddresses() public {
    require(hasRole(ROLE_ADMIN, _msgSender()));
    require(isTokenGenerationPerformed(), "UPTS_ERROR: token generation has not been performed");

    unnGovernanceToken.transferFrom(
      a_owner,
      a_seedRoundAddress,
      m_saleWalletBalances[a_seedRoundAddress]
    );
    emit TokenTransferSuccess(address(this), a_seedRoundAddress, m_saleWalletBalances[a_seedRoundAddress]);

    unnGovernanceToken.transferFrom(
      a_owner,
      a_publicSaleAddress,
      m_saleWalletBalances[a_publicSaleAddress]
    );

    unnGovernanceToken.transferFrom(
      a_owner,
      a_privateRound1Address,
      m_saleWalletBalances[a_privateRound1Address]
    );
    emit TokenTransferSuccess(address(this), a_privateRound1Address, m_saleWalletBalances[a_privateRound1Address]);

    unnGovernanceToken.transferFrom(
      a_owner,
      a_privateRound2Address,
      m_saleWalletBalances[a_privateRound2Address]
    );
    emit TokenTransferSuccess(address(this), a_privateRound2Address, m_saleWalletBalances[a_privateRound2Address]);

    unnGovernanceToken.transferFrom(
      a_owner,
      a_supplyReservePoolAddress,
      m_saleWalletBalances[a_supplyReservePoolAddress]
    );
    emit TokenTransferSuccess(address(this), a_supplyReservePoolAddress, m_saleWalletBalances[a_supplyReservePoolAddress]);

    unnGovernanceToken.transferFrom(
      a_owner,
      a_miningIncentivesPoolAddress,
      m_saleWalletBalances[a_miningIncentivesPoolAddress]
    );
    emit TokenTransferSuccess(address(this), a_miningIncentivesPoolAddress, m_saleWalletBalances[a_miningIncentivesPoolAddress]);

    unnGovernanceToken.transferFrom(
      a_owner,
      a_marketLiquidityPoolAddress,
      m_saleWalletBalances[a_marketLiquidityPoolAddress]
    );
    emit TokenTransferSuccess(address(this), a_marketLiquidityPoolAddress, m_saleWalletBalances[a_marketLiquidityPoolAddress]);

    unnGovernanceToken.transferFrom(
      a_owner,
      a_ecosystemPartnersTeamAddress,
      m_saleWalletBalances[a_ecosystemPartnersTeamAddress]
    );
    emit TokenTransferSuccess(address(this), a_ecosystemPartnersTeamAddress, m_saleWalletBalances[a_ecosystemPartnersTeamAddress]);
  }

  /**
   * @dev Called by contract owner to start token sale
   */
  function startSale() public {
    require(hasRole(ROLE_ADMIN, _msgSender()));
    require(isTokenGenerationPerformed(), "UPTS_ERROR: token generation was not performed");
    require(!isSaleStarted(), "UPTS_ERROR: the sale has already started");

    b_saleStarted = true;
    emit UnionProtocolTokenSaleStarted(true);
  }

  /**
   * @dev Called by contract owner to end or suspend token sale
   */
  function endSale() public {
    require(hasRole(ROLE_ADMIN, _msgSender()));
    require(isTokenGenerationPerformed(), "UPTS_ERROR: token generation was not performed");
    require(isSaleStarted(), "UPTS_ERROR: the sale hasn't started yet");

    b_saleStarted = false;
    emit UnionProtocolTokenSaleStarted(false);
  }

  /**
  * @dev Returns the sale status
  */
  function isSaleStarted() public view returns (bool) {
    return b_saleStarted;
  }

  /**
   * @dev Retrieves the number of the next token available for purchase
   */
  function getCurrentTokenNumber() public view returns (uint256) {
    return uint256_currentTokenNumber;
  }
  
  /**
   * @dev Sets seed round wallet address
   * @param _address Address of seed round token wallet
   */
  function setSeedRoundAddress(address _address) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    require(_address != BURN_ADDRESS);
    a_seedRoundAddress = _address;
  }

  /**
  * @dev returns the seed round wallet address
  */
  function getSeedRoundAddress()  public view returns (address){
    return a_seedRoundAddress;
  }
      

  /**
   * @dev Sets private round 1 wallet address
   * @param _address Address of private round 1 token wallet
   */
  function setPrivateRound1Address(address _address) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    require(_address != BURN_ADDRESS);
    a_privateRound1Address = _address;
  }

  /**
  * @dev returns the private round 1 wallet address
  */
  function getPrivateRound1Address()  public view returns (address){
    return a_privateRound1Address;
  }


  /**
   * @dev Sets private round 2 wallet address
   * @param _address Address of private round 2 token wallet
   */
  function setPrivateRound2Address(address _address) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    require(_address != BURN_ADDRESS);
    a_privateRound2Address = _address;
  }

  /**
  * @dev returns the private round 2 wallet address
  */
  function getPrivateRound2Address()  public view returns (address){
    return a_privateRound2Address;
  }


  /**
   * @dev Sets public sale wallet address
   * @param _address Address of public sale token wallet
   */
  function setPublicSaleAddress(address _address) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    require(_address != BURN_ADDRESS);
    a_publicSaleAddress = _address;
  }

  /**
  * @dev returns the public sale wallet address
  */
  function getPublicSaleAddress()  public view returns (address){
    return a_publicSaleAddress;
  }


  /**
   * @dev Sets ecosystem, partners, and team wallet address
   * @param _address Address of ecosystem, partners, and team token wallet
   */
  function setEcosystemPartnersTeamAddress(address _address) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    require(_address != BURN_ADDRESS);
    a_ecosystemPartnersTeamAddress = _address;
  }

  /**
  * @dev returns the ecosystem, partners and team wallet address
  */
  function getEcosystemPartnersTeamAddress()  public view returns (address){
    return a_ecosystemPartnersTeamAddress;
  }

      
  /**
   * @dev Sets mining incentives pool wallet address
   * @param _address Address of mining incentives pool token wallet
   */
  function setMiningIncentivesPoolAddress(address _address) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    require(_address != BURN_ADDRESS);
    a_miningIncentivesPoolAddress = _address;
  }

  /**
  * @dev returns the mining incentives pool wallet address
  */
  function getMiningIncentivesPoolAddress()  public view returns (address){
    return a_miningIncentivesPoolAddress;
  }


  /**
   * @dev Sets market liquidity pool wallet address
   * @param _address Address of market liquidity pool token wallet
   */
  function setMarketLiquidityPoolAddress(address _address) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    require(_address != BURN_ADDRESS);
    a_marketLiquidityPoolAddress = _address;
  }

  /**
  * @dev returns the market liquidity pool wallet address
  */
  function getMarketLiquidityPoolAddress()  public view returns (address){
    return a_marketLiquidityPoolAddress;
  }


  /**
   * @dev Sets supply reserve pool wallet address
   * @param _address Address of supply reserve pool token wallet
   */
  function setSupplyReservePoolAddress(address _address) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    require(_address != BURN_ADDRESS);
    a_supplyReservePoolAddress = _address;
  }

  /**
  * @dev returns the supply reserve pool wallet address
  */
  function getSupplyReservePoolAddress()  public view returns (address){
    return a_supplyReservePoolAddress;
  }

  /**
  * @dev sets the minimum value of tokens to be purchased in public sale
  */
  function setMinimumTokenPurchaseAmount(uint256 _amount) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    require(_amount > 0, "UPTS_ERROR: token amount too small");
    require(_amount <= uint256_maxNumberOfTokensToBePurchasedInETH, "UPTS_ERROR: token amount cannot exceed maximum token number");
    uint256_minNumberOfTokensToBePurchasedInETH = _amount;
  }

  /**
  * @dev sets the maximum value of tokens to be purchased in public sale
  */
  function setMaximumTokenPurchaseAmount(uint256 _amount) public {
    require(
      hasRole(ROLE_ADMIN, _msgSender())
      || hasRole(ROLE_GOVERN, _msgSender())
    );
    require(_amount >= uint256_minNumberOfTokensToBePurchasedInETH);
    uint256_minNumberOfTokensToBePurchasedInETH = _amount;
  }


  /**
   * @dev calculate the price for a specific token number which is a linear function of the token number
   * @param _number number (in ETH not Wei) of the token for which the price is being calculated
   * @return token price for specifed token number
   */
  function getTokenPrice(uint256 _number) public pure returns (uint256) {
    require(_number >= 950000001 && _number <= 1000000000, "UPTS_ERROR: token number is out of sale bounds");
    uint256 slope = 9300000186;
    uint256 intercept = 8800000186000000000;
    return slope.mul(_number).sub(intercept);
  }


  /**
   * @dev calculate the price for a specific quantity of tokens
   * @param _amountInEth number of tokens for which the price is being calculated
   * @return price for specifed number of tokens
   */
  function getBuyPriceInTether(uint256 _amountInEth) public view returns (uint256) {
    require(
      _amountInEth >= uint256_minNumberOfTokensToBePurchasedInETH,
      "UPTS_ERROR: number of tokens for purchase is below minimum"
    );
    require(
      _amountInEth <= uint256_maxNumberOfTokensToBePurchasedInETH,
      "UPTS_ERROR: number of tokens for purchase is above maximum"
    );
    require(
      (uint256_currentTokenNumber + _amountInEth) <= uint256_publicSaleLastTokenNumber,
      "UPTS_ERROR: number of tokens to buy exceeds the sale pool"
    );

    uint256 lastTokenPrice = getTokenPrice(_amountInEth.add(uint256_currentTokenNumber).sub(1));
    uint256 firstTokenPrice = getTokenPrice(uint256_currentTokenNumber);
    // calculate the sum of arithmetic sequence
    return(firstTokenPrice.add(lastTokenPrice)).mul(_amountInEth).div(2);
  }

  /**
  * @dev returns the interface for the tether token required for payments
  */
  function getERC20Token(address _address) internal pure returns (IERC20) {
    return IERC20(_address);
  }


  /**
   * @dev public mechanism for buying tokens from smart contract. It needs the purchaser to previously approve his
   * ERC20 token amount in which he wishes to do payment.
   * Payments in tokens are not currently supported (Look EIP-1958)
   */
function purchaseTokens(bytes32 _contributedTokenSymbol, uint256 _numberOfTokensInEth) public {
    require(isSaleStarted(), "UPTS_ERROR: sale has not started yet");
    require(getAddressPermittedApprovalStatus(_msgSender()), "UPTS_ERROR: user not authorised for purchase");
    require(
      m_permittedAccounts[_msgSender()].amount >= _numberOfTokensInEth,
        "UPTS_ERROR: insufficient number of tokens approved for purchase"
    );

    address tokenAddress = getSupportedTokenAddress(_contributedTokenSymbol);
    require(
      tokenAddress != BURN_ADDRESS,
      "UPTS_ERROR: tether token with the given symbol is not allowed for making payments"
    );

    // COLLECTING PAYMENT
    IERC20 tetherToken = getERC20Token(tokenAddress);
    uint256 buyPriceInTether = getBuyPriceInTether(_numberOfTokensInEth);
    bool paymentCollected = _collectPaymentInTetherToken(_msgSender(), tetherToken, buyPriceInTether);
    if (!paymentCollected) {
      revert("error with tether payment");
    }

    // TRANSFER
    bool tokenTransferSuccess = _transferTokens(_msgSender(), _numberOfTokensInEth);
    if (!tokenTransferSuccess) {
      revert("error with token transfer");
    }
    m_permittedAccounts[_msgSender()].amount = m_permittedAccounts[_msgSender()].amount.sub(_numberOfTokensInEth);

    // BONUS TOKEN TRANSFER
    uint256 lockedTokenAmount = _calculateBonusTokenAmount(_numberOfTokensInEth);
    bool bonusTokenTransferSuccess = _transferLockedTokens(_msgSender(), lockedTokenAmount);
    if (!bonusTokenTransferSuccess) {
      revert("error with bonus token transfer");
    }

    bool success = false;
    if(paymentCollected && tokenTransferSuccess && bonusTokenTransferSuccess) {
      success = true;
    }

    TokenTransferRecord memory record;
    record.transactionTimestamp = now;
    record.tokenRecipient = _msgSender();
    record.tokenReceived = _contributedTokenSymbol;
    record.tokenAmountReceived = buyPriceInTether;
    record.amountUNNSent = _numberOfTokensInEth.mul(uint256_tokenSupplyScale);
    record.amountBonusUNNSent = lockedTokenAmount;
    record.success = success;

    l_tokenTransactions.push(record);

    emit TokensPurchased(_msgSender(), _numberOfTokensInEth);
  }

  /**
  * @dev calls a TransferFrom method from the given tether token on the payer
  * @param _payer payer address
  * @param _tetherToken ERC20 instance of payment tether
  * @param _amount payment amount
  */
  function _collectPaymentInTetherToken(address _payer, IERC20 _tetherToken, uint256 _amount) private returns (bool){
    require(
      _tetherToken.allowance(_payer, UPTO_CONTRACT_ADDRESS) >= _amount,
      "UPTS_ERROR: insuficient funds allowed for contract to perform purchase"
    );
    require(
      unnGovernanceToken.allowance(a_publicSaleAddress, UPTO_CONTRACT_ADDRESS) >= _amount,
      "UPTS_ERROR: public sale wallet owner has not allowed requested UNN Token amount"
    );

    address incomingPaymentWallet;
    if (getAddressPermittedPrecheck(_payer)) {
      incomingPaymentWallet = a_precheckContributionWallet;
    } else {
      incomingPaymentWallet = a_saleContributionWallet;
    }
    return _tetherToken.transferFrom(_payer, incomingPaymentWallet, _amount);
  }

  /**
   * @dev handles the transfer of tokens to intended recipients-- requires that the sales contract is assumed to have
   * approval from the sender for designated amounts.  Uses transferFrom on ERC20 interface to send tokens to recipient
   */
 function _transferTokens(
     address _recipient,
     uint256 _amountInEth
 ) private returns (bool) {
    bool success = unnGovernanceToken.transferFrom(
      a_publicSaleAddress,
      _recipient,
      _amountInEth.mul(uint256_tokenSupplyScale)
    );
    uint256_currentTokenNumber = uint256_currentTokenNumber.add(_amountInEth);

    emit TokenTransferSuccess(a_publicSaleAddress, _recipient, _amountInEth.mul(uint256_tokenSupplyScale));
    return success;
  }

  /**
  * @dev handles the transfer of bonus tokens to intended recipients
  */
  function _transferLockedTokens(
    address _recipient,
    uint256 _amount
  ) private returns (bool) {
    require(
      unnGovernanceToken.allowance(a_publicSaleBonusAddress, UPTO_CONTRACT_ADDRESS) >= _amount,
      "UPTS_ERROR: public sale bonus tokens wallet owner has not allowed requested UNN Token amount"
    );
    uint256 releaseTime = _calculateReleaseTime();

    bool success = unnGovernanceToken.transferFromAndLock(
      a_publicSaleBonusAddress,
      _recipient,
      _amount,
      releaseTime,
      false
    );
    emit TokenTransferSuccess(a_publicSaleBonusAddress, _recipient, _amount);
    return success;
  }

  /**
  * @dev calculates the token release time timestamp based on current timestamp and lock period
  */
  function _calculateReleaseTime() private view returns (uint256) {
    uint256 timestamp = block.timestamp;
    uint16 year = DateTime.getYear(timestamp);
    uint8 month = DateTime.getMonth(timestamp);
    uint8 day = DateTime.getDay(timestamp);
    uint8 hour = DateTime.getHour(timestamp);
    uint8 minute = DateTime.getMinute(timestamp);
    uint8 second = DateTime.getSecond(timestamp);

    uint8 newPrecalculatedMonth = uint8(uint256(month).add(uint256_bonusTokenLockPeriodInMonths));
    uint16 yearAddition = uint16(uint256(newPrecalculatedMonth).div(12));
    uint16 newYear = year + yearAddition;
    uint8 newMonth = uint8(uint256(newPrecalculatedMonth).mod(12));
    uint8 daysInMonth = DateTime.getDaysInMonth(newMonth, newYear);
    if ( daysInMonth < day) {
      day = 1;
      newMonth = newMonth + 1;
    }
    uint256 lockTimestamp = DateTime.toTimestamp(newYear, newMonth, day, hour, minute, second);

    return lockTimestamp;
  }

  /**
   * @dev Called by contract owner to destroy the token sale contract and revert generated tokens to contract
   *   owner.  The sale must be stopped or paused prior to being killed.
   */
  function performContractKill() public {
    require(hasRole(ROLE_ADMIN, _msgSender()));
    require(!isSaleStarted());
    selfdestruct(_msgSender());
    emit UnionProtocolTokenSaleContractInstalled(false);
  }

  //Transfer-Related Events
  /**
   * @dev event emited when tokens are purchased
   */
  event TokensPurchased(address indexed _from, uint256 _amount);


  /**
   * @dev Event to notify of successful token transfer to recipients
   */
  event TokenTransferSuccess(address indexed _from, address indexed _to, uint256 _amount);

  /**
   * @dev Event to notify of failed token transfer to recipients
   */
  event TokenTransferFailed(address indexed _from, address indexed _to, uint256 _amount);

  /**
   * @dev Announces installation and deinstallation of the sale contract
   */
  event UnionProtocolTokenSaleContractInstalled(bool _installed);

  /**
   * @dev Announces token generation event completed
   */
  event UnionProtocolTokenSaleTokenGenerationComplete(bool _isComplete);

  /**
   * @dev Announces start/end of token sale
   */
  event UnionProtocolTokenSaleStarted(bool _status);

  /**
   * @dev Emits event when bonus token factor is changed
   */
  event BonusTokenFactorChanged(uint256 _tokenFactor);

  /**
   * @dev Emits event when bonus token lock period is changed
   */
  event BonusTokenLockPeriodChanged(uint256 _lockPeriod);

  /**
   * @dev Announces when a new account is added to permitted list of accounts for token sale
   */
  event UnionProtocolTokenSaleNewAccountPermittedListModification(address indexed _address, bool _isApproved, bool _isPrecheck, uint256 _amount);
}
