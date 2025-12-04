import React, { useState } from "react";
import { ethers } from "ethers";

import "./Css_components/Borrower.css"; 

import { borrowerAddress,borrowerABI} from "./contract/borrowerABI";


const Borrow = () => {
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [collateral, setCollateral] = useState("");
  const [message, setMessage] = useState("");


  const requestLoan = async () => {
  if (!window.ethereum) {
    alert("MetaMask is not installed");
    return;
  }

  try {
    setMessage("Requesting loan...");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const borrower = new ethers.Contract(borrowerAddress, borrowerABI, signer);

    const tx = await borrower.requestLoan(
      ethers.parseEther(amount),
      Math.floor(Date.now() / 1000) + Number(duration) * 24 * 3600,
      { value: ethers.parseEther(collateral) }
    );

    await tx.wait();
    setMessage("Loan requested! Waiting for owner approval...");
    setAmount("");
    setDuration("");
    setCollateral("");
  } catch (err) {
    console.error(err);
    setMessage("Error: " + (err.reason || err.message));
  }
};


  return (
    <div className="borrower-container">
      <h2>Request a Loan</h2>
      <p className="sub-text">
        Fill in your loan details carefully. Ensure your collateral is sufficient.
      </p>

      <div className="form-group">
        <label>Loan Amount (ETH)</label>
        <input
          type="number"
          placeholder="e.g. 1.5"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Duration (Days)</label>
        <input
          type="number"
          placeholder="e.g. 30"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Collateral (ETH)</label>
        <input
          type="number"
          placeholder="e.g. 2.0"
          value={collateral}
          onChange={(e) => setCollateral(e.target.value)}
        />
      </div>

      <button onClick={requestLoan} className="loan-btn">
        Submit Loan Request
      </button>

      {message && <p className="status-message">{message}</p>}
    </div>
  );
};

export default Borrow;
