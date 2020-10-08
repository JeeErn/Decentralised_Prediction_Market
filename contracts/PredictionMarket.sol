pragma solidity >=0.4.21 <0.7.0;

contract PredictionMarket {
    // Structs for users and arbitrators. Default scores = 100
    struct Trader {
        int winScore;
        int loseScore;
        bool isValid; 
    }

    struct Arbitrator {
        int trustworthiness;
        bool isValid;
    }

    // Maps of addresses to different entities
    mapping (address => Trader) public traders;
    mapping (address => Arbitrator) public arbitrators;
    // TODO: Uncomment mapping for marketTopic when Topic contract is completed
    // mapping (address => Topic) public marketTopics;


    // Struct create functions
    function createTrader() public {
        address id = msg.sender;

        // require that address has not been assigned to a trader
        require(!traders[id].isValid);

        // create new trader with the default values
        traders[id] = Trader(100, 100, true);
    }

    function createArbitrator() public {
        address id = msg.sender;

        // require that address has not been assigned to a arbitrator
        require(!arbitrators[id].isValid);

        // create new arbitrator with the default values
        arbitrators[id] = Arbitrator(100, true);
    }

    // TODO: To complete createTopic function when Topic contract is completed
    // function createTopic(string _name, string _description, string[] _options, datetime _resolution, address _topicCreator, address[] _arbitrators) public {
    //     // create new topic
    //     // add to map
    // }
}