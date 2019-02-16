const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledFactory = require('../ethereum/build/CampaignFactory.json');
const compiledCampaign = require('../ethereum/build/Campaign.json');

let accounts;
let factory;

let campaignAddress;
let campaign;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
    .deploy({ data: compiledFactory.bytecode })
    .send({ from: accounts[0], gas: '1000000'});

  //send only gives back a transaction receipt
  //That's why we have a getDeployedCampaigns function
  await factory.methods.createCampaign('100').send({
    from: accounts[0],
    gas: '1000000'
  });

  [campaignAddress] = await factory.methods.getDeployedCampaigns().call();
  campaign = await new web3.eth.Contract(
    JSON.parse(compiledCampaign.interface),
    campaignAddress
  );
});

describe('Campaigns', () => {
  it('deploys a factory and a campaign', () => {
    assert.ok(factory.options.address);
    assert.ok(campaign.options.address);
  });

  //caller of createCampaign
  it('marks a caller as the campaign manager', async() => {
    //whenever we create a global public variable we automatically get a manager getter
    const manager = await campaign.methods.manager().call();
    assert.equal(accounts[0], manager);
  })

  //what behavior do i really care about?
  //test if money can donate money to a campaign?
  it('allows people to contribute money and marks them as approvers', async() => {
    //we specify a value to send along with transaction
    //we have a minimum contribution of 100 wei
    await campaign.methods.contribute().send({
      value: '200',
      //who is sending the contraction
      //ganache automatically creates 10 accounts
      from: accounts[1]
    });
    //now how do we make sure account[1] is considered a contributor?
    //check if there is a value associated with accounts[1]
    //we are doing a data lookup and not modifiying
    const isContributor = await campaign.methods.approvers(accounts[1]).call();
    assert(isContributor);
  });

  //check for minimum minimumContribution
  it('requires a minimum contribution', async () => {
    //send in a contribution of less than value
    try {
      await campaign.methods.contribute().send({
        value: '5',
        from: accounts[1]
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  //a manager should have the ability to create a payment request
  it('allows a manager to make a payment request', async () => {
    await campaign.methods
      .createRequest('Buy batteries', '100', accounts[1])
      .send({
        from:accounts[0]
        gas: '1000000'
      });
      //not modifying data, so use .call()
      const request = await campaign.methods.requests(0).call();
  });


});
