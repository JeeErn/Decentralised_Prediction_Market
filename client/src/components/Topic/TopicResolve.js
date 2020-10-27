/* eslint-disable react/prop-types */
/* eslint-disable max-len */
/* eslint-disable react/jsx-filename-extension */
import {
  Accordion, AccordionDetails, AccordionSummary, Button, Typography, makeStyles, Grid,
} from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';

import React, { useCallback, useState } from 'react';
import Web3 from 'web3';
import useHasSubmittedResolve from './hooks/useHasSubmittedResolve';
import TopicOptions from './TopicVotingBox/TopicOptions';

const useStyles = makeStyles(() => ({
  root: {
    background: '#fcfce3',
    margin: '1em',
    textAlign: 'center',
  },
  voted: {
    margin: '1em',
    textAlign: 'center',
    background: '#ffa27a',
  },
  button: {
    margin: '2em',
  },
}));

// Resolve component for both Juror and Arbitrator
function TopicResolve({
  options, topicInstance, accountAddress, userType,
}) {
  const classes = useStyles();
  const [selectedOption, setSelectedOption] = useState(0);
  const hasSubmittedResolve = useHasSubmittedResolve({ topicInstance, accountAddress, userType });

  const handleResolveSubmit = useCallback((type) => {
    if (type === 'arbitrator') {
      topicInstance.methods.addArbitratorVote(Web3.utils.stringToHex(options[selectedOption].optionName.toString()), false)
        .send({ from: accountAddress })
        .then(() => {
          alert('Your vote has been recorded! ');
          window.location.reload(false);
        });
    }
    if (type === 'juror') {
      topicInstance.methods.addJuryVote(Web3.utils.stringToHex(options[selectedOption].optionName.toString()), false)
        .send({ from: accountAddress })
        .then(() => {
          alert('Your vote has been recorded! ');
          window.location.reload(false);
        });
    }
  }, [accountAddress, options, selectedOption, topicInstance.methods]);

  if (hasSubmittedResolve) {
    return (
      <MuiAlert elevation={0} variant="filled" severity="info">
        You have placed your resolution vote as
        {' '}
        {userType === 'arbitrator' && 'an arbitrator'}
        {userType === 'juror' && 'a juror'}
      </MuiAlert>
    );
  }
  if (userType === 'juror') {
    return (
      <Accordion className={classes.root}>
        <AccordionSummary>
          <Typography>
            You are a selected Juror for this topic. Click begin resolution.
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container>
            <Grid item xs={12}>
              <Typography variant="h6">What is the final result?</Typography>
            </Grid>
            <Grid item xs={12}>
              <TopicOptions options={options} selectedOption={selectedOption} setSelectedOption={setSelectedOption} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" className={classes.button} onClick={() => { handleResolveSubmit('juror'); }}>
                Submit
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  }
  if (userType === 'arbitrator') {
    return (
      <Accordion className={classes.root}>
        <AccordionSummary>
          <Typography>
            You are a selected arbitrator for this topic. Click begin resolution.
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container>
            <Grid item xs={12}>
              <Typography variant="h6">What is the final result?</Typography>
            </Grid>
            <Grid item xs={12}>
              <TopicOptions options={options} selectedOption={selectedOption} setSelectedOption={setSelectedOption} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" className={classes.button} onClick={() => { handleResolveSubmit('arbitrator'); }}>
                Submit
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  }
}

export default TopicResolve;
