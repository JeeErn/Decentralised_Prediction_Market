# Decentralised Prediction Market
A Decentralised Prediction Market application using Ethereum, inspired by Augur and Omen. Sign up, create a topic, and predict which outcome will be resolved as true. Rake up win points every time you predict the outcome correctly, and become a legendary trader that has the ability to influence others' perception through our reputation based prediction scoring system. 

<br />

# Requirements
In order to participate in the market activities, an Etherium wallet manager such as [Metamask](https://metamask.io) with sufficient Ether is required. For developers looking for development requirements, see our [Development section](#Development). 

<br />

# Market Mechanisms
This section provides a walkthrough on all the market mechanisms that the platform handles. 

## **Account Creation**
There are 2 types of accounts that the platform uses:
* Trader account
* Arbitrator account  

Traders are regular accounts that are tied to the address indicated in your Etherium wallet. Each address can only create **_one_** trader account. Every trader account starts with 100 win score and 100 lose score for a reputation score of 0.5 and changes as the trader votes on topics. Reputation score is calculated as follows:
```math
rep = win / (win + lose)
```

More on the reputation system later. 

Arbitrators are special, trusted parties that are in charge of result reporting. While trader accounts are nameless, arbitrator accounts have a display name attached to the address, which used for identification purposes when a topic is being created. Every arbitrator account has a trustworthiness score that starts at 50 and changes between 0 and 100 inclusive as the arbitrator reports on topics. More on the trustworthiness system later. 

_Because we require every user to have a trader account, users who wish to become arbitrators will have to pay the account creation gas fee twice - once for a trader account, once for an arbitrator account._

## **Topics**
Topics are the essence of our platform. Traders can select any topic they wish to predict on and place a stake on the outcome that they believe will be most likely to happen. There are several key components to each topic:
1. [Topic state](#1-topic-state-)
2. [Title](#2-title-)
3. [Description](#3-description-)
4. [Market cap](#4-market-cap-)
5. [Expiry date](#5-expiry-date-)
6. [Selected arbitrators](#6-selected-arbitrators-)
7. [Vote options](#7-vote-options-)
8. [Weighted probability](#8-weighted-probability-)
9. [Last traded price](#9-last-traded-price-)
10. [Pending price](#10-pending-price-)

The details of each key component is explained below. 

### 1. Topic State [^](#Topics)
A topic can exist in one of following 4 states:
1. Open
2. Verification
3. Jury
4. Resolved

When a topic is first created, it will be in the open state. It will exist in this state until after the expiry date. In this state, any trader who is not selected as an arbitrator for the topic can place their votes on the outcome they think is most likely to happen. 

Once the expiry date has passed, the topic will transit to the verification state. In this state, the arbitrators selected to report the correct result of the topic will place their votes. Once the last selected arbitrator has placed his/her vote, the topic will transit to the next state depending on the outcome. 

In the event of a **tie** occurs in deciding the correct result, the topic will transit to the **Jury** state. During the transition to this state, a panel of Jurors are selected from the list of arbitrators. The jury will then have another round of voting. The outcome that the jury selects is final and will be used as the correct outcome of the topic. 

Once the topic has received a final outcome, either from the selected arbitrators or from the jury, all users that are due to receive their payouts will automatically receive them when the topic transits to the Resolved state. The payouts system is explained in more detail later. Once the topic is in the resolved state, no other actions can be performed on the topic. 

### 2. Title [^](#Topics)
The title is the name of the topic. As multiple topics of the same title may exists at the same time, traders should choose the topic to vote for carefully and at their own discretion. 

### 3. Description [^](#Topics)
The description provides more information about the topic to give context to the topic title. As certain titles may be ambiguous or misleading, traders and arbitrators alike should read through the topic description before placing their votes. 

### 4. Market Cap [^](#Topics)
Market cap is the amount of Ether that has been placed into the topic by voters. 

### 5. Expiry Date [^](#Topics)
Expiry date is the cutoff date for voting. Ideally, it should be the day that the correct outcome of the topic can confidently determined by arbitrators. 

_Traders: do note that voting will only be open till the day **BEFORE** the expiry date._

### 6. Selected Arbitrators [^](#Topics)
Selected arbitrators are arbitrators that have been selected to report on the final outcome of the topic. A minimum of 1 and maximum of 5 arbitrators can be selected for each topic. 

### 7. Vote Options [^](#Topics)
Vote options are the available options for voting. These represent the possible outcomes that the topic can resolve to. There should exist a minimum of 2 options and a maximum of 4 options for each topic. Ideally, the options given will cover all possible scenarios that the topic can resolve towards. 

### 8. Weighted Probability [^](#Topics)
Weighted probability is the aggregated probability that the option will be the correct one. This probability accounts for the voter's reputation at the time of voting, as well as the price the voter paid for the vote to happen. 

The formula for calculating the weighted probability is as follows:
```math
option_win = sum(voter_win * price_of_vote);  
option_lose = sum(voter_lose * price_of_vote);  
option_rep = option_win / (option_win + option_lose);  
option_weighted_prob = option_rep / sum(all_option_rep);
```
With this weighted probability, a trader with a higher reputation score would affect these numbers more than a trader with a lower reputation score, given the same voting price. 

On the other hand, a voter with a very low reputation score may in turn lower the weighted probability of the outcome he/she voted for, given his poor track record of predicting outcomes correctly.

> Disclaimer: The weighted probability does not indicate that the option will be correct, but instead is a visualisation of the sentiment of previous voters, with the individual voter reputation taken into account. 

### 9. Last Traded Price [^](#Topics)
The last traded price shows the prices of the last trade that got accepted by the system. The numbers shown merely serves as a guide for voters to place their price for the vote. 

> Disclaimer: Voters should place their prices according to their own comfort levels. In no way are we responsible for influencing the decision of any voter to vote above what they are comfortable with. 

### 10. Pending Price [^](#Topics)
The pending price shows the current votes that have not been converted into a confirmed trade. On our platform, confirmed trades must make up exactly 1 Ether, and must comprise of at least 2 different voted options. Therefore, votes may be stuck in pending price for 2 reasons:
1. The sum of prices in the pending prices is less than 1 Ether
2. Only 1 option has been voted for in the pending options

In the first case, all votes will remain stuck in pending state until a higher priced vote is made for 1 or more of the options, making the sum of prices go above of equal 1 Ether.

In the second case, the pending vote will have to await for more votes to be cast for other options in order to make up a valid trade and be processed by the market. 

Voting will be explained in greater detail later.

_In the event that there are votes that are still pending and the topic transits from Open state to Verification state, all pending prices will be refunded to the voters and those votes will be discarded. However, the gas price used to cast the vote will not be refunded._

<br />

# Development
This section covers the installation process and steps to build and run the project on local environment.  
Note that the instructions provided are for MacOS and may not necessarily be followed step-by-step for other OS. 
  
## **Installation**
In order to run the project in local environment, the following are minimum requirements:
* [node](https://nodejs.org/en/) v8.9.4 or later
* [npm](https://www.npmjs.com/) (use _`npm -v`_ to ensure it is installed correctly)
* [Metamask Extension](https://metamask.io/download.html) and at least 1 account created

> As we developed the project using a newer version of node, we recommend installing the following instead for the best development experience:
> * node v12.18.4

After installing the requirements, use the following code to install truffle
```bash
npm install truffle -g # you may need to use `sudo` depending on your permission settings
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

### **Client-Side Installations**
We used React.js to develop the web client. In order to install the dependencies, go to the main folder of this project and navigate to the client folder using
```bash
cd client 
```
then run 
```bash
npm i # installs all dependencies required
```

## **Building the Smart Contract**
In order to build and run the smart contracts in local environment, you will need to have a local blockchain instance running. To do so:

1. Open **Ganache**

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
However, note that not all tests may pass as there are some differences between the function signatures that we use for unit testing and for actual deployment. You may see this [commit history](https://github.com/JeeErn/Decentralised_Prediction_Market/commit/394c53e1ab563cfb4a39480ee5dba03d6ec295e7) to find the function signatures that changed. 

## **Starting the Client**
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

3. Open the web browser with Metamask Extension installed 
4. Use the dropdown within the Metamask Extension and select _Custom RPC_
5. Add the new network. For the _New RPC URL_, use the RCP Server URL found in your Ganache instance
6. Import the private keys of the Ganache accounts into the Metamask Wallet manager

Note: you may need to refresh the page for the changes to take effect.  

If you see the front page for creating a new trader or arbitrator account, the set up is complete and you may start development!

