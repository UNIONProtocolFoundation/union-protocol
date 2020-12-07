```bash
npx hardhat run --network ganache scripts/deploy/clearConfig.js
npx hardhat run --network ganache scripts/deploy/check.js

npx hardhat run --network ganache scripts/deploy/deployRealMockTokens.js.js            // call this one only on test network
npx hardhat run --network ganache scripts/deploy/loadPublicTokens.js            // call this one only on public main network

npx hardhat run --network ganache scripts/deploy/deployGovernance.js
npx hardhat run --network ganache scripts/deploy/deploySale.js
npx hardhat run --network ganache scripts/deploy/deployVoluntaryLock.js

npx hardhat run --network ganache scripts/deploy/grantRoles.js
npx hardhat run --network ganache scripts/deploy/loadApprovedUsers.js

npx hardhat run --network ganache scripts/deploy/performTokenGeneration.js
npx hardhat run --network ganache scripts/deploy/startSale.js
``` 