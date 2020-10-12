const { assert } = require("console");

const PredictionMarket = artifacts.require("./PredictionMarket.sol");

const stringToBytes = (options) => {
    return options.map(option => web3.utils.asciiToHex(option));
}

const bytesToString = (options) => {
    return options.map(option => web3.utils.hexToAscii(option));
}

contract("PredictionMarket", accounts => {
    let predictionMarketInstance = null; 
    before( async () => {
        predictionMarketInstance = await PredictionMarket.deployed();
    })
    // it(decription, callback)
    it("allows a user to create a trading account with default values", async () => {
        assert(predictionMarketInstance.address != "");
        await predictionMarketInstance.createTrader({from: accounts[0]});
        const trader = await predictionMarketInstance.traders(accounts[0]);
        assert(trader.isValid, "trader is init to valid");
        assert(trader.winScore, 100, "trader win score is init to 100");
        assert(trader.loseScore, 100, "trader lose score is init to 100");
    });

    it("throws an exception when an existing trader creates a new account", async () => {
        await predictionMarketInstance.createTrader({ from: accounts[1] });
        const trader = await predictionMarketInstance.traders(accounts[1]);

        // First creation is accepted
        assert(trader.isValid, "trader is init to valid");
        assert(trader.winScore, 100, "trader win score is init to 100");
        assert(trader.loseScore, 100, "trader lose score is init to 100");

        // Try to create again
        try {
            await predictionMarketInstance.createTrader({ from: accounts[1] });
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert");
        } finally {
            const trader1 = await predictionMarketInstance.traders(accounts[1]);
            assert(trader1.isValid, "created trader remains valid");
        };
    }); 

    it("allows a entity to create a arbitrator account with default values", async () => {
        assert(predictionMarketInstance.address != "");
        await predictionMarketInstance.createArbitrator({from: accounts[2]});
        const arbitrator = await predictionMarketInstance.arbitrators(accounts[2]);
        assert(arbitrator.isValid, "arbitrator is init to valid");
        assert(arbitrator.trustworthiness, 100, "arbitrator trustworthiness score is init to 100");
    });

    it("throws an exception when an existing arbitrator creates a new account", async () => {
        await predictionMarketInstance.createArbitrator({ from: accounts[3] });
        const arbitrator = await predictionMarketInstance.arbitrators(accounts[3]);

        // First creation is accepted
        assert(arbitrator.isValid, "arbitrator is init to valid");
        assert(arbitrator.winScore, 100, "arbitrator trustworthiness score is init to 100");

        // Try to create again
        try {
            await predictionMarketInstance.createArbitrator({ from: accounts[3] });
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert");
        } finally {
            const arbitrator1 = await predictionMarketInstance.traders(accounts[1]);
            assert(arbitrator1.isValid, "created arbitrator remains valid");
        };
    }); 

    it("allows user to create a new topic", async () => {
        assert(predictionMarketInstance.address != "");

        // set up variables
        const name = "test";
        const description = "test description foo bar";
        const options = ["option 1", "option 2", "option 3", "option 4"];
        const optionsBytes = stringToBytes(options)
        const expiryDate = (new Date()).getTime();

        // Create topic and retrieve
        await predictionMarketInstance.createTopic(name, description, optionsBytes, expiryDate, { from: accounts[0], value: 1.0 });
        events = await predictionMarketInstance.getPastEvents("TopicCreated");
        console.log(">>>>>>>>>>> events", events);
        assert(events.length > 0, "events are not null");
        const topicAddress = events[0].returnValues._topicAddress;

        assert(await predictionMarketInstance.getCreatorAddress(topicAddress), accounts[0], "topic creator address is set correctly");
        assert(await predictionMarketInstance.getName(topicAddress), name, "name is set correctly");
        assert(await predictionMarketInstance.getDescription(topicAddress), description, "description is set correctly");
        assert(await predictionMarketInstance.getMarketCap(topicAddress), 0, "market cap is init to 0");
        assert(await predictionMarketInstance.getCreatorBond(topicAddress), 1.0, "creator bond is set to message value");
        assert(topicAddress.balance, 1.0, "creator bond is transferred correctly");

        const bytesOptions = await predictionMarketInstance.getOptions(topicAddress);
        const topicOptions = bytesToString(bytesOptions);
        assert(topicOptions, options, "options are set correctly");

        assert(await predictionMarketInstance.getExpiryDate(topicAddress), expiryDate, "expiry date is set correctly");
        
    })
})