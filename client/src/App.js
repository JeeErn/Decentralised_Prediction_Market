import React, { useEffect, useState } from 'react'
import Topic from "./components/Topic";
import PredictionMarketContract from './contracts/PredictionMarket.json'
import TopicContract from './contracts/Topic.json'
import { useGetWeb3 } from './hooks/useGetWeb3'
import './App.css'
// Hooks
import useGetAccounts from './hooks/useGetAccounts';
import useGetContractInstance from './hooks/useGetContractInstance';

function App (props) {

  const web3 = useGetWeb3();
  const accounts = useGetAccounts({web3});
  const predictionMarketInstance = useGetContractInstance({web3, contract: PredictionMarketContract})

  //TODO:  Here for testing purposes, the contract addresses should be retrieved from predictionMarketInstance.getTopics(). That should set topicInsance accordingly.
  const topicInstance = useGetContractInstance({web3, contract: TopicContract})
  console.log(topicInstance);
 
  return (
    <>
      <Topic topicInstance= {topicInstance} accountAddress={accounts ? accounts[0] : null}/>
    </>
  )
}

export default App
