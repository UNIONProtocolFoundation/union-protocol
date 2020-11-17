// Copyright (c) 2020 The UNION Protocol Foundation
// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

library UnnEIP712Lib {
        
    /**
    * @notice Struct for EIP712 Domain
    * @member name
    * @member version
    * @member chainId
    * @member verifyingContract
    * @member salt
    */
    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
        bytes32 salt;
    }

    /**
    * @notice Struct for EIP712 VotingDelegate call
    * @member owner
    * @member delegate
    * @member nonce
    * @member expirationTime
    */
    struct VotingDelegate {
        address owner;
        address delegate;
        uint256 nonce;
        uint256 expirationTime;
    }

    /**
    * @notice Struct for EIP712 Permit call
    * @member owner
    * @member spender
    * @member value
    * @member nonce
    * @member expirationTime
    */
    struct Permit {
        address owner;
        address spender;
        uint256 value;
        uint256 nonce;
        uint256 expirationTime;
    }

    address private constant BURN_ADDRESS = address(0);

    bytes32 public constant EIP712DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)"
    );
    bytes32 public constant DELEGATE_TYPEHASH = keccak256(
        "DelegateVote(address owner,address delegate,uint256 nonce,uint256 expirationTime)"
    );
    bytes32 public constant PERMIT_TYPEHASH = keccak256(
        "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 expirationTime)"
    );

    /**
    * @dev Private hash EIP712Domain struct for EIP-712
    * @param _eip712Domain EIP712Domain struct
    * @return bytes32 hash of _eip712Domain
    */
    function _hash(EIP712Domain memory _eip712Domain) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                EIP712DOMAIN_TYPEHASH,
                keccak256(bytes(_eip712Domain.name)),
                keccak256(bytes(_eip712Domain.version)),
                _eip712Domain.chainId,
                _eip712Domain.verifyingContract,
                _eip712Domain.salt
            )
        );
    }

    /**
    * @dev Private hash Delegate struct for EIP-712
    * @param _delegate VotingDelegate struct
    * @return bytes32 hash of _delegate
    */
    function _hash(VotingDelegate memory _delegate) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                DELEGATE_TYPEHASH,
                _delegate.owner,
                _delegate.delegate,
                _delegate.nonce,
                _delegate.expirationTime
            )
        );
    }

    /** 
    * @dev Private hash Permit struct for EIP-712
    * @param _permit Permit struct
    * @return bytes32 hash of _permit
    */
    function _hash(Permit memory _permit) internal pure returns (bytes32) {
        return keccak256(abi.encode(
        PERMIT_TYPEHASH,
        _permit.owner,
        _permit.spender,
        _permit.value,
        _permit.nonce,
        _permit.expirationTime
        ));
    }

    /**
    * @dev Recover signer information from provided digest
    * @param _digest signed, hashed message
    * @param _ecv ECDSA v parameter
    * @param _ecr ECDSA r parameter
    * @param _ecs ECDSA s parameter
    * @return address of the validated signer
    * based on openzeppelin/contracts/cryptography/ECDSA.sol recover() function
    */
    function _recoverSigner(bytes32 _digest, uint8 _ecv, bytes32 _ecr, bytes32 _ecs) internal pure returns (address) {
        // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
        // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
        // the valid range for s in (281): 0 < s < secp256k1n ÷ 2 + 1, and for v in (282): v ∈ {27, 28}. Most
        // signatures from current libraries generate a unique signature with an s-value in the lower half order.
        //
        // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
        // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
        // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
        // these malleable signatures as well.
        if(uint256(_ecs) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            revert("ECDSA: invalid signature 's' value");
        }

        if(_ecv != 27 && _ecv != 28) {
            revert("ECDSA: invalid signature 'v' value");
        }

        // If the signature is valid (and not malleable), return the signer address
        address signer = ecrecover(_digest, _ecv, _ecr, _ecs);
        require(signer != BURN_ADDRESS, "ECDSA: invalid signature");

        return signer;
    }
}