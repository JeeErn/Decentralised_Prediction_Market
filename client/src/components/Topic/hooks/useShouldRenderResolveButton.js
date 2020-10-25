import { useEffect, useState } from 'react';

function useShouldRenderResolveButton({ topicInstance, accountAddress }) {
  const [shouldRenderButton, setShouldRenderButton] = useState(false);

  useEffect(() => {
    topicInstance.methods
      .getArbitrators()
      .call()
      .then((arbs) => {
        const shouldRender = arbs.includes(accountAddress);
        setShouldRenderButton(shouldRender);
      })
      .catch((err) => {
        console.log(err);
        setShouldRenderButton(false);
      });
  }, [shouldRenderButton, setShouldRenderButton, topicInstance, accountAddress]);
  return shouldRenderButton;
}

export default useShouldRenderResolveButton;
