/* eslint-disable max-len */
import { useEffect, useState } from 'react';
import Web3 from 'web3';

function useGetUserInfo({ predictionMarketInstance, accountAddress }) {
  const [userType, setUserType] = useState('');
  const [reputation, setReputation] = useState(0);
  const [arbitratorName, setArbitratorName] = useState(null);

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
          setUserType(Web3.utils.hexToUtf8(receipt).split('  ')[0]);
        });
    }
  }, [accountAddress, predictionMarketInstance]);

  useEffect(() => {
    if (userType === 'Trader and Arbitrator' || userType === 'Arbitrator') {
      predictionMarketInstance.methods.getArbitratorName()
        .call({ from: accountAddress })
        .then((_name) => {
          setArbitratorName(Web3.utils.hexToUtf8(_name).split('  ')[0]);
        });
    }
  }, [accountAddress, predictionMarketInstance, userType]);
  return { userType, reputation, arbitratorName };
}

export default useGetUserInfo;
