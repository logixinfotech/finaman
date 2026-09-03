import { useState, useEffect, useCallback } from "react";
import { getWorkflowConfig } from "../pages/Modules/QMS/Utils/QmsAPI";

let cachedConfig = null;
let inflightPromise = null;

export function useWorkflowConfig() {
  const [wfConfig, setWfConfig] = useState(cachedConfig);

  const load = useCallback((force = false) => {
    if (cachedConfig && !force) { setWfConfig(cachedConfig); return; }
    if (force) { cachedConfig = null; inflightPromise = null; }

    if (!inflightPromise) {
      inflightPromise = getWorkflowConfig().then((res) => {
        cachedConfig = res?.data || {};
        inflightPromise = null;
        return cachedConfig;
      });
    }
    inflightPromise.then((d) => setWfConfig(d));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { wfConfig, refresh: () => load(true) };
}