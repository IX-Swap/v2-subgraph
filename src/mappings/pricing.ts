/* eslint-disable prefer-const */
import { Pair, Token, Bundle } from '../types/schema'
import { BigDecimal, Address, BigInt } from '@graphprotocol/graph-ts/index'
import { ZERO_BD, factoryContract, ADDRESS_ZERO, ONE_BD, UNTRACKED_PAIRS } from './helpers'

const WETH_ADDRESS = '0xd0a1e359811322d97991e03f863a0c30c2cf029c'
const USDC_WETH_PAIR = '0x0000000000000000000000000000000000000000' // created 10008355
const DAI_WETH_PAIR = '0x0000000000000000000000000000000000000000' // created block 10042267
const USDT_WETH_PAIR = '0x0000000000000000000000000000000000000000' // created block 10093341

const IXSC_WETH_PAIR = '0x5749a57A3e63B659C21db01607c268bc8D7D7E47'  // Ixswap Stable Coin      : block: ...
const IXSCD_WETH_PAIR = '0xf60D483d820c063BC9AfcA8558aAfd5b3051A9d9' // Ixswap Stable Coin DAI  : block: ...




export function getEthPriceInUSD(): BigDecimal {
  // fetch eth prices for each stablecoin
  let daiPair = Pair.load(DAI_WETH_PAIR) // dai is token0
  let usdcPair = Pair.load(USDC_WETH_PAIR) // usdc is token0
  let usdtPair = Pair.load(USDT_WETH_PAIR) // usdt is token1
  

  //for kovan
  // delete all this code untill -> scroll down
  //
  let ixscPair = Pair.load(IXSC_WETH_PAIR) // Ixswap Stable Coin & Ixswap Stable Coin DAI
  let ixscdPair = Pair.load(IXSCD_WETH_PAIR) // Ixswap Stable Coin & Ixswap Stable Coin DAI

  if(ixscPair !== null && ixscdPair !== null)
  {
    let totalLiquidityETH = ixscPair.reserve1.plus(ixscdPair.reserve1)
    let ixscWeight = ixscPair.reserve1.div(totalLiquidityETH)
    let ixscdWeight = ixscdPair.reserve1.div(totalLiquidityETH)

    return ixscPair.token0Price.times(ixscWeight).plus(ixscdPair.token0Price.times(ixscdWeight))
  }
  else if (ixscPair !== null) 
  {
    return ixscPair.token0Price
  } 
  else 
  {
    return ZERO_BD
  }
  // delete untill here



  //          Decomment when move to mainnet
  // all 3 have been created
  // if (daiPair !== null && usdcPair !== null && usdtPair !== null)
  // {
  //   let totalLiquidityETH = daiPair.reserve1.plus(usdcPair.reserve1).plus(usdtPair.reserve0)
  //   let daiWeight = daiPair.reserve1.div(totalLiquidityETH)
  //   let usdcWeight = usdcPair.reserve1.div(totalLiquidityETH)
  //   let usdtWeight = usdtPair.reserve0.div(totalLiquidityETH)

  //   //kovan
  //   let ixscWeight = usdcPair.reserve1.div(totalLiquidityETH)
  //   let ixscdWeight = usdtPair.reserve0.div(totalLiquidityETH)


  //   return daiPair.token0Price
  //     .times(daiWeight)
  //     .plus(usdcPair.token0Price.times(usdcWeight))
  //     .plus(usdtPair.token1Price.times(usdtWeight))
  // } 

  /*    Decomment after moving on mainnet       */
  // else if (daiPair !== null && usdcPair !== null) 
  // {
  //   let totalLiquidityETH = daiPair.reserve1.plus(usdcPair.reserve1)
  //   let daiWeight = daiPair.reserve1.div(totalLiquidityETH)
  //   let usdcWeight = usdcPair.reserve1.div(totalLiquidityETH)
  //   return daiPair.token0Price.times(daiWeight).plus(usdcPair.token0Price.times(usdcWeight))
  //   // USDC is the only pair so far
  // } 
  // else if (usdcPair !== null) 
  // {
  //   return usdcPair.token0Price
  // } 
  // else 
  // {
  //   return ZERO_BD
  // }
}

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = [
  '0xd0a1e359811322d97991e03f863a0c30c2cf029c', // WETH
  '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa', // DAI
  '0xdcfab8057d08634279f8201b55d311c2a67897d2', // USDC
  '0xf3e0d7bf58c5d455d31ef1c2d5375904df525105', // USDT
  '0xc6e977741487dd8457397b185709cd89b0cf5e7e', // TUSD
  '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // cDAI
  '0xb6b09fbffba6a5c4631e5f7b2e3ee183ac259c0d', // cUSDC
  // '0xdB33dFD3D61308C33C63209845DaD3e6bfb2c674', // EBASE
  '0x406555dbf02e9e4df9adeaec9da76abeed8c1bc3', // sUSD
  '0xac94ea989f6955c67200dd67f0101e1865a560ea', // MKR
  '0x61460874a7196d6a22d1ee4922473664b3e95270', // COMP
  '0xa36085F69e2889c224210F603D836748e7dC0088', // LINK
  '0xd99aed09a65ee8377a2ffad8ed5407785c530869', // ANT
  '0x22f1ba6dB6ca0A065e1b7EAe6FC22b7E675310EF', // SNX
  '0x28a8cdd5f533aac3053d4e97980a7f1e174db902', // YFI
  '0x48c0628f108a45b12cc63a7b9414c653434ed8b9', // yCurv
  // '0x853d955acef822db058eb8505911ed77f175b99e', // FRAX
  // '0x764a5b7399d552a029d6c8e4a2a71bb5e9c82bd6', // WUST
  '0xa0a5ad2296b38bd3e3eb59aaeaf1589e8d9a29a9', // WBTC
  '0xA1997c88a60dCe7BF92A3644DA21e1FfC8F96dC2', // IXS
  '0xB1519Ffe2761Eb68C11F53eBb550f71C4E04C35F', // ISXgov


  '0xbc55ad5733a1bb050f51bbdfb65ecc7a72aedc20', // Ixswap Stable Coin
  '0x5f3feA7f9C032a80391F3441507a1fDF1b3bA1e8', // Ixswap Stable Coin DAI
]

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
let MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('400000')

// minimum liquidity for price to get tracked
let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('2')

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
