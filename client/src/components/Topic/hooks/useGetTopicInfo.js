import { useState, useEffect, useCallback } from 'react';

function useGetTopicInfo({ topicInstance, accountAddress, web3 }) {
  const [name, setName] = useState(null);
  const [balance, setBalance] = useState(null);
  const [optionNames, setOptionNames] = useState([]);
  const [optionPendingPrices, setOptionPendingPrices] = useState([]);
  const [lastTradedPrices, setLastTradedPrices] = useState([]);

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

      // Get Weighted Votes
      topicInstance.methods.getWeightedVotes()
        .call({ from: accountAddress })
        .then((weightedVotes) => {
          console.log(weightedVotes);
        });
    }
  }, [topicInstance, accountAddress, web3]);

  const parseOptionData = useCallback(() => {
    const options = [];
    optionNames.forEach((_name, index) => {
      options.push({
        optionName: _name,
        pendingVotePrice: optionPendingPrices[index],
        lastTradedPrices: lastTradedPrices[index],
      });
    });
    return options;
  }, [optionNames, optionPendingPrices, lastTradedPrices]);

  return { name, balance, options: parseOptionData() };
}

export default useGetTopicInfo;
