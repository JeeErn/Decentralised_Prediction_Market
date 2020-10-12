const { assert } = require("console");

const Topic = artifacts.require("./Topic.sol");

contract("Topic", accounts => {
    let topicInstance = null; 
    before( async () => {
        topicInstance = await Topic.new(accounts[0], "Test", "", [], 0, 0);
    })

    it("Test get name", async () => {
        const name = await topicInstance.name(); 
        assert(name === "Test", "Check name");
    })

    it("Test vote", async () => {
        const balanceBef = await topicInstance.balanceOf(); 
        const senderBalanceBef = await web3.eth.getBalance(accounts[0]);
        const pendingVoteBef = await topicInstance.getPendingVotePrice(1);
        assert(pendingVoteBef == 0, "Pending vote for option 1 should be 0 before voting");
        await topicInstance.voteOption(web3.utils.toWei("0.1"), 1, {
            from: accounts[0], 
            value: web3.utils.toWei("0.1"),
        });
        const balanceAft = await topicInstance.balanceOf(); 
        const senderBalanceAft = await web3.eth.getBalance(accounts[0]);
        // Check that balance has been added and deducted
        assert(balanceAft-balanceBef == web3.utils.toWei("0.1"), "Balance added");
        assert(senderBalanceBef-senderBalanceAft > web3.utils.toWei("0.1"), "Balance deducted");

        // 1) 1 vote is set for option 1 at 0.1 eth, --> Pending vote
        const pendingVoteAft = await topicInstance.getPendingVotePrice(1);
        assert(pendingVoteAft.toString() === web3.utils.toWei("0.1"), "Pending vote for option 1 should be 0.1 after voting");

        // // 2) 1 vote is set for option 2 at 0.1 eth, --> Vote should go through at 0.9 eth
        const sender2BalanceBef = await web3.eth.getBalance(accounts[1]);
        const success = await topicInstance.voteOption(web3.utils.toWei("0.99"), 2, {
            from: accounts[1], 
            value: web3.utils.toWei("0.99"),
        });
        const sender2BalanceAft = await web3.eth.getBalance(accounts[1]);
   
        assert(success, "Vote should have gone through successfully"); 
        assert(sender2BalanceBef-sender2BalanceAft < web3.utils.toWei("0.91") && sender2BalanceBef-sender2BalanceAft > web3.utils.toWei("0.90"), "Balance deducted for successful trade should be more than 0.9 but less than 0.91");

        const pendingVoteAft2 = await topicInstance.getPendingVotePrice(1);
        assert(pendingVoteAft2.toString() === web3.utils.toWei("0"), "Pending vote for option 2 should be reset");

    })

})