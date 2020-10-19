/* eslint-disable react/jsx-filename-extension */
import { Button, makeStyles } from '@material-ui/core';
import React from 'react';
import { useGetWeb3 } from '../../hooks/useGetWeb3';

const useStyles = makeStyles(() => ({
  root: {
    width: '100%',
    margin: '0.5em',
  },
}));

function CreateTopic(props) {
  const classes = useStyles();
  return (
    <Button className={classes.root}>
      Create Topic
    </Button>
  );
}

export default CreateTopic;
