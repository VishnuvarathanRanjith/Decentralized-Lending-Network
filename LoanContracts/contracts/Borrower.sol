// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILender {
    
    function getLoanAmount(uint256 loanId) external view returns(uint256);
    function RequestLoan(address _borrower, uint256 _amount, uint256 _deadline) external payable returns(uint256);
    function Repay(uint256 loanId) external payable;
}

contract Borrower {

    ILender public lender;
    mapping(uint256 => bool) public Paid;
    mapping(address => uint256[]) public myLoans;

    event LoanRequested(address indexed borrower, uint256 amount, uint256 deadline, uint256 collateral);
    event Repaid(address indexed borrower, uint256 amount, uint256 loanId);

    constructor(address _lenderAddress) {
        lender = ILender(_lenderAddress);
    }

    function requestLoan(uint256 _amount, uint256 _deadline) external payable {

        require(msg.value > 0, "Collateral is required");

        uint256 newLoanId = lender.RequestLoan{value: msg.value}(msg.sender, _amount, _deadline);
        myLoans[msg.sender].push(newLoanId);
        emit LoanRequested(msg.sender, _amount, _deadline, msg.value);
    }

    function repayLoan(uint256 _loanId) external payable {

        require(!Paid[_loanId], "Loan already repaid");

        uint256 amountDue = lender.getLoanAmount(_loanId);

        require(msg.value >= amountDue, "Amount is not enough");

        lender.Repay{value: msg.value}(_loanId);
        Paid[_loanId] = true;
        emit Repaid(msg.sender, msg.value, _loanId);
    }

    function getBalance() public view returns(uint256) {
        return address(this).balance;
    }

    function getMyLoans(address _borrower) external view returns(uint256[] memory) {
        return myLoans[_borrower];
    }

    receive() external payable {
        revert("Direct transfers not allowed");
    }
}
