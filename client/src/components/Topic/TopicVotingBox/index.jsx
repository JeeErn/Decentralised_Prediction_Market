/* eslint-disable import/extensions */
/* eslint-disable react/prop-types */
/* eslint-disable max-len */
import React, { useCallback, useState } from 'react';
import {
  makeStyles, Paper, Grid, Typography, Button, Slider, Modal,
} from '@material-ui/core';
import TopicOptions from './TopicOptions.jsx';

const useStyles = makeStyles(() => ({
  root: {
    padding: '0.7em',
  },
  alignCenter: {
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  modal: {
    position: 'absolute',
    width: 400,
    top: '50%',
    left: '50%',
    padding: '10px',
    transform: 'translate(-50%,-50%)',
  },

}));

function TopicVotingBox({
  options, topicInstance, web3, accountAddress,
}) {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(0.5);
  const [selectedOption, setSelectedOption] = useState(1);

  // TODO: Make hook for considtional rendering of the vote button (E.g. if the user is an arbitrator)
  const shouldRenderVoteButton = true;

  const handleMakeBet = useCallback(
    () => {
      // // Make the bet
      topicInstance.methods
        .voteOption(selectedOption.toString(), Date.now())
        .send({ from: accountAddress, value: web3.utils.toWei(sliderValue.toString()) })
        .then(() => {
          alert('Congratuations! You have just made a bet!');
          window.location.reload(false);
        })
        .catch((err) => { if (err.code === -32603) { alert('Your betting price should be more than the pending price!'); } });
    },
    [topicInstance, sliderValue, web3, accountAddress, selectedOption],
  );
  return (
    <>
      <Button className={classes.fullWidth} variant="outlined" color="secondary" onClick={() => setOpen(true)}> Make your bet </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Paper className={classes.modal}>
          <Grid container item xs spacing={3} className={classes.root}>
            <Grid item xs={12}>
              <Typography variant="h6">
                Make Your Bet
              </Typography>
            </Grid>
            <Grid item container xs={12}>
              <Slider
                value={sliderValue * 100}
                onChange={(event, newValue) => {
                  setSliderValue(newValue / 100);
                }}
              />
            </Grid>
            <Grid item container xs={12}>
              <Typography>
                {' '}
                { `You are betting ${sliderValue} eth to win 1 eth` }
                {' '}
              </Typography>
            </Grid>
            <Grid item container xs={12}>
              <TopicOptions selectedOption={selectedOption} setSelectedOption={setSelectedOption} options={options} />
            </Grid>
            <Grid item container xs={12}>
              {shouldRenderVoteButton && (
              <Button variant="contained" color="primary" onClick={handleMakeBet}>
                Submit Bet
              </Button>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Modal>
    </>
  );
}

export default TopicVotingBox;
