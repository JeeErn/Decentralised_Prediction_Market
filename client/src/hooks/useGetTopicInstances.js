import { useEffect, useState } from 'react';

function useGetTopicInstances({ web3, contract, contractAddresses }) {
  const [instances, setInstances] = useState([]);

  useEffect(() => {
    if (web3 && contractAddresses) {
      web3.eth.net.getId().then(() => {
        const temp = [];
        contractAddresses.forEach((address) => {
          const inst = new web3.eth.Contract(
            contract.abi,
            address,
          );
          temp.push(inst);
        });
        setInstances(temp);
      });
    }
  }, [web3, contract, contractAddresses]);
  return instances;
}

export default useGetTopicInstances;
