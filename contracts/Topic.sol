// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <=0.7.0;
import "./PredictionMarket.sol";
// import "github.com/OpenZeppelin/zeppelin-solidity/contracts/math/SafeMath.sol";

contract Topic {
  // Public attirbutes
  address payable public topicCreator;
  string public name;
  string public description;
  bytes32[] public options;
  uint public marketCap;
  uint public creatorBond;
  uint256 public expiryDate;
  address payable[] public arbitrators;
  address payable[] public jury;

  // Private attributes
  address parentContract;
  uint16 nonce;

  // Mapping for easier checking of address having been assigned a role
  mapping(address => bool) arbitratorAssigned;
  mapping(address => bool) juryAssigned;

  // Pending votes
  voteStruct[4] pendingVotes;
  struct voteStruct {
    uint price; 
    address payable voter;
  }

  // Last Traded Prices
  uint[4] lastTradedPrices;

  // weighted votes
  uint[4] winScores;
  uint[4] loseScores;

  // Successful trades
  trade[] confirmedTrades;
  struct trade {
    address payable[4] shareOwners;
  }

  struct ArbitratorVote {
        bool hasVoted;
        bytes32 votedOption;
  }

  mapping (address => ArbitratorVote) public arbVotes;
  mapping (bytes32 => address[]) public arbitratorsVotes;
  mapping (bytes32 => uint) public countofArbVotes;

  // State of contract
  // 0 => Open, 1 => Arbitrator Voting, 2 => Jury Voting, 3 => Resolved / closed
  enum Phase { Open, Verification, Jury, Resolved }
  Phase public contractPhase = Phase.Open;

  // FIXME: Ignore linter warning about visibility modifier being ignored. 
  // It is required for successful compilation
  constructor (
      address payable _creator, string memory _name, string memory _description, bytes32[] memory _options, 
      uint _bondValue, uint256 _expiryDate, address payable[] memory _arbitrators, address _predictionMarket
    ) public payable {
        parentContract = _predictionMarket;
        topicCreator = _creator;
        name = _name;
        description = _description;
        options = _options;
        marketCap = 0;
        creatorBond = _bondValue;
        expiryDate = _expiryDate;
        arbitrators = _arbitrators;

        nonce = 23; // FIXME: Random number for the nonce

        // init pending votes
        for (uint i = 0; i < _options.length; i++) {
          pendingVotes[i] = voteStruct(0, address(0));
        }

        for (uint j = 0; j < _arbitrators.length; j++) {
          arbitratorAssigned[_arbitrators[j]] = true;
        }
    }

// TODO: TEST CASES
  function updateWeightedVotes() private {
    PredictionMarket pm = PredictionMarket(parentContract);
    trade memory lastTrade = confirmedTrades[confirmedTrades.length - 1];
    for(uint i=0; i<4; i++){
      address voterAddress = lastTrade.shareOwners[i]; 
      
      if(voterAddress != address(0x0000000000000000000000000000000000000000)){
        // getVotersReputation only accepts a valid voterAddress. 
        uint[2] memory winLose = pm.getVotersReputation(voterAddress);   
        emit UpdateWeightedVotes(voterAddress, winLose);
        winScores[i] = winScores[i] + (winLose[0] * lastTradedPrices[i]);
        loseScores[i] = loseScores[i] + (winLose[1] * (1 - lastTradedPrices[i]));
      }
    }
  }
     
  function voteOption(uint option) public payable returns(bool){
    require(!arbitratorAssigned[msg.sender]);

    uint amount = msg.value;
    require(msg.value < 1 ether);
    // Reject the vote if it is lower than the last available vote
    require(pendingVotes[option].price <  amount);

    // Check if the voter is valid
    PredictionMarket pm = PredictionMarket(parentContract);
    bool validTrader = pm.checkValidTrader(msg.sender);
    require(validTrader);

    // If the vote is higher than the last available price, send money back to the previous voter
    pendingVotes[option].voter.transfer(pendingVotes[option].price);

    // Balance to decide if the vote goes through
    uint balance = 1 ether; 

    // Entry to insert into the confirmed trades if vote goes through
    address payable[4] memory tempTrade;

    for(uint i=0; i< 4; i++){
      if(i != option){
        balance = balance - pendingVotes[i].price; 
        tempTrade[i] = pendingVotes[i].voter;
      }
    }
    
    // If vote can go through
    if(balance <= amount){
      
      // 1) Confirm the trade by putting it into trade confirmed
      tempTrade[option] = msg.sender;
      trade memory tradeConfirmed = trade(tempTrade);
      confirmedTrades.push(tradeConfirmed);
      
      // 2) Update the lastTradedPrices
      for(uint i=0; i< 4; i++){
        if(i == option){
          lastTradedPrices[i] = balance;
        }
        else{
          lastTradedPrices[i]= pendingVotes[i].price;
        }
      }
      

      // 3) Send the remaining money back to the sender
      msg.sender.transfer(amount - balance);

      // 4) Update the weighted votes according to the last trade
      updateWeightedVotes();

      // 5) Reset the pending votes instance
      for(uint i =0; i< 4; i++){
        pendingVotes[i].price =0; 
      }
      return true;
    }

    // If vote cannot go through
    else {
      // Update the pending votes
      voteStruct memory tempVote = voteStruct(amount, msg.sender); 
      pendingVotes[option] = tempVote;
    }
  }

  function addArbitratorVote(bytes32 _option) public {
    require(arbVotes[msg.sender].hasVoted == false); //no double voting
    require(checkIfSelectedArbitrator());
    arbVotes[msg.sender] = ArbitratorVote(true, _option);
    arbitratorsVotes[_option].push(msg.sender);
    countofArbVotes[_option]++;
  }

  function checkIfSelectedArbitrator() public view returns (bool) {
    for (uint i = 0; i < arbitrators.length; i++){
      if(arbitrators[i] == msg.sender) return true;
    }
    return false;
  }

  /*
  resolve() will be called after all selected arbitrators have voted for the truth
  TODO: figure out how to make last arbitrator call resolve function and are we going to charge gas fees to last arbitrator? 
  */
  function resolve() public {
    // if(contractPhase == Phase.Jury){ 
    //   resolveWithTie();
    // }
    
    (bool hasTie, uint winIndex) = getArbitratorVerdict();
    if (!hasTie) {
      resolveWithoutTie(winIndex);
    } else {
      //resolveWithTie();
      //get jury verdict, ie. count their votes --> TODO: write function for this, similar to getArbitratorVerdict()
      //resolveWithoutTie(); 
    }
  }

  function getArbitratorVerdict() public view returns (bool,uint){
    uint largest = 0;
    uint winningOption;
    bool hasTie = false;
    for (uint i =0; i < options.length; i++){
      uint temp = countofArbVotes[options[i]];
      if (temp > largest){
        largest = temp;
        hasTie = false;
        winningOption = i;
      } else if (temp == largest){
        hasTie = true;
      }
    }
    return (hasTie, winningOption);
  }

  function resolveWithoutTie(uint winIndex) public payable returns(uint) {
    PredictionMarket marketInstance = PredictionMarket(parentContract);
    uint temp = 0;
    for(uint i = 0; i<confirmedTrades.length; i++){
      for(uint j = 0; j<confirmedTrades[i].shareOwners.length; j++){
        if (confirmedTrades[i].shareOwners[j] != address(uint160(0x0))){
          temp = temp + 10;
          if(j == winIndex){
            // marketInstance.updateWinScore(address(uint160(confirmedTrades[i].shareOwners[j])));
          payoutToWinners(confirmedTrades[i].shareOwners[j]); 
          } else {
            // marketInstance.updateLoseScore(confirmedTrades[i].shareOwners[j]);
          }
        }
      }
    }
    return temp;
  }

  function payoutToWinners(address payable winner) public payable {
    winner.transfer(0.98 ether);
  }
 
  function resolveWithTie() public {
    contractPhase = Phase.Jury;
    selectJury();
  }

  function selectJury() public {
    PredictionMarket marketInstance = PredictionMarket(parentContract);
    address payable[] memory allArbitrators = marketInstance.getAllArbitrators();

    // If there are less than 5 remaining arbitrators, select all of them as jury
    // Topic creator is excluded from selection as well
    if (allArbitrators.length - arbitrators.length <= 5) {
      uint diff = allArbitrators.length - arbitrators.length;
      address payable[] memory remainingArbitrators = new address payable[](diff);
      uint ptr = 0;
      for (uint k = 0; k < allArbitrators.length; k++) {
        address payable arb = allArbitrators[k];
        if (arbitratorAssigned[arb] || arb == topicCreator) {
          continue;
        }
        juryAssigned[arb] = true;
        remainingArbitrators[ptr] = arb;
        ptr++;
      }
      // If less than diff arbitrators are selected (i.e. one of the remaining is the topic creator)
      // last address will be address(0)
      jury = remainingArbitrators;
      return;
    }

    // Else, create ballot where number of chances is proportional to the arbitrator's trustworthiness
    address payable[] memory ballot = new address payable[](allArbitrators.length * 10); // Max length is when all arbitrators are at 100 score
    uint ballotPointer = 0;

    for (uint i = 0; i < allArbitrators.length; i++) {
      address payable arbitrator = allArbitrators[i];
      if (arbitratorAssigned[arbitrator] || arbitrator == topicCreator) {
        continue;
      }
      (,uint8 trustworthiness,) = marketInstance.arbitrators(arbitrator); // Access trustworthiness score of struct
      uint8 chance = trustworthiness / uint8(10);
      for (uint j = 0; j < chance; j++) {
        ballot[ballotPointer] = arbitrator;
        ballotPointer++;
      }
    }

    // Select random jury from the ballot
    // Rechoose if address is already selected in the jury
    address payable[] memory juryMemory = new address payable[](5);
    uint juryPointer = 0;
    while (juryPointer < 5) {
      uint next = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce))) % ballotPointer;
      nonce++;
      address payable potential = ballot[next];
      if (!juryAssigned[potential]) {
        juryAssigned[potential] = true;
        juryMemory[juryPointer] = potential;
        juryPointer++;
      }
    }
    jury = juryMemory;
  }

  // ===================================================
  // Getters
  // ===================================================

  function getAllPendingVotePrice() view public returns(bytes32[] memory){
    uint len = pendingVotes.length;
    bytes32[] memory bytesArray = new bytes32[](len);
    for (uint i = 0; i < len; i++) {
      bytesArray[i] = bytes32(pendingVotes[i].price);
    }
    return bytesArray;
  } 

  function getLastTradedPrices() view public returns(bytes32[] memory){
    uint len = lastTradedPrices.length;
    bytes32[] memory bytesArray = new bytes32[](len);
    for (uint i = 0; i < len; i++) {
      bytesArray[i] = bytes32(lastTradedPrices[i]);
    }
    return bytesArray;
  }

// Function will return an array of 8 elements in total: [win0, lose0, win1, lose1...]
  function getLoseScores() view public returns(bytes32[] memory){
    uint len = loseScores.length;
    bytes32[] memory bytesArray = new bytes32[](len);
    for (uint i = 0; i < len; i++) {
      bytesArray[i] = bytes32(loseScores[i]);
    }
    return bytesArray;
  }

  // Function will return an array of 8 elements in total: [win0, lose0, win1, lose1...]
  function getWinScores() view public returns(bytes32[] memory){
    uint len = loseScores.length;
    bytes32[] memory bytesArray = new bytes32[](len);
    for (uint i = 0; i < len; i++) {
      bytesArray[i] = bytes32(winScores[i]);
    }
    return bytesArray;
  }

  function balanceOf() external view returns(uint) {
    return address(this).balance;
  }

  function getOptions() public view returns (bytes32[] memory) {
    return options;
  }

  function getArbitrators() public view returns (address payable[] memory) {
    return arbitrators;
  }

  function getJury() public view returns (address payable[] memory) {
    return jury;
  }

  // ===================================================
  // For testing purposes
  // ===================================================
  event UpdateWeightedVotes(address add, uint[2] beforeUpdate);
}
