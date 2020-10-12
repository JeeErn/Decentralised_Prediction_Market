import React, { useState, useEffect } from 'react';
import TopicContract from '../contracts/Topic.json'



function Topic({topicInstance, accountAddress}) {


    const [name, setName] = useState(null);
    const [balance, setBalance] = useState(null);
    
    useEffect( () => {
        if (accountAddress && topicInstance) {
            // Get balance
            topicInstance.methods.balanceOf()
            .call({from: accountAddress})
            .then((receipt) => {
                    setBalance(receipt);
                }) 
                
            // For testing purposes
            topicInstance.methods.getTestName().call({from: accountAddress})
            .then(res => 
                setName(res)
                )
            .catch(error => console.log(error))
            
        }
       
        
        
        
    }, [topicInstance, accountAddress]); 

    return (
        <div>
            Balance : {balance} 
            <br/>
            Topic Component : {name}
        </div>
    );
}

export default Topic;