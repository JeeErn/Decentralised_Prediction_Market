import { useEffect, useState } from 'react';

function useGetTopicAddressesList({ predictionMarketInstance }) {
  // list of address that are deployed in topics
  const [topicAddressList, setTopicAddressList] = useState([]);

  useEffect(() => {
    if (predictionMarketInstance) {
      predictionMarketInstance.methods.getAllTopics()
        .call()
        .then((addresses) => {
          setTopicAddressList(addresses);
        });
    }
  }, [predictionMarketInstance]);

  return topicAddressList;
}

export default useGetTopicAddressesList;
