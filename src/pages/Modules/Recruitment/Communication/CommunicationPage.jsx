import React, { useState } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPTabBar from "../../../../components/Reusable/form/ERPTabBar";
import {
  PhoneForwarded,
  PhoneIncoming,
  Clock,
  MessageSquare,
  Mail,
  History,
  PhoneCall,
} from "lucide-react";
import CallingManagement from "./CallingManagement/CallingManagement";
import CallReceive from "./CallReceive/CallReceive";
import ScheduledCallbacks from "./Callbacks/ScheduledCallbacks";
import WhatsAppMessageDesk from "./WhatsApp/WhatsAppMessageDesk";
import EmailMessageDesk from "./Email/EmailMessageDesk";
import CommunicationHistory from "./History/CommunicationHistory";

const TABS = [
  { id: "calling", label: "1. Calling Queue", icon: <PhoneForwarded size={13} /> },
  { id: "inbound", label: "2. Inbound Desk", icon: <PhoneIncoming size={13} /> },
  { id: "callbacks", label: "3. Scheduled Callbacks", icon: <Clock size={13} /> },
  { id: "whatsapp", label: "4. WhatsApp Desk", icon: <MessageSquare size={13} /> },
  { id: "email", label: "5. Email Desk", icon: <Mail size={13} /> },
  { id: "history", label: "6. Call History & Audio", icon: <History size={13} /> },
];

export default function CommunicationPage({ initialTab = "calling" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [emailInitialData, setEmailInitialData] = useState(null);

  const handleNavigateToEmail = (candidate, extra = {}) => {
    setEmailInitialData({ candidate, ...extra });
    setActiveTab("email");
  };

  return (
    <div className="bg-slate-50 h-full min-h-0 flex flex-col w-full min-w-0 overflow-hidden">
      <ERPHeader
        title="COMMUNICATION"
        isHidden={true}
        subtitle="Candidate Calling & Messaging Hub"
        TitleIcon={PhoneCall}
      />

      {/* Tabs scroll sideways on small screens instead of being cut off */}
      <div className="shrink-0 overflow-x-auto overflow-y-hidden whitespace-nowrap [&::-webkit-scrollbar]:hidden [&_button]:shrink-0 [&_button]:whitespace-nowrap">
        <ERPTabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden p-0 w-full min-w-0">
        {activeTab === "calling" && (
          <CallingManagement onNavigateToEmail={handleNavigateToEmail} />
        )}
        {activeTab === "inbound" && <div className="h-full min-h-0 overflow-y-auto overscroll-contain"><CallReceive /></div>}
        {activeTab === "callbacks" && <ScheduledCallbacks />}
        {activeTab === "whatsapp" && <div className="h-full min-h-0 overflow-y-auto overscroll-contain"><WhatsAppMessageDesk /></div>}
        {activeTab === "email" && (
          <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
            <EmailMessageDesk
              initialData={emailInitialData}
              onClearInitialData={() => setEmailInitialData(null)}
            />
          </div>
        )}
        {activeTab === "history" && <CommunicationHistory />}
      </div>
    </div>
  );
}