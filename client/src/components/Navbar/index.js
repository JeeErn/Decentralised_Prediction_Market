/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    marginBottom: '20px',
    background: '#555555',
    color: 'white',
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

export default function Navbar({ userType, reputation, arbitratorName }) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <AppBar position="static" color="transparent">
        <Toolbar>
          <Typography variant="" className={classes.title} align="left">
            {`${userType} account`}
          </Typography>
          <Typography variant="" className={classes.title} align="left">
            {`Trader Reputation: ${reputation}`}
          </Typography>
          {
            arbitratorName && (
            <Typography variant="" className={classes.title} align="left">
              {`Arbitrator Name: ${arbitratorName}`}
            </Typography>
            )
          }
        </Toolbar>
      </AppBar>
    </div>
  );
}
