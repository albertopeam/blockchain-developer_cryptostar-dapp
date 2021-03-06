const StarNotary = artifacts.require("StarNotary");
const truffleAssert = require('truffle-assertions');

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice:0});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    assert.equal(value, starPrice);
});

it('can add the star name and star symbol properly', async() => {
    let instance = await StarNotary.deployed();

    assert.equal(await instance.name(), "Star Notary NFT");
    assert.equal(await instance.symbol(), "SNT");
});

it('lets 2 users exchange stars', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId1 = 6;
    let starId2 = 7;
    await instance.createStar('awesome star 1', starId1, {from: user1});
    await instance.createStar('awesome star 2', starId2, {from: user2});

    await instance.exchangeStars(starId1, starId2, {from: user1})

    assert.equal(await instance.ownerOf(starId1), user2);
    assert.equal(await instance.ownerOf(starId2), user1);
});

it('doesnt let 2 users exchange stars if sender is not owner of none of them', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId1 = 8;
    let starId2 = 9;
    await instance.createStar('awesome star 1', starId1, {from: user1});
    await instance.createStar('awesome star 2', starId2, {from: user2});

    await truffleAssert.reverts(instance.exchangeStars(starId1, starId2, {from: owner}), "You can't exchange the star you don't own");
});

it('doesnt let 1 user exchange its stars', async() => {
    let instance = await StarNotary.deployed();
    let starId1 = 10;
    let starId2 = 11;
    await instance.createStar('awesome star 1', starId1, {from: owner});
    await instance.createStar('awesome star 2', starId2, {from: owner});

    await truffleAssert.reverts(instance.exchangeStars(starId1, starId2, {from: owner}), "Sender is owner of both stars");
});

it('lets a user transfer a star', async() => {
    let instance = await StarNotary.deployed();
    let starId = 12;
    let to = accounts[1];
    let newOwner = accounts[3];
    await instance.createStar('awesome star', starId, {from: newOwner});

    await instance.transferStar(to, starId, {from: newOwner})

    assert.equal(await instance.ownerOf(starId), to);
    assert.equal(await instance.balanceOf(newOwner), 0);
});

it('doesnt let a user to transfer a star that is not owned', async() => {
    let instance = await StarNotary.deployed();
    let starId = 13;
    await instance.createStar('awesome star', starId, {from: owner});

    await truffleAssert.reverts(instance.transferStar(accounts[1], starId, {from: accounts[2]}), "Sender can't transfer a star that is not owned")
});

it('lookUptokenIdToStarInfo test', async() => {
    let instance = await StarNotary.deployed();
    let starId = 14;
    let starName = "new star";
    await instance.createStar(starName, starId, {from: owner});

    let name = await instance.lookUptokenIdToStarInfo(starId);
    assert.equal(name, starName)
});