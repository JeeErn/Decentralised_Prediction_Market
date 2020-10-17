import React, { useCallback, useState } from 'react';
import { makeStyles, Paper, Grid, Typography, Button, Slider} from "@material-ui/core";
import TopicOptions from "./TopicOptions";

const useStyles = makeStyles( theme => ({
    root : {
        padding: "0.7em",
    },
    alignCenter : {
        textAlign: "center"
    }
})) 


function TopicVotingBox({options, topicInstance, web3, accountAddress, forceUpdate}) {
    const classes = useStyles();
    const [sliderValue, setSliderValue] = useState(0.5);
    const [selectedOption,setSelectedOption] = useState(1);
    const handleMakeBet = useCallback(
        () => {
            // // Make the bet
            topicInstance.methods.voteOption(web3.utils.toWei(sliderValue.toString()), selectedOption.toString())
            .send({from: accountAddress, value: web3.utils.toWei(sliderValue.toString())})
            .then((receipt) => {
                    alert("Congratuations! You have just made a bet!")
                    window.location.reload(false);
                })         
        }
    ,[topicInstance, sliderValue, web3, accountAddress, selectedOption]);
    return (
        <Paper>
            <Grid container item xs spacing={3} className={classes.root}>
                <Grid item xs ={12}> 
                    <Typography variant="h6">                                    
                        Make Your Bet
                    </Typography>
                </Grid>  
                <Grid item container xs ={12}>
                    <Slider value={sliderValue * 100} onChange={ (event, newValue) => {
                        setSliderValue(newValue / 100);
                    } } />
                </Grid>
                <Grid item container xs={12} >
                    <Typography > { `You are betting ${sliderValue} eth to win 1 eth` }  </Typography>
                </Grid>
                <Grid item container xs={12}>
                    <TopicOptions selectedOption={selectedOption} setSelectedOption={setSelectedOption} options={options}/>
                </Grid>
                <Grid item container xs={12}>
                    <Button variant="contained" color="primary" onClick={handleMakeBet}>
                        Submit Bet
                    </Button>
                    </Grid>
                </Grid>
        </Paper>
    );
}

export default TopicVotingBox;