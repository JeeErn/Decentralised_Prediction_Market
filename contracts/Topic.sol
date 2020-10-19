// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <=0.7.0;
import "./PredictionMarket.sol";

contract Topic {
  address parentContract;
  address payable public topicCreator;
  string public name;
  string public description;
  bytes32[] public options;
  uint public marketCap;
  uint public creatorBond;
  uint256 public expiryDate;
  address payable[] public arbitrators;
  address payable[5] public jury;
  uint nonce;

  // Pending votes
  voteStruct[4] pendingVotes;
  struct voteStruct {
    uint price; 
    address payable voter;
  }

  // Last Traded Prices
  uint[4] lastTradedPrices;

  // Successful trades
  trade[] confirmedTrades;
  struct trade {
    address payable[4] shareOwners;
  }

  // State of contract
  enum Phase { Open, Verification, Jury, Resolved }
  Phase public contractPhase;


  constructor (
      address payable _creator, string memory _name, string memory _description, bytes32[] memory _options, 
      uint _bondValue, uint256 _expiryDate, address payable[] memory _arbitrators
    ) payable {
        topicCreator = _creator;
        name = _name;
        description = _description;
        options = _options;
        marketCap = 0;
        creatorBond = _bondValue;
        expiryDate = _expiryDate;
        arbitrators = _arbitrators;
        jury = [address(0), address(0), address(0), address(0), address(0)];

        nonce = 23; // Random number for the nonce

        // init pending votes
        for (uint i = 0; i < _options.length; i++) {
          pendingVotes[i] = voteStruct(0, address(0));
        }

        // set state to Open
        contractPhase = Phase.Open;
    }

     
  function voteOption(uint amount, uint option) public payable returns(bool){
    // Reject the vote if it is lower than the last available vote
    require(pendingVotes[option].price <  amount);

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
      
      // 1) Confirm the trade
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
      // 4) Reset the pending votes instance
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

  function resolveWithTie() public {
    contractPhase = Phase.Jury;
    selectJury();
  }

  function selectJury() public {
    PredictionMarket marketInstance = PredictionMarket(parentContract);
    address payable[] memory allArbitrators = marketInstance.getAllArbitrators();
    address payable[] memory ballot = new address payable[](allArbitrators.length * 10); // Max length is when all arbitrators are at 100 score
    uint ballotPointer = 0;

    for (uint i = 0; i < allArbitrators.length; i++) {
      address payable arbitrator = allArbitrators[i];
      if (isASelectedArbitrator(arbitrator)) {
        continue;
      }
      (,uint trustworthiness,) = marketInstance.arbitrators(arbitrator); // Access trustworthiness score of struct
      uint chance = trustworthiness / uint(10);
      for (uint j = 0; j < chance; j++) {
        ballot[ballotPointer] = arbitrator;
        ballotPointer++;
      }
    }

    // Select random jury from the ballot
    // Rechoose if address is already selected in the jury
    uint juryPointer = 0;
    while (jury[4] == address(0)) {
      uint next = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce))) % ballotPointer;
      nonce++;
      address payable potential = ballot[next];
      if (!hasBeenSelectedAsJury(potential, juryPointer)) {
        jury[juryPointer] = potential;
        juryPointer++;
      }
    }
  }

  function hasBeenSelectedAsJury(address payable potential, uint pointer) internal view returns (bool) {
    for (uint k = 0; k < pointer; k++) {
      if (jury[k] == potential) {
        return true;
      }
    }
    return false;
  }

  function isASelectedArbitrator(address payable arbitrator) internal view returns (bool) {
    for (uint i = 0; i < arbitrators.length; i++) {
      if (arbitrator == arbitrators[i]) {
        return true;
      }
    }
    return false;
  }

  // ===================================================
  // Getters
  // ===================================================

  function getPendingVotePrice(uint option) view public returns(uint){
    return pendingVotes[option].price;
  } 


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

  function balanceOf() external view returns(uint) {
    return address(this).balance;
  }

  function getOptions() public view returns (bytes32[] memory) {
    return options;
  }

  function getArbitrators() public view returns (address payable[] memory) {
    return arbitrators;
  }
}
