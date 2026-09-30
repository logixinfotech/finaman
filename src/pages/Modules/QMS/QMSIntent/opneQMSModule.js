import { useCallback, useEffect, useRef } from "react";
import { fetchMasmnuData } from "../../../../utils/api";   
import { useAuth } from "../../../../theme/AuthContext";   
const APPL = {
  deviation: "deviation",
  incident: "Incidents",
  capa: "CAPA",
  changecontrol: "ChangeControl",
  calibration: "Calibration",
  pm: "PreventiveMain",
  qualification: "Qualification",
  audit: "Audit",
  training: "trainning",        
  complaint: "marketcomplaint",
  recall: "ProductRecall",
  stp: "STP",
  dms: "dms",
  environmental: "environment",
  risk: "RiskAssessment",
  oos: "OOS",
  oot: "OOT",
};
const norm = (v) => String(v ?? "").trim().toLowerCase();

export function useOpenQmsModule(onOpenPage) {
    
  const { token } = useAuth();
  const menusRef = useRef(null);

  useEffect(() => {
    fetchMasmnuData(token).then((m) => { menusRef.current = m || []; }).catch(() => {});
  }, [token]);

  return useCallback(async (moduleKey) => {
    if (!onOpenPage) return console.warn("openQmsModule: onOpenPage prop nahi mila");
    if (!menusRef.current) menusRef.current = (await fetchMasmnuData(token)) || [];

    const want = norm(APPL[moduleKey] || moduleKey);
    const row = menusRef.current.find((m) => norm(m.appl_name) === want);
    if (!row) {
      console.warn(`openQmsModule: "${moduleKey}" ke liye appl_name "${want}" nahi mila. Available:`,
        menusRef.current.map((m) => m.appl_name));
      return;
    }
    onOpenPage(row);  
  }, [onOpenPage, token]);
}