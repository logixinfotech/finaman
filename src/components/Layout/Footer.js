import React, { useEffect, useState } from "react";
import "./Footer.css";

function Footer({ activeModule }) {

  const [dateTime, setDateTime] = useState("");

   const [companyInfo, setCompanyInfo] = useState({
      name: "Demo Company Private Limited",
      loc: "Uttar Pradesh",
      fy: "2026-27",
    });

  const appVersion = "v1.0.0";

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user) {

      if (user.com_name || user.com_code) {
        setCompanyInfo({
          name: user.com_name || user.com_code,
          loc: user.location || "Noida, UP",
          fy: user.fy || "2026-27",
        });
      }
    }
  }, []);


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
          © {new Date().getFullYear()} {companyInfo.name}
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