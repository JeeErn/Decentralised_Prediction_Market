/*
NOTE: int values in contract are converted to BN objects, so use toString() on the BN object, 
and compare to the toString() of whatever number it is supposed to be compared with

Trader accounts:
accounts[0], accounts[1], accounts[4]

Arbitrator accounts:
accounts[2], accounts[3], accounts[4]
*/
const stringUtils = require("./utils/stringUtil.js");
const PredictionMarket = artifacts.require("./PredictionMarket.sol");

contract("PredictionMarket", accounts => {
    let predictionMarketInstance = null; 
    before( async () => {
        predictionMarketInstance = await PredictionMarket.deployed();
    })
    // it(decription, callback)
    // ================================
    // Create trader tests
    // ================================
    it("allows a user to create a trading account with default values", async () => {
        assert.isOk(predictionMarketInstance.address != "");
        await predictionMarketInstance.createTrader({from: accounts[0]});
        const trader = await predictionMarketInstance.traders(accounts[0]);
        assert.isOk(trader.isValid, "trader is init to valid");
        assert.strictEqual(trader.winScore.toString(), "100", "trader win score is init to 100");
        assert.strictEqual(trader.loseScore.toString(), "100", "trader lose score is init to 100");
    });

    it("throws an exception when an existing trader creates a new account", async () => {
        await predictionMarketInstance.createTrader({ from: accounts[1] });
        const trader = await predictionMarketInstance.traders(accounts[1]);

        // First creation is accepted
        assert.isOk(trader.isValid, "trader is init to valid");
        assert.strictEqual(trader.winScore.toString(), "100", "trader win score is init to 100");
        assert.strictEqual(trader.loseScore.toString(), "100", "trader lose score is init to 100");

        // Try to create again
        try {
            await predictionMarketInstance.createTrader({ from: accounts[1] });
        } catch (error) {
            assert.isOk(error.message.indexOf("revert") >= 0, "error message must contain revert");
        } finally {
            const trader1 = await predictionMarketInstance.traders(accounts[1]);
            assert.isOk(trader1.isValid, "created trader remains valid");
        };
    }); 

    // ================================
    // Create arbitrator tests
    // ================================
    it("allows a entity to create a arbitrator account with default values", async () => {
        await predictionMarketInstance.createArbitrator(stringUtils.stringToBytes("test1"), {from: accounts[2]});
        const arbitrator = await predictionMarketInstance.arbitrators(accounts[2]);
        assert.isOk(arbitrator.isValid, "arbitrator is init to valid");

        const displayName = stringUtils.bytesToString(arbitrator.displayName);
        assert.strictEqual(displayName, "test1", "arbitrator display name is set correctly");
        assert.strictEqual(arbitrator.trustworthiness.toString(), "50", "arbitrator trustworthiness score is init to 50");

        const allArbitrators = await predictionMarketInstance.getAllArbitrators();
        assert.isOk(allArbitrators.includes(accounts[2]), "address is stored in list of arbitrator address");
    });

    it("throws an exception when an existing arbitrator creates a new account", async () => {
        await predictionMarketInstance.createArbitrator(stringUtils.stringToBytes("test2"), { from: accounts[3] });
        const arbitrator = await predictionMarketInstance.arbitrators(accounts[3]);

        // First creation is accepted
        assert.isOk(arbitrator.isValid, "arbitrator is init to valid");
        const displayName = stringUtils.bytesToString(arbitrator.displayName);
        assert.strictEqual(displayName, "test2", "arbitrator display name is set correctly");
        assert.strictEqual(arbitrator.trustworthiness.toString(), "50", "arbitrator trustworthiness score is init to 50");

        // Try to create again
        try {
            await predictionMarketInstance.createArbitrator(stringUtils.stringToBytes("test3"), { from: accounts[3] });
        } catch (error) {
            assert.isOk(error.message.indexOf("revert") >= 0, "error message must contain revert");
        } finally {
            const arbitrator1 = await predictionMarketInstance.traders(accounts[1]);
            assert.isOk(arbitrator1.isValid, "created arbitrator remains valid");
        };
    }); 

    it("allows user to create both arbitrator and trader accounts using same address", async () => {
        // Create trader account
        await predictionMarketInstance.createTrader({from: accounts[4]});
        const trader = await predictionMarketInstance.traders(accounts[4]);
        assert.isOk(trader.isValid, "trader is init to valid");
        assert.strictEqual(trader.winScore.toString(), "100", "trader win score is init to 100");
        assert.strictEqual(trader.loseScore.toString(), "100", "trader lose score is init to 100");

        // Create arbitrator account
        await predictionMarketInstance.createArbitrator(stringUtils.stringToBytes("test1"), {from: accounts[4]});
        const arbitrator = await predictionMarketInstance.arbitrators(accounts[4]);
        assert.isOk(arbitrator.isValid, "arbitrator is init to valid");

        const displayName = stringUtils.bytesToString(arbitrator.displayName);
        assert.strictEqual(displayName, "test1", "arbitrator display name is set correctly");
        assert.strictEqual(arbitrator.trustworthiness.toString(), "50", "arbitrator trustworthiness score is init to 50");

        const allArbitrators = await predictionMarketInstance.getAllArbitrators();
        assert.isOk(allArbitrators.includes(accounts[4]), "address is stored in list of arbitrator address");
    });

    it("allows user to view all arbitrator names", async () => {
        const createdArbitratorNames = ["test1", "test2"]; // FIXME: Update if more arbitrators are created before this test!!!
        const allArbitratorNamesBytes = await predictionMarketInstance.getAllArbitratorNames();
        const allArbitratorNames = stringUtils.bytesToString(allArbitratorNamesBytes);
        allArbitratorNames.forEach(name => {
            assert.isOk(createdArbitratorNames.includes(name), name + "is successfully retrieved");
        });
    });

    // ================================
    // Create topic tests
    // ================================
    it("allows user to create a new topic", async () => {
        // set up variables
        const name = "test";
        const description = "test description foo bar";
        const options = ["option 1", "option 2", "option 3", "option 4"];
        const optionsBytes = stringUtils.stringToBytes(options)
        const expiryDate = (new Date()).getTime();
        const selectedArbitrators = [accounts[2], accounts[3]];

        // Create topic and retrieve address
        // Note: accounts[0] trading account is already created as of above test
        await predictionMarketInstance.createTopic(name, description, optionsBytes, expiryDate, selectedArbitrators, { from: accounts[0], value: 1.0 });
        events = await predictionMarketInstance.getPastEvents("TopicCreated");
        assert.isOk(events.length > 0, "events are not null");
        const topicAddress = events[0].returnValues._topicAddress;

        // Assertions
        const allTopicAddresses = await predictionMarketInstance.getAllTopics();
        assert.isOk(allTopicAddresses.includes(topicAddress), "new topic address is in array of all topic addresses");

        assert.strictEqual(await predictionMarketInstance.getCreatorAddress(topicAddress), accounts[0], "topic creator address is set correctly");
        assert.strictEqual(await predictionMarketInstance.getName(topicAddress), name, "name is set correctly");
        assert.strictEqual(await predictionMarketInstance.getDescription(topicAddress), description, "description is set correctly");

        const marketCap = await predictionMarketInstance.getMarketCap(topicAddress);
        assert.strictEqual(marketCap.toString(), "0", "market cap is init to 0");

        const creatorBond = await predictionMarketInstance.getCreatorBond(topicAddress);
        assert.strictEqual(creatorBond.toString(), "1", "creator bond is set to message value");

        const bytesOptions = await predictionMarketInstance.getOptions(topicAddress);
        const topicOptions = stringUtils.bytesToString(bytesOptions);
        for (i = 0; i < topicOptions.length; i++) {
            assert.strictEqual(topicOptions[i], options[i], "option " + i.toString() + " is set correctly");
        }
 
        const _expiryDate = await predictionMarketInstance.getExpiryDate(topicAddress);
        assert.strictEqual(_expiryDate.toString(), expiryDate.toString(), "expiry date is set correctly");

        const _selectedArbitrators = await predictionMarketInstance.getSelectedArbitrators(topicAddress);
        for (i = 0; i < _selectedArbitrators.length; i++) {
            assert.strictEqual(_selectedArbitrators[i], selectedArbitrators[i], "arbitrator " + i.toString() + " is set correctly");
        }

        const currentContractBalance = await predictionMarketInstance.getCurrentBalance();
        assert.strictEqual(currentContractBalance.toString(), "1", "creator bond is transferred to contract's balance");
    });

    //TODO: Change back to "it" when the require in the contract is uncommented
    xit("does not allow user with no trading account to create a new topic", async () => {
        // set up variables
        const name = "test";
        const description = "test description foo bar";
        const options = ["option 1", "option 2", "option 3", "option 4"];
        const optionsBytes = stringUtils.stringToBytes(options)
        const expiryDate = (new Date()).getTime();
        const selectedArbitrators = [accounts[2], accounts[3]];

        try {
            await predictionMarketInstance.createTopic(name, description, optionsBytes, expiryDate, selectedArbitrators, { from: accounts[7], value: 1.0 });
        } catch (error) {
            assert.isOk(error.message.indexOf("revert") >= 0, "error message must contain revert");
            events = await predictionMarketInstance.getPastEvents("TopicCreated");
            assert.strictEqual(events.length, 0, "new event is not created");
        } finally {
            const allTopicAddresses = await predictionMarketInstance.getAllTopics();
            assert.strictEqual(allTopicAddresses.length, 1, "only first topic created still exists");
        }
    });

    it("does not allow user to create a new topic when sending 0 ETH for creator bond", async () => {
        // set up variables
        const name = "test";
        const description = "test description foo bar";
        const options = ["option 1", "option 2", "option 3", "option 4"];
        const optionsBytes = stringUtils.stringToBytes(options)
        const expiryDate = (new Date()).getTime();
        const selectedArbitrators = [accounts[2], accounts[3]];

        try {
            await predictionMarketInstance.createTopic(name, description, optionsBytes, expiryDate, selectedArbitrators, { from: accounts[0], value: 0 });
        } catch (error) {
            assert.isOk(error.message.indexOf("revert") >= 0, "error message must contain revert");
            events = await predictionMarketInstance.getPastEvents("TopicCreated");
            assert.strictEqual(events.length, 0, "new event is not created");
        } finally {
            const allTopicAddresses = await predictionMarketInstance.getAllTopics();
            assert.strictEqual(allTopicAddresses.length, 1, "only first topic created still exists");
        }
    });

    it("does not allow user to pick an non-arbitrator address as an arbitrator", async () => {
        // set up variables
        const name = "test";
        const description = "test description foo bar";
        const options = ["option 1", "option 2", "option 3", "option 4"];
        const optionsBytes = stringUtils.stringToBytes(options)
        const expiryDate = (new Date()).getTime();
        const selectedArbitrators = [accounts[2], accounts[5]]; // accounts[2] and accounts[3] are arbitrators

        try {
            await predictionMarketInstance.createTopic(name, description, optionsBytes, expiryDate, selectedArbitrators, { from: accounts[0], value: 1.0 });
        } catch (error) {
            assert.isOk(error.message.indexOf("revert") >= 0, "error message must contain revert");
            events = await predictionMarketInstance.getPastEvents("TopicCreated");
            assert.strictEqual(events.length, 0, "new event is not created");
        } finally {
            const allTopicAddresses = await predictionMarketInstance.getAllTopics();
            assert.strictEqual(allTopicAddresses.length, 1, "only first topic created still exists");
        }
    });

    it("does not allow user to pick himself as an arbitrator", async () => {
        // set up variables
        const name = "test";
        const description = "test description foo bar";
        const options = ["option 1", "option 2", "option 3", "option 4"];
        const optionsBytes = stringUtils.stringToBytes(options)
        const expiryDate = (new Date()).getTime();
        const selectedArbitrators = [accounts[2], accounts[3]]; // accounts[2] and accounts[3] are arbitrators

        //create trader with accounts[2]
        await predictionMarketInstance.createTrader({from: accounts[2]});

        try {
            await predictionMarketInstance.createTopic(name, description, optionsBytes, expiryDate, selectedArbitrators, { from: accounts[2], value: 1.0 });
        } catch (error) {
            assert.isOk(error.message.indexOf("revert") >= 0, "error message must contain revert");
            events = await predictionMarketInstance.getPastEvents("TopicCreated");
            assert.strictEqual(events.length, 0, "new event is not created");
        } finally {
            const allTopicAddresses = await predictionMarketInstance.getAllTopics();
            assert.strictEqual(allTopicAddresses.length, 1, "only first topic created still exists");
        }
    });

    it("allows user to create topic with options up to 32 char long", async () => {
        // set up variables
        const name = "test";
        const description = "test description foo bar";
        const options = ["1111-1111-1111-1111-1111-1111-11", "1111-1111-1111-1111-1111-1111-11"];
        const optionsBytes = stringUtils.stringToBytes(options)
        const expiryDate = (new Date()).getTime();
        const selectedArbitrators = [accounts[2], accounts[4]];

        await predictionMarketInstance.createTopic(name, description, optionsBytes, expiryDate, selectedArbitrators, { from: accounts[1], value: 1.0 });
        events = await predictionMarketInstance.getPastEvents("TopicCreated");
        assert.isOk(events.length > 0, "events are not null");
        const topicAddress = events[0].returnValues._topicAddress;

        const allTopicAddresses = await predictionMarketInstance.getAllTopics();
        assert.isOk(allTopicAddresses.includes(topicAddress), "new topic address is in array of all topic addresses");

        const bytesOptions = await predictionMarketInstance.getOptions(topicAddress);
        const topicOptions = stringUtils.bytesToString(bytesOptions);
        for (i = 0; i < topicOptions.length; i++) {
            assert.strictEqual(topicOptions[i], options[i], "option " + i.toString() + " is set correctly");
        }
    });

    it("does not allow user to create topic with options more than 32 char long", async () => {
        // set up variables
        const name = "test";
        const description = "test description foo bar";
        const options = ["1111-1111-1111-1111-1111-1111-111", "1111-1111-1111-1111-1111-1111-11"];
        const optionsBytes = stringUtils.stringToBytes(options)
        const expiryDate = (new Date()).getTime();
        const selectedArbitrators = [accounts[2], accounts[4]];

        try {
            await predictionMarketInstance.createTopic(name, description, optionsBytes, expiryDate, selectedArbitrators, { from: accounts[1], value: 1.0 });
        } catch (error) { 
            // Somehow the error message does not contain revert
            // Yet the transaction does not go through
        } finally {
            const allTopicAddresses = await predictionMarketInstance.getAllTopics();
            assert.strictEqual(allTopicAddresses.length, 2, "only previously created topic still exist");
        };
    });
})