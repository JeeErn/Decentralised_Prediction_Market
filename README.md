# Decentralised Prediction Market
A Decentralised Prediction Market application using Ethereum, inspired by Augur and Omen. Sign up, create a topic, and predict which outcome will be resolved as true. Rake up win points every time you predict the outcome correctly, and become a legendary trader that has the ability to influence others' perception through our reputation based prediction scoring system. 

### Submission Note
* This project was not deployed on Ethereum testnet. It was only deployed on local Ganache instance.
* Further information regarding installation, building the contract and starting the client can be found in the [Development](#development) section below.


### Video Demo
The following is a video explaining our system. Clicking on the image will redirect the browser to the YouTube video. 

[![](http://img.youtube.com/vi/J-FDntnHnkk/0.jpg)](http://www.youtube.com/watch?v=J-FDntnHnkk "Video Demo")

## Table of Contents
* [Requirements](#requirements)
* [Market Mechanisms](#market-mechanisms)
    * [Account Creation](#account-creation)
    * [Details about Topics](#topics)
    * [Topic Creation](#topic-creation)
    * [Voting](#voting)
    * [Resolution](#resolution)
    * [Jury Selection](#jury-selection)
    * [Payout](#payout)
    * [Reputation and Trustworthiness System](#reputation-and-trustworthiness-system)
    * [Security Considerations](#security-considerations)
* [Development](#development)
* [Recommended Test Flow](#recommended-test-flow)
* [Acknowledgements](#acknowledgements)

<br />

# Requirements
In order to participate in the market activities, an Ethereum wallet manager such as [Metamask](https://metamask.io) with sufficient Ether is required. For developers looking for development requirements, see our [Development section](#Development). 

<br />

# Market Mechanisms
This section provides a walkthrough on all the market mechanisms that the platform handles. 

## **Account Creation**
There are 2 types of accounts that the platform uses:
* Trader account
* Arbitrator account  

Traders are regular accounts that are tied to the address indicated in your Ethereum wallet. Each address can only create **_one_** trader account. Every trader account starts with a win score of 100 and a lose score of 100, which translates to a reputation score of 0.5. This reputation score changes each time the traders' votes on a topic is resolved. Reputation score is calculated as follows:
```math
rep = win / (win + lose)
```

Arbitrators are special, trusted parties that are in charge of result reporting. While trader accounts are nameless, arbitrator accounts have a display name attached to the address, which used for identification purposes when a topic is being created. Every arbitrator account has a trustworthiness score that starts at 50 and changes between 0 and 100 (inclusive) as the arbitrator reports on topics. 

_Because we require every user to have a trader account, users who wish to become arbitrators will have to pay the account creation gas fee twice - once for a trader account, once for an arbitrator account._

More on the reputation and trustworthiness system [later](#reputation-and-trustworthiness-system). 

## **Topics**
Topics are the essence of our platform. Traders can select any topic they wish to predict on and place a stake on the outcome that they believe will be most likely to happen. They can also [create topics](#topic-creation) for other traders to vote on. There are several key components to each topic:
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
A topic can exist in one of the following 4 states:
1. Open
2. Verification
3. Jury
4. Resolved

When a topic is first created, it will be in the _Open_ state. It will exist in this state until after the expiry date. In this state, any trader who is not selected as an arbitrator for the topic can place their votes on the outcome they think is most likely to happen. 

Once the expiry date has passed, the topic will transit to the _Verification_ state. In this state, the arbitrators selected to report the correct result of the topic will place their votes. Once the last selected arbitrator has placed his/her vote, the topic will transit to the next state depending on the outcome of the arbitrators' votes. 

In the event where a **tie** occurs while deciding the correct result(ie, tally of arbitrators' votes results in more than one option having the same _top_ number of votes), the topic will transit to the _**Jury**_ state. During the transition to this state, a panel of Jurors are [selected](#jury-selection) from the list of arbitrators. The jury will then have another round of voting. The outcome that the jury selects is final and will be used as the correct outcome of the topic. 

Once the topic has received a final outcome, either from the selected arbitrators or from the jury, all users that are due to receive their payouts will automatically receive them when the topic transits to the _Resolved_ state. The payouts system is explained in more detail [later](#payout). Once the topic is in the resolved state, no other actions can be performed on the topic. 

### 2. Title [^](#Topics)
The title is the name of the topic. As multiple topics of the same title may exist at the same time, traders should choose the topic to vote for carefully and at their own discretion. 

### 3. Description [^](#Topics)
The description provides more information about the topic to give context to the topic title. As certain titles may be ambiguous or misleading, traders and arbitrators alike should read through the topic description before placing their votes. 

### 4. Market Cap [^](#Topics)
Market cap is the amount of Ether that has been placed into the topic by voters, regardless of whether the vote is pending or confirmed. 

### 5. Expiry Date [^](#Topics)
Expiry date is the cutoff date for voting. Ideally, it should be the day where a correct outcome of the topic can confidently determined by arbitrators. 

_Note to Traders: Voting will only be open till **the day BEFORE** the expiry date._

### 6. Selected Arbitrators [^](#Topics)
Selected arbitrators are arbitrators that have been selected to report on the final outcome of the topic. A minimum of 1 and maximum of 5 arbitrators can be selected for each topic. 

### 7. Vote Options [^](#Topics)
Vote options are the available options for voting. These represent the possible outcomes that the topic can resolve to. There should exist a minimum of 2 options and a maximum of 4 options for each topic. Ideally, the options given will cover all possible scenarios that the topic can resolve towards. 

### 8. Weighted Probability [^](#Topics)
The motivation behind the weighted probability is to to give a depiction of the outcome of the event taking into consideration 3 factors: 
1. The price that a trader has traded at
2. The ratio of the number of times the trader is right to the number of times the trader was wrong (Reputation Score) 
3. The number of times that a trader has traded in the past.

To calculate this weighted probability, each option will have a win score and a lose score. From the win/lose scores, an option reputation score will be derived from it. The option weighted probability is then derived from the option reputation score.
The formula for calculating the weighted probability is as follows:
```math
option_win = sum(voter_win x price_of_vote);  
option_lose = sum(voter_lose x (1-price_of_vote));  
option_rep = option_win / (option_win + option_lose);  
option_weighted_prob = option_rep / sum(all_option_rep);
```
In the following example, we will look at how the bets of 2 people with different reputation scores will affect the weighted probability of an outcome.
Example: 
```math
Alice Win Score = 900
Alice Lose Score = 100
Bob Win Score = 100
Bob Lose Score = 100
Alice Rep Score = 0.9 
Bob Rep Score = 0.5
```
Intuitively, this means that Alice is more credible than Bob. Let's now look at the following scenario where there is one Topic with 2 options: Option A and Option B.

``` math
Option A Win Score = 100 
Option A Lose Score = 100 
Option B Win Score = 100
Option B Lose Score = 100 

Current weights: 
- Option A: 100/200 = 0.5
- Option B: 100/200 = 0.5

Weighted Probability:
Option A: 0.5/(0.5+0.5) = 0.5 
Option B: 0.5/(0.5+0.5) = 0.5 

```
Alice now makes a bet of 0.9 on option A, Bob makes a bet of 0.1 on option B. 
```
New Win/Lose Scores:
Option A Win Score = 100 + (0.9)*900 = 910
Option A Lose Score = 100 + (0.1)*100 = 110
Option B Win Score = 100 + (0.1)*100 = 110
Option B Lose Score = 100 + (0.9)*100 = 190

New Weights:
Option A: 910/1020 = 0.892
Option B: 110/300 = 0.366 

New Weighted Probabilities:
Option A: 0.892/1.258 = 0.71
Option B: 0.366/1.258 = 0.29
```
This is aligned with the intuition that the weighted probability will sway in Alice's direction more than Bob's, as Alice is more credible. Conversely, if Bob's reputation score is higher, with the same total win+lose scores, the same bet will sway the vote in Bob's direction.

With this weighted probability, a trader with a higher reputation score would affect these numbers more than a trader with a lower reputation score, given the same voting price. 

On the other hand, a voter with a very low reputation score may in turn lower the weighted probability of the outcome he/she voted for, given his poor track record of predicting outcomes correctly.

> Disclaimer: The weighted probability does not indicate that the option will be correct. 

### 9. Last Traded Price [^](#Topics)
The last traded price shows the prices of the last trade that got accepted by the system. The numbers shown merely serves as a guide for voters to place their price for the vote. 

> Disclaimer: Voters should select their prices according to their own comfort levels. In no way are we responsible for influencing the decision of any voter to vote above what they are comfortable with. 

### 10. Pending Price [^](#Topics)
The pending price shows the current votes that have not been converted into a confirmed trade. On our platform, confirmed trades must make up exactly 1 Ether, and must comprise of at least 2 different voted options. Therefore, votes may be stuck in pending price for 2 reasons:
1. The sum of prices in the pending prices is less than 1 Ether
2. Only 1 option has been voted for in the pending options

In the first case, all votes will remain stuck in pending state until a higher priced vote is made for 1 or more of the options, making the sum of prices go above of or equal to 1 Ether.

In the second case, the pending vote will have to await for more votes to be cast for other options in order to make up a valid trade and be processed by the market. 

Voting will be explained in greater detail [later](#voting).

>_In the event that there are votes that are still pending and the topic transits from Open state to Verification state, all pending prices will be refunded to the voters and those votes will be discarded. However, the gas price used to cast the vote will not be refunded._


## **Topic Creation**
Anyone can create a topic, as long as they have a trader account. When creating topics, there are some things to note:
* The topic creator has to put down a mandatory 1 Ether topic creation bond. This bond will be refunded to the topic creator if the selected arbitrators resolve the outcome **without any tie**. This encourages topic creators to create options that are unambiguous and also select their topic's arbitrators carefully(choose arbitrators that are more _trusthworthy_). 
* The topic creator will receive 1% of the topic's market cap when the topic has been resolved **without any tie**. This encourages topic creators to create interesting topics that will garner high voting activity.
* When creating topics, each option is limited to 32 ASCII characters or lesser. This is due to a limitation when transferring the information to the blockchain. 

## **Voting**
Voting can be categorised into 3 categories: trader voting, arbitrator voting and jury voting. Each type will be discussed in detail below. 

### Trader Voting
Trader voting is the act of casting a vote for an outcome on any topic when the topic is in the _Open_ state. This type of voting is the one that most users will engage in. Anyone can engage in trader voting, **except the selected arbitrators**. 

To vote on a topic, the user will first select a price in Ether that he/she believes is worth the outcome, as well as the option that he/she wants to vote for. Submitting the vote will place it in a pending phase, whereby it will be submitted if succesfully matched by the system to other votes.

In the event that the user tries to vote for an option with an existing pending vote, the vote with the higher price will be kept by the system, and the lower priced vote will be refunded to the voter. 

During the matching phase, the system will match votes for different options together, _in the order that the votes were received_. 
* If the sum of prices of pending votes is less than 1 Ether, then all the pending votes remain as pending until a new vote increases the sum to 1 Ether. 
* If the sum of prices of pending votes is equal to or exceed 1 Ether, then the votes will be combined together as a confirmed trade and the votes will become confirmed. When the sum of prices exceed 1 Ether, the excess will be refunded to the last voter. 

Once the votes are confirmed, the weighted probabilities for each option will be updated with the newest values. The buffer of pending votes will be cleared and the system will be ready to receive new votes to fill up the pending votes buffer. 

### Arbitrator Voting
Arbitrator voting happens once the topic is on, or passes the expiry date. Only arbitrators selected to report on the result for a particular topic can vote on that topic's outcome. 

Arbitrators selected for reporting should perform their due diligence in researching the true final outcome of the topic before placing their votes. While there is no deadline for arbitrator voting, arbitrators should place their votes as soon as possible. Also, arbitrators will not be aware of the votes that other arbitrators have placed. 

Once the final selected arbitrator votes (e.g. for a topic with 5 selected arbitrators, the 5th arbitrator votes), the votes of all arbitrators will be tallied and the topic will transit to the next state(either _Jury_ or _Resolved_). 

### Jury Voting
Jury voting works in the same manner as arbitrator voting, but only occurs when the selected arbitrators cannot come to a majority conclusion on the topic's final outcome. Only selected jurors for the topic will be allowed to vote during the jury selection stage. Jury selection is discussed in more detail [later](#jury-selection). 

## **Resolution**
Once the last selected arbitrator or jury places his/her vote, the topic will move into a temporary resolution state. During resolution, the votes for the final outcome will be tallied. In the case of counting selected arbitrators' votes, if the final outcome contains a tie, the topic will resolve as an tied-outcome and the topic will transit to the _Jury_ state and the jury will be selected. In the case of jury voting, it is assumed that the jury will definitely have a majority outcome. 

Once a majority outcome has been achieved, the topic will automatically trigger a payout event, as well as a reputation and trustworthiness update event for all parties involved. 

## **Jury Selection**
Jury selection happens whenever a topic transits to the _Jury_ state. A maximum of 5 jurors will be selected randomly for the jury. The steps for jury selection are as follows:
1. All arbitrator accounts are retrieved
2. From the pool of all arbitrator accounts, in the event that the topic creator was an arbitrator, his/her account will be removed from the pool
3. All selected arbitrators for the topic will be removed from the pool
4. Any arbitrator who had voted as a trader in the topic will be removed from the pool
5. **In the event 5 or fewer arbitrators are left for selection, all of them will be selected for jury and the selection event ends here**
6. From the remaining pool of arbitrators, a ballot is formed. For each arbitrator in the pool:
    * The trustworthiness score of the arbitrator will be retrieved
    * For every 10 trustworthiness score, 1 ballot chance will be added into the ballot in the arbitrator's name (e.g. for a score of 75, 7 chances are added)
7. Once all the ballot chances are added, arbitrators are randomly retrieved from the ballot
8. If the arbitrator has not yet been selected as a juror, add him/her to the list of jury. Otherwise, ignore this and continue
9. Repeat steps 7-8 until 5 jurors are selected

## **Payout**
Once the final outcome (a.k.a winning option) is achieved, a payout will be automatically triggered. The payout calculations and conditions for each involved party is detailed below. 

### Topic Creator
In the event that there was no tie during the selected arbitrator voting stage, the topic creator will be refunded his/her 1 Ether creator bond. In addition to that, the topic creator will receive 1% of the market cap of the topic. 

Otherwise, in the event that there was a tie, the topic creator forfeits both the creator bond and the 1% benefit, and will not receive any payout. 
> Note: this is separate from any payouts the topic creator might be due to receive if he/she participates in trader voting.

### Trader Payout
Regardless of whether there was a tie at the arbitrator voting stage, all winning trader voters will receive 0.98 Ether for each confirmed vote they placed on the topic's winning option. Traders who voted on the non-winning option will receive nothing as payout. 

### Arbitrator Payout
Regardless of whether there was a tie at the arbitrator voting stage, each winning arbitrator who voted for the winning option will receive 
```math
(1% x market_cap) / number_of_winning_arbitrators
```
Arbitrators who voted for the non-winning option will not receive any payout.

### Jury Payout
In the event that jury voting took place, the forfeited creator bond and 1% of market cap previously entitled to the creator will be used to pay the jury. Each winning juror who voted for the winning option will receive
```math
(1 ETH + 1% x market_cap) / number_of_winning_jurors
```
Jurors who voted for the non-winning option will not receive any payout. 

## **Reputation and Trustworthiness System**
Traders follow a reputation system and arbitrators have a trustworthiness system. The respective systems and update mechanisms are detailed below. 

### Trader Reputation System
The trader reputation system is comprised of 2 scores, a "win score" and "lose score" that starts at 100 each for every trader. The reputation of the trader will affect how much influence the trader will have on the weighted probability of the topic. 

Whenever a topic resolves, every trader with a confirmed vote in the topic will go through a reputation update process. The process repeats for every confirmed vote that the trader has in the topic. 

In the event the trader voted on the winning option, his/her "win score" will be increased. The trader's lose score will not change in this case. The calculation is as follows:
```math
new_win_score = prev_win_score + 100 x (1 - price_of_vote)
```

In the event that the trader voted on the non-winning option, his/her "lose score" will be increased. The trader's win score will not change in this case. The calculation is as follows:
```math
new_lose_score = prev_lose_score + 100 x price_of_vote
```

Our reputation update formula results in votes for popular options (and thus higher prices) becoming less rewarding and more risky for the trader's reputation. On the other hand, less popular options provide greater reward when it is the winning option and punishes less when it is not the winning option. 

### Arbitrator Trustworthiness System
The arbitrator trustworthiness system only has one score. This trustworthiness score starts at 50 for every new arbitrator. The trustworthiness of the arbitrator directly affects his/her chances to be selected as a juror in the future, so the arbitrator is incentivised to keep his/her trustworthiness high in order to be called to jury duty and earn the incentives of being a honest juror.

Whenever a topic resolves, if the arbitrator had voted in the topic either as a selected arbitrator or as a juror, his/her trustworthiness will be updated.

In the event the arbitrator voted on the winning option, his/her trustworthiness will be increased by **5** points, and will be capped at a maximum of **100** points. 

In the event the arbitrator voted on the non-winning option, his/her trustworthiness will immediately be set to **0** points. This harsh punishment stems from the fact that arbitrators are supposed to be trusted parties. 

## **Security Considerations**
To safeguard our smart contracts, we have erected some security features to guard against re-entrancy attacks, integer overflow and malicious collusion amongst arbitrators. 

### Re-entrancy Attacks
In order to guard against malicious scripts that can launch a re-entrancy attack, we ensure that our contracts do not transfer Ether to the same address within the same window. Before transferring Ether to an address, the address is checked against a "cache". If the address is found in the cache, future transfers to the address within the same window is denied. If the address was not found, the address is added to the "cache" before the transfer occurs, and is removed from the cache after the transfer is successful. 

### Integer Overflow
We recognise that within our trader reputation system, the "win score" and "lose score" could theoretically increase towards the maximum unsigned integer limit. As such, we use [OpenZeppelin's SafeMath](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/math/SafeMath.sol) contract to perform the integer addition. This prevents integer overflow from happening silently.

### Malicious Collusion Amongst Arbitrators
We recognise that our arbitrator system may become susceptible to collusion amongst the arbitrators. Our safeguard against this is the jury system, whereby the jury is selected randomly without any juror knowing who are the other jurors. 

Our working assumption is that the there will be sufficient honest selected arbitrators in each topic that will report the correct outcome, which will be enough to make the topic go into _Jury_ state. As the jurors are unaware of who else is the juror, there is little risk of collusion at the jury voting stage. 

Any arbitrator who reports falsely will get their trustworthiness score set to 0. As a result, these dishonest arbitrators will have very little chance to become a juror in another topic, which limits the damaging effects that a dishonest arbitrator can have on the system. Also, during topic creation, the arbitrator's trustworthiness is displayed, and any logical/rational topic creator will avoid choosing an arbitrator with low trustworthiness score to report on their topic as it might affect the likelihood of the topic creator getting back his/her topic creation bond and 1% of market cap. 

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

<br />

# Recommended Test Flow
To test out the different flows of this application (e.g. verification and jury phase), a recommended flow will be:
1. Import Ganache accounts into Metamask.
2. Create 10 different (arbitrator and trader) accounts on the platform. (Tip: Setting the arbitrator names to be the same as the metamask name of the account will help alot in nagivating between accounts.)
3. Using 1 account, create 2 (Or as many as you want) topics with 2 options, both with 2 (any even number) arbitrators and an expiry date 1 day after today. 
4. Go to the arbitrator accounts and try resolving the topics. You should not be able to. 
5. After 8am (SGT) on the expiry date, try to resolve the topics with the arbitrator accounts. 
6. On 1 topic, make a tie occur by having the arbitrators resolve differently. On the other topic, allow the arbitrators resolve to the same option. 
7. Observe the arbtirator trustworthiness score by going to : create topic -> select arbitrators. 
8. Observe the reputation scores of the voters; those who got it right and those who did not.
9. Observe the balances of the topic creator, arbitrators and voters. 
10. Try to make the voters vote on a new topic. Observe how their reputation scores affect the weighted probablity

<br />

# Acknowledgements
This project was developed as a course project for Nanyang Technological University's CX4153 Intro to Blockchain course. All code in this project belong entirely to the 3 original contributors of the project, and may not be redeployed on any blockchain network, in part or in whole, without explicit consent from all 3 members. You may, however, deploy the project on local Ganache and Ethereum testnet for the purpose of testing and reference. 
