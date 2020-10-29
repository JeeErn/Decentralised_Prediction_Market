/* eslint-disable no-nested-ternary */
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
import TopicResolve from './TopicResolve';
// TODO: Bring this hook out of create topic
import useGetArbitrators from '../CreateTopic/hooks/useGetArbitrators';
import { getArbitratorNamesFromAddress, formatDate } from './Util';

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
  marketCapContainer: {
    borderRight: '1px solid #DDDDDD',
  },
  marketCap: {
    color: '#888888',
  },

}));

// View component for topic
function Topic({
  web3, topicInstance, accountAddress, predictionMarketInstance, contractPhaseFilter,
}) {
  const classes = useStyles();
  const {
    name, description, balance, options, arbitratorAddresses, contractPhase, juryAddresses, winningOptionIndex, expiryDate
  } = useGetTopicInfo({ topicInstance, accountAddress, web3 });

  const { arbitrators, arbitratorNames } = useGetArbitrators({ predictionMarketInstance });

  // Bad complexity but can do for small array
  const isJuror = juryAddresses.includes(accountAddress);
  const isArbitrator = arbitratorAddresses.includes(accountAddress);

  // Minor logic to make code cleaner. 10 is the default index
  const userType = isJuror ? 'juror' : (isArbitrator ? 'arbitrator' : 'trader');

  return contractPhase === contractPhaseFilter
    ? (
      <Paper className={classes.root}>
        <Grid container spacing={2}>
          <Grid container item direction="column" xs={1} className={classes.marketCapContainer}>
            <Grid container item xs direction="column" align="center">
              <Typography className={classes.marketCap}> Market Cap</Typography>
              <Typography variant="h2">{`${balance}`}</Typography>
              <Typography className={classes.marketCap}>eth</Typography>

            </Grid>
          </Grid>
          <Grid container item xs={8} spacing={3} style={{ paddingLeft: '1em' }}>
            <Grid item xs={12} className={classes.header}>
              <Typography variant="h5">
                {' '}
                {name}
                {' '}
              </Typography>
              <Typography variant="subtitle1">
                {description}
              </Typography>
              {expiryDate && <Typography className={classes.arbitratorNames} variant="subtitle1">{`Expiry Date: ${formatDate(expiryDate)}`}</Typography>}
              <Typography display="inline" className={classes.arbitratorNames}>Selected Arbitrators:</Typography>
              {' '}
              {getArbitratorNamesFromAddress({ selectedAddresses: arbitratorAddresses, allAddresses: arbitrators, allNames: arbitratorNames }).map((_name) => (
                <Typography display="inline" className={classes.arbitratorNames}>
                  {' '}
                  {_name}
                  {' '}
                </Typography>
              ))}
              <br />
              {contractPhase === 2 && <Typography display="inline" className={classes.arbitratorNames}>Selected Jurors: </Typography>}
              {contractPhase === 2 && getArbitratorNamesFromAddress({ selectedAddresses: juryAddresses, allAddresses: arbitrators, allNames: arbitratorNames }).map((_name) => (
                <Typography display="inline" className={classes.arbitratorNames}>
                  {_name}
                </Typography>
              ))}
            </Grid>
            <Grid container item xs={12} spacing={10}>
              <TopicProperty title="Weighted Probability" options={options} propKey="weightedScore" />
              <TopicProperty title="Last Traded Price" options={options} propKey="lastTradedPrices" />
              <TopicProperty title="Pending Price" options={options} propKey="pendingVotePrice" />
            </Grid>

          </Grid>
          {
            contractPhaseFilter === 0
            && (
            <Grid item xs={3}>
              {options && <TopicVotingBox options={options} web3={web3} topicInstance={topicInstance} accountAddress={accountAddress} />}
            </Grid>
            )
          }

          {/* WinningOptionIndex Might Be 0 */}
          {expiryDate && options && winningOptionIndex !== null &&  (
          <Grid item xs={12}>
            <TopicResolve options={options} topicInstance={topicInstance} accountAddress={accountAddress} userType={userType} winningOptionIndex={winningOptionIndex} expiryDate={expiryDate} />
          </Grid>
          )}
        </Grid>
      </Paper>
    ) : (<></>);
}

export default Topic;
