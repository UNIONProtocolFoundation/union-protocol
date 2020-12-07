const path = require('path');
const fs = require('fs');

async function main() {

    const clearConfig = {
        unionGovernanceTokenContract: "",
        unionTokenSaleContract: "",
        voluntaryLockContract: "",
        dateTimeLib: "",
        daiTokenContract: "",
        usdtTokenContract: ""
    }

    fs.writeFileSync(path.join(__dirname, 'config', 'deployConfig.json'), JSON.stringify(clearConfig))
    console.log("Configuration cleared!")

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })