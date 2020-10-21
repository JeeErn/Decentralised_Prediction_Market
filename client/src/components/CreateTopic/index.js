/* eslint-disable max-len */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-filename-extension */

/*
  @TODO:
  - Display creator bond
  - Select from list of arbitrators
  - Choose Expiry date
 */

import {
  Button, makeStyles, Modal, Typography, Paper, TextField, Grid, MenuItem, Select, FormControl, InputLabel,
} from '@material-ui/core';
import React, { useCallback, useState } from 'react';
import Web3 from 'web3';
import useGetArbitrators from './hooks/useGetArbitrators';

const useStyles = makeStyles(() => ({
  root: {
    width: '100%',
    margin: '0.5em',
  },
  modal: {
    position: 'absolute',
    width: 400,
    top: '50%',
    left: '50%',
    padding: '10px',
    transform: 'translate(-50%,-50%)',
  },
  textField: {
    width: '100%',
  },
}));

function CreateTopic({ predictionMarketInstance, accountAddress }) {
  const classes = useStyles();
  const [name, setName] = useState('Will Joe Biden Win the election');
  const [description, setDescription] = useState('Default Description');
  const [options, setOptions] = useState(['yes', 'no', 'others']);
  const [expiryDate, setExpiryDate] = useState(0);
  const [selectedArbitrators, setSelectedArbitrators] = useState([]);
  const [creatorBond, setCreatorBond] = useState(0.1);
  const [open, setOpen] = useState(false);

  const arbitrators = useGetArbitrators({ predictionMarketInstance });

  const handleCreateTopic = useCallback(() => {
    const options32Bytes = options.map((option) => Web3.utils.fromAscii(option));
    predictionMarketInstance.methods
      .createTopic(name, description, options32Bytes, expiryDate, selectedArbitrators)
      .send({ from: accountAddress, value: Web3.utils.toWei(creatorBond.toString(), 'ether') })
      .then(() => {
        window.location.reload(false);
      })
      .catch((error) => { console.log(error); });
  // eslint-disable-next-line max-len
  }, [predictionMarketInstance, name, description, options, expiryDate, selectedArbitrators, accountAddress, creatorBond]);

  const handleEditOption = (event, index) => {
    const temp = options.copy();
    temp[index] = event.target.value;
    setOptions(temp);
  };

  const handleModalOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    predictionMarketInstance
    && (
    <>
      <Button className={classes.root} onClick={handleModalOpen} variant="contained" color="primary">
        Create Topic
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
      >
        <Paper className={classes.modal}>
          <Typography variant="h6">
            Create Topic
          </Typography>
          <Grid container spacing={2}>
            <Grid container item xs={12}>
              <TextField label="name" value={name} className={classes.textField} onChange={(event) => { setName(event.target.value); }} />
            </Grid>
            <Grid container item xs={12}>
              <TextField label="description" value={description} className={classes.textField} onChange={(event) => { setDescription(event.target.value); }} />
            </Grid>
            <Grid container item xs={12} spacing={1}>
              <Grid item xs>
                <TextField label="option 1" value={options[0]} className={classes.textField} onChange={(event) => { handleEditOption(event, 0); }} />
              </Grid>
              <Grid item xs>
                <TextField label="option 2" value={options[1]} className={classes.textField} onChange={(event) => { handleEditOption(event, 1); }} />
              </Grid>
              <Grid item xs>
                <TextField label="option 3" value={options[2]} className={classes.textField} onChange={(event) => { handleEditOption(event, 2); }} />
              </Grid>
              <Grid item xs>
                <TextField label="option 4" value={options[3]} className={classes.textField} onChange={(event) => { handleEditOption(event, 3); }} />
              </Grid>
            </Grid>
            <Grid item xs={12}>
              Selected Arbitrators: [...]
            </Grid>
            <Grid item xs={12}>
              <FormControl className={classes.textField}>
                <InputLabel>Select Arbitrators</InputLabel>
                <Select
                  labelId="demo-simple-select-helper-label"
                  id="demo-simple-select-helper"
                >
                  {arbitrators.map((arb) => <MenuItem value={arb}>{arb}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="date"
                label="Expiration Date"
                type="date"
                className={classes.textField}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button className={classes.textField} onClick={handleCreateTopic}>
                Submit
              </Button>
            </Grid>
          </Grid>

        </Paper>
      </Modal>
    </>
    )

  );
}

export default CreateTopic;
