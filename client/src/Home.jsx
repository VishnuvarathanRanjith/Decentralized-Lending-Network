import React, { useState, useEffect } from 'react';
import './Css_components/Home.css';
import { ethers } from 'ethers';
import { lenderABI } from './contract/LenderABI';

import { lenderAddress } from "./contract/LenderABI";

const Home = () => {
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    fetchApprovedLoans();
  }, []);

  const fetchApprovedLoans = async () => {
    try {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const lender = new ethers.Contract(lenderAddress, lenderABI, provider);
      const data = await lender.getAllUsers();

      const approvedLoans = data.borrowers
        .map((b, i) => {
          const statusIndex = Number(data.statuses[i]);
          if (statusIndex === 1) {
            return {
              borrower: b,
              amount: ethers.formatEther(data.amounts[i]),
              collateral: ethers.formatEther(data.collaterals[i]),
              deadline: new Date(Number(data.deadlines[i]) * 1000).toLocaleString(),
              status: "Approved",
            };
          }
          return null;
        })
        .filter(Boolean);

      setLoans(approvedLoans);
    } catch (error) {
      console.error("Error fetching approved loans:", error);
    }
  };

  return (
    <div className="home-container">
     
      <div className="about-us-container">
        <h2>About Us</h2>
        <div className="about-us-content">
          lNetworks has been a pioneer in decentralized finance, setting high standards for security, reliability, and
          risk management. Their achievements in building a leading lending protocol and establishing best practices
          around how to secure DeFi correctly have made the entire industry attractive to users and institutions.
          <br />
          <br />
          lNetworks has played a pivotal role in driving USDT's growth within the DeFi ecosystem. By providing stability
          and liquidity, USDT bridges traditional finance and crypto, forming a strong foundation when integrated with
          lNetworks.
        </div>
      </div>

     
      <div className="trusted-list">
        <h2>Our Trusted Borrowers</h2>
        {loans.length === 0 ? (
          <p className="no-loans">No approved loans yet. Check back soon!</p>
        ) : (
          <div className="loan-table">
            <div className="loan-header">
              <span>Borrower</span>
              <span>Amount (ETH)</span>
              <span>Collateral (ETH)</span>
              <span>Deadline</span>
              <span>Status</span>
            </div>

            {loans.map((loan, index) => (
              <div key={index} className="loan-row">
                <span className="borrower">{loan.borrower}</span>
                <span>{loan.amount}</span>
                <span>{loan.collateral}</span>
                <span>{loan.deadline}</span>
                <span className="status approved">{loan.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
