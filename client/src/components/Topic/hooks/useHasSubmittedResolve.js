import { useState, useEffect } from 'react';

function useHasSubmittedResolve({ topicInstance, accountAddress, userType }) {
  const [hasSubmittedResolve, setHasSubmittedResolve] = useState(null);

  useEffect(() => {
    if (userType === 'arbitrator') {
      topicInstance.methods.hasArbitratorVoted(accountAddress)
        .call({ from: accountAddress })
        .then((res) => {
          setHasSubmittedResolve(res);
        });
    }
    if (userType === 'juror') {
      topicInstance.methods.hasJuryVoted(accountAddress)
        .call({ from: accountAddress })
        .then((res) => {
          setHasSubmittedResolve(res);
        });
    }
  }, [accountAddress, topicInstance, userType]);
  return hasSubmittedResolve;
}

export default useHasSubmittedResolve;
