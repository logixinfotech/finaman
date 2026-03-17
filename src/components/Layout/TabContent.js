// TabContent.js

import React, { useState, useEffect } from 'react';

function TabContent({ appl_name }) {
  const [Component, setComponent] = useState(null);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        const component = await import(`./tabs/${appl_name}.js`);
        setComponent(() => component.default);
      } catch (error) {
        console.warn(`Could not load component for appl_name: ${appl_name}, falling back to common component.`);
        const commonComponent = await import('./tabs/common.js');
        setComponent(() => commonComponent.default);
      }
    };

    loadComponent();
  }, [appl_name]);

  if (!Component) {
    return <div>Loading tab content...</div>;
  }

  return <Component />;
}

export default TabContent;
