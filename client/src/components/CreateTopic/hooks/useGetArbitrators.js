import { useEffect, useState } from 'react';
import Web3 from 'web3';

function useGetArbitrators({ predictionMarketInstance }) {
  const [arbitrators, setArbitrators] = useState([]);
  const [arbitratorNames, setArbitratorNames] = useState([]);

  useEffect(() => {
    predictionMarketInstance.methods
      .getAllArbitratorNames()
      .call()
      .then((names) => {
        const temp = names.map((name) => Web3.utils.toAscii(name));
        setArbitratorNames(temp);
      });

    predictionMarketInstance.methods
      .getAllArbitrators()
      .call()
      .then((arb) => {
        setArbitrators(arb);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [JSON.stringify(arbitrators), setArbitrators, predictionMarketInstance]);
  return { arbitrators, arbitratorNames };
}

export default useGetArbitrators;
