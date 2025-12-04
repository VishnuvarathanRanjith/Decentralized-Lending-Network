// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Lender {
    address public owner;

    enum LoanStatus { Pending, Funded, Repaid, Defaulted }

    uint256 public collateralThreshold = 150;

    struct Loan {
        address borrower;
        uint256 amount;
        uint256 deadline;
        uint256 collateral;
        LoanStatus status;
    }

    uint256 public loanId;
    mapping(uint256 => Loan) public loans;
    mapping(uint256 => bool) public approval;
    Loan[] public users;

    modifier onlyOwner() {
        require(owner == msg.sender, "Not a Owner");
        _;
    }

    modifier onlyBorrower(uint256 _loanId) {
        require(msg.sender == loans[_loanId].borrower, "Not a Borrower");
        _;
    }

    event funded(address indexed borrower, uint256 indexed amount, uint256 indexed deadline, uint256 loanId);
    event repaid(address indexed borrower, bool status, uint256 indexed amount, uint256 collateral);
    event collateralLocked(address indexed borrower, uint256 loanId, uint256 collateral);
    event collateralReleased(address indexed borrower, uint256 loanId, uint256 collateral);
    event collateralLiquidated(address indexed borrower, uint256 loanId, uint256 collateral);

    constructor() payable { owner = msg.sender; }

    function RequestLoan(address _borrower, uint256 _amount, uint256 _deadline)
        external payable returns (uint256)
    {
        require(block.timestamp < _deadline, "Deadline must be greater than current time");
        require(_borrower != address(0), "Borrower address is required");
        require(_amount > 0, "Amount must be greater than 0");
        require(msg.value > 0, "Collateral is required");

        uint256 CR = CalculateCollateral(_amount, msg.value);
        require(CR >= collateralThreshold, "Not sufficient Collateral");

        loans[loanId] = Loan({
            borrower: _borrower,
            amount: _amount,
            deadline: _deadline,
            collateral: msg.value,
            status: LoanStatus.Pending
        });

        emit collateralLocked(_borrower, loanId, msg.value);
        loanId++;
        return loanId - 1;
    }

    function ApproveLoan(uint256 _loanId) external onlyOwner {
        require(loans[_loanId].status == LoanStatus.Pending, "Loan is not Pending");
        require(!approval[_loanId], "Loan already approved");
        require(address(this).balance >= loans[_loanId].amount, "Insufficent balance to lend");

        approval[_loanId] = true;
        (bool success, ) = loans[_loanId].borrower.call{ value: loans[_loanId].amount }("");
        require(success, "Transaction Failed");

        loans[_loanId].status = LoanStatus.Funded;
        emit funded(loans[_loanId].borrower, loans[_loanId].amount, loans[_loanId].deadline, _loanId);

        users.push(Loan(
            loans[_loanId].borrower,
            loans[_loanId].amount,
            loans[_loanId].deadline,
            loans[_loanId].collateral,
            loans[_loanId].status
        ));
    }

    function Repay(uint256 _loanId) external payable onlyBorrower(_loanId) {
        Loan storage loan = loans[_loanId];
        require(approval[_loanId] == true, "Loan is Not Approved");
        require(loan.status == LoanStatus.Funded, "Loan is not Active");

        uint amount = loan.amount;
        if (block.timestamp > loan.deadline) {
            uint interest = (amount * 10) / 100;
            amount += interest;
        }

        require(msg.value >= amount, "Insufficient Balance");

        if (msg.value > amount) {
            uint256 extraAmount = msg.value - amount;
            payable(msg.sender).transfer(extraAmount);
        }

        loan.status = LoanStatus.Repaid;

        (bool received, ) = owner.call{ value: amount }("");
        require(received, "Transaction Failed");

        (bool collateralTransfer, ) = loans[_loanId].borrower.call{ value: loan.collateral }("");
        require(collateralTransfer, "Collateral Transfer Failed");

        emit repaid(loan.borrower, true, amount, loan.collateral);
        emit collateralReleased(loan.borrower, _loanId, loan.collateral);
    }

    function getBalance() public view returns (uint256 balance) {
        return address(this).balance;
    }

    function getLoanAmount(uint256 _loanId) public view returns (uint256) {
        Loan memory loan = loans[_loanId];
        require(loan.status == LoanStatus.Funded, "Loan is not Active");

        uint256 amount = loan.amount;
        if (block.timestamp > loan.deadline) {
            uint256 interest = (amount * 10) / 100;
            amount += interest;
        }
        return amount;
    }

    function CalculateCollateral(uint256 _amount, uint256 collateralValue)
        public pure returns (uint256)
    {
        return (collateralValue * 100) / _amount;
    }

    function liqiudate(uint256 _loanId) public onlyOwner {
        
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Funded, "Loan is Not Active");
        require(block.timestamp > loan.deadline, "Not overdue");

        loan.status = LoanStatus.Defaulted;

        (bool success, ) = owner.call{ value: loan.collateral }("");
        require(success, "Transaction Failed");

        emit collateralLiquidated(loan.borrower, _loanId, loan.collateral);
    }

    function getAllUsers() public view returns (
            address[] memory borrowers,
            uint256[] memory amounts,
            uint256[] memory deadlines,
            uint256[] memory collaterals,
            uint8[] memory statuses
        )
    {
        uint256 len = users.length;
        borrowers = new address[](len);
        amounts = new uint256[](len);
        deadlines = new uint256[](len);
        collaterals = new uint256[](len);
        statuses = new uint8[](len);

        for (uint256 i = 0; i < len; i++) {
            borrowers[i] = users[i].borrower;
            amounts[i] = users[i].amount;
            deadlines[i] = users[i].deadline;
            collaterals[i] = users[i].collateral;
            statuses[i] = uint8(users[i].status);
        }
    }

    function getLoanDetails(uint256 _loanId) public view returns (
    address borrower,
    uint256 amount,
    uint256 deadline,
    uint256 collateral,
    LoanStatus status
) {
    Loan memory loan = loans[_loanId];
    return (loan.borrower, loan.amount, loan.deadline, loan.collateral, loan.status);
}


    receive() external payable {}
}
