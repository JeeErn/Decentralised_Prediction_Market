const stringUtils = require("./utils/stringUtil.js");
const Topic = artifacts.require("./Topic.sol");
const PredictionMarket = artifacts.require("./PredictionMarket.sol");

contract("Topic", accounts => {
    let predictionMarketInstance = null;
    let withoutTieTopicInstance = null;
    let withTieTopicInstance = null;
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const validTraderTimeStamp = (new Date(2020, 10, 28)).getTime();
    const validArbTimeStamp = (new Date(2070, 10, 28)).getTime();


    /*
    - Both topics created will have 2 options
    - Topic creator will be accounts[0]
    - Voters will be accounts[1, 2]. Accounts[1] will vote for options[0] and Accounts[2] will vote for options[1]
    - Selected arbitrators will be accounts[6, 7, 8, 9]
    - For flow with tie, jury will be accounts[3, 4, 5]
    */
    const name = "test";
    const description = "test description foo bar";
    const expiryDate = (new Date(2050, 12, 31)).getTime();
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
            await withoutTieTopicInstance.voteOption(0, validTraderTimeStamp, {
                from: accounts[1],
                value: web3.utils.toWei("0.5"),
            });
            await withoutTieTopicInstance.voteOption(1, validTraderTimeStamp, {
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
            await withoutTieTopicInstance.addArbitratorVote(options[0], validArbTimeStamp, false, { from: accounts[6] });
            await withoutTieTopicInstance.addArbitratorVote(options[0], validArbTimeStamp, false, { from: accounts[7] });
            await withoutTieTopicInstance.addArbitratorVote(options[0], validArbTimeStamp, false, { from: accounts[8] });

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
            const winningVoterWinScoreBef = await predictionMarketInstance.getWinScore(accounts[1]);
            const winningVoterLoseScoreBef = await predictionMarketInstance.getLoseScore(accounts[1]); 
            const losingVoterWinScoreBef = await predictionMarketInstance.getWinScore(accounts[2]);
            const losingVoterLoseScoreBef = await predictionMarketInstance.getLoseScore(accounts[2]); 

            await withoutTieTopicInstance.addArbitratorVote(options[1], validArbTimeStamp, false, { from: accounts[9] });

            const topicCreatorBalanceAft = await web3.eth.getBalance(accounts[0]);
            const winningVoterBalanceAft = await web3.eth.getBalance(accounts[1]);
            const losingVoterBalanceAft = await web3.eth.getBalance(accounts[2]);
            const accountSixBalanceAft = await web3.eth.getBalance(accounts[6]);
            const accountSevenBalanceAft = await web3.eth.getBalance(accounts[7]);
            const accountEightBalanceAft = await web3.eth.getBalance(accounts[8]);
            const winningVoterWinScoreAft = await predictionMarketInstance.getWinScore(accounts[1]);
            const winningVoterLoseScoreAft = await predictionMarketInstance.getLoseScore(accounts[1]); 
            const losingVoterWinScoreAft = await predictionMarketInstance.getWinScore(accounts[2]);
            const losingVoterLoseScoreAft = await predictionMarketInstance.getLoseScore(accounts[2]); 

            const winningVoterDiff = winningVoterBalanceAft - winningVoterBalanceBef;
            assert.strictEqual(winningVoterDiff.toString(), web3.utils.toWei("0.98"), "0.98 ETH is transferred to winning voter");
            assert.strictEqual(losingVoterBalanceAft.toString(), losingVoterBalanceBef.toString(), "losing voter balance does not change");

            const marketCap = Number(await withoutTieTopicInstance.marketCap());
            const arbitratorShare = Math.floor(marketCap / 300);
            const upperBound = Number(arbitratorShare + web3.utils.toWei("100", "kwei"));
            const lowerBound = Number(arbitratorShare - web3.utils.toWei("100", "kwei"));
            
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
            
            assert.strictEqual(Number(winningVoterWinScoreAft),Number(winningVoterWinScoreBef)+50);
            assert.strictEqual(Number(winningVoterLoseScoreAft),Number(winningVoterLoseScoreBef));
            assert.strictEqual(Number(losingVoterWinScoreAft),Number(losingVoterWinScoreBef));
            assert.strictEqual(Number(losingVoterLoseScoreAft),Number(losingVoterLoseScoreBef)+50);
        });

        it("shifts contract to resolved state and does not allow any other actions", async () => {
            const currentContractState = await withoutTieTopicInstance.contractPhase();
            assert.strictEqual(currentContractState.toString(), "3", "contract state is shifted to 3 -> Resolved");
            const contractBalance = Number(await withoutTieTopicInstance.balanceOf());
            assert.isTrue(contractBalance < Number(web3.utils.toWei("10", "wei")), "contract balance is less than 10 wei");

            try {
                await withoutTieTopicInstance.voteOption(0, validTraderTimeStamp, { from: accounts[0] });
            } catch (error) {
                assert.isTrue(error.message.indexOf("revert") >= 0, "error message must contain revert");
            }

            try {
                await withoutTieTopicInstance.addArbitratorVote(options[0], validArbTimeStamp, false, { from: accounts[6] });
            } catch (error) {
                assert.isTrue(error.message.indexOf("revert") >= 0, "error message must contain revert");
            }
        });
    });

    context("Test full topic flow with tie", async () => {
        it("allows users to vote", async () => {
            const startContractState = await withTieTopicInstance.contractPhase();
            assert.strictEqual(startContractState.toString(), "0", "contract state is at 0 -> Open");

            const topicBalanceBeforeVoting = await withTieTopicInstance.balanceOf();
            await withTieTopicInstance.voteOption(0, validTraderTimeStamp, {
                from: accounts[1],
                value: web3.utils.toWei("0.5"),
            });
            await withTieTopicInstance.voteOption(1, validTraderTimeStamp, {
                from: accounts[2],
                value: web3.utils.toWei("0.5"),
            });

            const topicBalanceAfterVoting = await withTieTopicInstance.balanceOf();
            const balanceDiff = topicBalanceAfterVoting - topicBalanceBeforeVoting;
            assert.strictEqual(balanceDiff.toString(), web3.utils.toWei("1.0"), "Vote values are added to balance");

            const marketCap = await withTieTopicInstance.marketCap();
            assert.strictEqual(marketCap.toString(), web3.utils.toWei("1.0"), "Market cap is updated");

            const lastTradedPrices = await withTieTopicInstance.getLastTradedPrices();
            lastTradedPrices.forEach(priceHex => {
                const price = parseInt(priceHex, 16);
                if (price !== 0) {
                    assert.strictEqual(price.toString(), web3.utils.toWei("0.5"), "last traded price is correct");
                }
            });

            const tradeAddresses = await withTieTopicInstance.getLastConfirmedTradeAddresses();
            assert.strictEqual(tradeAddresses[0], accounts[1], "option 0 address is correct");
            assert.strictEqual(tradeAddresses[1], accounts[2], "option 1 address is correct");
            assert.strictEqual(tradeAddresses[2], zeroAddress, "option 2 address is correct");
            assert.strictEqual(tradeAddresses[3], zeroAddress, "option 3 address is correct");
        });

        /*
        - Accounts[6, 7] will vote for options[0]
        - Accounts[8] will vote for options[1]
        - Accounts[9] will vote for options[1] in next "it" block to trigger resolve
        - Jury will be accounts[3, 4, 5]
        */
        it("allows arbitrators to vote", async () => {
            await withTieTopicInstance.addArbitratorVote(options[0], validArbTimeStamp, false, { from: accounts[6] });
            await withTieTopicInstance.addArbitratorVote(options[0], validArbTimeStamp, false, { from: accounts[7] });
            await withTieTopicInstance.addArbitratorVote(options[1], validArbTimeStamp, false, { from: accounts[8] });

            const currentContractState = await withTieTopicInstance.contractPhase();
            assert.strictEqual(currentContractState.toString(), "1", "contract state is shifted to 1 -> Verification");

            const optionZeroVoteCount = await withTieTopicInstance.countofArbVotes(options[0]);
            assert.strictEqual(optionZeroVoteCount.toString(), "2", "Vote count for option increases by 2");
            const optionOneVoteCount = await withTieTopicInstance.countofArbVotes(options[1]);
            assert.strictEqual(optionOneVoteCount.toString(), "1", "Vote count for option increases by 1");

            for (let i = 0; i < 3; i++) {
                const account = accounts[i + 6];
                const optionToVote = i === 2 ? options[1] : options[0];
                const index = i === 2 ? 0 : i;
                const arbitratorAddress = await withTieTopicInstance.arbitratorsVotes(optionToVote, index);
                assert.strictEqual(account, arbitratorAddress, "arbitrator address for option is pushed correctly");
                
                const arbitrator = await withTieTopicInstance.selectedArbitrators(account);
                assert.isTrue(arbitrator.hasVoted, "arbitrator's has voted flag set to true");
                assert.strictEqual(stringUtils.bytesToString(arbitrator.votedOption), stringUtils.bytesToString(optionToVote), "arbitrator's voted option is set correctly");
            }
        });

        it("triggers resolve with tie when last arbitrator votes and select jury accordingly", async () => {
            await withTieTopicInstance.addArbitratorVote(options[1], validArbTimeStamp, false, { from: accounts[9] });

            const currentContractState = await withTieTopicInstance.contractPhase();
            assert.strictEqual(currentContractState.toString(), "2", "contract state is shifted to 2 -> Jury");

            const numJurySelected = await withTieTopicInstance.getNumOfJurySelected();
            assert.strictEqual(numJurySelected.toString(), "3", "3 remaining accounts are selected as jury");

            const expectedJuryAccounts = [accounts[3], accounts[4], accounts[5]];
            const actualJuryAccounts = await withTieTopicInstance.getJury();
            for (const account of expectedJuryAccounts) {
                const juryStruct = await withTieTopicInstance.selectedJurys(account);
                assert.isTrue(juryStruct.isAssigned, "account is assigned in mapping");
                assert.isTrue(actualJuryAccounts.includes(account), "account is pushed to jury list");
            }
            for (const account of actualJuryAccounts) {
                if (account === zeroAddress) continue;
                const numTimesAppeared = actualJuryAccounts.filter(address => address === account).length;
                assert.strictEqual(numTimesAppeared, 1, "each address only appears once in the list of jury");
            }
            for (const account of selectedArbitrators) {
                assert.isFalse(actualJuryAccounts.includes(account), "selected arbitrator is not selected as jury");
                const juryStruct = await withTieTopicInstance.selectedJurys(account);
                assert.isFalse(juryStruct.isAssigned, "selected arbitrator is not assigned in mapping");
            }
            let juryStruct;
            assert.isFalse(actualJuryAccounts.includes(accounts[0]), "topic creator is not selected as jury");
            juryStruct = await withTieTopicInstance.selectedJurys(accounts[0]);
            assert.isFalse(juryStruct.isAssigned, "topic creator is not selected in mapping");

            assert.isFalse(actualJuryAccounts.includes(accounts[1]), "voter is not selected as jury");
            juryStruct = await withTieTopicInstance.selectedJurys(accounts[1]);
            assert.isFalse(juryStruct.isAssigned, "voter is not selected in mapping");

            assert.isFalse(actualJuryAccounts.includes(accounts[2]), "voter is not selected as jury");
            juryStruct = await withTieTopicInstance.selectedJurys(accounts[2]);
            assert.isFalse(juryStruct.isAssigned, "voter is not selected in mapping");
        });

        /*
        - accounts[3, 4] will vote for option 0
        - accounts[5] will vote for option 1 in next "it" block to trigger resolve
        */
        it("allows jury to vote", async () => {
            await withTieTopicInstance.addJuryVote(options[0], false, { from: accounts[3] });
            await withTieTopicInstance.addJuryVote(options[0], false, { from: accounts[4] });

            const optionZeroVoteCount = await withTieTopicInstance.countofJuryVotes(options[0]);
            assert.strictEqual(optionZeroVoteCount.toString(), "2", "Vote count for option increases by 2");

            for (let i = 0; i < 2; i++) {
                const account = accounts[i + 3];
                const juryAddress = await withTieTopicInstance.jurysVotes(options[0], i);
                assert.strictEqual(account, juryAddress, "jury address for option is pushed correctly");
                
                const jury = await withTieTopicInstance.selectedJurys(account);
                assert.isTrue(jury.hasVoted, "jury's has voted flag set to true");
                assert.strictEqual(stringUtils.bytesToString(jury.votedOption), stringUtils.bytesToString(options[0]), "jury's voted option is set correctly");
            }
        });

        it("triggers resolve without tie when last jury votes and payouts accordingly", async () => {
            const topicCreatorBalanceBef = await web3.eth.getBalance(accounts[0]);
            const winningVoterBalanceBef = await web3.eth.getBalance(accounts[1]);
            const losingVoterBalanceBef = await web3.eth.getBalance(accounts[2]);
            const accountSixBalanceBef = await web3.eth.getBalance(accounts[6]);
            const accountSevenBalanceBef = await web3.eth.getBalance(accounts[7]);
            const accountThreeBalanceBef = await web3.eth.getBalance(accounts[3]);
            const accountFourBalanceBef = await web3.eth.getBalance(accounts[4]);
            const winningVoterWinScoreBef = await predictionMarketInstance.getWinScore(accounts[1]);
            const winningVoterLoseScoreBef = await predictionMarketInstance.getLoseScore(accounts[1]); 
            const losingVoterWinScoreBef = await predictionMarketInstance.getWinScore(accounts[2]);
            const losingVoterLoseScoreBef = await predictionMarketInstance.getLoseScore(accounts[2]); 

            await withTieTopicInstance.addJuryVote(options[1], false, { from: accounts[5] });

            const topicCreatorBalanceAft = await web3.eth.getBalance(accounts[0]);
            const winningVoterBalanceAft = await web3.eth.getBalance(accounts[1]);
            const losingVoterBalanceAft = await web3.eth.getBalance(accounts[2]);
            const accountSixBalanceAft = await web3.eth.getBalance(accounts[6]);
            const accountSevenBalanceAft = await web3.eth.getBalance(accounts[7]);
            const accountThreeBalanceAft = await web3.eth.getBalance(accounts[3]);
            const accountFourBalanceAft = await web3.eth.getBalance(accounts[4]);
            const winningVoterWinScoreAft = await predictionMarketInstance.getWinScore(accounts[1]);
            const winningVoterLoseScoreAft = await predictionMarketInstance.getLoseScore(accounts[1]); 
            const losingVoterWinScoreAft = await predictionMarketInstance.getWinScore(accounts[2]);
            const losingVoterLoseScoreAft = await predictionMarketInstance.getLoseScore(accounts[2]); 

            const winningVoterDiff = winningVoterBalanceAft - winningVoterBalanceBef;
            assert.strictEqual(winningVoterDiff.toString(), web3.utils.toWei("0.98"), "0.98 ETH is transferred to winning voter");
            assert.strictEqual(losingVoterBalanceAft.toString(), losingVoterBalanceBef.toString(), "losing voter balance does not change");

            const marketCap = Number(await withTieTopicInstance.marketCap());
            const arbitratorShare = Math.floor(marketCap / 200);
            const upperBoundArb = Number(arbitratorShare + web3.utils.toWei("100", "kwei"));
            const lowerBoundArb = Number(arbitratorShare - web3.utils.toWei("100", "kwei"));
            
            const accountSixDiff = Number(accountSixBalanceAft - accountSixBalanceBef);
            const accountSevenDiff = Number(accountSevenBalanceAft - accountSevenBalanceBef);
            assert.isTrue(accountSixDiff <= upperBoundArb && accountSixDiff >= lowerBoundArb, "winning arbitrator receives promised share");
            assert.isTrue(accountSevenDiff <= upperBoundArb && accountSevenDiff >= lowerBoundArb, "winning arbitrator receives promised share");

            const topicCreatorDiff = topicCreatorBalanceAft - topicCreatorBalanceBef;
            assert.strictEqual(topicCreatorDiff.toString(), "0", "topic creator does not receive any payouts");

            const creatorBond = Number(await withTieTopicInstance.creatorBond());
            const juryShare = Math.floor((Math.floor(marketCap / 100) + creatorBond) / 2);
            const upperBoundJury = Number(juryShare + web3.utils.toWei("100", "kwei"));
            const lowerBoundJury = Number(juryShare - web3.utils.toWei("100", "kwei"));

            const accountThreeDiff = Number(accountThreeBalanceAft - accountThreeBalanceBef);
            const accountFourDiff = Number(accountFourBalanceAft - accountFourBalanceBef);
            assert.isTrue(accountThreeDiff <= upperBoundJury && accountThreeDiff >= lowerBoundJury, "winning jury received promised share");
            assert.isTrue(accountFourDiff <= upperBoundJury && accountFourDiff >= lowerBoundJury, "winning jury received promised share");
            
            assert.strictEqual(Number(winningVoterWinScoreAft),Number(winningVoterWinScoreBef)+50);
            assert.strictEqual(Number(winningVoterLoseScoreAft),Number(winningVoterLoseScoreBef));
            assert.strictEqual(Number(losingVoterWinScoreAft),Number(losingVoterWinScoreBef));
            assert.strictEqual(Number(losingVoterLoseScoreAft),Number(losingVoterLoseScoreBef)+50);
        });

        it("shifts contract to resolved state and does not allow any other actions", async () => {
            const currentContractState = await withTieTopicInstance.contractPhase();
            assert.strictEqual(currentContractState.toString(), "3", "contract state is shifted to 3 -> Resolved");
            const contractBalance = Number(await withTieTopicInstance.balanceOf());
            assert.isTrue(contractBalance < Number(web3.utils.toWei("10", "wei")), "contract balance is less than 10 wei");

            try {
                await withTieTopicInstance.voteOption(0, validTraderTimeStamp, { from: accounts[0] });
            } catch (error) {
                assert.isTrue(error.message.indexOf("revert") >= 0, "trader error message must contain revert");
            }

            try {
                await withTieTopicInstance.addArbitratorVote(options[0], validArbTimeStamp, false, { from: accounts[6] });
            } catch (error) {
                assert.isTrue(error.message.indexOf("revert") >= 0, "arbitrator error message must contain revert");
            }

            try {
                await withTieTopicInstance.addJuryVote(options[0], false, { from: accounts[3] });
            } catch (error) {
                assert.isTrue(error.message.indexOf("revert") >= 0, "arbitrator error message must contain revert");
            }
        });
    });
});