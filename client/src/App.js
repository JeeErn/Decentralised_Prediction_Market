/* eslint-disable react/jsx-filename-extension */
/* eslint-disable max-len */
import React from 'react';
import PredictionMarketContract from './contracts/PredictionMarket.json';
import TopicContract from './contracts/Topic.json';
import { useGetWeb3 } from './hooks/useGetWeb3';
import './App.css';
// Hooks
import useGetAccounts from './hooks/useGetAccounts';
import useGetContractInstance from './hooks/useGetContractInstance';

// Components
import CreateTopic from './components/CreateTopic';
import Topic from './components/Topic';
import useGetTopicAddressesList from './hooks/useGetTopicsList';
import useGetTopicInstances from './hooks/useGetTopicInstances';

function App() {
  const web3 = useGetWeb3();
  const accounts = useGetAccounts({ web3 });
  const predictionMarketInstance = useGetContractInstance({ web3, contract: PredictionMarketContract });

  const topicAddressesList = useGetTopicAddressesList({ predictionMarketInstance });
  const topicInstances = useGetTopicInstances({ web3, contract: TopicContract, contractAddresses: topicAddressesList });

  return (
    <>
      {predictionMarketInstance && <CreateTopic predictionMarketInstance={predictionMarketInstance} accountAddress={accounts ? accounts[0] : null} />}
      {
        topicInstances && topicInstances.map((topicInstance) => <Topic web3={web3} topicInstance={topicInstance} accountAddress={accounts ? accounts[0] : null} />)
      }
    </>
  );
}

export default App;
