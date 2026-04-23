import React, { useEffect, useState } from "react";
import "./Footer.css";

function Footer({ activeModule }) {

  const [dateTime, setDateTime] = useState("");
  const [serverStatus] = useState("Online");
  const [dbStatus] = useState("Connected");

  const appVersion = "v1.0.0";
  const companyName = "LOGIX INFOTECH LLP";
  const appName = "FINAMAN ERP";

  useEffect(() => {

    const updateClock = () => {

      const now = new Date();

      const formatted =
        now.toLocaleDateString() +
        " " +
        now.toLocaleTimeString();

      setDateTime(formatted);

    };

    updateClock();

    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);

  }, []);

  return (

    <footer className="erp-footer">
      <div className="erp-footer-left">

        <span className="erp-footer-brand">
          © {new Date().getFullYear()} {companyName}
        </span>

        <span className="erp-footer-copy">
          | {appName}
        </span>

      </div>

      <div className="erp-footer-right">

        <span className="footer-version">
          {appVersion}
        </span>

        <span className="footer-datetime">
          {dateTime}
        </span>

      </div>

    </footer>

  );

}

export default Footer;