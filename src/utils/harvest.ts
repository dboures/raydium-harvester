import { Connection, PublicKey, TokenAccountsFilter } from "@solana/web3.js";
import { deposit } from "./deposit";
import { FARMS } from "./farms";

export default async function harvest (conn: Connection, wallet: any) {

    if (typeof wallet === 'undefined' || !wallet.connected) {
        console.log('Connect Wallet');
        return;
    }

    //TODO: turn into multiple find, taking in farms as a function input
    let farmInfo = FARMS.find(farm => {
        return farm.name == 'RAY-SRM'
    });

    console.log(farmInfo);

    let programId = farmInfo?.programId
    if (typeof programId === 'undefined'){
        return
    }
    let mintAddress = farmInfo?.lp.mintAddress
    if (typeof mintAddress === 'undefined'){
        return
    }

    console.log(mintAddress);
    console.log('DSX5E21RE9FB9hM8Nh8xcXQfPK6SzRaJiywemHBSsfup'); // how to get this

    let tokenAccountsFilter: TokenAccountsFilter = {
        programId: new PublicKey(programId),
        mint: new PublicKey('DSX5E21RE9FB9hM8Nh8xcXQfPK6SzRaJiywemHBSsfup')
    }

    let res1 = await conn.getTokenAccountsByOwner(wallet._publicKey, tokenAccountsFilter  );

    // const lpAccount = get(this.wallet.tokenAccounts, `${this.farmInfo.lp.mintAddress}.tokenAccountAddress`)
    //   const rewardAccount = get(this.wallet.tokenAccounts, `${this.farmInfo.reward.mintAddress}.tokenAccountAddress`)
    //   const infoAccount = get(this.farm.stakeAccounts, `${this.farmInfo.poolId}.stakeAccountAddress`)


    // //harvest my Ray
    await deposit(conn,
        wallet,
        farmInfo,
        '5v5afm5CNkuBffoaq4TrPkmn5pRUd6r4uEaD4kTN1X4f',//lp Account
        'DgHYWZmBUijAUnTxpvjUw4ryGfWPtWJaDixCfTc4iVBt', // rewardAccount
        'FWHirYo85tdmJxPwrhQX9ZSrqgsTq4m9rJVuEdgcteXf', //InfoAccount
        '0')

    console.log('done');


}

// setInterval(() => {
//     // do
// }, 2000);