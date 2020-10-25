import { useEffect, useState } from 'react';

function useGetContractInstance({ web3, contract }) {
  const [predictionMarketInstance, setPredictionMarketInstance] = useState(null);
  useEffect(() => {
    if (web3) {
      web3.eth.net.getId().then((netId) => {
        const deployedNetwork = contract.networks[netId];
        const inst = new web3.eth.Contract(
          contract.abi,
          deployedNetwork && deployedNetwork.address,
        );

        setPredictionMarketInstance(inst);
      });
    }
  }, [web3, contract]);
  return { predictionMarketInstance };
}

export default useGetContractInstance;
