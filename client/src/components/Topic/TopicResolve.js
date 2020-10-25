/* eslint-disable react/prop-types */
/* eslint-disable max-len */
/* eslint-disable react/jsx-filename-extension */
import {
  Accordion, AccordionDetails, AccordionSummary, Button, Typography, makeStyles, Grid,
} from '@material-ui/core';
import React, { useCallback, useState } from 'react';
import TopicOptions from './TopicVotingBox/TopicOptions';

const useStyles = makeStyles(() => ({
  root: {
    background: '#fcfce3',
    margin: '1em',
    textAlign: 'center',
  },
  button: {
    margin: '2em',
  },
}));
function TopicResolve({ options }) {
  const classes = useStyles();
  const [selectedOption, setSelectedOption] = useState(0);

  const handleResolveSubmit = useCallback(() => {
    console.log(selectedOption);
  });
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
            <Button variant="contained" color="primary" className={classes.button} onClick={handleResolveSubmit}>
              Submit
            </Button>
          </Grid>
        </Grid>

      </AccordionDetails>
    </Accordion>
  );
}

export default TopicResolve;
