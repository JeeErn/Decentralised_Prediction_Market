var PredictionMarket = artifacts.require("./PredictionMarket.sol");
var Topic = artifacts.require("./Topic.sol");

module.exports = function(deployer) {
  const predictionMarket = deployer.deploy(PredictionMarket);
};

