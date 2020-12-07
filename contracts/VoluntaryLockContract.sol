// Copyright (c) 2020 The UNION Protocol Foundation
// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "hardhat/console.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./UnionGovernanceToken.sol";

contract VoluntaryLockContract  {
    using SafeMath for uint;

    string public name = "Voluntary Lock Contract";
    address public immutable owner;
    address private immutable interestWallet;
    UnionGovernanceToken public immutable unnToken;

    mapping(uint => uint) private periodValues;

    event VoluntaryLock(
        address issuerAddress,
        uint investedAmount,
        uint interest,
        uint lockPeriod,
        uint releaseTime
    );

    constructor(UnionGovernanceToken _unnToken, address _interestWallet) public {
        unnToken = _unnToken;
        owner = msg.sender;
        interestWallet = _interestWallet;

        // Set allowed period values and reward multiply factor (32 decimal places)
        periodValues[30] = uint(101850978699351013152164648236338);
        periodValues[60] = uint(104407191610000098370724501908360);
        periodValues[120] = uint(111697150481445814518399053782668);
    }

    function isCorrectLockPeriod(uint _lockPeriod) private view returns (bool){
        return periodValues[_lockPeriod] > 0;
    }

    function calculateReleaseTime(uint _lockTime, uint _lockPeriod) private pure returns (uint){
        return _lockTime.add((_lockPeriod.mul(1 days)));
    }

    function calculateReward(uint _amount, uint _lockPeriod) public view returns(uint){
        return _amount.mul(periodValues[_lockPeriod]).div(10**32);
    }

    function lockTokens(uint _amount, uint _lockPeriod) public {
        // Require amount to be greater than 1UNN
        require(_amount >= 1000000000000000000, "amount too small");

        // Require correct lock period value
        require(isCorrectLockPeriod(_lockPeriod) == true, "incorrect lock period");

        // Calculate interest 
        uint interest = calculateReward(_amount, _lockPeriod).sub(_amount);

        // Require amount to be smaller than interestWallet balance
        require(interest <= unnToken.balanceOf(interestWallet), "amount too big");

        // Calculate release time
        uint releaseTime = calculateReleaseTime(block.timestamp, _lockPeriod);

        // Trasnfer UNN tokens to this contract for staking
        unnToken.transferFrom(msg.sender, address(this), _amount);
        unnToken.transferAndLock(msg.sender, _amount, releaseTime, true);
        unnToken.transferFromAndLock(interestWallet, msg.sender, interest, releaseTime, false);

    
        // Emit event VoluntaryLock
        emit VoluntaryLock(msg.sender, _amount, interest, _lockPeriod, releaseTime);
    }
}