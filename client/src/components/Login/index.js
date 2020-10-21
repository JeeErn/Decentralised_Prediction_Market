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
    if (type === 'arbitrator') {
      predictionMarketInstance.methods.createArbitrator(Web3.utils.asciiToHex(name))
        .send({ from: accountAddress })
        .then((receipt) => {
          console.log(receipt);
        });
    }
    if (type === 'trader') {
      predictionMarketInstance.methods.createTrader()
        .send({ from: accountAddress })
        .then((receipt) => {
          console.log(receipt);
        });
    }
  };
  return (
    <Paper className={classes.root} elevation={2}>
      <Typography align="center" variant="h5">
        Welcome to Decentralised Betting Platform
      </Typography>
      <TextField className={classes.textField} label="name" value={name} onChange={(event) => { setName(event.target.value); }} />
      <Button color="primary" variant="contained" className={classes.button} onClick={() => handleSignUp('arbitrator')}>
        Sign up as Arbitrator
      </Button>
      <Button color="primary" variant="contained" className={classes.button} onClick={() => handleSignUp('trader')}>
        Sign up as Trader
      </Button>
    </Paper>
  );
}

export default Login;
