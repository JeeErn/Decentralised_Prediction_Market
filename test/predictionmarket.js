/*
NOTE: int values in contract are converted to BN objects, so use toString() on the BN object, 
and compare to the toString() of whatever number it is supposed to be compared with
*/

const PredictionMarket = artifacts.require("./PredictionMarket.sol");

const stringToBytes = (options) => {
    return options.map(option => web3.utils.asciiToHex(option));
}

const bytesToString = (options) => {
    return options.map(option => web3.utils.hexToUtf8(option));
}

contract("PredictionMarket", accounts => {
    let predictionMarketInstance = null; 
    before( async () => {
        predictionMarketInstance = await PredictionMarket.deployed();
    })
    // it(decription, callback)
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

    it("allows a entity to create a arbitrator account with default values", async () => {
        await predictionMarketInstance.createArbitrator("test1", {from: accounts[2]});
        const arbitrator = await predictionMarketInstance.arbitrators(accounts[2]);
        assert.isOk(arbitrator.isValid, "arbitrator is init to valid");
        assert.strictEqual(arbitrator.displayName, "test1", "arbitrator display name is set correctly");
        assert.strictEqual(arbitrator.trustworthiness.toString(), "100", "arbitrator trustworthiness score is init to 100");
    });

    it("throws an exception when an existing arbitrator creates a new account", async () => {
        await predictionMarketInstance.createArbitrator("test2", { from: accounts[3] });
        const arbitrator = await predictionMarketInstance.arbitrators(accounts[3]);

        // First creation is accepted
        assert.isOk(arbitrator.isValid, "arbitrator is init to valid");
        assert.strictEqual(arbitrator.displayName, "test2", "arbitrator display name is set correctly");
        assert.strictEqual(arbitrator.trustworthiness.toString(), "100", "arbitrator trustworthiness score is init to 100");

        // Try to create again
        try {
            await predictionMarketInstance.createArbitrator("test3", { from: accounts[3] });
        } catch (error) {
            assert.isOk(error.message.indexOf("revert") >= 0, "error message must contain revert");
        } finally {
            const arbitrator1 = await predictionMarketInstance.traders(accounts[1]);
            assert.isOk(arbitrator1.isValid, "created arbitrator remains valid");
        };
    }); 

    it("allows user to create a new topic", async () => {
        // set up variables
        const name = "test";
        const description = "test description foo bar";
        const options = ["option 1", "option 2", "option 3", "option 4"];
        const optionsBytes = stringToBytes(options)
        const expiryDate = (new Date()).getTime();

        // Create topic and retrieve address
        await predictionMarketInstance.createTopic(name, description, optionsBytes, expiryDate, { from: accounts[0], value: 1.0 });
        events = await predictionMarketInstance.getPastEvents("TopicCreated");
        assert.isOk(events.length > 0, "events are not null");
        const topicAddress = events[0].returnValues._topicAddress;

        assert.strictEqual(await predictionMarketInstance.getCreatorAddress(topicAddress), accounts[0], "topic creator address is set correctly");
        assert.strictEqual(await predictionMarketInstance.getName(topicAddress), name, "name is set correctly");
        assert.strictEqual(await predictionMarketInstance.getDescription(topicAddress), description, "description is set correctly");

        const marketCap = await predictionMarketInstance.getMarketCap(topicAddress);
        assert.strictEqual(marketCap.toString(), "0", "market cap is init to 0");

        const creatorBond = await predictionMarketInstance.getCreatorBond(topicAddress);
        assert.strictEqual(creatorBond.toString(), "1", "creator bond is set to message value");

        const bytesOptions = await predictionMarketInstance.getOptions(topicAddress);
        const topicOptions = bytesToString(bytesOptions);
        for (i = 0; i < topicOptions.length; i++) {
            assert.strictEqual(topicOptions[i], options[i], "option " + i.toString() +" is set correctly");
        }
 
        const _expiryDate = await predictionMarketInstance.getExpiryDate(topicAddress);
        assert.strictEqual(_expiryDate.toString(), expiryDate.toString(), "expiry date is set correctly");

        const currentContractBalance = await predictionMarketInstance.getCurrentBalance();
        assert.strictEqual(currentContractBalance.toString(), "1", "creator bond is transferred to contract's balance");
    })
})