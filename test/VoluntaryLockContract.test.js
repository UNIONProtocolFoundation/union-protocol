const { tokens, increaseTime, keccak256 } = require('./utils/testHelpers')
const { expect } = require("chai");

/** 
 * Tests
 */
describe("VoluntaryLockContract", () => {
  let unnToken, interestWallet, voluntaryLockContract, owner, user1

  before(async () => {
    // Load Accounts
    [owner, interestWallet, user1] = await ethers.getSigners();

    // Load Contracts
    const UnnToken = await ethers.getContractFactory("UnionGovernanceToken")
    unnToken = await UnnToken.deploy(owner.address, tokens('100000000000'))
    await unnToken.deployed()
    await unnToken.setCanTransfer(true)
    await unnToken.setReversion(true)

    const VoluntaryLockContract = await ethers.getContractFactory("VoluntaryLockContract")
    voluntaryLockContract = await VoluntaryLockContract.deploy(unnToken.address, interestWallet.address)
    await voluntaryLockContract.deployed()

    // Grant locking rights for VoluntaryLockContract
    await unnToken.grantRole(await unnToken.ROLE_LOCK(), voluntaryLockContract.address)

    // Send tokens to VoluntaryLockContract
    await unnToken.transfer(interestWallet.address, tokens('100000'))

    // Approve voluntaryLockContract to use interestWallet funds
    await unnToken.connect(interestWallet).approve(voluntaryLockContract.address, tokens('100000'))

    // Send tokens to investor
    await unnToken.transfer(user1.address, tokens('5000'))
  })

  it("Should return VoluntaryLockContract name", async () => {
    expect(await voluntaryLockContract.name()).to.equal("Voluntary Lock Contract")
  })

  it('Should calculate interest', async () => {
    let result

    result = await voluntaryLockContract.calculateReward(tokens('1000'), 30)
    expect(result.toString()).to.equal(tokens('1018.509786993510131521'))

    result = await voluntaryLockContract.calculateReward(tokens('1000'), 60)
    expect(result.toString()).to.equal(tokens('1044.071916100000983707'))

    result = await voluntaryLockContract.calculateReward(tokens('1000'), 120)
    expect(result.toString()).to.equal(tokens('1116.971504814458145183'))

    result = await voluntaryLockContract.calculateReward(tokens('1000.000000000000000001'), 120)
    expect(result.toString()).to.equal(tokens('1116.971504814458145185'))

    result = await voluntaryLockContract.calculateReward(tokens('0.000000000000000001'), 30)
    expect(result.toString()).to.equal(tokens('0.000000000000000001'))

    result = await voluntaryLockContract.calculateReward(tokens('100000000000'), 120)
    expect(result.toString()).to.equal(tokens('111697150481.445814518399053782'))

    result = await voluntaryLockContract.calculateReward(tokens('1000'), 12)
    expect(result.toString()).to.equal(tokens('0'))
  })

  it('Should lock investor tokens increased by interest', async () => {
    let result

    // Check VoluntaryLockContract balance before locking
    result = await unnToken.balanceOf(interestWallet.address)
    expect(result.toString()).to.equal(tokens('100000'))

    // Check investor balance before locking
    result = await unnToken.balanceOf(user1.address)
    expect(result.toString()).to.equal(tokens('5000'))

    // Lock 1000 UNN tokens
    await unnToken.connect(user1).approve(voluntaryLockContract.address, tokens('1000'))
    await voluntaryLockContract.connect(user1).lockTokens(tokens('1000'), 30)

    // Check VoluntaryLockContract balance after locking
    result = await unnToken.balanceOf(interestWallet.address)
    expect(result.toString()).to.equal(tokens('99981.490213006489868479'))

    // Check investor balance after locking
    result = await unnToken.balanceOf(user1.address)
    expect(result.toString()).to.equal(tokens('4000'))

    // Check investor locked balance after locking
    result = await unnToken.lockedBalanceOf(user1.address)
    expect(result.toString()).to.equal(tokens('1018.509786993510131521'))

    // Increase ethereum network time by 30 days
    await increaseTime(30 * 86400)

    // Check investor balance after release time
    result = await unnToken.balanceOf(user1.address)
    expect(result.toString()).to.equal(tokens('5018.509786993510131521'))

    // Check investor locked balance after release time
    result = await unnToken.lockedBalanceOf(user1.address)
    expect(result.toString()).to.equal(tokens('0'))
  })

})
