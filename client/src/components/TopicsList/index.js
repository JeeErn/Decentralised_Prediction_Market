/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/prop-types */
/* eslint-disable max-len */
import React, { useState } from 'react';
import { Paper, Tab, Tabs } from '@material-ui/core';
import Topic from '../Topic';

function TopicsList({
  topicInstances, predictionMarketInstance, accountAddress, web3,
}) {
  const [contractPhaseFilter, setContractPhaseFilter] = useState(0);
  return (
    <>

      <Paper square elevation={0}>
        <Tabs
          value={contractPhaseFilter}
          indicatorColor="primary"
          textColor="primary"
          onChange={(event, newVal) => { setContractPhaseFilter(newVal); }}
          aria-label="disabled tabs example"
        >
          <Tab label="Open" />
          <Tab label="Verification" />
          <Tab label="Jury" />
          <Tab label="Resolved" />
        </Tabs>
      </Paper>

      { topicInstances.map((topicInstance) => <Topic web3={web3} predictionMarketInstance={predictionMarketInstance} topicInstance={topicInstance} accountAddress={accountAddress} contractPhaseFilter={contractPhaseFilter} />)}
    </>
  );
}

export default TopicsList;
