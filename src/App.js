import Main from './components/Main';
import Connect from './components/Connect';
import ConnectionProvider from './components/ConnectionProvider';
import './App.css';

function App() {
  return (
    <div className="App">
      <ConnectionProvider>
      <header className="app-header">
          <span>
            header here
          </span>
          <Connect/>
        </header>
        <div className="container">
          hello
          <Main/>
        {/* <BrowserRouter>
            <Route path="/" exact component={BetList} />
            <Route path="/create" exact component={CreateBet} />
            <Route path="/bets/:id" exact component={ExecuteBet} />
        </BrowserRouter> */}
        </div>
      </ConnectionProvider>
    </div>
  );
}

export default App;
