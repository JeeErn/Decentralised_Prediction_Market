/* eslint-disable react/no-array-index-key */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import { makeStyles, Grid, Typography } from '@material-ui/core';

const useStyles = makeStyles(() => ({
  root: {
    textAlign: 'center',
  },
  header: {
    fontWeight: '500',
  },

}));

function TopicProperty({ title, options, propKey }) {
  const classes = useStyles();
  return (
    <Grid item container xs className={classes.root}>
      <Grid item xs={12}>
        <Typography center variant="h6">
          {' '}
          {title}
          {' '}
        </Typography>
      </Grid>
      <Grid item xs={12} container>
        {options.map((option, index) => (
          <Grid item container xs direction="column" key={index}>
            <Grid item xs>{option.optionName}</Grid>
            <Grid item xs>{option[propKey]}</Grid>
          </Grid>
        ))}
      </Grid>

    </Grid>
  );
}

export default TopicProperty;
