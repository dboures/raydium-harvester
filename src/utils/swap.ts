import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { LIQUIDITY_POOL_PROGRAM_ID_V3, SERUM_PROGRAM_ID_V3 } from "./ids";
import { LP_TOKENS, TOKENS } from "./tokens";
import { loadPools } from "./loadPoolsForSwap";
import { sendTransaction } from "./web3";
import { LIQUIDITY_POOLS } from "./pools";

export default async function swap (conn: Connection, wallet: any) {

    const LPINFO = LIQUIDITY_POOLS.find((pool) => {
        return pool.ammId = 'EGhB6FdyHtJPbPMRoBC8eeUVnVh2iRgnQ9HZBKAw46Uy'  // TODO: automate
    });

    if (typeof(LPINFO) == 'undefined') {
        console.log('Could not find Liquidity Pool Info');
        return;
    }

    let poolInfo = await loadPools(conn, LPINFO);

    let RaySrmToken = TOKENS.find((token: { mintAddress: string; }) => {
        return token.mintAddress == 'DSX5E21RE9FB9hM8Nh8xcXQfPK6SzRaJiywemHBSsfup' // TODO: automate
    });
    const fromCoinMint = RaySrmToken.coin.mintAddress;
    const toCoinMint = RaySrmToken.pc.mintAddress;
    const fromTokenAccount = 'DgHYWZmBUijAUnTxpvjUw4ryGfWPtWJaDixCfTc4iVBt' // RAY TODO: automate
    const toTokenAccount = 'EQCETn5HZtuM6DzZNN7rZTUxsbrMsWQ2URd4jyVb2Fkq' // SRM TODO: automate

    const slippage = 1

    const transaction = new Transaction()
    const signers: Account[] = []
    
    const owner = wallet._publicKey;

    let amount = "0.1"; //TODO: Change!!!!!

    const { amountIn, amountOut } = getSwapOutAmount(poolInfo, fromCoinMint, toCoinMint, amount, slippage)
    
    let fromMint = fromCoinMint
    let toMint = toCoinMint

    // console.log('create new tokens');
    const newFromTokenAccount = await createTokenAccountIfNotExist(
        conn,
        fromTokenAccount,
        owner,
        fromMint,
        null,
        transaction,
        signers
    )
    const newToTokenAccount = await createTokenAccountIfNotExist(
        conn,
        toTokenAccount,
        owner,
        toMint,
        null,
        transaction,
        signers
    )
    
    // console.log('txn add');

    transaction.add(
        swapInstruction(
        new PublicKey(LPINFO.programId),
        new PublicKey(LPINFO.ammId),
        new PublicKey(LPINFO.ammAuthority),
        new PublicKey(LPINFO.ammOpenOrders),
        new PublicKey(LPINFO.ammTargetOrders),
        new PublicKey(LPINFO.poolCoinTokenAccount),
        new PublicKey(LPINFO.poolPcTokenAccount),
        new PublicKey(LPINFO.serumProgramId),
        new PublicKey(LPINFO.serumMarket),
        new PublicKey(LPINFO.serumBids), // what the deal boss?
        new PublicKey(LPINFO.serumAsks),
        new PublicKey(LPINFO.serumEventQueue),
        new PublicKey(LPINFO.serumCoinVaultAccount),
        new PublicKey(LPINFO.serumPcVaultAccount),
        new PublicKey(LPINFO.serumVaultSigner),
        newFromTokenAccount,
        newToTokenAccount,
        owner,
        Math.floor(amountIn.toWei().toNumber()),
        Math.floor(amountOut.toWei().toNumber())
        )
    )
    
    console.log("Swapping " + amount + " RAY");
    let txid =  await sendTransaction(conn, wallet, transaction);
    console.log(txid);

}