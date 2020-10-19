// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <=0.7.0;
import "./Topic.sol";

contract PredictionMarket {
    // Structs for users and arbitrators. Default scores = 100
    struct Trader {
        uint winScore;
        uint loseScore;
        bool isValid; 
    }

    struct Arbitrator {
        string displayName;
        uint trustworthiness;
        bool isValid;
    }

    // Maps of addresses to different entities
    mapping (address => Trader) public traders;
    mapping (address => Arbitrator) public arbitrators;
    mapping (address => Topic) public marketTopics;

    // Array of addresses of topics to return to front end
    address[] topicAddresses;

    // Array of addresses of arbitrators to return to front end
    address payable[] arbitratorAddresses;

    // Struct create functions
    function createTrader() public {
        address id = msg.sender;
        // // require that address has not been assigned to a trader
        require(!traders[id].isValid);

        // // create new trader with the default values
        traders[id] = Trader(100, 100, true);
    }

    function createArbitrator(string memory _displayName) public {
        address id = msg.sender;

        // require that address has not been assigned to a arbitrator
        require(!arbitrators[id].isValid);

        // create new arbitrator with the default values
        arbitrators[id] = Arbitrator(_displayName, 50, true);

        arbitratorAddresses.push(address(uint160(id)));
    }

    function getAllArbitrators() public view returns (address payable[] memory) {
        return arbitratorAddresses;
    }


    // Topics
    function createTopic(
        string memory name, string memory description, bytes32[] memory options, uint256 expiryDate, address payable[] memory selectedArbitrators
    ) public payable
        {
        address payable creatorId = msg.sender;

        // Creator must have a trader account
        // TODO: Commented out for testing purposes, uncomment when createTrader is implemented
        // require(traders[creatorId].isValid);

        // Must have value above 0 ETH for payment of creation bond
        require(msg.value > 0 ether);

        // selected arbitrators must have arbitrator account and creator must not select himself as an arbitrator
        require(areValidArbitrators(creatorId, selectedArbitrators));

        uint bondValue = msg.value;
        Topic newTopic = new Topic(creatorId, name, description, options, bondValue, expiryDate, selectedArbitrators, address(this));
        address payable topicAddress = address(uint160(address(newTopic))); // to cast from address to address payable
        marketTopics[topicAddress] = newTopic;
        topicAddresses.push(topicAddress);
        emit TopicCreated(topicAddress);
    }

    function getAllTopics() public view returns (address[] memory) {
        return topicAddresses;
    }

    function areValidArbitrators(address payable creatorId, address payable[] memory selectedArbitrators) internal view returns (bool) {
        uint numSelectedArbitrators = selectedArbitrators.length;
        for (uint i = 0; i < numSelectedArbitrators; i++) {
            address arbitrator = selectedArbitrators[i];
            if (!arbitrators[arbitrator].isValid || creatorId == arbitrator) {
                return false;
            }
        }
        return true;
    }


    // ===============================================================
    // For testing purposes
    // ===============================================================
    event TopicCreated(address _topicAddress);

    function getCreatorAddress(address topicAddress) public view returns (address payable) {
        return marketTopics[topicAddress].topicCreator();
    }

    function getName(address topicAddress) public view returns (string memory) {
        return marketTopics[topicAddress].name();
    }

    function getDescription(address topicAddress) public view returns (string memory) {
        return marketTopics[topicAddress].description();
    }

    function getOptions(address topicAddress) public view returns (bytes32[] memory) {
        return marketTopics[topicAddress].getOptions();
    }

    function getMarketCap(address topicAddress) public view returns (uint) {
        return marketTopics[topicAddress].marketCap();
    }

    function getCreatorBond(address topicAddress) public view returns (uint) {
        return marketTopics[topicAddress].creatorBond();
    }

    function getExpiryDate(address topicAddress) public view returns (uint256) {
        return marketTopics[topicAddress].expiryDate();
    }

    function getSelectedArbitrators(address topicAddress) public view returns (address payable[] memory) {
        return marketTopics[topicAddress].getArbitrators();
    }

    function getCurrentBalance() public view returns (uint) {
        return address(this).balance;
    }

}