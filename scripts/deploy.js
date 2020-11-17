const { tokens } = require('./../test//utils/testHelpers')

async function main() {
    // Get accounts
    const [owner] = await ethers.getSigners();

    // Load Contracts
    const UnnToken = await ethers.getContractFactory("UnionGovernanceToken")
    unnToken = await UnnToken.deploy(owner.address, tokens('100000000000'))
    await unnToken.deployed()
    await unnToken.setCanTransfer(true)
    await unnToken.setReversion(true)

    const VoluntaryLockContract = await ethers.getContractFactory("VoluntaryLockContract")
    voluntaryLockContract = await VoluntaryLockContract.deploy(unnToken.address)
    await voluntaryLockContract.deployed()

    // Grant locking rights for VoluntaryLockContract
    await unnToken.grantRole(await unnToken.ROLE_LOCK(), voluntaryLockContract.address)
    
    console.log("UnionGovernanceToken deployed to:", unnToken.address);
    console.log("VoluntaryLockContract deployed to:", voluntaryLockContract.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });