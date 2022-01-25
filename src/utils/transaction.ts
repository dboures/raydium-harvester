import {
    Account,
    Connection,
    Transaction,
    TransactionSignature,
  } from '@solana/web3.js'
import { commitment } from './web3'

export async function signTransaction(
    connection: Connection,
    wallet: any,
    transaction: Transaction,
    signers: Array<Account> = []
  ) {
    transaction.recentBlockhash = (await connection.getRecentBlockhash(commitment)).blockhash
    transaction.setSigners(wallet.publicKey, ...signers.map((s) => s.publicKey))
    if (signers.length > 0) {
      transaction.partialSign(...signers)
    }
    return await wallet.signTransaction(transaction)
  }
  
  export async function sendTransaction(
    connection: Connection,
    wallet: any,
    transaction: Transaction,
    signers: Array<Account> = []
  ) {
    const signedTransaction = await signTransaction(connection, wallet, transaction, signers)
    return await sendSignedTransaction(connection, signedTransaction)
  }
  
  export async function sendSignedTransaction(connection: Connection, signedTransaction: Transaction): Promise<string> {
    const rawTransaction = signedTransaction.serialize()
  
    const txid: TransactionSignature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      preflightCommitment: commitment
    })
  
    return txid
  }