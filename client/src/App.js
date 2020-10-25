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
import useGetUserType from './hooks/useGetUserType';
import useGetTopicAddressesList from './hooks/useGetTopicsList';
import useGetTopicInstances from './hooks/useGetTopicInstances';

// Components
import CreateTopic from './components/CreateTopic';
import Navbar from './components/Navbar';
import Login from './components/Login';
import TopicsList from './components/TopicsList';

function App() {
  const web3 = useGetWeb3();
  const accounts = useGetAccounts({ web3 });
  const { predictionMarketInstance } = useGetContractInstance({ web3, contract: PredictionMarketContract });
  const { userType, reputation } = useGetUserType({ predictionMarketInstance, accountAddress: accounts?.[0] });
  const topicAddressesList = useGetTopicAddressesList({ predictionMarketInstance });
  const topicInstances = useGetTopicInstances({ web3, contract: TopicContract, contractAddresses: topicAddressesList });

  return (
    <>
      {(userType === 'Invalid') && <Login predictionMarketInstance={predictionMarketInstance} accountAddress={accounts?.[0]} />}

      {(userType !== 'Invalid' && <Navbar userType={userType} reputation={reputation} />) }

      {(userType === 'Trader') && predictionMarketInstance && <CreateTopic predictionMarketInstance={predictionMarketInstance} accountAddress={accounts?.[0]} />}
      {(userType !== 'Invalid') && topicInstances && predictionMarketInstance && <TopicsList web3={web3} predictionMarketInstance={predictionMarketInstance} topicInstances={topicInstances} accountAddress={accounts?.[0]} contractPhaseFilter={0} /> }

    </>
  );
}

export default App;
