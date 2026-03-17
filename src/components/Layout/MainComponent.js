// MainComponent.js

import { useState } from 'react';
import Sidebar from './Sidebar';
import TabContent from './TabContent';

function MainComponent() {
  const [activeTab, setActiveTab] = useState(null);

  const handleMenuItemClick = (tabData) => {
    setActiveTab(tabData.appl_name);
  };

  return (
    <div className="main-container">
      <Sidebar onMenuItemClick={handleMenuItemClick} />
      <div className="tab-content-container">
        {activeTab && <TabContent appl_name={activeTab} />}
      </div>
    </div>
  );
}

export default MainComponent;
