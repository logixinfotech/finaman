// src/components/Sidebar.js
import React from 'react';
import './Sidebar.css';
import MainMenu from './icons/mainmenu.png'; 
import MasterIcon from './icons/master.png'; 
import storeIcon from './icons/store1.png'; 
import QcIcon from './icons/lala.png'; 
import QaIcon from './icons/qualitya.png'; 
import SalesIcon from './icons/sales.png'; 
import PurchaseIcon from './icons/purchase.png'; 
import ProductionIcon from './icons/production.png'; 
import PpicIcon from './icons/planning.png'; 
import LogisticsIcon from './icons/logistic.png'; 
import MisIcon from './icons/common.png'; 
import MarkettingIcon from './icons/cms.png'; 
import PayrollIcon from './icons/payroll.png'; 
import accountIcon from './icons/account.png'; 
import accountReportIcon from './icons/reports.png'; 

function Sidebar() {
  return (
    <div className="sidebar">
      <ul>
        <li><img src={MainMenu} alt="Main Menu" className="icon" /> Main Menu</li>       
        <li><img src={MasterIcon} alt="Master" className="icon" /> Master</li>
        <li><img src={storeIcon} alt="Store (RM/PM/MIS)" className="icon" /> Store (RM/PM/MIS)</li>
        <li><img src={storeIcon} alt="Store (FG)" className="icon" /> Store (FG)</li>
        <li><img src={QcIcon} alt="Quality Control" className="icon" /> Quality Control</li>
        <li><img src={QaIcon} alt="Quality Assurance" className="icon" /> Quality Assurance</li>
        <li><img src={SalesIcon} alt="Sales" className="icon" /> Sales</li>
        <li><img src={PurchaseIcon} alt="Purchase" className="icon" /> Purchase</li>
        <li><img src={ProductionIcon} alt="Production" className="icon" /> Production</li>
        <li><img src={PpicIcon} alt="Planning (PPIC)" className="icon" /> Planning (PPIC)</li>
        <li><img src={PayrollIcon} alt="Payroll" className="icon" /> Payroll</li>
        <li><img src={MisIcon} alt="MIS Reports" className="icon" /> MIS Reports</li>
        <li><img src={accountIcon} alt="Accounts (Entries)" className="icon" /> Accounts (Entries)</li>
        <li><img src={accountReportIcon} alt="Accounts (Reports)" className="icon" /> Accounts (Reports)</li>
        <li><img src={LogisticsIcon} alt="Logistics" className="icon" /> Logistics</li>
        <li><img src={MarkettingIcon} alt="Marketing" className="icon" /> Marketing</li>
      </ul>
    </div>
  );
}

export default Sidebar;
