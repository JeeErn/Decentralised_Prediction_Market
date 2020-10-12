pragma solidity >=0.4.21 <0.7.0;
import "./Topic.sol";

contract PredictionMarket {
    // Structs for users and arbitrators. Default scores = 100
    struct Trader {
        uint winScore;
        uint loseScore;
        bool isValid; 
    }

    struct Arbitrator {
        int trustworthiness;
        bool isValid;
    }

    // Maps of addresses to different entities
    mapping (address => Trader) public traders;
    mapping (address => Arbitrator) public arbitrators;
    mapping (address => Topic) public marketTopics;


    // Struct create functions
    function createTrader() public {
        address id = msg.sender;
        // // require that address has not been assigned to a trader
        require(!traders[id].isValid);

        // // create new trader with the default values
        traders[id] = Trader(100, 100, true);
    }

    function createArbitrator() public {
        address id = msg.sender;

        // require that address has not been assigned to a arbitrator
        require(!arbitrators[id].isValid);

        // create new arbitrator with the default values
        arbitrators[id] = Arbitrator(100, true);
    }


    // Topics
    function createTopic(
        string memory name, string memory description, bytes32[] memory options, uint256 expiryDate
    ) public payable
        {
        address payable creatorId = msg.sender;

        // Creator must have a trader account
        require(traders[creatorId].isValid);

        // Must have value above 0 ETH for payment of creation bond
        require(msg.value > 0 ether);

        uint bondValue = msg.value;
        Topic newTopic = new Topic(creatorId, name, description, options, bondValue, expiryDate);
        address payable topicAddress = address(uint160(address(newTopic))); // to cast from address to address payable
        marketTopics[topicAddress] = newTopic;
        emit TopicCreated(topicAddress);
    }

    // // TODO: To complete createTopic function when Topic contract is completed
    // function createTopic(string _name, string _description, string[] _options, datetime _resolution, address _topicCreator, address[] _arbitrators) public {
    //     // create new topic
    //     return new Topic()
    // }

    // ===============================================================
    // For testing purposes
    // ===============================================================
    event TopicCreated(address _topicAddress);

    function getCreatorAddress(address payable topicAddress) public view returns (address payable) {
        return marketTopics[topicAddress].topicCreator();
    }

    function getName(address payable topicAddress) public view returns (string memory) {
        return marketTopics[topicAddress].name();
    }

    function getDescription(address payable topicAddress) public view returns (string memory) {
        return marketTopics[topicAddress].description();
    }

    function getOptions(address payable topicAddress) public view returns (bytes32[] memory) {
        return marketTopics[topicAddress].getOptions();
    }

    function getMarketCap(address payable topicAddress) public view returns (uint) {
        return marketTopics[topicAddress].marketCap();
    }

    function getCreatorBond(address payable topicAddress) public view returns (uint) {
        return marketTopics[topicAddress].creatorBond();
    }

    function getExpiryDate(address payable topicAddress) public view returns (uint256) {
        return marketTopics[topicAddress].expiryDate();
    }

    function getCurrentBalance() public view returns (uint) {
        return address(this).balance;
    }

}