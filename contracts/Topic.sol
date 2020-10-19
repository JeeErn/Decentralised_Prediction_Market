// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;
// pragma solidity ^0.7.0;

contract Topic {

  address payable public topicCreator;
  string public name;
  string public description;
  bytes32[] public options;
  uint public marketCap;
  uint public creatorBond;
  uint256 public expiryDate;
  address payable[] public arbitrators;

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

  constructor (
      address payable _creator, string memory _name, string memory _description, bytes32[] memory _options, 
      uint _bondValue, uint256 _expiryDate, address payable[] memory _arbitrators
    ) public payable {
        topicCreator = _creator;
        name = _name;
        description = _description;
        options = _options;
        marketCap = 0;
        creatorBond = _bondValue;
        expiryDate = _expiryDate;
        arbitrators = _arbitrators;

        // init pending votes
        for (uint i = 0; i < _options.length; i++) {
          pendingVotes[i] = voteStruct(0, address(0));
        }
    }

     


  function voteOption(uint amount, uint option) public payable returns(bool){
    // 1. Transfer the money in
    // 2. If can be resolved now, resolve it and transfer any remaining money
    voteStruct memory vote = voteStruct(amount, msg.sender);

    // Reject the vote if it is lower than the last available vote
    require(pendingVotes[option].price <  amount);

    // Try to resolve the vote
    uint balance = 1 ether; 
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


  function getAllPendingVotePrice() view public returns(bytes32[] memory){
    uint len = pendingVotes.length;
    bytes32[] memory bytesArray = new bytes32[](len);
    for (uint i = 0; i < len; i++) {
      bytesArray[i] = bytes32(pendingVotes[i].price);
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
