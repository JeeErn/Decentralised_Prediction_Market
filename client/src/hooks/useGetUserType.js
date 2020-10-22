/* eslint-disable max-len */
import { useEffect, useState } from 'react';
import Web3 from 'web3';

function useGetUserType({ predictionMarketInstance, accountAddress }) {
  const [userType, setUserType] = useState('');

  const [reputation, setReputation] = useState(0);
  useEffect(() => {
    if (predictionMarketInstance && accountAddress) {
      predictionMarketInstance.methods.getVotersReputation(accountAddress)
        .call()
        .then(([win, lose]) => { setReputation(parseInt(win, 10) / (parseInt(lose, 10) + parseInt(win, 10))); });

      predictionMarketInstance.methods.checkIdentity()
        .call({
          from: accountAddress,
        })
        .then((receipt) => {
          setUserType(Web3.utils.hexToUtf8(receipt).split(' ')[0]);
        });
    }
  });
  return { userType, reputation };
}

export default useGetUserType;