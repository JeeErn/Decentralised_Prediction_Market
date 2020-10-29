/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
import { useState, useEffect, useCallback } from 'react';

const parseWeightedScores = (winScores, loseScores) => {
  let weightedScores = [];

  winScores.forEach((el, index) => {
    weightedScores.push(winScores[index] / (loseScores[index] + winScores[index]));
  });

  // Computing the ratio
  let total = 0;
  weightedScores.forEach((score) => {
    if (!isNaN(score)) {
      total += score;
    }
  });
  weightedScores = weightedScores.map((score) => (!isNaN(score) ? Math.round((score / total) * 100) : 0));

  return weightedScores;
};

function useGetTopicInfo({ topicInstance, accountAddress, web3 }) {
  const [name, setName] = useState(null);
  const [balance, setBalance] = useState(null);
  const [optionNames, setOptionNames] = useState([]);
  const [description, setDescription] = useState(null);
  const [optionPendingPrices, setOptionPendingPrices] = useState([]);
  const [lastTradedPrices, setLastTradedPrices] = useState([]);
  const [winScores, setWinScores] = useState([]);
  const [loseScores, setLoseScores] = useState([]);
  const [arbitratorAddresses, setArbitratorAddresses] = useState([]);
  const [contractPhase, setContractPhase] = useState(null);
  const [juryAddresses, setJuryAddresses] = useState([]);
  const [winningOptionIndex, setWinningOptionIndex] = useState(null);
  const [expiryDate, setExpiryDate] = useState(null);

  useEffect(() => {
    if (accountAddress && topicInstance) {
      // Get balance
      topicInstance.methods.balanceOf()
        .call({ from: accountAddress })
        .then((bal) => {
          setBalance(web3.utils.fromWei(bal, 'ether'));
        });

      // Get name
      topicInstance.methods.name()
        .call({ from: accountAddress })
        .then((_name) => setName(_name));

      // Get description
      topicInstance.methods.description()
        .call({ from: accountAddress })
        .then((_des) => setDescription(_des));

      // Get options
      topicInstance.methods.getOptions()
        .call({ from: accountAddress })
        .then((options) => {
          let tempOptions = options;
          tempOptions = options.map((optionName) => web3.utils.toAscii(optionName));
          setOptionNames(tempOptions);
        });

      // Get pending prices
      topicInstance.methods.getAllPendingVotePrice()
        .call({ from: accountAddress })
        .then((prices) => {
          let tempPrices = prices;
          tempPrices = prices.map((price) => web3.utils.fromWei(parseInt(price, 16).toString(), 'ether'));
          setOptionPendingPrices(tempPrices);
        });

      // Get Last Traded Prices
      topicInstance.methods.getLastTradedPrices()
        .call({ from: accountAddress })
        .then((prices) => {
          let tempPrices = prices;
          tempPrices = prices.map((price) => web3.utils.fromWei(parseInt(price, 16).toString(), 'ether'));
          setLastTradedPrices(tempPrices);
        });

      // Get Win Scores
      topicInstance.methods.getWinScores()
        .call({ from: accountAddress })
        .then((_winScores) => {
          const _score = _winScores.map((score) => parseInt(score, 16));
          setWinScores(_score);
        });

      // Get Lose Scores
      topicInstance.methods.getLoseScores()
        .call({ from: accountAddress })
        .then((_loseScores) => {
          const _score = _loseScores.map((score) => parseInt(score, 16));
          setLoseScores(_score);
        });

      // Get all Arbitrator names
      topicInstance.methods.getArbitrators()
        .call({ from: accountAddress })
        .then((_arbitratorAddresses) => {
          setArbitratorAddresses(_arbitratorAddresses);
        });

      // Get all Arbitrator names
      topicInstance.methods.getJury()
        .call({ from: accountAddress })
        .then((_juryAddresses) => {
          setJuryAddresses(_juryAddresses);
        });

      // Get topic status
      topicInstance.methods.contractPhase()
        .call({ from: accountAddress })
        .then((_contractPhase) => {
          setContractPhase(parseInt(_contractPhase, 10));
        });

      // Get final outcome if valid
      topicInstance.methods.winningOptionIndex()
        .call({ from: accountAddress })
        .then((_winningOption) => {
          setWinningOptionIndex(parseInt(_winningOption, 10));
        });
      
      // Get expiry date
      topicInstance.methods.expiryDate()
      .call({ from: accountAddress })
      .then((_expiryDate) => {
        setExpiryDate(new Date(parseInt(_expiryDate,10)))
      });
    }
  }, [topicInstance, accountAddress, expiryDate]);

  const parseOptionData = useCallback(() => {
    const options = [];

    optionNames.forEach((_name, index) => {
      options.push({
        optionName: _name,
        pendingVotePrice: optionPendingPrices[index],
        lastTradedPrices: lastTradedPrices[index],
        weightedScore: parseWeightedScores(winScores, loseScores)[index],
      });
    });
    return options;
  }, [optionNames, optionPendingPrices, lastTradedPrices, winScores, loseScores]);

  return {
    name, description, balance, arbitratorAddresses, juryAddresses, contractPhase, options: parseOptionData(), winningOptionIndex, expiryDate
  };
}

export default useGetTopicInfo;
