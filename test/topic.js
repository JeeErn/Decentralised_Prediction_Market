const stringUtils = require("./utils/stringUtil.js");
const Topic = artifacts.require("./Topic.sol");
const PredictionMarket = artifacts.require("./PredictionMarket.sol");

const zeroAddress = "0x0000000000000000000000000000000000000000";

contract("Topic", accounts => {
    let topicInstance = null; 
    before( async () => {
        topicInstance = await Topic.new(accounts[0], "Test", "", [], 0, 0, [accounts[9]], "0xc85E1Ba8F9D7cfdf27ff7604A8802FD589Ac7149");
    })

    it("should be created with the correct initial values", async () => {
        assert.strictEqual(await topicInstance.name(), "Test", "Name is correct");

        const contractPhase = await topicInstance.contractPhase();
        assert.strictEqual(contractPhase.toString(), "0", "state is Open");

        const jury = await topicInstance.getJury();
        jury.forEach(juror => {
            assert.strictEqual(juror, zeroAddress, "juror is init to address(0)");
        });
    })

    it("Test vote", async () => {
        const balanceBef = await topicInstance.balanceOf(); 
        const senderBalanceBef = await web3.eth.getBalance(accounts[0]);
        const pendingVoteBef = await topicInstance.getPendingVotePrice(1);
        assert.equal(pendingVoteBef, 0, "Pending vote for option 1 should be 0 before voting");
        await topicInstance.voteOption(web3.utils.toWei("0.1"), 1, {
            from: accounts[0], 
            value: web3.utils.toWei("0.1"),
        });
        const balanceAft = await topicInstance.balanceOf(); 
        const senderBalanceAft = await web3.eth.getBalance(accounts[0]);
        // Check that balance has been added and deducted
        assert.equal(balanceAft-balanceBef, web3.utils.toWei("0.1"), "Balance added");
        assert.isOk(senderBalanceBef-senderBalanceAft > web3.utils.toWei("0.1"), "Balance deducted");

        // 1) 1 vote is set for option 1 at 0.1 eth, --> Pending vote
        const pendingVoteAft = await topicInstance.getPendingVotePrice(1);
        assert.strictEqual(pendingVoteAft.toString(), web3.utils.toWei("0.1"), "Pending vote for option 1 should be 0.1 after voting");

        // // 2) 1 vote is set for option 2 at 0.1 eth, --> Vote should go through at 0.9 eth
        const sender2BalanceBef = await web3.eth.getBalance(accounts[1]);
        const success = await topicInstance.voteOption(web3.utils.toWei("0.99"), 2, {
            from: accounts[1], 
            value: web3.utils.toWei("0.99"),
        });
        const sender2BalanceAft = await web3.eth.getBalance(accounts[1]);
   
        assert.isOk(success, "Vote should have gone through successfully"); 
        assert.isOk(sender2BalanceBef-sender2BalanceAft < web3.utils.toWei("0.91") && sender2BalanceBef-sender2BalanceAft > web3.utils.toWei("0.90"), "Balance deducted for successful trade should be more than 0.9 but less than 0.91");

        const pendingVoteAft2 = await topicInstance.getPendingVotePrice(1);
        assert.strictEqual(pendingVoteAft2.toString(), web3.utils.toWei("0"), "Pending vote for option 2 should be reset");

    });

    it("should be able to execute resolve with tie and select jury correctly", async () => {
        const predictionMarketInstance = await PredictionMarket.deployed();
        // Make everyone an arbitrator
        for (let i = 0; i < 10; i++) {
            await predictionMarketInstance.createArbitrator("test", { from: accounts[i] });
        }

        // Make account[1] a trader
        await predictionMarketInstance.createTrader({ from: accounts[1] });

        // Create the new topic through the prediction market
        // accounts[8] and accounts[9] are selected arbitrators
        const name = "test";
        const description = "test description foo bar";
        const options = ["option 1"];
        const optionsBytes = stringUtils.stringToBytes(options)
        const expiryDate = (new Date()).getTime();
        const selectedArbitrators = [accounts[8], accounts[9]];
        await predictionMarketInstance.createTopic(name, description, optionsBytes, expiryDate, selectedArbitrators, { from: accounts[1], value: 1.0 });
        events = await predictionMarketInstance.getPastEvents("TopicCreated");
        const topicAddress = events[0].returnValues._topicAddress;

        // Retrieve instance of newly created topic
        let newTopicInstance = await Topic.at(topicAddress);

        // Call resolve with tie
        await newTopicInstance.resolveWithTie();

        // const contractPhase = await topicInstance.contractPhase();
        // assert.strictEqual(contractPhase.toString(), "2", "state is Jury");

        const jury = await topicInstance.getJury();
        console.log(jury);
        selectedArbitrators.forEach(arbitrator => {
            assert.isFalse(jury.includes(arbitrator), "selected arbitrator is not in jury");
        });

        jury.forEach(juror => {
            assert.strictEqual(jury.filter(address => address === juror).length, 1, "address is only selected once per juror");
        });
    });

})