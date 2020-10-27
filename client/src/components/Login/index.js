/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/jsx-no-undef */
import {
  makeStyles, Paper, TextField, Button, Typography,
} from '@material-ui/core';
import React, { useState } from 'react';
import Web3 from 'web3';

const useStyles = makeStyles(() => ({
  root: {
    width: '30%',
    margin: '0.5em',
    padding: '10px',
    textAlign: 'center',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
  },
  textField: {
    width: '80%',
    textAlign: 'center',
  },
  button: {
    width: '80%',
    margin: '10px',
  },
}));

function Login({ predictionMarketInstance, accountAddress }) {
  const classes = useStyles();
  const [name, setName] = useState('');
  const handleSignUp = (type) => {
    if (type === 'trader and arbitrator') {
      predictionMarketInstance.methods.createTrader()
        .send({ from: accountAddress })
        .then(() => {
          window.location.reload(false);
        });
      predictionMarketInstance.methods.createArbitrator(Web3.utils.asciiToHex(name))
        .send({ from: accountAddress })
        .then(() => {
          window.location.reload(false);
        });
    }
    if (type === 'trader') {
      predictionMarketInstance.methods.createTrader()
        .send({ from: accountAddress })
        .then(() => {
          window.location.reload(false);
        });
    }
  };
  return (
    <Paper className={classes.root} elevation={2}>
      <Typography align="center" variant="h5">
        Welcome to Decentralised Betting Platform
      </Typography>
      <TextField className={classes.textField} label="name" value={name} onChange={(event) => { setName(event.target.value); }} />
      <Button color="primary" variant="contained" className={classes.button} onClick={() => handleSignUp('trader and arbitrator')}>
        Sign up as an Arbitrator and Trader
      </Button>
      <Button color="primary" variant="contained" className={classes.button} onClick={() => handleSignUp('trader')}>
        Sign up only as a Trader
      </Button>
    </Paper>
  );
}

export default Login;
