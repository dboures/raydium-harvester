import  { useEffect, useState } from 'react';
import { MContext } from '../components/ConnectionProvider';
import harvest from '../utils/harvest';

function Main(props) {

    // const [state, setState] = useState({
    //     programId: 'A1W5cEG1yfqNms6hcofEiTgKsqzTM6oeHKdYMUP37cfM',
    //     bobXPubKey: 'GTgZDXU9PGCUGedZ11364TW2PS9oFVwZyMF6m3EwdSpT',
    //     bobXTokens: 1,

    //     escrowAccountPubkey: '',
    //     escrowXAccountString: '',
    //     escrowAccountTokens: 0
    // });

    // useEffect(() => {
    //     db.collection('Bets').doc(props.match.params.id).get().then((docu) => {
    //         let data = docu.data();
    //         setState({...state,
    //             escrowAccountPubkey: data.escrowAccountPubkey,
    //             escrowXAccountString: data.escrowXAccountString,
    //             bobXTokens: data.tokens
    //         });
    //     });
    // }, []);
    return (
        <MContext.Consumer>
          {(context) => (
            <div className="mt-5 d-flex justify-content-left">
                
                <button onClick={()=> harvest(context.state.connection, context.state.wallet)}>Harvest</button>
            </div>
          )}
        </MContext.Consumer>
        )
    
    

}

export default Main;