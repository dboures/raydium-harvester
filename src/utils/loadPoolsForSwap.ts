import { PublicKey, Connection, Commitment, AccountInfo } from '@solana/web3.js'
import { OpenOrders } from '@project-serum/serum'
import { TokenAmount } from "./tokens"
import { struct } from 'superstruct'
import { ACCOUNT_LAYOUT, AMM_INFO_LAYOUT, AMM_INFO_LAYOUT_V3, AMM_INFO_LAYOUT_V4, MINT_LAYOUT } from "./layouts"
import { cloneDeep } from 'lodash';
import { LiquidityPoolInfo, LIQUIDITY_POOLS } from './pools'
// eslint-disable-next-line
const assert =require('assert');

export const commitment: Commitment = 'confirmed'

function jsonRpcResult(resultDescription: any) {
    const jsonRpcVersion = struct.literal('2.0')
    return struct.union([
      struct({
        jsonrpc: jsonRpcVersion,
        id: 'string',
        error: 'any'
      }),
      struct({
        jsonrpc: jsonRpcVersion,
        id: 'string',
        error: 'null?',
        result: resultDescription
      })
    ])
  }

function jsonRpcResultAndContext(resultDescription: any) {
    return jsonRpcResult({
      context: struct({
        slot: 'number'
      }),
      value: resultDescription
    })
  }

const AccountInfoResult = struct({
    executable: 'boolean',
    owner: 'string',
    lamports: 'number',
    data: 'any',
    rentEpoch: 'number?'
  })
const GetMultipleAccountsAndContextRpcResult = jsonRpcResultAndContext(
    struct.array([struct.union(['null', AccountInfoResult])])
  )

// getMultipleAccounts
export async function getMultipleAccounts(
    connection: Connection,
    publicKeys: PublicKey[],
    commitment?: Commitment
  ): Promise<Array<null | { publicKey: PublicKey; account: AccountInfo<Buffer> }>> {
    const keys: string[][] = []
    let tempKeys: string[] = []
  
    publicKeys.forEach((k) => {
      if (tempKeys.length >= 100) {
        keys.push(tempKeys)
        tempKeys = []
      }
      tempKeys.push(k.toBase58())
    })
    if (tempKeys.length > 0) {
      keys.push(tempKeys)
    }
  
    const accounts: Array<null | {
      executable: any
      owner: PublicKey
      lamports: any
      data: Buffer
    }> = []
  
    for (const key of keys) {
      const args = [key, { commitment }]
  
      // @ts-ignore
      const unsafeRes = await connection._rpcRequest('getMultipleAccounts', args)
      const res = GetMultipleAccountsAndContextRpcResult(unsafeRes)
      if (res.error) {
        throw new Error(
          'failed to get info about accounts ' + publicKeys.map((k) => k.toBase58()).join(', ') + ': ' + res.error.message
        )
      }
  
      assert(typeof res.result !== 'undefined')
  
      for (const account of res.result.value) {
        let value: {
          executable: any
          owner: PublicKey
          lamports: any
          data: Buffer
        } | null = null
        if (account === null) {
          accounts.push(null)
          continue
        }
        if (res.result.value) {
          const { executable, owner, lamports, data } = account
          assert(data[1] === 'base64')
          value = {
            executable,
            owner: new PublicKey(owner),
            lamports,
            data: Buffer.from(data[0], 'base64')
          }
        }
        if (value === null) {
          throw new Error('Invalid response')
        }
        accounts.push(value)
      }
    }
  
    return accounts.map((account, idx) => {
      if (account === null) {
        return null
      }
      return {
        publicKey: publicKeys[idx],
        account
      }
    })
  }

  export function getAddressForWhat(address: string) {
    for (const pool of LIQUIDITY_POOLS) {
      //console.log(pool);
      for (const [key, value] of Object.entries(pool)) {
        if (key === 'lp') {
          if (value.mintAddress === address) {
            return { key: 'lpMintAddress', lpMintAddress: pool.lp.mintAddress, version: pool.version }
          }
        } else if (value === address) {
          return { key, lpMintAddress: pool.lp.mintAddress, version: pool.version }
        }
      }
    }
  
    return {}
  }


