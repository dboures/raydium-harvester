// @ts-ignore
import { nu64, struct, u8 } from 'buffer-layout'
import { Connection, PublicKey, SYSVAR_CLOCK_PUBKEY, Transaction, TransactionInstruction } from '@solana/web3.js'
import { FarmInfo } from './farms'
import { TokenAmount } from './tokens'
import { createProgramAccountIfNotExist, createTokenAccountIfNotExist, sendTransaction } from './web3'
import { TOKEN_PROGRAM_ID } from './ids'
import { USER_STAKE_INFO_ACCOUNT_LAYOUT } from './layouts'

export function depositInstruction(
  programId: PublicKey,
  // staking pool
  poolId: PublicKey,
  poolAuthority: PublicKey,
  // user
  userInfoAccount: PublicKey,
  userOwner: PublicKey,
  userLpTokenAccount: PublicKey,
  poolLpTokenAccount: PublicKey,
  userRewardTokenAccount: PublicKey,
  poolRewardTokenAccount: PublicKey,
  // tokenProgramId: PublicKey,
  amount: number
): TransactionInstruction {
  const dataLayout = struct([u8('instruction'), nu64('amount')])

  const keys = [
    { pubkey: poolId, isSigner: false, isWritable: true },
    { pubkey: poolAuthority, isSigner: false, isWritable: true },
    { pubkey: userInfoAccount, isSigner: false, isWritable: true },
    { pubkey: userOwner, isSigner: true, isWritable: true },
    { pubkey: userLpTokenAccount, isSigner: false, isWritable: true },
    { pubkey: poolLpTokenAccount, isSigner: false, isWritable: true },
    { pubkey: userRewardTokenAccount, isSigner: false, isWritable: true },
    { pubkey: poolRewardTokenAccount, isSigner: false, isWritable: true },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true }
  ]

  const data = Buffer.alloc(dataLayout.span)
  dataLayout.encode(
    {
      instruction: 1,
      amount
    },
    data
  )

  return new TransactionInstruction({
    keys,
    programId,
    data
  })
}

// deposit
export async function deposit(
  connection: Connection | undefined | null,
  wallet: any | undefined | null,
  farmInfo: FarmInfo | undefined | null,
  lpAccount: string | undefined | null,
  rewardAccount: string | undefined | null,
  infoAccount: string | undefined | null,
  amount: string | undefined | null
): Promise<string> {
  if (!connection || !wallet) throw new Error('Miss connection')
  if (!farmInfo) throw new Error('Miss pool infomations')
  if (!lpAccount) throw new Error('Miss account infomations')
  if (!amount) throw new Error('Miss amount infomations')

  const transaction = new Transaction()
  const signers: any = []

  const owner = wallet.publicKey

  // if no account, create new one
  const userRewardTokenAccount = await createTokenAccountIfNotExist(
    connection,
    rewardAccount,
    owner,
    farmInfo.reward.mintAddress,
    null,
    transaction,
    signers
  )

  // if no userinfo account, create new one
  const programId = new PublicKey(farmInfo.programId)
  const userInfoAccount = await createProgramAccountIfNotExist(
    connection,
    infoAccount,
    owner,
    programId,
    null,
    USER_STAKE_INFO_ACCOUNT_LAYOUT,
    transaction,
    signers
  )

  const value = new TokenAmount(amount, farmInfo.lp.decimals, false).wei.toNumber()

  console.log(farmInfo.poolId);   // GLQwyMF1txnAdEnoYuPTPsWdXqUuxgTMsWEV38njk48C -> HwEgvS79S53yzYUTRHShU6EuNmhR3WTX5tTZPUzBmwky
  console.log(farmInfo.poolAuthority);   // 5ddsMftKDoaT5qHnHKnfkGCexJhiaNz1E4mMagy6qMku -> 9B3XWm89zX7NwaBB8VmT5mrWvxVpd9eyfQMeqkuLkcCF
  console.log(userInfoAccount.toBase58())   // FWHirYo85tdmJxPwrhQX9ZSrqgsTq4m9rJVuEdgcteXf -> good
  console.log(wallet.publicKey.toBase58())   // DAETLz1E6ThdzRYqx131swWGLqzA4UjyPC3M7nTvSQve
  console.log(lpAccount);   // 5v5afm5CNkuBffoaq4TrPkmn5pRUd6r4uEaD4kTN1X4f -> good
  console.log(farmInfo.poolLpTokenAccount);   // HFYPGyBW5hsQnrtQntg4d6Gzyg6iaehVTAVNqQ6f5f28 -> F4zXXzqkyT1GP5CVdEgC7qTcDfR8ox5Akm6RCbBdBsRp
  console.log(userRewardTokenAccount.toBase58());   // DgHYWZmBUijAUnTxpvjUw4ryGfWPtWJaDixCfTc4iVBt -> good
  console.log(farmInfo.poolRewardTokenAccount);   // ETwFtP1dYCbvbARNPfKuJFxoGFDTTsqB6j3pRquPE7Fq -> FW7omPaCCvgBgUFKwvwU2jf1w1wJGjDrJqurr3SeXn14

  transaction.add(
    depositInstruction(
      programId, 
      new PublicKey(farmInfo.poolId),
      new PublicKey(farmInfo.poolAuthority),
      userInfoAccount,
      wallet.publicKey,
      new PublicKey(lpAccount),
      new PublicKey(farmInfo.poolLpTokenAccount),
      userRewardTokenAccount,
      new PublicKey(farmInfo.poolRewardTokenAccount),
      value
    )
  )

  console.log('sending');
  return await sendTransaction(connection, wallet, transaction, signers)
}