
import React from 'react';
import { Component } from 'react';
import Wallet from '@project-serum/sol-wallet-adapter';
import { Connection } from "@solana/web3.js";

export const MContext = React.createContext();  //exporting context object
class ConnectionProvider extends Component {
    userWallet = new Wallet("https://www.sollet.io");

    state = {
        connection: new Connection("https://solana-api.projectserum.com/", 'singleGossip'),
        wallet: this.userWallet 
    }
    render() {
        return (
            <MContext.Provider value={
                {   
                    state: this.state,
                    connect:  async () => {
                            this.state.wallet.on('connect', publicKey => console.log('Connected to ' + publicKey.toBase58()));
                            this.state.wallet.on('disconnect', () => console.log('Disconnected'));
                            await this.state.wallet.connect();
                        this.setState({ wallet: this.state.wallet });
                    }
                }}>
                {this.props.children}
            </MContext.Provider>
            )    
        }
}

export default ConnectionProvider;