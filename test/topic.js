const stringUtils = require("./utils/stringUtil.js");
const Topic = artifacts.require("./Topic.sol");
const PredictionMarket = artifacts.require("./PredictionMarket.sol");

const zeroAddress = "0x0000000000000000000000000000000000000000";

contract("Topic", accounts => {
    let predictionMarketInstance = null;
    let topicInstance = null; 
    before( async () => {
        // Creates a test topic and initializes 1 trader and 2 arbitrators
        predictionMarketInstance = await PredictionMarket.deployed();
        await predictionMarketInstance.createTrader({from: accounts[0]});
        await predictionMarketInstance.createTrader({from: accounts[1]});
        await predictionMarketInstance.createArbitrator(stringUtils.stringToBytes("test1"), {from: accounts[8]});
        await predictionMarketInstance.createArbitrator(stringUtils.stringToBytes("test2"), {from: accounts[9]});

         // set up variables
         const name = "test";
         const description = "test description foo bar";
         const options = ["option 1", "option 2", "option 3", "option 4"];
         const optionsBytes = stringUtils.stringToBytes(options)
         const expiryDate = (new Date()).getTime();
         const selectedArbitrators = [accounts[8], accounts[9]];
 
         // Create topic and retrieve address
         // Note: accounts[0] trading account is already created as of above test
         topicInstance = await predictionMarketInstance.createTopic(name, description, optionsBytes, expiryDate, selectedArbitrators, { from: accounts[0], value: 1.0 });
         events = await predictionMarketInstance.getPastEvents("TopicCreated");
         assert.isOk(events.length > 0, "events are not null");
         const topicAddress = events[0].returnValues._topicAddress;
         topicInstance = await Topic.at(topicAddress);

    })

    it("should be created with the correct initial values", async () => {
        assert.strictEqual(await topicInstance.name(), "test", "Name is correct");

        const contractPhase = await topicInstance.contractPhase();
        assert.strictEqual(contractPhase.toString(), "0", "state is Open");

        const jury = await topicInstance.getJury();
        jury.forEach(juror => {
            assert.strictEqual(juror, zeroAddress, "juror is init to address(0)");
        });
    })

    it("Test vote", async () => {
        // Create the traders first

        const balanceBef = await topicInstance.balanceOf(); 
        const senderBalanceBef = await web3.eth.getBalance(accounts[0]);
        const pendingVoteBef = await topicInstance.getAllPendingVotePrice();

        assert.equal(parseInt(pendingVoteBef[1], 16), 0, "Pending vote for option 1 should be 0 before voting");
        await topicInstance.voteOption( 1, {
            from: accounts[0], 
            value: web3.utils.toWei("0.1"),
        });
        const balanceAft = await topicInstance.balanceOf(); 
        const senderBalanceAft = await web3.eth.getBalance(accounts[0]);
        // Check that balance has been added and deducted
        assert.equal(balanceAft-balanceBef, web3.utils.toWei("0.1"), "Balance added");
        assert.isOk(senderBalanceBef-senderBalanceAft > web3.utils.toWei("0.1"), "Balance deducted");

        // 1) 1 vote is set for option 1 at 0.1 eth, --> Pending vote
        const pendingVoteAft = await topicInstance.getAllPendingVotePrice();
        assert.strictEqual(parseInt(pendingVoteAft[1], 16), parseInt(web3.utils.toWei("0.1"), 10), "Pending vote for option 1 should be 0.1 after voting");

        // 2) 1 vote is set for option 2 at 0.1 eth, --> Vote should go through at 0.9 eth
        const sender2BalanceBef = await web3.eth.getBalance(accounts[1]);
  

        const success = await topicInstance.voteOption(2, {
            from: accounts[1], 
            value: web3.utils.toWei("0.99"),
        });

        // FOR DEBUGGING PURPOSES IF ERROR COMES UP
        let event = await topicInstance.getPastEvents("UpdateWeightedVotes"); 
        event = event.map((event) => event.returnValues);

        const sender2BalanceAft = await web3.eth.getBalance(accounts[1]);
        assert.isOk(success, "Vote should have gone through successfully"); 
        assert.isOk(sender2BalanceBef-sender2BalanceAft < web3.utils.toWei("0.91") && sender2BalanceBef-sender2BalanceAft > web3.utils.toWei("0.90"), "Balance deducted for successful trade should be more than 0.9 but less than 0.91");

        const pendingVoteAft2 = await topicInstance.getAllPendingVotePrice();
        assert.strictEqual(parseInt(pendingVoteAft2[1], 16).toString(), web3.utils.toWei("0"), "Pending vote for option 2 should be reset");

    });

    it("should be able to execute resolve with tie and select jury correctly", async () => {
        // Make everyone an arbitrator
        const testName = stringUtils.stringToBytes("test");
        for (let i = 0; i < 10; i++) {
            if(i != 8 && i != 9){
                await predictionMarketInstance.createArbitrator(testName, { from: accounts[i] });
            }
        }
        // Creation of topic instance is already done above
        // accounts[8] and accounts[9] are selected arbitrators
        const selectedArbitrators = [accounts[8], accounts[9]];

        // Call resolve with tie
        await topicInstance.resolveWithTie();

        const contractPhase = await topicInstance.contractPhase();
        assert.strictEqual(contractPhase.toString(), "2", "state is Jury");

        const jury = await topicInstance.getJury();
        selectedArbitrators.forEach(arbitrator => {
            assert.isFalse(jury.includes(arbitrator), "selected arbitrator is not in jury");
        });

        jury.forEach(juror => {
            assert.strictEqual(jury.filter(address => address === juror).length, 1, "address is only selected once per juror");
        });
    });

})