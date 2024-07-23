// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// This is a Olympic Betting platform

contract OlympicBet {
    // Define Status
    enum Status {
        Open,
        Finished,
        Paid
    }

    // Define the structure of the Betting event
    struct Event {
        uint256 eventId;
        uint256 prize;
        string question;
        string[] countries;
        uint256 deadline; // UNIX time stamp
        address[] participants;
        address[] winners;
        Status status;
    }

    // Define the structure of each bet
    struct Bet {
        uint256 eventId;
        string prediction;
        bool isPlaced;
    }

    mapping(address => mapping(uint256 => Bet)) private bets;
    mapping(address => uint256) private balance;
    mapping(uint256 => Event) private events;
    mapping(address => bool) private paidEntryFee;
    uint256 private eventCount;
    bool private initialized;

    // Constant variables part
    address private OWNER;
    uint256 public constant ENTRY_FEE = 10 ether;
    uint256 private constant OLYMPIC_END_DAY = 1723392000;

    // modifier part
    modifier onlyOwner() {
        require(msg.sender == OWNER, "Not authorized");
        _;
    }

    modifier hasPaidEntryFee() {
        require(paidEntryFee[msg.sender], "Entry Fee not paid");
        _;
    }

    modifier beforeDeadline(uint256 _eventId) {
        require(block.timestamp < events[_eventId].deadline, "Event has ended");
        _;
    }

    modifier afterDeadline(uint256 _eventId) {
        require(
            block.timestamp > events[_eventId].deadline,
            "Event hasn't finished yet!"
        );
        _;
    }

    // event part
    event EntryFeePaid(address indexed user, uint256 amount);
    event EventCreated(
        uint256 indexed eventId,
        uint256 prize,
        string question,
        string[] countries,
        uint256 deadline,
        Status status
    );
    event BetPlaced(
        uint256 indexed eventId,
        string prediction,
        bool isPlaced,
        address participant
    );
    event EventWinnerSet(
        uint256 indexed eventId,
        address[] winners,
        Status status
    );
    event WinnersPaid(uint256 indexed eventId, Status status);
    event FundWithdrawn(address indexed user, uint256 amount);

    // constructor() {
    //     OWNER = msg.sender;
    // }

    // Proxy Initializer
    function initialize() public {
        require(!initialized, "Contract instance has already been initialized");
        initialized = true;
        OWNER = msg.sender;
        eventCount = 1;
    }

    /**
     * Function to pay the entry fee
     * This function can be called by any user who wants to participate in the lottery
     * The user must send exactly the amount of entry fee defined in the constant ENTRY_FEE
     * If the user sends less than ENTRY_FEE, an error message will be displayed
     * If the user sends the correct amount, the balance of the user who sent the message will be increased by the amount sent,
     * and an EntryFeePaid event will be emitted, indicating that the user has paid the entry fee
     */
    function payEntryFee() public payable {
        require(
            msg.value == ENTRY_FEE,
            "You need to deposite 10 GAS to participate!"
        );
        require(balance[msg.sender] != ENTRY_FEE, "You have paid entry fee");
        balance[msg.sender] += msg.value;
        paidEntryFee[msg.sender] = true;
        emit EntryFeePaid(msg.sender, msg.value);
    }

    /**
     * @notice This function is used to create a new event
     * @param _prize The prize amount for the event
     * @param _question The question to be asked in the event
     * @param _countries An array of country names
     * @param _deadline The deadline for the event in Unix timestamp format
     */
    function createEvent(
        uint256 _prize,
        string memory _question,
        string[] memory _countries,
        uint256 _deadline
    ) public payable onlyOwner {
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(msg.value == _prize, "Please send enough GAS to contract");

        Event storage newEvent = events[eventCount];
        newEvent.eventId = eventCount;
        newEvent.prize = _prize;
        newEvent.question = _question;
        newEvent.countries = _countries;
        newEvent.deadline = _deadline;
        newEvent.status = Status.Open;

        emit EventCreated(
            eventCount,
            _prize,
            _question,
            _countries,
            _deadline,
            Status.Open
        );

        eventCount++;
    }

    /**
     * Function for placing a bet
     *
     * @param _eventId The ID of the event on which the bet is being placed
     * @param _prediction The prediction made by the user
     *
     * This function can be called by any user who has paid the entry fee and before the deadline of the event.
     * It requires that the user has not placed a bet before.
     *
     * If the user meets the requirements, a new bet is recorded for the user, indicating the prediction made.
     * The user's address is added to the list of participants in the event.
     * An event is emitted to indicate that a bet has been placed, which includes the ID of the event, the prediction, the bet status, and the user's address.
     */
    function placeBet(
        uint256 _eventId,
        string memory _prediction
    ) public hasPaidEntryFee beforeDeadline(_eventId) {
        require(!bets[msg.sender][_eventId].isPlaced, "Bet already placed");
        bets[msg.sender][_eventId] = Bet(_eventId, _prediction, true);
        events[_eventId].participants.push(msg.sender);
        emit BetPlaced(_eventId, _prediction, true, msg.sender);
    }

    /**
     * @dev Sets the winner of an event.
     * @param _eventId The ID of the event.
     * @param _rightAnswer The correct answer to the event.
     */
    function setEventWinners(
        uint256 _eventId,
        string memory _rightAnswer
    ) public onlyOwner afterDeadline(_eventId) {
        require(
            events[_eventId].status == Status.Open,
            "Even Status should be Open"
        );
        // Retrieve the event from the events mapping based on the provided event ID
        Event storage currentEvent = events[_eventId];

        // Iterate over each participant in the current event
        for (uint256 i = 0; i < currentEvent.participants.length; i++) {
            address participant = currentEvent.participants[i];
            if (
                keccak256(
                    abi.encodePacked(bets[participant][_eventId].prediction)
                ) == keccak256(abi.encodePacked(_rightAnswer))
            ) {
                currentEvent.winners.push(participant);
            }
        }

        currentEvent.status = Status.Finished;
        emit EventWinnerSet(
            _eventId,
            currentEvent.winners,
            currentEvent.status
        );
    }

    /**
     * @dev This function is used to pay out prizes to the winners of an event
     * @param _eventId The ID of the event for which winners need to be paid
     */
    function payWinners(uint256 _eventId) public payable onlyOwner {
        Event storage currentEvent = events[_eventId];
        require(currentEvent.winners.length != 0, "No winners to pay");

        uint256 individualPrize = currentEvent.prize /
            currentEvent.winners.length;

        for (uint256 i = 0; i < currentEvent.winners.length; i++) {
            address winner = currentEvent.winners[i];
            payable(winner).transfer(individualPrize);
        }

        currentEvent.status = Status.Paid;
        emit WinnersPaid(_eventId, currentEvent.status);
    }

    /**
     * @notice This function allows the user to withdraw their funds
     */
    function withdrawFunds() public {
        require(block.timestamp > OLYMPIC_END_DAY, "Olympic is not over yet!");
        uint256 amount = balance[msg.sender];
        require(amount > 0, "You have no balance to withdraw");
        balance[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Failed to send GAS to user");
        emit FundWithdrawn(msg.sender, amount);
    }

    function getE(
        uint256 _eventId
    )
        public
        view
        returns (
            uint256,
            uint256,
            string memory,
            string[] memory,
            uint256,
            address[] memory,
            address[] memory,
            Status
        )
    {
        Event memory evenT = events[_eventId];
        return (
            evenT.eventId,
            evenT.prize,
            evenT.question,
            evenT.countries,
            evenT.deadline,
            evenT.participants,
            evenT.winners,
            evenT.status
        );
    }

    function getBet(
        address _user,
        uint256 _eventId
    ) public view returns (Bet memory) {
        return bets[_user][_eventId];
    }

    function getBalance(address _user) public view returns (uint256) {
        return balance[_user];
    }

    function getEventCount() public view returns (uint256) {
        return eventCount;
    }
}
