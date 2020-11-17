# Union Finance contracts

## Installation
```bash
npm i
```

## Usage

Compile contracts
```bash
npx hardhat compile
```

Test contracts
```bash
npx hardhat test
```

Deploy contracts
```bash
npx hardhat run --network <network> scripts/deploy.js
```

Preconfigured networks are: `hardhat`, `ganache`.
Additional networks configuration takes place in `hardhat.config.js`.

## Calculate APR and multiplier factor
```
npm run calculate-reward-factor <apy> <period> <amount?>
```
- apy - percentage value of APY (for example 0.4 which equals 40%)
- period - period in days (for example 30)
- amount - optional argument to calculate reward for given amount of tokens (for example 1000)