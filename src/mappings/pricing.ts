/* eslint-disable prefer-const */
import { Pair, Token, Bundle } from '../types/schema'
import { BigDecimal, Address, BigInt } from '@graphprotocol/graph-ts/index'
import { ZERO_BD, factoryContract, ADDRESS_ZERO, ONE_BD, UNTRACKED_PAIRS } from './helpers'

//const WETH_ADDRESS   = "0xd0a1e359811322d97991e03f863a0c30c2cf029c"
const USDC_WETH_PAIR = '0x0000000000000000000000000000000000000000'; // created 10008355
const DAI_WETH_PAIR  = '0x0000000000000000000000000000000000000000'; // created block 10042267
const USDT_WETH_PAIR = '0x0000000000000000000000000000000000000000'; // created block 10093341

const IUSDC_WETH_PAIR = "0x5749a57A3e63B659C21db01607c268bc8D7D7E47";    // Ixswap Stable Coin      : block: ...
const IDAI_WETH_PAIR  = "0xf60D483d820c063BC9AfcA8558aAfd5b3051A9d9";    // Ixswap Stable Coin DAI  : block: ...

const WETH_ADDRESS = Address.fromString("0xd0a1e359811322d97991e03f863a0c30c2cf029c").toHex()

const _iusdcPair = factoryContract.getPair
                (Address.fromString('0xd0a1e359811322d97991e03f863a0c30c2cf029c'), // weth
                Address.fromString('0xb10c4ec295225688461ddbc6d30e8291e9934464'))  // iusdc

const _idaiPair = factoryContract.getPair
                (Address.fromString('0xd0a1e359811322d97991e03f863a0c30c2cf029c'), // weth
                Address.fromString('0x8234ff99e7c1bfc45f076af399fd89e034e710dc'))  // idai


export function getEthPriceInUSD(): BigDecimal {
  // fetch eth prices for each stablecoin
  // main
  let daiPair = Pair.load(DAI_WETH_PAIR) // dai is token0
  let usdcPair = Pair.load(USDC_WETH_PAIR) // usdc is token0
  let usdtPair = Pair.load(USDT_WETH_PAIR) // usdt is token1
  

  //for kovan
  // delete all this code untill -> scroll down
  //
  // let iusdcPair = Pair.load(IUSDC_WETH_PAIR) // Ixswap Stable Coin & Ixswap Stable Coin DAI
  // let idaiPair = Pair.load(IDAI_WETH_PAIR) // Ixswap Stable Coin & Ixswap Stable Coin DAI
  

  let idaiPair = Pair.load(_idaiPair.toHex())   // Ixswap Stable Coin & Ixswap Stable Coin DAI
  let iusdcPair = Pair.load(_iusdcPair.toHex()) // Ixswap Stable Coin & Ixswap Stable Coin DAI


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
  '0x8234ff99e7c1bfc45f076af399fd89e034e710dc', // Ixswap Stable Coin DAI
  '0xb10c4ec295225688461ddbc6d30e8291e9934464', // Ixswap Stable Coin
  
  '0x7B137484B6c38d6f2151FB1f4B3c054A3E042d71', // DAI
  '0x0E965311aE3d4b1aaf702C71B19D179F197D1404', // USDC
  '0x9eacD4317B9623cb43b6afBe121E2A9a2426AA2b', // USDT
  '0x57Eb96F9D37F8884430756bE17ad7f02b565a670', // MKR
  '0x2929D544839C7C659763cED98693e25BB4Cb69EB', // COMP
  '0x4dD76BbE53d6C840dCFfCaD92FEDdF0248a5da7e', // LINK
  '0x469e887C7B6Fc067a7cb2ECC1e22bA3512329B7B', // ANT
  '0xC1E8E716825E5684c22221ef1E72B1a8A120863E', // SNX
  '0x586e068592f6e5897abE70a283C5cf2E6F87946F', // YFI
  '0x55b3EfB1Fe8a1919d77f2e6B8EED3766077f0442', // WBTC
  
  '0x53621205AE3a3e8d5C00510194eCd391C5Cf1CD5', // IXS
  '0x7Eef728796a042dE61dbbE0426EC0d305dF0d49e', // ISXgov
  
  
  // '0x48c0628f108a45b12cc63a7b9414c653434ed8b9', // yCurv
  // '0x406555dbf02e9e4df9adeaec9da76abeed8c1bc3', // sUSD
  // '0xb6b09fbffba6a5c4631e5f7b2e3ee183ac259c0d', // cUSDC
  // '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // cDAI
  // '0xc6e977741487dd8457397b185709cd89b0cf5e7e', // TUSD
  // '0xdB33dFD3D61308C33C63209845DaD3e6bfb2c674', // EBASE comment
  // '0x853d955acef822db058eb8505911ed77f175b99e', // FRAX comment
  // '0x764a5b7399d552a029d6c8e4a2a71bb5e9c82bd6', // WUST comment
]

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
//let MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('400000')
let MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('95')

// minimum liquidity for price to get tracked
// let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('2')
let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('0.1')

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
    if (pairAddress.toHexString() != ADDRESS_ZERO) 
    {
      let pair = Pair.load(pairAddress.toHexString())
      
      if (pair.token0 == token.id && pair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) 
      {
        let token1 = Token.load(pair.token1)
        return pair.token1Price.times(token1.derivedETH as BigDecimal) // return token1 per our token * Eth per token 1
      }
      if (pair.token1 == token.id && pair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) 
      {
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
