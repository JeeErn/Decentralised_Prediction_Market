const PredictionMarket = artifacts.require("./PredictionMarket.sol");

contract("PredictionMarket", accounts => {
    it("allows a user to create a trading account with default values", async () => {
        const predictionMarketInstance = await PredictionMarket.deployed();

        await predictionMarketInstance.createTrader({ from: accounts[0] });
        trader = predictionMarketInstance.traders({ from: accounts[0] });

        assert(trader.isValid, "trader is init to valid");
        assert(trader.winScore, 100, "trader win score is init to 100");
        assert(trader.loseScore, 100, "trader lose score is init to 100");
    });

    it("throws an exception when an existing trader creates a new account", async () => {
        const predictionMarketInstance = await PredictionMarket.deployed();
        await predictionMarketInstance.createTrader({ from: accounts[1] });
        trader = predictionMarketInstance.traders({ from: accounts[1] });

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
            trader1 = predictionMarketInstance.traders({ from: accounts[1] });
            assert(trader1.isValid, "created trader remains valid");
        };
    });
})