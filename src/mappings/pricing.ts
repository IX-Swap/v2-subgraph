/* eslint-disable prefer-const */
import { Pair, Token, Bundle } from '../types/schema'
import { BigDecimal, Address } from '@graphprotocol/graph-ts/index'
import { ZERO_BD, ONE_BD } from './helpers'

const WIXS_ADDRESS = Address.fromString("0xd0a1e359811322d97991e03f863a0c30c2cf029c").toHex()
const _iusdcPair = Address.fromString("0x9381de79c513d2196bca1f4b31a0f53357b19a7c").toHex()
const _idaiPair = Address.fromString("0x6fB49E7D93570cB01e60f6613a876C5A8D8c538F").toHex()


export function getEthPriceInUSD(): BigDecimal {
  let idaiPair = Pair.load(_idaiPair)   // Ixswap Stable Coin & Ixswap Stable Coin DAI
  let iusdcPair = Pair.load(_iusdcPair) // Ixswap Stable Coin & Ixswap Stable Coin DAI


  if(iusdcPair !== null && idaiPair !== null)
  {
    let totalLiquidityETH = iusdcPair.reserve1.plus(idaiPair.reserve1)
    let iusdcWeight = iusdcPair.reserve1.div(totalLiquidityETH)
    let idaiWeight = idaiPair.reserve1.div(totalLiquidityETH)

    return iusdcPair.token0Price.times(iusdcWeight).plus(idaiPair.token0Price.times(idaiWeight)).times(BigDecimal.fromString('1'))
  }
  else if(idaiPair !== null)
  {
    return idaiPair.token0Price
  }
   if(iusdcPair !== null)
  {
    return iusdcPair.token0Price
  }
  else
  {
    return ZERO_BD
  }
}

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = [
  Address.fromString("0xd0a1e359811322d97991e03f863a0c30c2cf029c").toHex(), // WETH
  Address.fromString("0x992A460e0ef16b94118a98ADEE14C72e6A9aA34F").toHex(), // Ixswap Stable Coin DAI
  Address.fromString("0xFfF7880d81D2E2ec676209E75BBCF35D1974168a").toHex(), // Ixswap Stable Coin
  Address.fromString("0x296275783B369ce3DAc1F4bF7aA5165Aa0dFC6d8").toHex(), // USDT
  Address.fromString("0xA1997c88a60dCe7BF92A3644DA21e1FfC8F96dC2").toHex(), // IXS
  Address.fromString("0xB1519Ffe2761Eb68C11F53eBb550f71C4E04C35F").toHex() // ISXgov
]

export function isOnWhitelist(token: string): boolean {
  for(var i = 0; i < WHITELIST.length; i++) {
    if(token == WHITELIST[i]) return true
  }
  return false
}

// minimum liquidity for price to get tracked
let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('0.3')

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
