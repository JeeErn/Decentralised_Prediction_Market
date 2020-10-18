/* eslint-disable react/jsx-filename-extension */
/* eslint-disable max-len */
import React from 'react';
import Topic from './components/Topic';
import PredictionMarketContract from './contracts/PredictionMarket.json';
import TopicContract from './contracts/Topic.json';
import { useGetWeb3 } from './hooks/useGetWeb3';
import './App.css';
// Hooks
import useGetAccounts from './hooks/useGetAccounts';
import useGetContractInstance from './hooks/useGetContractInstance';

function App() {
  const web3 = useGetWeb3();
  const accounts = useGetAccounts({ web3 });
  // eslint-disable-next-line no-unused-vars
  const predictionMarketInstance = useGetContractInstance({ web3, contract: PredictionMarketContract });

  // TODO:  Here for testing purposes, the contract addresses should be retrieved from predictionMarketInstance.getTopics(). That should set topicInstance accordingly.
  const topicInstance = useGetContractInstance({ web3, contract: TopicContract });

  return (
    <>
      <Topic web3={web3} topicInstance={topicInstance} accountAddress={accounts ? accounts[0] : null} />
    </>
  );
}

export default App;
