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
  Button, makeStyles, Modal, Typography, Paper, TextField, Grid, MenuItem, Select, FormControl, InputLabel, Input, Chip,
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

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

// BAD STRUCTURE OF GETTING NAMES (POOR COMPLEXITY) - Change this if scalability is a concern or solidity does not return deterministic orders of arrays.
const getSelectedArbitratorAddresses = (selectedArbitrators, arbitrators, arbitratorNames) => {
  const selectedAddresses = [];
  selectedArbitrators.forEach((_name) => {
    const index = arbitratorNames.findIndex((n) => (n === _name));
    selectedAddresses.push(arbitrators[index]);
  });
  return selectedAddresses;
};

function CreateTopic({ predictionMarketInstance, accountAddress }) {
  const classes = useStyles();
  const [name, setName] = useState('Will Joe Biden Win the election');
  const [description, setDescription] = useState('Default Description');
  const [options, setOptions] = useState(['yes', 'no', 'others']);
  const [expiryDate, setExpiryDate] = useState(0);
  const [selectedArbitrators, setSelectedArbitrators] = useState([]);
  const [creatorBond, setCreatorBond] = useState(0.1);
  const [open, setOpen] = useState(false);

  const { arbitrators, arbitratorNames } = useGetArbitrators({ predictionMarketInstance });

  const handleCreateTopic = useCallback(() => {
    const options32Bytes = options.map((option) => Web3.utils.fromAscii(option));
    const selectedArbitratorAddresses = getSelectedArbitratorAddresses(selectedArbitrators, arbitrators, arbitratorNames);
    predictionMarketInstance.methods
      .createTopic(name, description, options32Bytes, expiryDate, selectedArbitratorAddresses)
      .send({ from: accountAddress, value: Web3.utils.toWei(creatorBond.toString(), 'ether') })
      .then(() => {
        window.location.reload(false);
      })
      .catch((error) => { console.log(error); });
  // eslint-disable-next-line max-len
  }, [predictionMarketInstance, name, description, options, expiryDate, selectedArbitrators, accountAddress, creatorBond, arbitratorNames, arbitrators]);

  const handleEditOption = useCallback((event, index) => {
    const temp = [...options];
    temp[index] = event.target.value;
    setOptions(temp);
  });

  const handleModalOpen = useCallback(() => {
    setOpen(true);
  });

  const handleClose = useCallback(() => {
    setOpen(false);
  });

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
              <FormControl className={classes.textField}>
                <InputLabel>Select Arbitrators</InputLabel>
                <Select
                  multiple
                  value={selectedArbitrators}
                  input={<Input id="select-multiple-chip" />}
                  renderValue={(selected) => (
                    <div className={classes.chips}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} className={classes.chip} />
                      ))}
                    </div>
                  )}
                  MenuProps={MenuProps}
                  onChange={(event) => { setSelectedArbitrators(event.target.value); }}
                >
                  {arbitratorNames.map((arbName) => <MenuItem value={arbName}>{arbName}</MenuItem>)}
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
