const { ether } = require('@openzeppelin/test-helpers');

const tokens = (x) => {
    return ether(x).toString()
}

const increaseTime = async (x) => {
    await ethers.provider.send('evm_increaseTime', [x])
    await ethers.provider.send("evm_mine")
}

const getTime = async () => {
    const latestBlock = await ethers.provider.getBlock('latest')
    return latestBlock.timestamp
}

const keccak256 = (x) => {
    return ethers.utils.keccak256(x)
}

const toUtf8Bytes = (x) => {
    return ethers.utils.toUtf8Bytes(x)
}

module.exports = {
    tokens,
    increaseTime,
    getTime,
    keccak256,
    toUtf8Bytes
}
