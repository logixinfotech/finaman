import { useMemo, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { alertError, showToast } from "../../../../components/Reusable/alert";
import FieldRenderer from "../../../../components/Reusable/form/FieldRenderer";
import { issueRegister } from "../Utils/LogbookAPI";
import { Modal, Btn, Kbd, Field, Section, erp, useEnterNavigation } from "./LogbookUi";

const REF_LABEL = { equipment: "Equipment", instrument: "Instrument", area: "Area / Room", general: "Register Name" };
const today = () => new Date().toISOString().slice(0, 10);

export default function IssueRegisterModal({ types, masters, onClose, onIssued }) {
    const [f, setF] = useState({ TypeKey: types[0]?.key || "", RefName: "", Department: "", IssuedOn: today() });
    const [saving, setSaving] = useState(false);
    const handleKeyDown = useEnterNavigation();

    const type = useMemo(() => types.find((t) => t.key === f.TypeKey) || null, [types, f.TypeKey]);
    const refType = type?.refType || "general";
    const refOptions = refType === "general" ? [] : (masters?.[refType] || []);
    const refLabels = refOptions.map((o) => (o.code ? `${o.label} (${o.code})` : o.label));
    const refId = refOptions.find((o) => (o.code ? `${o.label} (${o.code})` : o.label) === f.RefName)?.id ?? null;

    const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
    const onTypeChange = (name) => { const t = types.find((x) => x.name === name); setF((p) => ({ ...p, TypeKey: t?.key || p.TypeKey, RefName: "" })); };
    const valid = f.TypeKey && f.RefName.trim();

    const save = async () => {
        if (!valid || saving) return;
        setSaving(true);
        try {
            const res = await issueRegister({ ...f, RefId: refType === "general" ? null : refId });   // refId may be null — backend then matches on RefName
            if (res && res.success === false) throw new Error(res.message);
            if (!res?.id) throw new Error("Could not issue the register.");
            showToast({ icon: "success", title: `Register ${res.recordNo} issued` });
            onIssued?.(res.id);
        } catch (e) { alertError("Issue failed", e?.message || "Could not issue the register."); }
        finally { setSaving(false); }
    };

    return (
        <Modal title="Issue New Register" subtitle="One register per equipment, instrument or area. The previous one must be closed first." icon={FaIcons.FaBookOpen} width="max-w-2xl" onClose={onClose}
            footer={<>
                <span className="text-[11.5px] text-[#5b6b85]">Register No. is assigned on save.</span>
                <div className="ml-auto flex gap-2">
                    <Btn onClick={onClose} disabled={saving}>Cancel <Kbd>Esc</Kbd></Btn>
                    <Btn kind="primary" onClick={save} disabled={!valid || saving}>{saving ? "Issuing…" : "Issue Register"} <Kbd>Ctrl+Enter</Kbd></Btn>
                </div>
            </>}>
            <div onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); save(); } else handleKeyDown(e); }}>
                <Section title="1. Register Details" bodyClass="p-[14px] grid grid-cols-1 sm:grid-cols-2 gap-x-[12px] gap-y-[8px]">
                    <Field label="Logbook Type" required className="sm:col-span-2">
                        <FieldRenderer fieldObj={{ key: "TypeKey", label: "Logbook Type", type: "select", options: types.map((t) => t.name) }}
                            value={type?.name || ""} onChange={onTypeChange} className={erp.input} />
                        {type && (
                            <div className="text-[11.5px] text-[#5b6b85] mt-[2px]">
                                {type.columns.length} columns · {type.verifyRequired ? `verified by ${type.verifyRoles.join(" / ") || "any head"}` : "no verification"}{type.entrySign ? " · e-sign on every entry" : ""}
                            </div>
                        )}
                    </Field>

                    <Field label={REF_LABEL[refType]} required className="sm:col-span-2">
                        {refType === "general"
                            ? <FieldRenderer fieldObj={{ key: "RefName", label: REF_LABEL[refType], type: "text" }} value={f.RefName} onChange={set("RefName")} className={erp.input} />
                            : <FieldRenderer fieldObj={{ key: "RefName", label: REF_LABEL[refType], type: "select", options: refLabels }} value={f.RefName} onChange={set("RefName")} className={erp.input} />}
                        {refType !== "general" && refOptions.length === 0 && (
                            <div className="text-[11.5px] text-amber-600 mt-[2px]">No {REF_LABEL[refType].toLowerCase()} master found — add one in Masters first.</div>
                        )}
                    </Field>

                    <Field label="Department">
                        <FieldRenderer fieldObj={{ key: "Department", label: "Department", type: "select", options: (masters?.department || []).map((d) => d.label) }}
                            value={f.Department} onChange={set("Department")} />
                    </Field>
                    <Field label="Issued On" required>
                        <FieldRenderer fieldObj={{ key: "IssuedOn", label: "Issued On", type: "date" }} value={f.IssuedOn} onChange={set("IssuedOn")} className={erp.input} />
                    </Field>
                </Section>
            </div>
        </Modal>
    );
}