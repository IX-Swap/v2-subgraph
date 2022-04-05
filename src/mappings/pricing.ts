/* eslint-disable prefer-const */
import { Pair, Token, Bundle } from '../types/schema'
import { BigDecimal, Address } from '@graphprotocol/graph-ts/index'
import { ZERO_BD, ONE_BD } from './helpers'

const WIXS_ADDRESS = Address.fromString("0x1BA17C639BdaeCd8DC4AAc37df062d17ee43a1b8").toHex()
const USDC_WIXS_PAIR = Address.fromString("0xD093A031df30F186976A1e2936B16d95ca7919D6").toHex() // created 10008355


export function getEthPriceInUSD(): BigDecimal {
  //For now we will only use USDC_WETH pair for ETH prices
  let usdcPair = Pair.load(USDC_WIXS_PAIR);
  if (usdcPair !== null) {
    return usdcPair.token1Price
  }
  else {
    return ZERO_BD
  }
}

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = [
  Address.fromString("0x1BA17C639BdaeCd8DC4AAc37df062d17ee43a1b8").toHex(),
  Address.fromString("0x7ceb23fd6bc0add59e62ac25578270cff1b9f619").toHex(),
  Address.fromString("0x2791bca1f2de4661ed88a30c99a7a9449aa84174").toHex(),
  Address.fromString("0xe09910d2DA99Bad626f3747E0621Df7C4aEE1465").toHex(),
  Address.fromString("0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270").toHex(),
  Address.fromString("0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6").toHex(), //WBTC
  Address.fromString("0x8f3cf7ad23cd3cadbd9735aff958023239c6a063").toHex(), // DAI
  Address.fromString("0xc2132d05d31c914a87c6611c10748aeb04b58e8f").toHex(), // USDT
  Address.fromString("0x9719d867a500ef117cc201206b8ab51e794d3f82").toHex(), //MAUSDC
  Address.fromString("0x104592a158490a9228070e0a8e5343b499e125d0").toHex(), //FRAX
  Address.fromString("0x033d942a6b495c4071083f4cde1f17e986fe856c").toHex(), //AGA
  Address.fromString("0xd6df932a45c0f255f85145f286ea0b292b21c90b").toHex() //AAVE
]

export function isOnWhitelist(token: string): boolean {
  for(var i = 0; i < WHITELIST.length; i++) {
    if(token == WHITELIST[i]) return true
  }
  return false
}

// minimum liquidity for price to get tracked
let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('1')

/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
export function findEthPerToken(token: Token): BigDecimal {
  if (token.id == WIXS_ADDRESS) {
    return ONE_BD
  }

  // loop through whitelist and check if paired with any
  let whitelist = token.whitelist
  for (let i = 0; i < whitelist.length; ++i) {
      let pairAddress = whitelist[i]
      let pair = Pair.load(pairAddress)
      if (pair.token0 == token.id && pair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
        let token1 = Token.load(pair.token1)
        return pair.token1Price.times(token1.derivedETH as BigDecimal) // return token1 per our token * Eth per token 1
      }
      if (pair.token1 == token.id && pair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
        let token0 = Token.load(pair.token0)
        return pair.token0Price.times(token0.derivedETH as BigDecimal) // return token0 per our token * ETH per token 0
      }
  }
  return ZERO_BD // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export function getTrackedVolumeUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token,
  bundle: Bundle
): BigDecimal {
  let price0 = token0.derivedETH.times(bundle.ethPrice)
  let price1 = token1.derivedETH.times(bundle.ethPrice)

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0
      .times(price0)
      .plus(tokenAmount1.times(price1))
      .div(BigDecimal.fromString('2'))
  }

  // take full value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0)
  }

  // take full value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1)
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedLiquidityUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token,
  bundle: Bundle
): BigDecimal {
  let price0 = token0.derivedETH.times(bundle.ethPrice)
  let price1 = token1.derivedETH.times(bundle.ethPrice)

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).plus(tokenAmount1.times(price1))
  }

  // take double value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).times(BigDecimal.fromString('2'))
  }

  // take double value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1).times(BigDecimal.fromString('2'))
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD
}
