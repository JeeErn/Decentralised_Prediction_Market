const stringUtils = require("./utils/stringUtil.js");
const Topic = artifacts.require("./Topic.sol");
const PredictionMarket = artifacts.require("./PredictionMarket.sol");

const zeroAddress = "0x0000000000000000000000000000000000000000";

contract("Topic", accounts => {
    let topicInstance = null; 
    before( async () => {
        topicInstance = await Topic.new(accounts[0], "Test", "", [], 0, 0, [accounts[9]], "0xc85E1Ba8F9D7cfdf27ff7604A8802FD589Ac7149");
    })
   
    it("should be able to get weighted flows", async () => {
        const weightedVotes = await topicInstance.options(0); 
        const name = await topicInstance.name({from: accounts[0]});
        console.log(weightedVotes);
    })

})