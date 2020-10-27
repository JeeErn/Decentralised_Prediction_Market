const stringUtils = require("./utils/stringUtil.js");
const Topic = artifacts.require("./Topic.sol");
const PredictionMarket = artifacts.require("./PredictionMarket.sol");

contract("Topic", accounts => {
    let predictionMarketInstance = null;
    let withoutTieTopicInstance = null;
    let withTieTopicInstance = null;
    const zeroAddress = "0x0000000000000000000000000000000000000000";

    /*
    - Both topics created will have 2 options
    - Topic creator will be accounts[0]
    - Voters will be accounts[1, 2]. Accounts[1] will vote for options[0] and Accounts[2] will vote for options[1]
    - Selected arbitrators will be accounts[6, 7, 8, 9]
    - For flow with tie, jury will be accounts[3, 4, 5]
    */
    const name = "test";
    const description = "test description foo bar";
    const expiryDate = (new Date()).getTime();
    const selectedArbitrators = [accounts[6], accounts[7], accounts[8], accounts[9]];
    const options = stringUtils.stringToBytes(["option 1", "option 2"]);

    before(async () => {
        predictionMarketInstance = await PredictionMarket.deployed();
        const testName = stringUtils.stringToBytes("test");

        // Init all traders and arbitrators
        accounts.forEach(account => {
            predictionMarketInstance.createTrader({ from: account });
            predictionMarketInstance.createArbitrator(testName, { from: account });
        });

        let events = null;
        // Create topic without tie
        await predictionMarketInstance.createTopic(name, description, options, expiryDate, selectedArbitrators, { from: accounts[0], value: web3.utils.toWei("1.0") });
        events = await predictionMarketInstance.getPastEvents("TopicCreated");
        const topicWithoutTieAddress = events[0].returnValues._topicAddress;
        withoutTieTopicInstance = await Topic.at(topicWithoutTieAddress);

        // Create topic with tie
        await predictionMarketInstance.createTopic(name, description, options, expiryDate, selectedArbitrators, { from: accounts[0], value: web3.utils.toWei("1.0") });
        events = await predictionMarketInstance.getPastEvents("TopicCreated");
        const topicWithTieAddress = events[0].returnValues._topicAddress;
        withTieTopicInstance = await Topic.at(topicWithTieAddress);
    });

    context("Test full topic flow without tie", async () => {
        it("allows users to vote", async () => {
            const startContractState = await withoutTieTopicInstance.contractPhase();
            assert.strictEqual(startContractState.toString(), "0", "contract state is at 0 -> Open");

            const topicBalanceBeforeVoting = await withoutTieTopicInstance.balanceOf();
            await withoutTieTopicInstance.voteOption(0, {
                from: accounts[1],
                value: web3.utils.toWei("0.5"),
            });
            await withoutTieTopicInstance.voteOption(1, {
                from: accounts[2],
                value: web3.utils.toWei("0.5"),
            });

            const topicBalanceAfterVoting = await withoutTieTopicInstance.balanceOf();
            const balanceDiff = topicBalanceAfterVoting - topicBalanceBeforeVoting;
            assert.strictEqual(balanceDiff.toString(), web3.utils.toWei("1.0"), "Vote values are added to balance");

            const marketCap = await withoutTieTopicInstance.marketCap();
            assert.strictEqual(marketCap.toString(), web3.utils.toWei("1.0"), "Market cap is updated");

            const lastTradedPrices = await withoutTieTopicInstance.getLastTradedPrices();
            lastTradedPrices.forEach(priceHex => {
                const price = parseInt(priceHex, 16);
                if (price !== 0) {
                    assert.strictEqual(price.toString(), web3.utils.toWei("0.5"), "last traded price is correct");
                }
            });

            const tradeAddresses = await withoutTieTopicInstance.getLastConfirmedTradeAddresses();
            assert.strictEqual(tradeAddresses[0], accounts[1], "option 0 address is correct");
            assert.strictEqual(tradeAddresses[1], accounts[2], "option 1 address is correct");
            assert.strictEqual(tradeAddresses[2], zeroAddress, "option 2 address is correct");
            assert.strictEqual(tradeAddresses[3], zeroAddress, "option 3 address is correct");
        });

        /*
        - Accounts[6, 7, 8] will vote for options[0]
        - Accounts[9] will vote for options[1] in next "it" block to trigger resolve
        */
        it("allows arbitrators to vote", async () => {
            await withoutTieTopicInstance.addArbitratorVote(options[0], false, { from: accounts[6] });
            await withoutTieTopicInstance.addArbitratorVote(options[0], false, { from: accounts[7] });
            await withoutTieTopicInstance.addArbitratorVote(options[0], false, { from: accounts[8] });

            const currentContractState = await withoutTieTopicInstance.contractPhase();
            assert.strictEqual(currentContractState.toString(), "1", "contract state is shifted to 1 -> Verification");

            const optionZeroVoteCount = await withoutTieTopicInstance.countofArbVotes(options[0]);
            assert.strictEqual(optionZeroVoteCount.toString(), "3", "Vote count for option increases");
            for (let i = 0; i < 3; i++) {
                const account = accounts[i + 6];
                const arbitratorAddress = await withoutTieTopicInstance.arbitratorsVotes(options[0], i);
                assert.strictEqual(account, arbitratorAddress, "arbitrator address for option is pushed correctly");
                
                const arbitrator = await withoutTieTopicInstance.selectedArbitrators(account);
                assert.isTrue(arbitrator.hasVoted, "arbitrator's has voted flag set to true");
                assert.strictEqual(stringUtils.bytesToString(arbitrator.votedOption), stringUtils.bytesToString(options[0]), "arbitrator's voted option is set correctly");
            }
        });

        it("triggers resolve without tie when last arbitrator votes and payout the correct parties", async () => {
            const topicCreatorBalanceBef = await web3.eth.getBalance(accounts[0]);
            const winningVoterBalanceBef = await web3.eth.getBalance(accounts[1]);
            const losingVoterBalanceBef = await web3.eth.getBalance(accounts[2]);
            const accountSixBalanceBef = await web3.eth.getBalance(accounts[6]);
            const accountSevenBalanceBef = await web3.eth.getBalance(accounts[7]);
            const accountEightBalanceBef = await web3.eth.getBalance(accounts[8]);

            await withoutTieTopicInstance.addArbitratorVote(options[1], false, { from: accounts[9] });

            const topicCreatorBalanceAft = await web3.eth.getBalance(accounts[0]);
            const winningVoterBalanceAft = await web3.eth.getBalance(accounts[1]);
            const losingVoterBalanceAft = await web3.eth.getBalance(accounts[2]);
            const accountSixBalanceAft = await web3.eth.getBalance(accounts[6]);
            const accountSevenBalanceAft = await web3.eth.getBalance(accounts[7]);
            const accountEightBalanceAft = await web3.eth.getBalance(accounts[8]);

            const winningVoterDiff = winningVoterBalanceAft - winningVoterBalanceBef;
            assert.strictEqual(winningVoterDiff.toString(), web3.utils.toWei("0.98"), "0.98 ETH is transferred to winning voter");
            assert.strictEqual(losingVoterBalanceAft.toString(), losingVoterBalanceBef.toString(), "losing voter balance does not change");

            const marketCap = Number(await withoutTieTopicInstance.marketCap());
            const arbitratorShare = Math.floor(marketCap / 300);
            const upperBound = Number(arbitratorShare + web3.utils.toWei("0.0000001"));
            const lowerBound = Number(arbitratorShare - web3.utils.toWei("0.0000001"));
            
            const accountSixDiff = Number(accountSixBalanceAft - accountSixBalanceBef);
            const accountSevenDiff = Number(accountSevenBalanceAft - accountSevenBalanceBef);
            const accountEightDiff = Number(accountEightBalanceAft - accountEightBalanceBef);
            assert.isTrue(accountSixDiff <= upperBound && accountSixDiff >= lowerBound, "winning arbitrator receives promised share");
            assert.isTrue(accountSevenDiff <= upperBound && accountSevenDiff >= lowerBound, "winning arbitrator receives promised share");
            assert.isTrue(accountEightDiff <= upperBound && accountEightDiff >= lowerBound, "winning arbitrator receives promised share");

            const creatorBond = Number(await withoutTieTopicInstance.creatorBond());
            const amountTransferredToCreator = Math.floor(marketCap / 100) + creatorBond;
            const topicCreatorDiff = topicCreatorBalanceAft - topicCreatorBalanceBef;
            assert.strictEqual(topicCreatorDiff.toString(), amountTransferredToCreator.toString(), "creator bond and 1% of market cap is transferred to creator");
        });

        it("shifts contract to resolved state and does not allow any other actions", async () => {
            const currentContractState = await withoutTieTopicInstance.contractPhase();
            assert.strictEqual(currentContractState.toString(), "3", "contract state is shifted to 3 -> Resolved");

            try {
                await withoutTieTopicInstance.voteOption(0, { from: accounts[0] });
            } catch (error) {
                assert.isTrue(error.message.indexOf("revert") >= 0, "trader error message must contain revert");
            }

            try {
                await withoutTieTopicInstance.addArbitratorVote(options[0], false, { from: accounts[6] });
            } catch (error) {
                assert.isTrue(error.message.indexOf("revert") >= 0, "arbitrator error message must contain revert");
            }
        });
    });
});