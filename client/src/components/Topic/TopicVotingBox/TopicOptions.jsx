/* eslint-disable react/no-array-index-key */
/* eslint-disable react/prop-types */
import React, { useCallback } from 'react';
import {
  Grid, RadioGroup, FormControlLabel, FormControl, Radio,
} from '@material-ui/core';

function TopicOptions({ options, selectedOption, setSelectedOption }) {
  const handleChange = useCallback((event) => {
    setSelectedOption(parseInt(event.target.value, 10));
  }, [setSelectedOption]);

  return (
    <FormControl component="fieldset">
      <RadioGroup aria-label="gender" name="gender1" value={selectedOption} onChange={handleChange}>
        <Grid container>
          { options.map((option, index) => (
            <Grid item xs>
              <FormControlLabel key={index} value={index} control={<Radio />} label={option.optionName} labelPlacement="bottom" />
            </Grid>
          ))}
        </Grid>
      </RadioGroup>
    </FormControl>
  );
}

export default TopicOptions;
