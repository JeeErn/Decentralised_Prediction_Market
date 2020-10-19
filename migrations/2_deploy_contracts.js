var PredictionMarket = artifacts.require("./PredictionMarket.sol");
var Topic = artifacts.require("./Topic.sol");

module.exports = function(deployer) {
  const predictionMarket = deployer.deploy(PredictionMarket);
  deployer.deploy(Topic,"0xc85E1Ba8F9D7cfdf27ff7604A8802FD589Ac7149", 'Will Joe Biden Win the election', 'test', [web3.utils.fromAscii("yes"), web3.utils.fromAscii("no"), web3.utils.fromAscii("others")], 0, 0, []);
};

