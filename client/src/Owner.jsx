import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import './Css_components/Owner.css'
import Lender from "./contract/Lender.json"; 
import { lenderAddress } from "./contract/LenderABI";

const Owner = () => {
  const [pendingLoans, setPendingLoans] = useState([]);
  const [message, setMessage] = useState("");

 
  const fetchPendingLoans = async () => {
    try {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const lender = new ethers.Contract(lenderAddress, Lender.abi, provider); 

      const loanIdCount = Number(await lender.loanId());
      const pending = [];

      for (let i = 0; i < loanIdCount; i++) {
        const loan = await lender.loans(i);
      
        if (loan.status === 0n) { 
          pending.push({
            loanId: i,
            borrower: loan.borrower,
            amount: ethers.formatEther(loan.amount),
            collateral: ethers.formatEther(loan.collateral),
            deadline: new Date(Number(loan.deadline) * 1000).toLocaleString(),
          });
        }
      }

      setPendingLoans(pending);
    } catch (err) {
      console.error("Fetch error:", err);
      setMessage("Error fetching loans: " + (err.reason || err.message));
    }
  };


  const approveLoan = async (loanId) => {
    try {
      if (!window.ethereum) return;
      setMessage("Approving loan...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(); 
      const lender = new ethers.Contract(lenderAddress,Lender.abi, signer);

      const tx = await lender.ApproveLoan(loanId);
      await tx.wait();

      setMessage(`Loan ${loanId} approved!`);
      fetchPendingLoans(); 
    } catch (err) {
      console.error("Approve error:", err);
      setMessage("Error: " + (err.reason || err.message));
    }
  };

  useEffect(() => {
    fetchPendingLoans();
    const interval = setInterval(fetchPendingLoans, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="owner-container">
  <h2>Owner Dashboard - Approve Loans</h2>
  {message && <p>{message}</p>}

  {pendingLoans.length === 0 ? (
    <p className="no-loans">No pending loans.</p>
  ) : (
    <table>
      <thead>
        <tr>
          <th>Loan ID</th>
          <th>Borrower</th>
          <th>Amount (ETH)</th>
          <th>Collateral (ETH)</th>
          <th>Deadline</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {pendingLoans.map((loan) => (
          <tr key={loan.loanId}>
            <td>{loan.loanId}</td>
            <td>{loan.borrower}</td>
            <td>{loan.amount}</td>
            <td>{loan.collateral}</td>
            <td>{loan.deadline}</td>
            <td>
              <button className="approve-btn" onClick={() => approveLoan(loan.loanId)}>
                Approve
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>

  );
};

export default Owner;
