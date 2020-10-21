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

}));

// View component for topic
function Topic({
  web3, topicInstance, accountAddress, predictionMarketAddress,
}) {
  const classes = useStyles();
  const { name, balance, options } = useGetTopicInfo({ topicInstance, accountAddress, web3 });

  const defaultOptions = [
    { optionName: 'yes', lastTradedPrice: 0.2, weightedScore: 50 },
    { optionName: 'no', lastTradedPrice: 0.3, weightedScore: 20 },
    { optionName: 'maybe', lastTradedPrice: 0.5, weightedScore: 30 },
  ];

  return (
    <Paper className={classes.root}>
      <Grid container spacing={2}>
        <Grid container item xs={9} spacing={3}>
          <Grid item xs={12}>
            <Typography className={classes.header} variant="h5">
              {' '}
              {name}
              {' '}
            </Typography>
          </Grid>

          <Grid container item xs={12} spacing={10}>
            <TopicProperty title="Weighted Score" options={defaultOptions} propKey="weightedScore" />
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
          {options && <TopicVotingBox options={options} web3={web3} topicInstance={topicInstance} accountAddress={accountAddress} predictionMarketAddress={predictionMarketAddress} />}
        </Grid>

      </Grid>
    </Paper>

  );
}

export default Topic;
