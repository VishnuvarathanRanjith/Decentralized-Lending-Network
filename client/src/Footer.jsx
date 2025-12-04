import React from "react";
import "./Css_components/Footer.css";

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        {/* Left: Brand or Project Name */}
        <div className="footer-brand">
          <h3>LNetworks</h3>
          <p>Decentralized Lending Platform</p>
        </div>

        {/* Center: Quick Links */}
        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="borrow">Borrower</a></li>
            <li><a href="approve">Owner</a></li>
            <li><a href="/">About</a></li>
            <li><a href="contact">Contact</a></li>
          </ul>
        </div>

        {/* Right: Social Links */}
        <div className="footer-social">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://github.com/" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-github"></i>
            </a>
            <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-linkedin"></i>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} LNetworks. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
