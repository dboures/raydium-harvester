import { MContext } from '../components/ConnectionProvider';
import harvest from '../utils/harvest';
import swap from '../utils/swap';

function Main() {

    return (
        <MContext.Consumer>
          {(context) => (
            <div className="mt-5 d-flex justify-content-left">
                <button onClick={()=> harvest(context.state.connection, context.state.wallet)}>Harvest Raydium From Ray-SRM Pool</button>
                <button onClick={()=> swap(context.state.connection, context.state.wallet)}>Swap Half of Ray into SRM</button>
                {/* <button onClick={()=> harvest(context.state.connection, context.state.wallet)}>Provide Liquidity for RAY-SRM</button>
                <button onClick={()=> harvest(context.state.connection, context.state.wallet)}>Reinvest LP tokens</button> */}
            </div>
          )}
        </MContext.Consumer>
        )
    
    

}

export default Main;