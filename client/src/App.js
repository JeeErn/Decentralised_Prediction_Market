import React, { useEffect, useState } from 'react'
import Topic from "./components/Topic";
import PredictionMarketContract from './contracts/PredictionMarket.json'
import { useGetWeb3 } from './hooks/useGetWeb3'

import './App.css'

function App (props) {
  const [accounts, setAccounts] = useState(null)
  const [contract, setContract] = useState(null)
  const web3 = useGetWeb3()

  useEffect(() => {
    if (web3) {
      try{
      web3.eth.getAccounts().then(accounts => { setAccounts(accounts) })
      web3.eth.net.getId().then((netId) => {
        const deployedNetwork = PredictionMarketContract.networks[netId]
        const instance = new web3.eth.Contract(
          PredictionMarketContract.abi,
          deployedNetwork && deployedNetwork.address
        )
        setContract(instance)
      })
        } catch(error) {
          // Catch any errors for any of the above operations.
          alert(
            `Failed to load web3, accounts, or contract. Check console for details.`,
          );
          console.error(error);
      }
    }
  }, [web3])

  console.log(contract);
  return (
    <div>
      Hello
    </div>
  )
}

export default App
