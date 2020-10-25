/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable max-len */
import React from 'react';
import {
  makeStyles, Paper, Grid, Typography,
} from '@material-ui/core';
import useGetTopicInfo from './hooks/useGetTopicInfo';
import TopicProperty from './TopicProperty';
import TopicVotingBox from './TopicVotingBox';
import useShouldRenderResolveButton from './hooks/useShouldRenderResolveButton';
import TopicResolve from './TopicResolve';
// TODO: Bring this hook out of create topic
import useGetArbitrators from '../CreateTopic/hooks/useGetArbitrators';
import { getArbitratorNamesFromAddress } from './Util';

const useStyles = makeStyles(() => ({
  root: {
    margin: '15px',
    padding: '20px',
  },
  header: {
    padding: '15px',
  },
  votingBox: {
    padding: '0.7em',
  },
  arbitratorNames: {
    color: '#888888',
    fontSize: '0.9em',
  },

}));

// View component for topic
function Topic({
  web3, topicInstance, accountAddress, predictionMarketInstance, contractPhaseFilter,
}) {
  const classes = useStyles();
  const {
    name, description, balance, options, arbitratorAddresses, contractPhase,
  } = useGetTopicInfo({ topicInstance, accountAddress, web3 });

  const { arbitrators, arbitratorNames } = useGetArbitrators({ predictionMarketInstance });

  const renderResolveButton = useShouldRenderResolveButton({ topicInstance, accountAddress });

  return contractPhase === contractPhaseFilter
    ? (
      <Paper className={classes.root}>
        <Grid container spacing={2}>
          <Grid container item xs={9} spacing={3}>
            <Grid item xs={12} className={classes.header}>
              <Typography variant="h5">
                {' '}
                {name}
                {' '}
              </Typography>
              <Typography variant="subtitle1">
                {description}
              </Typography>
              <Typography display="inline" className={classes.arbitratorNames}>Selected Arbitrators:</Typography>
              {' '}
              {getArbitratorNamesFromAddress({ selectedAddresses: arbitratorAddresses, allAddresses: arbitrators, allNames: arbitratorNames }).map((_name) => (
                <Typography display="inline" className={classes.arbitratorNames}>
                  {' '}
                  {_name}
                  {' '}
                </Typography>
              ))}
            </Grid>
            <Grid container item xs={12} spacing={10}>
              <TopicProperty title="Weighted Probability" options={options} propKey="weightedScore" />
              <TopicProperty title="Last Traded Price" options={options} propKey="lastTradedPrices" />
              <TopicProperty title="Pending Price" options={options} propKey="pendingVotePrice" />
            </Grid>
            <Grid container item xs={12}>
              <Grid container item xs direction="column" align="center">
                <Typography variant="h6"> Num Successful Trades</Typography>
                <Typography>60</Typography>
              </Grid>
              <Grid container item xs direction="column" align="center">
                <Typography variant="h6"> Market Cap</Typography>
                <Typography>{`${balance} eth`}</Typography>
              </Grid>
            </Grid>

          </Grid>
          <Grid item xs={3}>
            {options && <TopicVotingBox options={options} web3={web3} topicInstance={topicInstance} accountAddress={accountAddress} />}
          </Grid>

          <Grid item xs={12}>
            { renderResolveButton && (
            <TopicResolve options={options} />
            )}
          </Grid>
        </Grid>
      </Paper>
    ) : (<></>);
}

export default Topic;
