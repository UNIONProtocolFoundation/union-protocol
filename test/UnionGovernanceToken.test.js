const { tokens, getTime, increaseTime, keccak256, toUtf8Bytes } = require('./utils/testHelpers')
const { constants } = require("@openzeppelin/test-helpers")
const expectRevert = require('./utils/expectRevert')
const EthUtil = require("ethereumjs-util")
const { expect, assert } = require("chai")

const _name = "UNION Protocol Governance Token"
const _symbol = "UNN"
const _decimals = 18
const _version = "0.0.1"
const _totalSupply = tokens('100000000000')

/** 
 * Tests
 */
describe("UnionGovernanceToken", () => {
  let unionGovernanceToken, owner, user1, user2, user3, user4

  before(async () => {
    // Load Accounts
    [owner, user1, user2, user3, user4] = await ethers.getSigners();

    // Load Contracts
    const UnionGovernanceToken = await ethers.getContractFactory("UnionGovernanceToken")
    unionGovernanceToken = await UnionGovernanceToken.deploy(owner.address, _totalSupply)
    await unionGovernanceToken.deployed()
  })

  describe("Token attributes", function () {
    it("Has the correct name", async () => {
      let name = await unionGovernanceToken.name()
      assert.equal(name, _name)
    })

    it("Has the correct symbol", async () => {
      let symbol = await unionGovernanceToken.symbol()
      assert.equal(symbol, _symbol)
    })

    it("Has the correct decimal (18)", async () => {
      let decimals = await unionGovernanceToken.decimals()
      assert.equal(decimals, _decimals)
    })

    it("Initial value is 1000000000 tokens", async () => {
      let totalSupply = await unionGovernanceToken.balanceOf(owner.address)
      assert.equal(totalSupply.toString(), _totalSupply)
    })
  })

  describe("Access Control for UNN Token", function () {
    it("Owner is the default admin", async () => {
      let adminRole = await unionGovernanceToken.DEFAULT_ADMIN_ROLE()
      let isAdmin = await unionGovernanceToken.hasRole(adminRole, owner.address)
      assert.ok(isAdmin)
    })

    it("Owner has the ALLOCATOR ROLE", async () => {
      let role = await unionGovernanceToken.ROLE_ALLOCATE()
      let isAdmin = await unionGovernanceToken.hasRole(role, owner.address)
      assert.ok(isAdmin)
    })

    it("Owner has the ROLE_GOVERN", async () => {
      let role = await unionGovernanceToken.ROLE_GOVERN()
      let isAdmin = await unionGovernanceToken.hasRole(role, owner.address)
      assert.ok(isAdmin)
    })

    it("Owner has the ROLE_MINT", async () => {
      let role = await unionGovernanceToken.ROLE_MINT()
      let isAdmin = await unionGovernanceToken.hasRole(role, owner.address)
      assert.ok(isAdmin)
    })

    it("Owner has the ROLE_TEST", async () => {
      let role = await unionGovernanceToken.ROLE_TEST()
      let isAdmin = await unionGovernanceToken.hasRole(role, owner.address)
      assert.ok(isAdmin)
    })
  })

  describe("Functional Testing", function () {
    it("Results must be set to false if status set to false and true if set to true", async function () {
      await unionGovernanceToken.setCanTransfer(true)
      let resTrue = await unionGovernanceToken.getCanTransfer.call()
      assert.ok(resTrue)
      await unionGovernanceToken.setCanTransfer(false)
      let resFalse = await unionGovernanceToken.getCanTransfer.call()
      assert.equal(false, resFalse)
    })

    it("Should return false if transfer status is set to false", async function () {
      await unionGovernanceToken.setCanTransfer(false)
      await unionGovernanceToken.setReversion(true)
      await expectRevert(
        unionGovernanceToken.connect(owner).transfer(constants.ZERO_ADDRESS, tokens('500')),
        "UPGT_ERROR: ERROR ON TRANSFER"
      )
    })

    // it("emits a Transfer event on successful transfers", async function () {
    //     const receipt = await unionGovernanceToken.connect(owner).transfer(user4.address, tokens('500'))
    //     // Event assertions can verify that the arguments are the expected ones
    //     let event1 = receipt.logs[0].event
    //     assert.equal("Transfer", event1)
    // })

    it("Seller's added to the Buyer's balance must be equal to totalSupply", async function () {
      await unionGovernanceToken.connect(owner).transfer(user4.address, tokens('500'))
      let user4Balance = await unionGovernanceToken.balanceOf(user4.address);
      let ownerBalance = await unionGovernanceToken.balanceOf(owner.address);
      assert.equal(
        _totalSupply,
        parseInt(user4Balance.toString()) + parseInt(ownerBalance.toString())
      )
    })

    it("Updates balances on successful transfers", async function () {
      await unionGovernanceToken.connect(owner).transfer(user4.address, tokens('500'))
      assert.equal(
        (await unionGovernanceToken.balanceOf(user4.address)).toString(),
        tokens('1000')
      )
    })

    // it("Must show the Approval Event", async function () {
    //   try {
    //     await unionGovernanceToken.transfer(UserAccount1, _transferAmount, { from: AdminAccount });
    //     let receipt = await unionGovernanceToken.approve.sendTransaction(
    //       UserAccount1,
    //       _transferAmount,
    //       {
    //         from: AdminAccount,
    //       }
    //     );
    //     let event = receipt.logs[0].event;
    //     assert.equal("Approval", event);
    //   } catch (e) {
    //     console.log(e.message);
    //   }
    // })

    it("Buyer must have an allowance of 100", async function () {
      assert.ok(await unionGovernanceToken.connect(owner).transfer(user4.address, tokens('500')))
      await unionGovernanceToken.connect(owner).approve(user4.address, tokens('500'))
      let allowance = await unionGovernanceToken.allowance(owner.address, user4.address)
      assert.equal(allowance.toString(), tokens('500'))
    })

    // it("User4 must have an allowance of 100 thru increaseAllowance", async function () {
    //     let transfer = await unionGovernanceToken.connect(owner).transfer(user4.address, tokens('500'))
    //     assert.ok(transfer)
    //     let receipt = await unionGovernanceToken.increaseAllowance(user4.address, tokens('500'))
    //     let event = receipt.logs[0].event
    //     assert.equal("Approval", event)
    // })

    it("Reverts when Increase allowance was called for Address(0)", async function () {
      let reversion = unionGovernanceToken.getReversion()
      if (reversion) {
        await expectRevert(
          unionGovernanceToken.increaseAllowance(constants.ZERO_ADDRESS, tokens('500')),
          "UPGT_ERROR: INCREASE ALLOWANCE ERROR"
        )
      }
      else {
        let result = await unionGovernanceToken.increaseAllowance(constants.ZERO_ADDRESS, tokens('500'));
        assert.equal(result, false);
      }

    })

    it("Reverts when Increase allowance was called for CONTRACT ADDRESS", async function () {
      let upgt = await unionGovernanceToken.UPGT_CONTRACT_ADDRESS()
      // Conditions that trigger a require statement can be precisely tested
      let isReversion = unionGovernanceToken.getReversion();
      if (isReversion) {
        await expectRevert(
          unionGovernanceToken.increaseAllowance(
            upgt,
            tokens('500')
          ),
          "UPGT_ERROR: INCREASE ALLOWANCE ERROR"
        )
      }
      else {
        let result = await unionGovernanceToken.increaseAllowance(
          upgt,
          tokens('500')
        )
        assert.equal(result, false);
      }
    })

    // it("User4 must have an allowance of 100 after decrease allowance was called", async function () {
    //     await unionGovernanceToken.connect(owner).transfer(user4.address, tokens('500'))
    //     let receipt = await unionGovernanceToken.increaseAllowance(user4.address, tokens('500'))
    //     let event = receipt.logs[0].event;
    //     assert.equal("Approval", event);
    //     let decreasedAllowance = await unionGovernanceToken.decreaseAllowance(UserAccount1, 500);
    //     let decreasedAllowanceEvent = decreasedAllowance.logs[0].event;
    //     assert.equal("Approval", decreasedAllowanceEvent);
    // })

    // it("Perform Transfer From for Authorized Spender", async function () {
    //   try {
    //     await unionGovernanceToken.setCanTransfer(true);
    //     await unionGovernanceToken.setAsAllocator(AdminAccount);
    //     await unionGovernanceToken.setAsAllocator(UserAccount1);
    //     await unionGovernanceToken.setAsAllocator(UserAccount2);
    //     await unionGovernanceToken.setAsAllocator(UserAccount3);
    //     await unionGovernanceToken.transfer(UserAccount1, 300, { from: AdminAccount });
    //     await unionGovernanceToken.approve(UserAccount3, 200, { from: UserAccount1 });
    //     let receipt = await unionGovernanceToken.transferFrom(
    //       UserAccount1,
    //       UserAccount3,
    //       parseInt(50) - 1,
    //       { from: UserAccount1 }
    //     );
    //     let event1 = receipt.logs[0].event;
    //     let event2 = receipt.logs[1].event;
    //     assert.equal("VoteBalanceChanged", event1);
    //     assert.equal("Approval", event2);
    //   } catch (e) {
    //     console.log(e.message);
    //   }
    // })

    it("EXPECT UPGT_ERROR: ERROR ON TRANSFER FROM for unauthorized spender", async function () {
      let reversion = unionGovernanceToken.getReversion();
      if (reversion) {
        await expectRevert(
          unionGovernanceToken.connect(user2).transferFrom(user4.address, user3.address, tokens('500')),
          "UPGT_ERROR: ERROR ON TRANSFER FROM"
        );
      }
      else {
        let result = await unionGovernanceToken.transferFrom(user4.address, user3.address, tokens('500'))
        assert.equal(result, false);
      }
    })

    it("EXPECT UPGT_ERROR: DECREASE ALLOWANCE ERROR when amount is greater than the allowance", async function () {
      await unionGovernanceToken.increaseAllowance(user4.address, tokens('500'))
      await expectRevert(
        unionGovernanceToken.decreaseAllowance(user4.address, _totalSupply),
        "UPGT_ERROR: DECREASE ALLOWANCE ERROR"
      )
    })

    it("Must BURN amount from Owner", async function () {
      await unionGovernanceToken.burn(tokens('500'))
      let totalSupply = await unionGovernanceToken.balanceOf(owner.address)
      assert.equal(totalSupply.toString(), tokens('99999998000'))
    })

    it("Must return a votingDelegate address", async function () {
      let address1 = await unionGovernanceToken.getVotingDelegate(owner.address);
      assert.isOk(address1);
    })

    // it("Expect emit VoteBalanceChanged  when _writeVotingCheckpoint is called  ", async function () {
    //     let receipt = await unionGovernanceToken.writeVotingCheckpoint(owner.address, 10, 10, 1);
    //     let event = receipt.logs[0].event;
    //     assert.equal("VoteBalanceChanged", event);
    // })

    // it("Expect emit VoteBalanceChanged when delegateVote is called  ", async function () {
    //     console.log(UserAccount2)
    //     let receipt = await unionGovernanceToken.delegateVote(UserAccount2);
    //     console.log(receipt)
    //     let event = receipt.logs[0].event;
    //     assert.equal("VoteBalanceChanged", event);
    // });

    // it("Expect emit VoteBalanceChanged when _writeVotingCheckpoint is called  ", async function () {
    //     let receipt = await unionGovernanceToken.moveVotingDelegates(AdminAccount, UserAccount1, 10);
    //     console.log(receipt)
    //     let event = receipt.logs[0].event;
    //     assert.equal("VoteBalanceChanged", event);
    // });

    // it("Expect an UINT when getVoteCountAtBlock is called  ", async function () {
    //   try {
    //     let event = await unionGovernanceToken.getVoteCountAtBlock(AdminAccount, 102);
    //     assert.equal(!isNaN(event.toString()), true)
    //   } catch (e) {
    //     console.log(e.message);
    //   }
    // });

    it("Hash methods MUST RETURN BYTES32 ", async function () {
      let chainId = await unionGovernanceToken.getChainId();
      let id = await unionGovernanceToken.getChainId();
      assert.equal(id.toString(), chainId.toString())

      let domainCur = {
        name: _name,
        version: _version,
        chainId: parseInt(chainId.toString()),
        verifyingContract: owner.address,
        salt: keccak256(toUtf8Bytes(_name))
      }

      assert.ok(await unionGovernanceToken.hashEIP712Domain(domainCur))
      assert.ok(await unionGovernanceToken.hashEIP712Domain(domainCur))
      assert.ok(await unionGovernanceToken.hashEIP712Domain(domainCur))
    })

    // it("recoverSigner MUST RETURN ADDRESS ", async function () {
    //   const privateKey = Buffer.from('43f2ee33c522046e80b67e96ceb84a05b60b9434b0ee2e3ae4b1311b9f5dcc46', 'hex')
    //   const address = (new ethers.Wallet(privateKey)).address

    //   let VD = await unionGovernanceToken.hashDelegate({
    //     owner: owner.address,
    //     delegate: user1.address,
    //     nonce: 1,
    //     expirationTime: 10e9, //new Date().getTime()
    //   })

    //   let messageHash = Buffer.from(ethers.utils.sha256(VD).replace("0x", ""), "hex")
    //   let signature = EthUtil.ecsign(messageHash, privateKey);
    //   let result = (await unionGovernanceToken.recoverSigner(VD.toString('hex'), signature.v, '0x' + signature.r.toString('hex'), '0x' + signature.s.toString('hex')))
    //   assert.equal(result, address)
    // })
  })

  describe("Token transfers and locks", function () {
    it('Should transfer tokens to user1', async () => {
      let result

      // Set canTransfer and revision to true
      await unionGovernanceToken.setCanTransfer(true)
      await unionGovernanceToken.setReversion(true)

      // Check user1 balance before transfer
      result = await unionGovernanceToken.balanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('0'))

      // Send tokens to user1
      await unionGovernanceToken.transfer(user1.address, tokens('5000'))

      // Check user1 balance after transfer
      result = await unionGovernanceToken.balanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('5000'))
    })

    it('Should transfer and lock tokens', async () => {
      let result

      // Check user1 balance before transfer
      result = await unionGovernanceToken.balanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('5000'))

      // Send tokens to user1 and lock them for 5 days
      await unionGovernanceToken.transferAndLock(user1.address, tokens('10000'), (await getTime()) + 5 * 86400, true)

      // Send another tokens to user1 and lock them for 30 days
      await unionGovernanceToken.transferAndLock(user1.address, tokens('20000'), (await getTime()) + 30 * 86400, true)

      // Check user1 balance after transfer
      result = await unionGovernanceToken.balanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('5000'))

      // Check user1 locked balance after transfer
      result = await unionGovernanceToken.lockedBalanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('30000'))
    })

    it('Should fail on spending locked tokens', async () => {
      let result

      // Check user1 balance before transfer
      result = await unionGovernanceToken.balanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('5000'))

      // Fail on sending amount of tokens that include locked tokens
      await expectRevert(
        unionGovernanceToken.connect(user1).transfer(user2.address, tokens('5100')),
        "UPGT_ERROR: ERROR ON TRANSFER"
      )

      // Check user1 balance after transfer
      result = await unionGovernanceToken.balanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('5000'))

      // Check user1 locked balance after transfer
      result = await unionGovernanceToken.lockedBalanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('30000'))
    })

    it('Should transfer released tokens', async () => {
      let result

      // Increase ethereum network time by 5 days
      await increaseTime(5 * 86400)

      // Check user1 balance before transfer
      result = await unionGovernanceToken.balanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('15000'))

      // Send tokens to user2 including released tokens
      await unionGovernanceToken.connect(user1).transfer(user2.address, tokens('5100'))

      // Check user1 balance after transfer
      result = await unionGovernanceToken.balanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('9900'))

      // Check user1 locked balance after transfer
      result = await unionGovernanceToken.lockedBalanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('20000'))

      // Check user2 balance after transfer
      result = await unionGovernanceToken.balanceOf(user2.address)
      expect(result.toString()).to.equal(tokens('5100'))

      // Check user2 locked balance after transfer
      result = await unionGovernanceToken.lockedBalanceOf(user2.address)
      expect(result.toString()).to.equal(tokens('0'))
    })

    it('Should fail on transfer and lock due insufficient rights', async () => {
      let result

      // Fail on transferAndLock
      await expectRevert(
        unionGovernanceToken.connect(user2).transferAndLock(user1.address, tokens('100'), (await getTime()) + 30 * 86400, true),
        "UPGT_ERROR: ERROR ON TRANSFER AND LOCK"
      )

      // Check user1 balance after transfer
      result = await unionGovernanceToken.balanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('9900'))

      // Check user1 locked balance after transfer
      result = await unionGovernanceToken.lockedBalanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('20000'))

      // Check user2 balance after transfer
      result = await unionGovernanceToken.balanceOf(user2.address)
      expect(result.toString()).to.equal(tokens('5100'))

      // Check user2 locked balance after transfer
      result = await unionGovernanceToken.lockedBalanceOf(user2.address)
      expect(result.toString()).to.equal(tokens('0'))
    })

    it('Should fail on transferFrom without approval', async () => {
      let result

      // Fail on transferFrom without approval
      await expectRevert(
        unionGovernanceToken.connect(user3).transferFrom(user1.address, user2.address, tokens('300')),
        "UPGT_ERROR: ERROR ON TRANSFER FROM"
      )

      // Check user1 balance after transferFrom
      result = await unionGovernanceToken.balanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('9900'))

      // Check user2 balance after transferFrom
      result = await unionGovernanceToken.balanceOf(user2.address)
      expect(result.toString()).to.equal(tokens('5100'))
    })

    it('Should transferFrom with approval', async () => {
      let result

      // As an user1 approve user3 to spend 300 tokens
      await unionGovernanceToken.connect(user1).approve(user3.address, tokens('300'))

      // As an user2 transfer 300 tokens from user1 to user2
      await unionGovernanceToken.connect(user3).transferFrom(user1.address, user2.address, tokens('300')),

        // Check user1 balance after transferFrom
        result = await unionGovernanceToken.balanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('9600'))

      // Check user2 balance after transferFrom
      result = await unionGovernanceToken.balanceOf(user2.address)
      expect(result.toString()).to.equal(tokens('5400'))
    })

    it('Should fail on transferFromAndLock without approval', async () => {
      let result
  
      // Fail on transferFromAndLock without approval
      await expectRevert(
        unionGovernanceToken.connect(user2).transferFromAndLock(user1.address, user2.address, tokens('400'), (await getTime()) + 30 * 86400, true),
        "UPGT_ERROR: ERROR ON TRANSFER FROM AND LOCK"
      )
  
      // Check user1 balance after transferFromAndLock
      result = await unionGovernanceToken.balanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('9600'))
  
      // Check user1 locked balance after transferFromAndLock
      result = await unionGovernanceToken.lockedBalanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('20000'))
  
      // Check user2 balance after transferFromAndLock
      result = await unionGovernanceToken.balanceOf(user2.address)
      expect(result.toString()).to.equal(tokens('5400'))
  
      // Check user2 locked balance after transferFromAndLock
      result = await unionGovernanceToken.lockedBalanceOf(user2.address)
      expect(result.toString()).to.equal(tokens('0'))
    })
  
    it('Should transferFromAndLock with approval', async () => {
      let result
  
      // As an user1 approve user2 to spend 400 tokens
      await unionGovernanceToken.connect(user1).increaseAllowance(user2.address, tokens('400'))
    
      // Temporary grant role to lock tokens
      await unionGovernanceToken.grantRole(await unionGovernanceToken.ROLE_LOCK(), user2.address)

      // As an user2 transfer and lock 400 tokens for 30 days from user1 to user2
      await unionGovernanceToken.connect(user2).transferFromAndLock(user1.address, user2.address, tokens('400'), (await getTime()) + 30 * 86400, true)

      // Revoke lock role
      await unionGovernanceToken.revokeRole(await unionGovernanceToken.ROLE_LOCK(), user2.address)
      
      // Check user1 balance after transferFromAndLock
      result = await unionGovernanceToken.balanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('9200'))
  
      // Check user1 locked balance after transferFromAndLock
      result = await unionGovernanceToken.lockedBalanceOf(user1.address)
      expect(result.toString()).to.equal(tokens('20000'))
  
      // Check user2 balance after transferFromAndLock
      result = await unionGovernanceToken.balanceOf(user2.address)
      expect(result.toString()).to.equal(tokens('5400'))
  
      // Check user2 locked balance after transferFromAndLock
      result = await unionGovernanceToken.lockedBalanceOf(user2.address)
      expect(result.toString()).to.equal(tokens('400'))
    })  

    it('Should calculate voting power', async () => {
      let result

      // Check voting power of user1
      result = await unionGovernanceToken.connect(user1).calculateVotingPower()
      expect(result.toString()).to.equal(tokens('29200'))

      // Check voting power of user2
      result = await unionGovernanceToken.connect(user2).calculateVotingPower()
      expect(result.toString()).to.equal(tokens('5800'))
    })

    it('Should calculate voting power after delegation', async () => {
      let result

      // User1 delegates his voting power to user2
      await unionGovernanceToken.connect(user1).delegateVote(user2.address)

      // Check voting power of user1
      result = await unionGovernanceToken.connect(user1).calculateVotingPower()
      expect(result.toString()).to.equal(tokens('29200'))

      // Check voting power of user2
      result = await unionGovernanceToken.connect(user2).calculateVotingPower()
      expect(result.toString()).to.equal(tokens('35000'))

      // Send locked non-votable tokens to user2
      await unionGovernanceToken.transferAndLock(user3.address, tokens('100'), (await getTime()) + 5 * 86400, false)

      // Send locked votable tokens to user3
      await unionGovernanceToken.transferAndLock(user3.address, tokens('200'), (await getTime()) + 5 * 86400, true)

      // Send locked non-votable tokens to user3
      await unionGovernanceToken.transferAndLock(user3.address, tokens('400'), (await getTime()) + 5 * 86400, false)

      // User3 delegates his voting power to user2
      await unionGovernanceToken.connect(user3).delegateVote(user2.address)

      // Check voting power of user2
      result = await unionGovernanceToken.connect(user2).calculateVotingPower()
      expect(result.toString()).to.equal(tokens('35200'))

      // Check voting power of user3
      result = await unionGovernanceToken.connect(user3).calculateVotingPower()
      expect(result.toString()).to.equal(tokens('200'))
    })

    it('Should calculate voting power after reverting delegation', async () => {
      let result

      // User1 reverts voting delegation
      await unionGovernanceToken.connect(user1).delegateVote(user1.address)

      // Check voting power of user1
      result = await unionGovernanceToken.connect(user1).calculateVotingPower()
      expect(result.toString()).to.equal(tokens('29200'))

      // Check voting power of user2
      result = await unionGovernanceToken.connect(user2).calculateVotingPower()
      expect(result.toString()).to.equal(tokens('6000'))

      // User3 reverts voting delegation
      await unionGovernanceToken.connect(user3).delegateVote(user3.address)

      // Check voting power of user3
      result = await unionGovernanceToken.connect(user3).calculateVotingPower()
      expect(result.toString()).to.equal(tokens('200'))

      // Check voting power of user2
      result = await unionGovernanceToken.connect(user2).calculateVotingPower()
      expect(result.toString()).to.equal(tokens('5800'))
    })
  })

})
