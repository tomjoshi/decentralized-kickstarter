pragma solidity^0.4.25;

contract CampaignFactory {
    Campaign[] public deployedCampaigns;

    function createCampaign(uint minimum) public {
        Campaign newCampaign = new Campaign(minimum, msg.sender);
        deployedCampaigns.push(newCampaign);
    }

    function getDeployedCampaigns() public view returns (Campaign[] memory) {
        return deployedCampaigns;
    }

}

contract Campaign {
    struct Request {
        //purpose of request
        string description;
        //amount of money they want to send
        uint value;
        //who they want to send it to
        address recipient;
        bool complete;
        //Keep track of yes votes. Don't care about no votes
        uint approvalCount;
        //Track who has voted
        //Don't have to initialize reference types, only value types
        mapping(address => bool) approvals;
    }

    Request[] public requests;
    address public manager;
    uint public minimumContribution;
    //we get a method because it is public
    //but we don't retrieve the entire mapping, but a single value
    //so we need to pass in a specific address with the given getter
    mapping(address => bool) public approvers;
    //We can't get count of approvals because it is a matching
    //Let's store a count variable then
    uint public approversCount;

    modifier restricted() {
        require(msg.sender == manager);
        //imagine the modifier takes the body of a function and pastes it below
        _;
    }

    constructor(uint minimum, address creator) public {
        manager = creator;
        //Global variable msg
        //Sender describes who is creating the contract
        minimumContribution = minimum;

    }

    //payable allows the function to accept payments
    function contribute() public payable {
        //msg.value amount in wei that someone has sent
        //false then immediately exit the function
        require(msg.value > minimumContribution);
        approvers[msg.sender] = true;
        approversCount++;
    }
    //public because you want to be accessed from an external account
    function createRequest(string description, uint value, address recipient) public restricted {
        //create new request
        //use memory key word because we have nothing to just store a single request
        Request memory newRequest = Request({
           description: description,
           value: value,
           recipient: recipient,
           //not ready to be completed
           complete: false,
           approvalCount: 0
        });

        //add to request array
        requests.push(newRequest);
    }

    function approveRequest(uint index) public {
        Request storage request = requests[index];

        require(approvers[msg.sender]);
        //If this person has already voted on this contract and
        //their address already exists then return exit out
        require(!request.approvals[msg.sender]);
        //go to specific request, access approvals property
        //set the value at the mapping to true.
        request.approvals[msg.sender] = true;
        request.approvalCount++;
    }

    function finalizeRequest(uint index) public restricted {
        Request storage request = requests[index];

        require(request.approvalCount > (approversCount/2));
        //check that request is not already complete
        require(!request.complete);

        //recipient has address therefore you can use transfer
        request.recipient.transfer(request.value);
        request.complete = true;
    }
}
