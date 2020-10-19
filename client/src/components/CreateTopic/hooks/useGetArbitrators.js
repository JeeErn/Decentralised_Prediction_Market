import { useEffect, useState } from 'react';

function useGetArbitrators({ predictionMarketInstance }) {
  const [arbitrators, setArbitrators] = useState([]);

  useEffect(() => {
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
  return arbitrators;
}

export default useGetArbitrators;
