import {useState, useEffect, useCallback} from 'react';
function useGetTopicInfo({topicInstance, accountAddress, web3}) {
    const [name, setName] = useState(null);
    const [balance, setBalance] = useState(null);
    const [optionNames, setOptionNames] = useState([]);
    const [optionPendingPrices, setOptionPendingPrices] = useState([]);

    useEffect( () => {
        if (accountAddress && topicInstance) {
            // Get balance
            topicInstance.methods.balanceOf()
            .call({from: accountAddress})
            .then((bal) => {
                    setBalance(web3.utils.fromWei(bal, "ether"));
                }) 
            
            // Get name
            topicInstance.methods.name()
            .call({from: accountAddress})
            .then(name => setName(name)); 

            // Get options
            topicInstance.methods.getOptions()
            .call({from: accountAddress})
            .then(options => {
                options = options.map(optionName => web3.utils.toAscii(optionName))
                setOptionNames(options)})

            // Get pending prices
            topicInstance.methods.getAllPendingVotePrice()
            .call({from: accountAddress})
            .then( prices => {
                prices = prices.map(price => {
                    return web3.utils.fromWei(parseInt(price, 16).toString(), "ether")})
                setOptionPendingPrices(prices)}
            );
        }
        
    }, [topicInstance, accountAddress, web3]); 

    const _parseOptionData = useCallback(() => {
        let options = []; 
        optionNames.forEach( (name, index) => {
            options.push({
                optionName : name, 
                pendingVotePrice : optionPendingPrices[index]
            })
        })
        return options;
    }, [optionNames, optionPendingPrices])
    

    return {name, balance, options : _parseOptionData()}
}

export default useGetTopicInfo;