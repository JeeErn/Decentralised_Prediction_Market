import { useEffect, useState } from 'react';

function useShouldRenderVoteButton(topicInstance, accountAddress) {
    const [shouldRenderButton, setShouldRenderButton] = useState(null);

    useEffect(() => {
        topicInstance.methods
            .getArbitrators()
            .call()
            .then(arbs => {
                const shouldRender = !arbs.includes(accountAddress);
                setShouldRenderButton(shouldRender);
            })
            .catch(err => {
                console.log(err);
                setShouldRenderButton(false);
            });
    }, [shouldRenderButton, setShouldRenderButton, topicInstance]);
    return shouldRenderButton;
}

export default useShouldRenderVoteButton;