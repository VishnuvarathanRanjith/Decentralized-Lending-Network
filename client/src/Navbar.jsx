import React from "react";
import { Link } from "react-router-dom";
import "./Css_components/Navbar.css";

const Navbar=()=> {
  return (
    <nav className="navbar">

      <div className="logo">
        <span className="blue">L</span> Networks
      </div>

     
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/borrow">Borrow</Link>
        <Link to="/repay">Repay</Link>
        <Link to='/approve'>Approve Loan</Link>
      </div>

   
      <button className="signin-btn">Sign In</button>
    </nav>
  );
}

export default Navbar;
