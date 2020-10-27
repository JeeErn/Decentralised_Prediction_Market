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
        bytes32 displayName;
        uint8 trustworthiness;
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

    // Guard against reentrancy attacks
    mapping (address => bool) transferredToWithinWindow;

    // Struct create functions
    function createTrader() public {
        address id = msg.sender;
        // // require that address has not been assigned to a trader
        require(!traders[id].isValid);

        // // create new trader with the default values
        traders[id] = Trader(100, 100, true);
    }

    function createArbitrator(bytes32 _displayName) public {
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

    function getArbitratorName() public view returns (bytes32){
        return arbitrators[msg.sender].displayName;
    }

    function getAllArbitratorNames() public view returns (bytes32[] memory) {
        uint len = arbitratorAddresses.length;
        bytes32[] memory names = new bytes32[](len);

        for (uint i = 0; i < len; i++) {
            address arbitratorAddress = arbitratorAddresses[i];
            Arbitrator memory arbitrator = arbitrators[arbitratorAddress];
            names[i] = arbitrator.displayName;
        }
        return names;
    }

    function getArbitratorReputations() public view returns (uint[] memory) {
        uint len = arbitratorAddresses.length;
        uint[] memory reputations = new uint[](len);

        for (uint i = 0; i < len; i++) {
            address arbitratorAddress = arbitratorAddresses[i];
            Arbitrator memory arbitrator = arbitrators[arbitratorAddress];
            reputations[i] = arbitrator.trustworthiness;
        }
        return reputations;
    }

    //VOTER'S REPUTATION 
    function getVotersReputation(address id) public view returns (uint[2] memory){
        require(traders[id].isValid);
        return [traders[id].winScore, traders[id].loseScore];
    }

    // AUTHENTICATION
    function checkIdentity() public view returns (bytes32) {
        // Check if user is a trader
        if(traders[msg.sender].isValid && arbitrators[msg.sender].isValid){
            return bytes32("Trader and Arbitrator");
        }

        // Check if user is a trader
        if(traders[msg.sender].isValid){
            return bytes32("Trader");
        }
        // Check if user is an arbitrator
        if(arbitrators[msg.sender].isValid){
            return bytes32("Arbitrator");
        }
        // If all the above fails, return invalid
        return bytes32("Invalid");
    }

    // Check if a trader is valid, this is called from external contracts/ views
    // This function is for internal use between contracts only
    function checkValidTrader(address trader) public view returns (bool) {
        return traders[trader].isValid;
    }


    // Topics
    function createTopic(
        string memory name, string memory description, bytes32[] memory options, uint256 expiryDate, address payable[] memory selectedArbitrators
    ) public payable
        {
        address payable creatorId = msg.sender;

        // Creator must have a trader account
        require(traders[creatorId].isValid);

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

    function updateWinScore(address winnerAddress) public {
        traders[winnerAddress].winScore += 1;
    }

    function getWinScore(address winnerAddress) public view returns (uint){
        Trader storage winner = traders[winnerAddress];
        return winner.winScore;
    }

    function updateLoseScore(address loserAddress) public {
        traders[loserAddress].loseScore += 1;
    }

    function getLoseScore(address loserAddress) public view returns (uint){
        Trader storage loser = traders[loserAddress];
        return loser.loseScore;
    }

    // Transfer creator bond function
    function transferCreatorBond(address payable targetAddress, uint bondValue) external payable {
        if (!transferredToWithinWindow[targetAddress]) {
            transferredToWithinWindow[targetAddress] = true;
            targetAddress.transfer(bondValue);
            transferredToWithinWindow[targetAddress] = false;
        }
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