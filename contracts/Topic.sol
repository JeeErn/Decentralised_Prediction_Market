// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;
// pragma solidity ^0.7.0;

contract Topic {
  address topicCreator;

  string name;
  string description;
  string[] options;
  uint marketCap;
  uint creatorBond;

  // Pending votes
  voteStruct[4] pendingVotes;
  struct voteStruct {
    uint price; 
    address voter;
  }


  // Successful trades
  trade[] confirmedTrades;
  struct trade {
    address[4] shareOwners;
  }

  constructor (string memory _name) public payable {
      // topicCreator = msg.sender;
      name = _name;
  }

  function voteOption(uint amount, uint option) public payable returns(bool){
    // 1. Transfer the money in
    // 2. If can be resolved now, resolve it and transfer any remaining money
    voteStruct memory vote = voteStruct(amount, msg.sender);

    // Reject the vote if it is lower than the last available vote
    if(pendingVotes[option].price >=  amount){
      return false;
    }

    // Try to resolve the vote
    uint balance = 1000000000000000000; 
    address[4] memory tempTrade;
    for(uint i=0; i< 4; i++){
      if(i != option){
        balance = balance - pendingVotes[i].price; 
        tempTrade[i] = pendingVotes[i].voter;
      }
    }
    
    // Vote can go through
    if(balance < amount){
      // Confirm the trade
      tempTrade[option] = msg.sender;
      trade memory tradeConfirmed = trade(tempTrade);
      confirmedTrades.push(tradeConfirmed);

      // Send the remaining money back to the sender
      msg.sender.transfer(amount - balance);
      // Reset the pending votes instance
      for(uint i =0; i< 4; i++){
        pendingVotes[i].price =0; 
      }
      return true;
    }

    // if vote cannot go through, update the pending votes and keep the money
    else {
      voteStruct memory tempVote = voteStruct(amount, msg.sender); 
      pendingVotes[option] = tempVote;
    }
  }

  function getPendingVotePrice(uint option) view public returns(uint){
    return pendingVotes[option].price;
  } 

  function getAllPendingVotePrice() view public returns(uint){
    // return pendingVotes[0].price,pendingVotes[1].price,pendingVotes[2].price,pendingVotes[3].price;
    return pendingVotes[0].price;
  } 

  //TODO: get All Successful trades, return an array of array of addresses
  // function getAllSuccessfulTrades()

  function balanceOf() external view returns(uint) {
        return address(this).balance;
    }


}
