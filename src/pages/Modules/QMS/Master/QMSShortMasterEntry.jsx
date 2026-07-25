import QMSMasterPage from "../../QMS/Master/QMSMasterPage";
import { qmsMasterConfigs } from "../../QMS/Utils/QmsMasterConfigs";

 
const QMSShortMasterEntry = (props) => {
  const { tab } = props;

  // 👇 ab title se match nahi, seedha config-key (masterType) se match — case-insensitive
  const incomingKey = (tab?.appl_name || "").toLowerCase().trim();
  const config = qmsMasterConfigs[incomingKey];

  if (!config) {
    return (
      <div className="p-4 text-red-600 text-sm">
  Master configuration not found for "{tab?.appl_name}". Please check that a matching
  key (e.g. "{incomingKey}") exists in qmsMasterConfigs.js.
</div>
    );
  }

  return <QMSMasterPage {...props} config={config} />;
};

export default QMSShortMasterEntry;