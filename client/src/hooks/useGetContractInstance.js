import { useEffect, useState } from 'react';

function useGetContract({web3, contract}) {
    const [instance, setInstance] = useState(null);

    useEffect(() => {
        if(web3){
            web3.eth.net.getId().then((netId) => {
                const deployedNetwork = contract.networks[netId]
                const instance = new web3.eth.Contract(
                  contract.abi,
                  deployedNetwork && deployedNetwork.address
                )
                setInstance(instance)
              })
        }
    
    }, [web3, contract])
    return instance;
}

export default useGetContract;