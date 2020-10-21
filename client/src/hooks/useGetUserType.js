import { useEffect, useState } from 'react';
import Web3 from 'web3';

function useGetUserType({ predictionMarketInstance, accountAddress }) {
  const [type, setType] = useState('');

  useEffect(() => {
    if (predictionMarketInstance && accountAddress) {
      predictionMarketInstance.methods.getAllArbitrators()
        .call({
          from: accountAddress,
        })
        .then((r) => {
          console.log(r);
        });
      predictionMarketInstance.methods.checkIdentity()
        .call({
          from: accountAddress,
        })
        .then((receipt) => {
          setType(Web3.utils.hexToUtf8(receipt).split(' ')[0]);
        });
    }
  });
  return type;
}

export default useGetUserType;
