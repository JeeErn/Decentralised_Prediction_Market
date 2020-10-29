/* eslint-disable no-underscore-dangle */
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
import React, { useCallback, useState, useMemo } from 'react';
import Web3 from 'web3';
import useGetArbitrators from './hooks/useGetArbitrators';

const useStyles = makeStyles(() => ({
  root: {
    width: '100%',
    textAlign: 'center',
    marginTop: '0.9em',
  },
  button: {
    width: '90%',
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

// TODO: CAN OPTIMIZE - SCALABILITY PROBLEM
// Filters arbitrators to not include the current user
const filterArbitrators = ({
  arbitratorNames, arbitratorReputations, arbitrators, accountAddress,
}) => {
  const _names = [];
  const _reps = [];
  const _add = [];
  arbitrators.forEach((add, index) => {
    if (add !== accountAddress) {
      _names.push(arbitratorNames[index]);
      _reps.push(arbitratorReputations[index]);
      _add.push(add);
    }
  });
  return { arbitratorNames: _names, arbitratorReputations: _reps, arbitrators: _add };
};

// TODO: CAN OPTIMIZE - SCALABILITY PROBLEM
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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState([]);
  const [expiryDate, setExpiryDate] = useState(0);
  const [selectedArbitrators, setSelectedArbitrators] = useState([]);
  const [creatorBond, setCreatorBond] = useState(1);
  const [open, setOpen] = useState(false);
  const arbitratorInfo = useGetArbitrators({ predictionMarketInstance });
  // Excludes the current user
  const { arbitrators, arbitratorNames, arbitratorReputations } = useMemo(() => (arbitratorInfo ? filterArbitrators({ accountAddress, ...arbitratorInfo }) : {}), [arbitratorInfo, accountAddress]);

  const handleCreateTopic = useCallback(() => {
    const options32Bytes = options.map((option) => Web3.utils.fromAscii(option));
    const selectedArbitratorAddresses = getSelectedArbitratorAddresses(selectedArbitrators, arbitrators, arbitratorNames);
    const date = new Date(expiryDate).getTime()
    console.log(date);
    predictionMarketInstance.methods
      .createTopic(name, description, options32Bytes, date, selectedArbitratorAddresses)
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
  }, [options]);

  const handleModalOpen = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  return (
    predictionMarketInstance
    && (
    <>
      <div className={classes.root}>
        <Button className={classes.button} onClick={handleModalOpen} variant="outlined" color="primary">
          Create Topic
        </Button>
      </div>

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
                  {arbitratorNames.map((arbName, index) => (
                    <MenuItem value={arbName} key={arbName + index}>
                      {`${arbName} - Reputation: ${arbitratorReputations[index]}`}
                      {' '}
                    </MenuItem>
                  ))}
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
                onChange={ (event) => {
                  setExpiryDate(event.target.value)
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
