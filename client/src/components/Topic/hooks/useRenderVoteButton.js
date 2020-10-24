import { useEffect, useState } from 'react';

function useShouldRenderVoteButton({ topicInstance, accountAddress }) {
    const [shouldRenderButton, setShouldRenderButton] = useState(null);

    useEffect(() => {
        topicInstance.methods
            .getAllArbitrators()
            .call()
            .then(arbs => {
                const shouldRender = !arbs.contains(accountAddress);
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