const { resolve4 } = require("dns");
const stringUtils = require("./utils/stringUtil.js");
const Topic = artifacts.require("./Topic.sol");
const PredictionMarket = artifacts.require("./PredictionMarket.sol");

const zeroAddress = "0x0000000000000000000000000000000000000000";

contract("Topic", accounts => {
    let predictionMarketInstance = null;
    let topicInstance = null; 
    let resolveTopicInstance = null;
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

        // TODO: put this in a specific test case instead 
        const options1 = stringUtils.stringToBytes(["option 1", "option 2", "option 3", "option 4"]);
        // topicInstance = await Topic.new(accounts[0], "Test", "", [], 0, 0, [accounts[9],accounts[8]], "0xc85E1Ba8F9D7cfdf27ff7604A8802FD589Ac7149");
        resolveTopicInstance = await Topic.new(accounts[0], "TestResolve", "My bets will make me a billionaire", options1, 0, 0, [accounts[9],accounts[8],accounts[7]],"0xc85E1Ba8F9D7cfdf27ff7604A8802FD589Ac7149");
        payoutTopicInstance = await Topic.new(accounts[0], "TestPayOut", "My bets will make me a billionaire", options1, 0, 0, [accounts[9],accounts[8],accounts[7]],"0xc85E1Ba8F9D7cfdf27ff7604A8802FD589Ac7149");
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

    context("with the addArbitratorVote and getArbitratorVerdict", async () => {
        const options = stringUtils.stringToBytes(["option 1", "option 2", "option 3", "option 4"]);
        it("should be able to add arbitrator's vote", async () => {
            await resolveTopicInstance.addArbitratorVote(options[0], {from: accounts[9]});
            await resolveTopicInstance.addArbitratorVote(options[3], {from: accounts[8]});
            const arbitratorNineVoteStatus = await resolveTopicInstance.selectedArbitrators(accounts[9]);
            const numVotesForOptionZero = await resolveTopicInstance.countofArbVotes(options[0]);
            const arbVotedAccNine = await resolveTopicInstance.arbitratorsVotes(options[0],0);
            const arbVotedAccEight = await resolveTopicInstance.arbitratorsVotes(options[3],0);
            assert.isTrue(arbitratorNineVoteStatus[0]);
            assert.strictEqual(accounts[9],arbVotedAccNine);
            assert.strictEqual(accounts[8],arbVotedAccEight);
            assert.strictEqual(Number(numVotesForOptionZero), 1);
        });

        it("should be able to allow authorized arbitrator to vote", async () => {
            const isSelected = await resolveTopicInstance.checkIfSelectedArbitrator({from: accounts[9]});
            const isNotSelected = await resolveTopicInstance.checkIfSelectedArbitrator({from: accounts[3]});
            assert.isTrue(isSelected);
            assert.isFalse(isNotSelected);
        });

        it("should be able to get True hasTie condition", async () => {
            const a = await resolveTopicInstance.countofArbVotes(options[0]);
            const b = await resolveTopicInstance.countofArbVotes(options[3]);
            const result = await resolveTopicInstance.getArbitratorVerdict({from: accounts[9]});
            const listOptions = await resolveTopicInstance.getOptions({from: accounts[9]});
            // console.log(options[0]);
            // console.log(b);
            assert.isTrue(result[0]);
            // console.log(result[1]);
            // console.log(listOptions);
        });

        it("should be able to get False hasTie condition and winning option", async () => {
            await resolveTopicInstance.addArbitratorVote(options[3], {from: accounts[7]});
            const result = await resolveTopicInstance.getArbitratorVerdict({from: accounts[7]});
            assert.isFalse(result[0]);
            assert.strictEqual(3,Number(result[1]));
        });
    });

    context("with resolution without tie", async () => {
        xit("should be able to increase winScore and loseScore and payoutToWinners", async () => {
            // const resolvePredMarkInstance = await PredictionMarket.deployed();
            const traderZeroVoteZeroSuccess = await resolveTopicInstance.voteOption(0, {
                from: accounts[0], 
                value: web3.utils.toWei("0.1"),
            });
    
            const traderOneVoteTwoSuccess = await resolveTopicInstance.voteOption(2, {
                from: accounts[1], 
                value: web3.utils.toWei("0.9"),
            });
            assert.isOk(traderZeroVoteZeroSuccess);
            assert.isOk(traderOneVoteTwoSuccess);
            
            // const topicBalance = await resolveTopicInstance.balanceOf();
            // const before = await web3.eth.getBalance(accounts[0]);

            // const resolve = await resolveTopicInstance.resolveWithoutTie(0, { from : accounts[0]});
            
            // const topicBalanceAfter = await resolveTopicInstance.balanceOf();
            // const after = await web3.eth.getBalance(accounts[0]);
            
            // assert.strictEqual((topicBalance-topicBalanceAfter).toString(),web3.utils.toWei("0.98"));
            // assert.isTrue(after-before < web3.utils.toWei("0.98"));
        

        });
    });

    xit("should be able transfer to winner", async () => {
        // const resolvePredMarkInstance = await PredictionMarket.deployed();
        
        const traderZeroVoteZeroSuccess = await payoutTopicInstance.voteOption(0, {
            from: accounts[0], 
            value: web3.utils.toWei("0.1"),
        });

        const traderOneVoteTwoSuccess = await payoutTopicInstance.voteOption(2, { //TODO: figure out why there is an error in this line

            from: accounts[1], 
            value: web3.utils.toWei("0.9"),
        });
        assert.isOk(traderZeroVoteZeroSuccess);
        assert.isOk(traderOneVoteTwoSuccess);
        
        const topicBalance = await payoutTopicInstance.balanceOf();
        const before = await web3.eth.getBalance(accounts[0]);
        await payoutTopicInstance.payoutToWinners(accounts[0]);
        const after = await web3.eth.getBalance(accounts[0]);
        const topicBalanceAfter = await payoutTopicInstance.balanceOf();
        
        assert.strictEqual((topicBalance-topicBalanceAfter).toString(),web3.utils.toWei("0.98"));
        assert.isTrue(after-before < web3.utils.toWei("0.98"));
    });


    it("should not allow selected arbitrator to vote", async () => {
        // Account 9 is already  an arbitrator
        await predictionMarketInstance.createTrader({ from: accounts[9] });

        const name = "test";
        const description = "test description foo bar";
        const options = ["option 1"];
        const optionsBytes = stringUtils.stringToBytes(options)
        const expiryDate = (new Date()).getTime();
        const selectedArbitrators = [accounts[9]];
        await predictionMarketInstance.createTopic(name, description, optionsBytes, expiryDate, selectedArbitrators, { from: accounts[1], value: 1.0 });
        events = await predictionMarketInstance.getPastEvents("TopicCreated");
        const topicAddress = events[0].returnValues._topicAddress;

        //  // Retrieve instance of newly created topic and get current balance
         let newTopicInstance = await Topic.at(topicAddress);
         const balanceBef = await newTopicInstance.balanceOf();

         // Try vote with accounts[9] => fail as accounts[9] is selected arbitrator
         try {
            await newTopicInstance.voteOption(1, {
                from: accounts[9], 
                value: web3.utils.toWei("0.1"),
            });
         } catch (error) {
            assert.isOk(error.message.indexOf("revert") >= 0, "error message must contain revert");
         } finally {
             const balanceAftFailVote = await newTopicInstance.balanceOf();
             assert.strictEqual(balanceBef.toString(), balanceAftFailVote.toString(), "balance of contract does not change");

            // Try vote with accounts[1] => succeed
            await newTopicInstance.voteOption(1, {
                from: accounts[1], 
                value: web3.utils.toWei("0.1"),
            });
            const balanceAftSuccessVote = await newTopicInstance.balanceOf();
            assert.strictEqual((balanceAftSuccessVote-balanceBef).toString(), web3.utils.toWei("0.1").toString(), "Balance added");
         }
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

    it("should select all remaining arbitrators if 5 or less are available for jury", async () => {
        const predictionMarketInstance = await PredictionMarket.deployed();
        // Make everyone an arbitrator
        const testName = stringUtils.stringToBytes("test");
        for (let i = 0; i < 10; i++) {
            if ((await predictionMarketInstance.arbitrators(accounts[i])).isValid) {
                continue;
            }
            await predictionMarketInstance.createArbitrator(testName, { from: accounts[i] });
        }

        // Create the new topic through the prediction market
        // accounts[4 - 9] are selected arbitrators. NOTE: Should not have more than 5 selected arbitrators but for the sake of testing more than 5 are included
        // accounts[1] is already a trader
        const name = "test";
        const description = "test description foo bar";
        const options = ["option 1"];
        const optionsBytes = stringUtils.stringToBytes(options)
        const expiryDate = (new Date()).getTime();
        const selectedArbitrators = [accounts[4], accounts[5], accounts[6], accounts[7], accounts[8], accounts[9]];
        await predictionMarketInstance.createTopic(name, description, optionsBytes, expiryDate, selectedArbitrators, { from: accounts[1], value: 1.0 });
        events = await predictionMarketInstance.getPastEvents("TopicCreated");
        const topicAddress = events[0].returnValues._topicAddress;

        // Retrieve instance of newly created topic
        let newTopicInstance = await Topic.at(topicAddress);

        // Call resolve with tie
        await newTopicInstance.resolveWithTie();

        const contractPhase = await newTopicInstance.contractPhase();
        assert.strictEqual(contractPhase.toString(), "2", "state is Jury");

        const jury = await newTopicInstance.getJury();
        selectedArbitrators.forEach(arbitrator => {
            assert.isFalse(jury.includes(arbitrator), "selected arbitrator is not in jury");
        });

        jury.forEach(juror => {
            assert.strictEqual(jury.filter(address => address === juror).length, 1, "address is only selected once per juror");
        });

        assert.isFalse(jury.includes(accounts[1]), "topic creator is not selected in jury");

        // Only accounts[0], accounts[2] and accounts[3] are left available for jury
        assert.strictEqual(jury.filter(address => address != zeroAddress).length, 3, "all remaining arbitrators are selected as jury");
    });

})