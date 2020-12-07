const { ether } = require('@openzeppelin/test-helpers');
const { create, all } = require('mathjs')
const config = {}
const mathjs = create(all, config)

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

const calculateUSDToUNN = (usdt, current_token) => {
    return mathjs.floor(
        mathjs.evaluate('(sqrt(86490003459600034596 * ' + current_token + '^2 - 163680006819690072651600034596 * ' + current_token + ' + 18600000372 *' + usdt + ' + 77440003355440037984222535460900008649) - 9300000186 * ' + current_token + ' + 8800000190650000093)/9300000186')
    )
}

module.exports = {
    tokens,
    increaseTime,
    getTime,
    keccak256,
    toUtf8Bytes,
    calculateUSDToUNN
}
