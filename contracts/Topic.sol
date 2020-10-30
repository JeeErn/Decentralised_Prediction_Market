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
  uint public winningOptionIndex;

  // Private attributes
  address parentContract;
  uint16 nonce;
  uint8 numArbitratorVoted;
  uint numOfJury;
  uint8 numJuryVoted;
  mapping (address => bool) hasBoughtShare;

  // Guard against reentrancy => applicable for all receivers of ether
  mapping (address => bool) hasReceivedPayout;

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
    uint[4] price;
  }

  // Arbitrator voting related variables
  struct SelectedArbitrator {
        bool isAssigned;
        bool hasVoted;
        bytes32 votedOption;
  }

  mapping (address => SelectedArbitrator) public selectedArbitrators;
  mapping (bytes32 => address[]) public arbitratorsVotes;
  mapping (bytes32 => uint) public countofArbVotes;

  // Jury voting related variables
  struct SelectedJury {
      bool isAssigned;
      bool hasVoted;
      bytes32 votedOption;
  }
  mapping (address => SelectedJury) public selectedJurys;
  mapping (bytes32 => address[]) public jurysVotes;
  mapping (bytes32 => uint) public countofJuryVotes;

  // State of contract
  // 0 => Open, 1 => Arbitrator Voting, 2 => Jury Voting, 3 => Resolved / closed
  enum Phase { Open, Verification, Jury, Resolved }
  Phase public contractPhase;

  // NOTE: Ignore linter warning about visibility modifier being ignored. 
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
        contractPhase = Phase.Open;

        nonce = 23; // NOTE: Random number for the nonce
        numArbitratorVoted = 0;
        numJuryVoted = 0;
        winningOptionIndex = 10; // Assign random value not within [0, 3]

        // init pending votes
        for (uint i = 0; i < _options.length; i++) {
          pendingVotes[i] = voteStruct(0, address(0));
        }

        for (uint j = 0; j < _arbitrators.length; j++) {
          selectedArbitrators[_arbitrators[j]] = SelectedArbitrator(true, false, bytes32(0));
        }
    }

