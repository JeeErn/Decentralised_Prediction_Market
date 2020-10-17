import React, { useCallback, useEffect, useState } from 'react';
import { Grid, RadioGroup, FormControlLabel, FormControl, Radio, FormLabel } from "@material-ui/core";

function TopicOptions({options, selectedOption, setSelectedOption}) {

    const handleChange = useCallback( (event) => {
           setSelectedOption(parseInt(event.target.value));
    }, [setSelectedOption])

    return (
        <FormControl component="fieldset">
            <RadioGroup aria-label="gender" name="gender1" value={selectedOption} onChange={handleChange}>
                <Grid container>
                { options.map( (option, index) => {
                    return (
                        <Grid item xs>
                            <FormControlLabel key={index} value={index} control={<Radio />} label={option.optionName} labelPlacement="bottom"/>
                        </Grid>
                    )
                })}
                </Grid>
            </RadioGroup>
        </FormControl>
    );
}

export default TopicOptions;