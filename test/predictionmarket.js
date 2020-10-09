const { assert } = require("console");

const PredictionMarket = artifacts.require("./PredictionMarket.sol");

contract("PredictionMarket", accounts => {
    let predictionMarketInstance = null; 
    before( async () => {
        predictionMarketInstance = await PredictionMarket.deployed();
    })
    it(decription, callback)
    it("allows a user to create a trading account with default values", async () => {
        assert(predictionMarketInstance.address != "");
        await predictionMarketInstance.createTrader({from: accounts[0]});
        trader = await predictionMarketInstance.traders(accounts[0]);
        assert(trader.isValid, "trader is init to valid");
        assert(trader.winScore, 100, "trader win score is init to 100");
        assert(trader.loseScore, 100, "trader lose score is init to 100");
    });

    it("throws an exception when an existing trader creates a new account", async () => {
        await predictionMarketInstance.createTrader({ from: accounts[1] });
        trader = await predictionMarketInstance.traders(accounts[1]);

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
            trader1 = await predictionMarketInstance.traders(accounts[1]);
            assert(trader1.isValid, "created trader remains valid");
        };
    }); 

    // it("Test Create new topic", async () => {
    //     // Creates a new topic
    //     const address = await predictionMarketInstance.createTopic("Test Topic"); 
    //     const allTopics = await predictionMarketInstance.marketTopics("Test Topic");
    //     console.log(allTopics);
    // })
})