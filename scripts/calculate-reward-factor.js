const { create, all, bignumber } = require('mathjs')
const config = {}
const mathjs = create(all, config)


const COMPOUND_FREQUENCY = bignumber(365)

async function main() {
  const [apy, period, amount] = process.argv.slice(2)
  if(apy === undefined || period === undefined){
    console.error("Invalid arguments. Use: npm run calculate-reward-factor <apy> <period> <amount?>");
    process.exit(1);
  }

  const apr = calculateApr(apy)
  const factor = calculateFactor(apr, period)

  console.log("APR =", apr.toString())
  console.log("Factor =", factor.toString())

  if(amount !== undefined){
    console.log("Tokens =", mathjs.multiply(factor, bignumber(amount)))
  }
}

const calculateApr = (apy) => {
    return mathjs.multiply(
        mathjs.subtract(
            mathjs.pow(
                mathjs.add(
                    bignumber(apy), 
                    bignumber(1)
                ),
                mathjs.divide(bignumber(1), COMPOUND_FREQUENCY)
            ),
            bignumber(1)
        ),
        bignumber(COMPOUND_FREQUENCY)
    )
}

const calculateFactor = (apr, period) => {
    return mathjs.pow(
        mathjs.add(
            bignumber(1),
            mathjs.divide(
                bignumber(apr),
                bignumber(COMPOUND_FREQUENCY)
            )
        ),
        bignumber(period)
    )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });