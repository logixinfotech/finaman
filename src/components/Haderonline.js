import React, { useEffect, useState } from 'react';
import './Header.css';
import darIcon from './icons/whatsapp.png';
import emailIcon from './icons/email.png';
import uploadIcon from './icons/upload.png';
import downloadIcon from './icons/download.png';
import notificationIcon from './icons/notification.png';
import supportIcon from './icons/support.png';
import exitIcon from './icons/exit.png';
import logoIcon from './icons/logo.png'; // Add your logo icon import here

function Header() {
  const [masmodData, setMasmodData] = useState([]);

  useEffect(() => {
    // Fetch data from the backend API
    fetch('http://localhost:5000/api/masmod')
      .then(response => response.json())
      .then(data => setMasmodData(data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const handleSupportClick = () => {
    window.location.href = '/AnyDesk.exe'; // Replace with the actual path to aydesk.exe
  };

  return (
    <div className="header">
      <div className="header-left-logo">
        <img src={logoIcon} alt="Logo" className="logo-icon" />
      </div>
      <div className="header-left">
        <h1>LOGIX INFOTECH LLP</h1>
        <p>Mobile: +91 817-851-0089</p>
        <p>Email: info@logixinfotech.in</p>
      </div>
      <div className="header-center">
        <h1>FINAMAN-ERP</h1>
        <p>(Process Manufacturing Management Software)</p>
        <p><a href="http://www.logixinfotech.in">www.logixinfotech.in</a></p>
      </div>
      <div className="header-right">
        <h1>DEMO FORMULATION PVT. LTD</h1>
        <p>C260-C Block, Sector 63-Noida</p>
        <p>Uttar Pradesh-201310</p>
      </div>
      <div className="button-align">
        {masmodData.map(item => (
          <button key={item.masmod_id} className="header-btn">
            <img src={`./icons/${item.pic_path}`} alt={item.mod_name} className="icon" />
            {item.mod_name}
          </button>
        ))}
        <button className="header-btn" onClick={handleSupportClick}>
          <img src={supportIcon} alt="Online Support" className="icon" /> Online Support
        </button>
        <button className="header-btn">
          <img src={exitIcon} alt="Exit" className="icon" /> Exit
        </button>
      </div>
    </div>
  );
}

export default Header;
