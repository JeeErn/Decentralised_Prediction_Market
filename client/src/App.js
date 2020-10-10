import React, { Component } from "react";
import PredictionMarketContract from "./contracts/PredictionMarket.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = { addedValue: 0, storageValue: 0, web3: null, accounts: null, contract: null };

  componentDidMount = () => {
    try {
      // Get network provider and web3 instance.
      getWeb3().then( async web3 => {
        // Use web3 to get the user's accounts.
        const accounts = await web3.eth.getAccounts();
         // Get the contract instance.
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = PredictionMarketContract.networks[networkId];

        const instance = new web3.eth.Contract(
          PredictionMarketContract.abi,
          deployedNetwork && deployedNetwork.address,
        );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance });
      });

    
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  createTrader = async () => {
        const { accounts, contract } = this.state;
        const receipt = await contract.methods.createTrader().send( {from: accounts[0]});
        console.log(receipt);
        // const traders = contract.methods.traders({from: accounts[0]}).call(); 
        // console.log(traders);
  }
  

  // addToStoredValue = async () => {
  //   const { accounts, contract } = this.state;
  //   // Get the value from the contract to prove it worked.
  //   const storedValue = await contract.methods.get().call();
  //   // Stores a given value, 5 by default.
  //   await contract.methods.set(parseInt(storedValue) + parseInt(this.state.addedValue)).send({ from: accounts[0] });

  //   // Get the value from the contract to prove it worked.
  //   const response = await contract.methods.get().call();

  //   // Update state with the result.
  //   this.setState({ storageValue: response });
  // };

  // handleInputChange = (event) => {
  //   this.setState({addedValue : event.target.value})
  // }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div>
        {/* <input value={this.state.addedValue} onChange={(event) => this.handleInputChange(event)}></input>
        <button onClick={this.addToStoredValue}>
          Add to stored value
        </button>
        <div>The stored value is: {this.state.storageValue}</div> */}
        <button onClick={this.createTrader}>Create Trader</button>
      </div>
    );
  }
}

export default App;