// TODO: TEST CASES
  function updateWeightedVotes() private {
    PredictionMarket pm = PredictionMarket(parentContract);
    trade memory lastTrade = confirmedTrades[confirmedTrades.length - 1];
    for(uint i=0; i<4; i++){
      address voterAddress = lastTrade.shareOwners[i]; 
      
      if(voterAddress != address(0)){
        // getVotersReputation only accepts a valid voterAddress. 
        uint[2] memory winLose = pm.getVotersReputation(voterAddress);   
        emit UpdateWeightedVotes(voterAddress, winLose);
        winScores[i] = winScores[i] + (winLose[0] * lastTradedPrices[i]);
        loseScores[i] = loseScores[i] + (winLose[1] * (1 - lastTradedPrices[i]));
      }
    }
  }
     
  function voteOption(uint option, uint256 timeStamp) public payable returns (bool) {
    if (timeStamp > expiryDate) {
      openPhaseToVerificationPhase();
      return false;
    }
    require(!selectedArbitrators[msg.sender].isAssigned);
    require(contractPhase == Phase.Open);

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
    uint[4] memory tempPrice;

    for(uint i=0; i< 4; i++){
      if(i != option){
        balance = balance - pendingVotes[i].price; 
        tempTrade[i] = pendingVotes[i].voter;
        tempPrice[i] = pendingVotes[i].price;
      }
    }

    // Update hasBoughtShare
    hasBoughtShare[msg.sender] = true;
    
    // If vote can go through
    if(balance <= amount){
      
      // 1) Confirm the trade by putting it into trade confirmed
      tempTrade[option] = msg.sender;
      tempPrice[option] = balance;
      trade memory tradeConfirmed = trade(tempTrade, tempPrice);
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
        pendingVotes[i].price = 0;
        pendingVotes[i].voter = address(0);
      }

      // 6) Add to market cap for future payouts calculations
      marketCap += 1 ether;
      return true;
    }

    // If vote cannot go through
    else {
      // Update the pending votes
      voteStruct memory tempVote = voteStruct(amount, msg.sender); 
      pendingVotes[option] = tempVote;
    }
  }

  function openPhaseToVerificationPhase() public { // FIXME: Change visibility to internal before deploying on testnet!
    if (contractPhase == Phase.Open) { 
      contractPhase = Phase.Verification;
    }
    refundPendingVotes();
  }

  function refundPendingVotes() internal {
    for(uint i = 0; i< 4; i++) {
      if (pendingVotes[i].voter == address(0)) {
        continue;
      }
      address payable refundAddress = pendingVotes[i].voter;
      uint amount = pendingVotes[i].price;
      if (hasReceivedPayout[refundAddress]) {
        continue;
      }
      pendingVotes[i].price = 0;
      pendingVotes[i].voter = address(0);
      hasReceivedPayout[refundAddress] = true;
      refundAddress.transfer(amount);
      hasReceivedPayout[refundAddress] = false;
    }
  }

  function addArbitratorVote(bytes32 _option, uint256 timeStamp, bool forUnitTest) public { // FIXME: Remove unit test options before deploying to testnet!
    // Shift contract phase
    require(timeStamp > expiryDate);
    if (contractPhase == Phase.Open) {
      openPhaseToVerificationPhase();
    }
    require(contractPhase == Phase.Verification);
    require(!selectedArbitrators[msg.sender].hasVoted); //no double voting
    require(selectedArbitrators[msg.sender].isAssigned);
    selectedArbitrators[msg.sender].hasVoted = true;
    selectedArbitrators[msg.sender].votedOption = _option;
    arbitratorsVotes[_option].push(msg.sender);
    countofArbVotes[_option]++;

    // Trigger resolve if all selected arbitrators have voted
    numArbitratorVoted++;
    if (numArbitratorVoted == arbitrators.length) {
      emit ResolveCalled("Arbitrator");
      resolve(forUnitTest);
    }
  }

  function addJuryVote(bytes32 _option, bool forUnitTest) public { // FIXME: Remove unit test options before deploying to testnet!
    require(contractPhase == Phase.Jury); // require it to be in jury phase
    require(!selectedJurys[msg.sender].hasVoted); //no double voting
    require(selectedJurys[msg.sender].isAssigned);
    selectedJurys[msg.sender].hasVoted = true;
    selectedJurys[msg.sender].votedOption = _option;
    jurysVotes[_option].push(msg.sender);
    countofJuryVotes[_option]++;

    // Trigger resolve if all selected jury have voted
    numJuryVoted++;
    if (numJuryVoted == numOfJury) {
      emit ResolveCalled("Jury");
      resolve(forUnitTest);
    }
  }

  // Getter function for test
  function checkIfSelectedArbitrator() public view returns (bool) {
    return selectedArbitrators[msg.sender].isAssigned;
  }

  /*
  resolve() will be called after all selected arbitrators have voted for the truth
  TODO: figure out how to make last arbitrator call resolve function and are we going to charge gas fees to last arbitrator? 
  NOTE: Events for testing purpose. Can see if FE requires events as well else remove before deployment on testnet
  */
  event ResolveCalled(string source);

  function resolve(bool forUnitTest) internal { // FIXME: Remove unit test options before deploying to testnet!
    require(contractPhase != Phase.Open && contractPhase != Phase.Resolved);
    if(contractPhase == Phase.Jury){ 
      uint finalWinIndex = getJuryVerdict();
      winningOptionIndex = finalWinIndex;
      resolveWithoutTie(finalWinIndex, forUnitTest);
      return;
    }
    
    (bool hasTie, uint winIndex) = getArbitratorVerdict();
    if (!hasTie) {
      winningOptionIndex = winIndex;
      resolveWithoutTie(winIndex, forUnitTest);
    } else {
      resolveWithTie();
    }
  }

  function getJuryVerdict() internal view returns (uint) {
    uint largest = 0;
    uint winningOption;
    for (uint i = 0; i < options.length; i++){
      uint temp = countofJuryVotes[options[i]];
      if (temp > largest){
        largest = temp;
        winningOption = i;
      }
    }
    return winningOption;
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

  function updateArbitratorsTrustworthiness(uint winIndex) public {
    PredictionMarket marketInstance = PredictionMarket(parentContract);
    for (uint o=0; o < options.length; o++){
        for (uint i=0; i<arbitratorsVotes[options[o]].length; i++){
          if (o == winIndex){
            marketInstance.updateHonestTrustworthiness(arbitratorsVotes[options[o]][i]);
          } else {
            marketInstance.updateDishonestTrustworthiness(arbitratorsVotes[options[o]][i]);
          }
        }
      }
  }

  // TODO: Payout to arbitrators, jury/creator
  function resolveWithoutTie(uint winIndex, bool forUnitTest) public payable returns(uint) { // FIXME: Remove unit test options before deploying to testnet!
    require(contractPhase != Phase.Open && contractPhase != Phase.Resolved); // Check required as function is public
    PredictionMarket marketInstance = PredictionMarket(parentContract);
    uint temp = 0;
    
    for(uint i = 0; i<confirmedTrades.length; i++){
      for(uint j = 0; j<confirmedTrades[i].shareOwners.length; j++){
        if (confirmedTrades[i].shareOwners[j] != address(uint160(0x0))){
          temp = temp + 10;
          if(j == winIndex){
            marketInstance.updateWinScore(confirmedTrades[i].shareOwners[j], 100*(1-confirmedTrades[i].price[j]));
            payoutToWinners(confirmedTrades[i].shareOwners[j]);
          } else {
            marketInstance.updateLoseScore(confirmedTrades[i].shareOwners[j], 100*confirmedTrades[i].price[j]);
          }
        }
      }
    }

    updateArbitratorsTrustworthiness(winIndex);

    if (!forUnitTest) {
      payoutToArbitrators(winIndex);
      if (contractPhase != Phase.Jury) {
        payoutToCreator();
      } else {
        payoutToJury(winIndex);
      }
    }
    contractPhase = Phase.Resolved;
    return temp;
  }

  function payoutToCreator() internal {
    if (!hasReceivedPayout[topicCreator]) {
      hasReceivedPayout[topicCreator] = true;
      topicCreator.transfer(uint(marketCap) / uint(100));
      PredictionMarket marketInstance = PredictionMarket(parentContract);
      marketInstance.transferCreatorBond(topicCreator, uint(creatorBond));
    }
  }

  function payoutToJury(uint winIndex) internal {
    PredictionMarket marketInstance = PredictionMarket(parentContract);

    // Creator bond is forfeited to the jury
    uint juryShare = (uint(marketCap) / uint(100)); // integer division
    bytes32 winningOption = options[winIndex];
    uint numWinners = countofJuryVotes[winningOption];
    for (uint i = 0; i < numWinners; i++) {
      address payable winningJury = address(uint160(jurysVotes[winningOption][i]));
      hasReceivedPayout[winningJury] = true;
      uint transferAmount = uint(juryShare) / uint(numWinners);
      marketInstance.transferCreatorBond(winningJury, (uint(creatorBond) / numWinners));
      winningJury.transfer(transferAmount);
    }
  }

  function payoutToArbitrators(uint winIndex) internal {
    uint arbitratorShare = uint(marketCap) / uint(100); // integer division
    bytes32 winningOption = options[winIndex];
    uint numWinners = countofArbVotes[winningOption];
    for (uint i = 0; i < numWinners; i++) {
      address payable winningArbitrator = address(uint160(arbitratorsVotes[winningOption][i]));
      hasReceivedPayout[winningArbitrator] = true;
      winningArbitrator.transfer(uint(arbitratorShare) / uint(numWinners));
    }
  }

  function payoutToWinners(address payable winner) public {
    if (!hasReceivedPayout[winner]) {
      hasReceivedPayout[winner] = true;
      winner.transfer(0.98 ether);
      hasReceivedPayout[winner] = false; // set back to false in case trader bought more than 1 share
    }
  }
 
  // FIXME: Change visibility to internal before deploying on testnet!
  // Use public for unit tests
  function resolveWithTie() public {
    contractPhase = Phase.Jury;
    selectJury();
  }

  function selectJury() internal {
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
        if (selectedArbitrators[arb].isAssigned || arb == topicCreator || hasBoughtShare[arb]) {
          continue;
        }
        selectedJurys[arb] = SelectedJury(true, false, bytes32(0));
        remainingArbitrators[ptr] = arb;
        ptr++;
      }
      // If less than diff arbitrators are selected (i.e. one of the remaining is the topic creator)
      // last address will be address(0)
      jury = remainingArbitrators;
      numOfJury = ptr; // Ptr will indicate how many jury were selected in the end
      return;
    }

    // Else, create ballot where number of chances is proportional to the arbitrator's trustworthiness
    address payable[] memory ballot = new address payable[](allArbitrators.length * 10); // Max length is when all arbitrators are at 100 score
    uint ballotPointer = 0;

    for (uint i = 0; i < allArbitrators.length; i++) {
      address payable arbitrator = allArbitrators[i];
      if (selectedArbitrators[arbitrator].isAssigned || arbitrator == topicCreator || hasBoughtShare[arbitrator]) {
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
    // Max tries is bounded by 51 => For 1st 4 jury, repeated hit their address again = 4 * 10, 
    // 10 additional tries if creator is arbitrator, hence 51st try is guaranteed to resolve
    uint8 triesLeft = 51; 
    while (juryPointer < 5 && triesLeft > 0) {
      uint next = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce))) % ballotPointer;
      nonce++;
      address payable potential = ballot[next];
      if (!selectedJurys[potential].isAssigned) {
        selectedJurys[potential] = SelectedJury(true, false, bytes32(0));
        juryMemory[juryPointer] = potential;
        juryPointer++;
      }
      triesLeft--;
    }
    jury = juryMemory;
    numOfJury = juryPointer; // Jury pointer would indicate number of jury members finally selected. Should be 5 but can be lower in edge cases
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

  // Gets all the addresses for the people who voted for that option
  function getConfirmedTradeAddresses(uint option) public view returns (address payable[] memory){
    uint len = confirmedTrades.length;
    address payable[] memory addArray = new address payable[](len);
    for (uint i = 0; i < len; i++) {
      addArray[i] = confirmedTrades[i].shareOwners[option];
    }
    return addArray;
  }

  // Gets all the addresses for the people who voted for that option
  function getConfirmedTradePrices(uint option) public view returns (bytes32[] memory){
    uint len = confirmedTrades.length;
    bytes32[] memory bytesArray = new bytes32[](len);
    for (uint i = 0; i < len; i++) {
      bytesArray[i] = bytes32(confirmedTrades[i].price[option]);
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

  function hasArbitratorVoted(address arbitratorAddress) public view returns (bool) {
    return selectedArbitrators[arbitratorAddress].hasVoted;
  }

  function hasJuryVoted(address juryAddress) public view returns (bool) {
    return selectedJurys[juryAddress].hasVoted;
  }



  // ===================================================
  // For testing purposes
  // ===================================================
  event UpdateWeightedVotes(address add, uint[2] beforeUpdate);

  function getNumOfJurySelected() public view returns (uint) {
    return numOfJury;
  }

  function getLastConfirmedTradeAddresses() public view returns (address, address, address, address) {
    trade memory lastConfirmedTrade = confirmedTrades[confirmedTrades.length - 1];
    address payable[4] memory tradeOwners = lastConfirmedTrade.shareOwners;
    return (tradeOwners[0], tradeOwners[1], tradeOwners[2], tradeOwners[3]);
  }
}
