var PredictionMarket = artifacts.require("./PredictionMarket.sol");
var Topic = artifacts.require("./Topic.sol");

module.exports = function(deployer) {
  deployer.deploy(PredictionMarket);
  deployer.deploy(Topic, 'test contract');
};
