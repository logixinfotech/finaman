import { useState, useEffect } from "react";
import { getWorkflowConfig } from "../pages/Modules/QMS/Utils/QmsAPI" 

let cachedConfig = null;
let inflightPromise = null;

export function useWorkflowConfig() {
  const [wfConfig, setWfConfig] = useState(cachedConfig);

  useEffect(() => {
    if (cachedConfig) return;
    if (!inflightPromise) {
      inflightPromise = getWorkflowConfig().then((res) => {
        cachedConfig = res?.data || {};
        return cachedConfig;
      });
    }
    inflightPromise.then((data) => setWfConfig(data));
  }, []);

  return { wfConfig };
}