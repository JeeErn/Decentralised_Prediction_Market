# Decentralised Prediction Market
A Decentralised Prediction Market application using Ethereum, inspired by Augur and Omen. Sign up, create a topic, and predict which outcome will be resolved as true. Rake up win points every time you predict the outcome correctly, and become a legendary trader that has the ability to influence others' perception through our reputation based prediction scoring system. 

<br />

# Requirements
In order to participate in the market activities, an Etherium wallet manager such as [Metamask](https://metamask.io) with sufficient Ether is required. For developers looking for development requirements, see our [Development section](#Development). 

<br />

# Market Mechanisms
This section walks through all the market mechanisms that the platform handles. 

## **Account Creation**
There are 2 types of accounts that the platform uses:
* Trader account
* Arbitrator account  

Traders are regular accounts that are tied to the address indicated in your Etherium wallet. Each address can only create **_one_** trader account. 

<br />

# Development
This section covers the installation process and steps to build and run the project on local environment.  
Note that the instructions provided are for MacOS and may not necessarily be followed step-by-step for other OS. 
  
## **Installation**
---

In order to run the project in local environment, the following are minimum requirements:
* [node](https://nodejs.org/en/) v8.9.4 or later
* [npm](https://www.npmjs.com/) (use _`npm -v`_ to ensure it is installed correctly)
* [Metamask Extension](https://metamask.io/download.html) and at least 1 account created

> As we developed the project using a newer version of node, we recommended installing the following instead for the best development experience:
> * node v12.18.4

After installing the requirements, use the following code to install truffle
```bash
npm install truffle -g # you may need to use `sudo` depending permission settings
truffle version # ensure successful installation
```
If you used the recommended settings, you should see the following installed when you call `truffle version`:
```
Truffle v5.1.48 (core: 5.1.48)
Solidity v0.5.16 (solc-js)
Node v12.18.4
Web3.js v1.2.1
```
You will also need to install [Ganache](https://www.trufflesuite.com/ganache). 

<br />

### **Client-Side Installations**
We used React.js to develop the web client. In order to install the dependencies, go to the main folder of this project and navigate to the client folder using
```bash
cd client 
```
then run 
```bash
npm i # installs all dependencies required
```
<br />

## **Building the Smart Contract**
---
In order to build and run the smart contracts in local environment, you will need to have a local blockchain instance running. To do so:

1. Open **Ganache**.

> You may either use a Quickstart Workspace or create a new Workspace, both are fine for development purposes. **Ensure that Ethereum is the selected option, and not Corda!**

2. Use the terminal and navigate to the main folder of the project
3. Run the following commands in sequence:
```bash
# You may need to use `sudo` depending on your permission settings
truffle compile # compiles the smart contracts
truffle migrate # runs the migration scripts
```

With this, the smart contract will be built and running on your Ganache local blockchain instance.

Note: you may try running unit tests using 
```bash
truffle test
```
However, note that not all tests may pass as there are some differences between the function signatures that we use for unit testing and for actual deployment. You may see this [commit history](insert URL to commit history of cleanup) to find the function signatures that changed. 

<br />

## **Starting the Client**
---
In this project, we use a web client to interact with the smart contracts instead of using the command line interface. To start the web client on localhost:

1. Navigate to the client directory in terminal using
```bash
cd client
```
2. Run the following command within client directory 
```bash
npm start
```
Your browser should open a new tab with http://localhost:3000. 
> Important: Ensure that the tab opens in the browser with the Metamask Extention installed!  

3. Open the web browser with Metamask Extension installed. 
4. Use the dropdown within the Metamask Extension and select _Custom RPC_
5. Add the new network. For the _New RPC URL_, use the RCP Server URL found in your Ganache instance
6. Import the private keys of the Ganache accounts into the Metamask Wallet manager

Note: you may need to refresh the page for the changes to take effect.  

If you see the front page for creating a new trader or arbitrator account, the set up is complete and you may start development!

