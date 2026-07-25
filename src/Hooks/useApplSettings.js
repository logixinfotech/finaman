// hooks/useApplSettings.js
import { useState, useEffect, useCallback } from "react";
import { getApplSettings, saveApplSettings } from "../utils/api";

export function useApplSettings(applName) {
  const [settingsConfig, setSettingsConfig] = useState([]);
  const [settingsDefaults, setSettingsDefaults] = useState({});

  useEffect(() => {
    if (!applName) return;
    getApplSettings(applName).then((res) => {
      setSettingsConfig(res.config);
      setSettingsDefaults(res.defaults);
    });
  }, [applName]);

  const onSettingsSave = useCallback(async (values) => {
    await saveApplSettings(applName, values);
    setSettingsDefaults((prev) => ({ ...prev, ...values }));
  }, [applName]);

  return { settingsConfig, settingsDefaults, onSettingsSave };
}