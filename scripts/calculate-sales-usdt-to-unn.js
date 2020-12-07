const { create, all, bignumber } = require('mathjs')
const config = {}
const mathjs = create(all, config)



async function main() {
  const [usdt, current_token] = process.argv.slice(2)
  if (usdt === undefined || current_token === undefined) {
    console.error("Invalid arguments. Use: npm run calculate-sales-usdt-to-unn <usdt> <current_token>");
    process.exit(1);
  }

  const unn = calculateUnn(usdt, current_token)

  console.log("USDT =", usdt.toString())
  console.log("Current token =", current_token.toString())
  console.log("UNN =", unn.toString())
}

const calculateUnn = (usdt, current_token) => {
  return mathjs.round(
    mathjs.evaluate('(sqrt(86490003459600034596 * ' + current_token + '^2 - 163680006819690072651600034596 * ' + current_token + ' + 18600000372 *' + usdt + ' + 77440003355440037984222535460900008649) - 9300000186 * ' + current_token + ' + 8800000190650000093)/9300000186')
  )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });