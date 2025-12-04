import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./Css_components/Repay.css";
import { lenderAddress, lenderABI } from "./contract/LenderABI";
import { borrowerAddress, borrowerABI } from "./contract/borrowerABI";

const Repay = () => {
  const [loans, setLoans] = useState([]);
  const [message, setMessage] = useState("");
  const [userAddress, setUserAddress] = useState("");

  useEffect(() => {
    const fetchLoans = async () => {
      if (!window.ethereum) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const borrower = new ethers.Contract(borrowerAddress, borrowerABI, signer);
        const lender = new ethers.Contract(lenderAddress, lenderABI, signer);

        const address = await signer.getAddress();
        setUserAddress(address);

        const userLoans = await borrower.getMyLoans(address);
        const loanDetails = [];

        for (let id of userLoans) {
          try {
            const details = await lender.getLoanDetails(id);
            loanDetails.push({
              id: id.toString(),
              borrower: details[0],
              amount: ethers.formatEther(details[1]),
              deadline: Number(details[2]),
              collateral: ethers.formatEther(details[3]),
              status: Number(details[4]),
            });
          } catch (err) {
            console.warn(`Skipping invalid loan ID ${id.toString()}: ${err.message}`);
          }
        }

        setLoans(loanDetails);
      } catch (err) {
        console.error("Error fetching loans:", err);
        setMessage("Error fetching your loans. Please try again.");
      }
    };

    fetchLoans();
  }, []);

  const handleRepay = async (loanId, amount) => {
    if (!window.ethereum) return;

    try {
      setMessage(` Repaying loan ${loanId}...`);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const lender = new ethers.Contract(lenderAddress, lenderABI, signer);

      const tx = await lender.Repay(ethers.toBigInt(loanId), {
        value: ethers.parseEther(amount.toString()),
      });
      await tx.wait();

      setMessage(` Loan ${loanId} repaid successfully!`);
    } catch (err) {
      console.error("Repayment Error:", err);
      setMessage("Error: " + (err.reason || err.message));
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0: return "Pending";
      case 1: return "Funded";
      case 2: return "Repaid";
      case 3: return "Defaulted";
      default: return "Unknown";
    }
  };

  return (
    <div className="repay-container">
      <h2>Repay Your Loans</h2>
      {loans.length === 0 && <p>No loans found.</p>}

      {loans.map((loan, index) => (
        <div key={index} className="loan-item">
          <p><strong>Loan ID:</strong> {loan.id}</p>
          <p><strong>Amount:</strong> {loan.amount} ETH</p>
          <p><strong>Collateral:</strong> {loan.collateral} ETH</p>
          <p><strong>Deadline:</strong> {new Date(loan.deadline * 1000).toLocaleString()}</p>
          <p><strong>Status:</strong> {getStatusText(loan.status)}</p>

          {loan.borrower.toLowerCase() === userAddress.toLowerCase() &&
           loan.status === 1 && (
            <button onClick={() => handleRepay(loan.id, loan.amount)}>Repay</button>
          )}
        </div>
      ))}

      {message && <p className="status-message">{message}</p>}
    </div>
  );
};

export default Repay;
