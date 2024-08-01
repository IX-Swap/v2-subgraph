/* eslint-disable prefer-const */
import { Pair, Token, Bundle } from '../types/schema'
import { BigDecimal, Address, BigInt } from '@graphprotocol/graph-ts/index'
import { ZERO_BD, factoryContract, ADDRESS_ZERO, ONE_BD, UNTRACKED_PAIRS } from './helpers'

let WETH_ADDRESS = Address.fromString('0x4200000000000000000000000000000000000006').toHex()

const _iusdcPair = '0x88A43bbDF9D098eEC7bCEda4e2494615dfD9bB9C' // Uniswap V2 WETH_USDC pair

const _idaiPair = '0x67b00B46FA4f4F24c03855c5C8013C0B938B3eEc' // Aedrome V2 WETH_DAI pair

export function getEthPriceInUSD(): BigDecimal {
  let idaiPair = Pair.load(_idaiPair) // Ixswap Stable Coin & Ixswap Stable Coin DAI
  let iusdcPair = Pair.load(_iusdcPair) // Ixswap Stable Coin & Ixswap Stable Coin DAI

  if (iusdcPair !== null && idaiPair !== null) {
    let totalLiquidityETH = iusdcPair.reserve1.plus(idaiPair.reserve1)
    let iusdcWeight = iusdcPair.reserve1.div(totalLiquidityETH)
    let idaiWeight = idaiPair.reserve1.div(totalLiquidityETH)

    return iusdcPair.token0Price
      .times(iusdcWeight)
      .plus(idaiPair.token0Price.times(idaiWeight))
      .times(BigDecimal.fromString('1'))
  } else if (idaiPair !== null) {
    return idaiPair.token0Price
  }
  if (iusdcPair !== null) {
    return iusdcPair.token0Price
  } else {
    return ZERO_BD
  }
}

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = [
  '0x4200000000000000000000000000000000000006', //WMATIC
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' // DAI

  // '0x1BA17C639BdaeCd8DC4AAc37df062d17ee43a1b8', // IXS
  // '0xe09910d2DA99Bad626f3747E0621Df7C4aEE1465', // ISXgov

  // '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', // WETH
  // '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6', //WBTC
  // '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // USDT
  // '0x9719d867a500ef117cc201206b8ab51e794d3f82', //MAUSDC
  // '0x104592a158490a9228070e0a8e5343b499e125d0', //FRAX
  // '0x033d942a6b495c4071083f4cde1f17e986fe856c', //AGA
  // '0xd6df932a45c0f255f85145f286ea0b292b21c90b', //AAVE
  // '0xa7051c5a22d963b81d71c2ba64d46a877fbc1821', //EROWAN
  // '0xfe4546fefe124f30788c4cc1bb9aa6907a7987f9' //cxETH
]

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
//let MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('400000')
let MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('0')

// minimum liquidity for price to get tracked
// let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('2')
let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('0')

/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
export function findEthPerToken(token: Token): BigDecimal {
  if (token.id == WETH_ADDRESS) {
    return ONE_BD
  }

  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    let pairAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(WHITELIST[i]))
    if (pairAddress.toHexString() != ADDRESS_ZERO) {
      let pair = Pair.load(pairAddress.toHexString())

      if (pair.token0 == token.id && pair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
        let token1 = Token.load(pair.token1)
        return pair.token1Price.times(token1.derivedETH as BigDecimal) // return token1 per our token * Eth per token 1
      }
      if (pair.token1 == token.id && pair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
        let token0 = Token.load(pair.token0)
        return pair.token0Price.times(token0.derivedETH as BigDecimal) // return token0 per our token * ETH per token 0
      }
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
  pair: Pair
): BigDecimal {
  let bundle = Bundle.load('1')
  let price0 = token0.derivedETH.times(bundle.ethPrice)
  let price1 = token1.derivedETH.times(bundle.ethPrice)

  // dont count tracked volume on these pairs - usually rebass tokens
  if (UNTRACKED_PAIRS.includes(pair.id)) {
    return ZERO_BD
  }

  // if less than 5 LPs, require high minimum reserve amount amount or return 0
  if (pair.liquidityProviderCount.lt(BigInt.fromI32(5))) {
    let reserve0USD = pair.reserve0.times(price0)
    let reserve1USD = pair.reserve1.times(price1)
    if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
      if (reserve0USD.plus(reserve1USD).lt(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
        return ZERO_BD
      }
    }
    if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
      if (reserve0USD.times(BigDecimal.fromString('2')).lt(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
        return ZERO_BD
      }
    }
    if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
      if (reserve1USD.times(BigDecimal.fromString('2')).lt(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
        return ZERO_BD
      }
    }
  }

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
  token1: Token
): BigDecimal {
  let bundle = Bundle.load('1')
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
