import React, { useEffect, useState } from "react";
import "./Footer.css";

function Footer({ activeModule }) {
  const [dateTime, setDateTime] = useState(
    new Date().toLocaleString()
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const appVersion = "v1.0.0";
  const companyName = "LOGIX INFOTECH LLP";
  const appName = "FINAMAN ERP";

  return (
    <footer className="erp-footer">

      {/* LEFT: COMPANY & APP */}
      <div className="erp-footer-left">
        <span className="erp-footer-brand">
          © {new Date().getFullYear()} {companyName}
        </span>
        <span className="erp-footer-copy">| {appName}</span>
      </div>


      {/* RIGHT: VERSION & LIVE TIME */}
      <div className="erp-footer-right">
        <span>Version: {appVersion}</span>
        <span>{dateTime}</span>
      </div>

    </footer>
  );
}

export default Footer;