export async function loadPools(conn: Connection, LPINFO: LiquidityPoolInfo )  {

      const liquidityPools = {} as any
      const publicKeys = [] as any

      // Need this info to start
      const { poolCoinTokenAccount, poolPcTokenAccount, ammOpenOrders, ammId, coin, pc, lp } = LPINFO
      //console.log('push pubkeys');
      publicKeys.push(
        new PublicKey(poolCoinTokenAccount),
        new PublicKey(poolPcTokenAccount),
        new PublicKey(ammOpenOrders),
        new PublicKey(ammId),
        new PublicKey(lp.mintAddress)
      )

      //console.log('clonedeep');
      const poolInfo = cloneDeep(LPINFO)

      //console.log('init balances');
      poolInfo.coin.balance = new TokenAmount(0, coin.decimals)
      poolInfo.pc.balance = new TokenAmount(0, pc.decimals)

      liquidityPools[lp.mintAddress] = poolInfo
      const savedMintAddress = lp.mintAddress;

      // console.log(publicKeys);
      //console.log('getMultipleAccounts');
      const multipleInfo = await getMultipleAccounts(conn, publicKeys, commitment) // json RPC, should be fine

      multipleInfo.forEach((info) => {
        if (info) {
          const address = info.publicKey.toBase58()
          const data = Buffer.from(info.account.data)

          //console.log('getAddressForWhat');
          const { key, lpMintAddress, version } = getAddressForWhat(address)
           
          //loads all the coin amounts
          if (key && lpMintAddress) {
            const poolInfo = liquidityPools[lpMintAddress]

            switch (key) {
              case 'poolCoinTokenAccount': {
                const parsed = ACCOUNT_LAYOUT.decode(data)

                poolInfo.coin.balance.wei = poolInfo.coin.balance.wei.plus(parsed.amount.toString())

                break
              }
              case 'poolPcTokenAccount': {
                const parsed = ACCOUNT_LAYOUT.decode(data)

                poolInfo.pc.balance.wei = poolInfo.pc.balance.wei.plus(parsed.amount.toNumber())

                break
              }
              case 'ammOpenOrders': {
                const OPEN_ORDERS_LAYOUT = OpenOrders.getLayout(new PublicKey(poolInfo.serumProgramId))
                const parsed = OPEN_ORDERS_LAYOUT.decode(data)

                const { baseTokenTotal, quoteTokenTotal } = parsed
                poolInfo.coin.balance.wei = poolInfo.coin.balance.wei.plus(baseTokenTotal.toNumber())
                poolInfo.pc.balance.wei = poolInfo.pc.balance.wei.plus(quoteTokenTotal.toNumber())

                break
              }
              case 'ammId': {
                let parsed
                if (version === 2) {
                  parsed = AMM_INFO_LAYOUT.decode(data)
                } else if (version === 3) {
                  parsed = AMM_INFO_LAYOUT_V3.decode(data)
                } else {
                  parsed = AMM_INFO_LAYOUT_V4.decode(data)

                  const { swapFeeNumerator, swapFeeDenominator } = parsed
                  poolInfo.fees = {
                    swapFeeNumerator: swapFeeNumerator.toNumber(),
                    swapFeeDenominator: swapFeeDenominator.toNumber()
                  }
                }

                const { needTakePnlCoin, needTakePnlPc } = parsed
                poolInfo.coin.balance.wei = poolInfo.coin.balance.wei.minus(needTakePnlCoin.toNumber())
                poolInfo.pc.balance.wei = poolInfo.pc.balance.wei.minus(needTakePnlPc.toNumber())

                break
              }
              // getLpSupply
              case 'lpMintAddress': {
                //console.log('lpMintAddress');
                const parsed = MINT_LAYOUT.decode(data)

                poolInfo.lp.totalSupply = new TokenAmount(parsed.supply.toNumber(), poolInfo.lp.decimals)

                break
              }
            }
          }
        }
      })

      return liquidityPools[savedMintAddress];
  }