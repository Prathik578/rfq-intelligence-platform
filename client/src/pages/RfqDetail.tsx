import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, CircleAlert, ClipboardCheck, Copy, FileText, Flag, MessageSquareText, Send, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

type RequirementStatus = "approved" | "missing" | "exception";
type Requirement = { id: number; label: string; status: RequirementStatus; note: string };
type ClarificationStatus = "draft" | "sent" | "resolved" | "cancelled";

const ITEMS = [
  { code: "SM-4400", name: "Servo motor assembly", detail: "4-axis, IP65, 2.4kW continuous", qty: "12", confidence: "98%" },
  { code: "ENC-22", name: "Control enclosure", detail: "NEMA 4X stainless steel", qty: "4", confidence: "83%" },
  { code: "CAB-15", name: "Shielded cable set", detail: "15m, M23 connectors", qty: "12", confidence: "72%" },
];
const INITIAL_REQUIREMENTS: Requirement[] = [
  { id: 1, label: "Customer identified", status: "approved", note: "" },
  { id: 2, label: "Product and quantity identified", status: "approved", note: "" },
  { id: 3, label: "Specifications available", status: "approved", note: "Reviewed against source PDF." },
  { id: 4, label: "Delivery location available", status: "approved", note: "Oslo, Norway." },
  { id: 5, label: "Required delivery date available", status: "missing", note: "Ask buyer to confirm required arrival date." },
  { id: 6, label: "Material grade confirmed", status: "missing", note: "Required for the control enclosure." },
];

function Field({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</label>
        {warn && <span className="text-[10px] font-semibold text-amber-600">Low confidence</span>}
      </div>
      <Input defaultValue={value} className={`h-9 rounded-lg text-xs ${warn ? "border-amber-200 bg-amber-50/40" : "border-slate-200"}`} />
    </div>
  );
}

function SourcePreview() {
  return (
    <Card className="border-0 shadow-[0_10px_30px_rgba(28,49,76,0.06)]">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-base text-[#152238]"><FileText className="h-4 w-4 text-[#52759f]" />Original request</CardTitle>
        <p className="text-xs text-slate-400">nordic-motion-rfq-1048.pdf · 4 pages</p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[600px] rounded-xl border border-slate-200 bg-[#f4f5f7] p-7">
          <div className="mx-auto max-w-[370px] rounded bg-white p-7 shadow-lg">
            <div className="flex justify-between border-b-2 border-[#152238] pb-4">
              <div><p className="text-[9px] font-bold tracking-[0.2em] text-[#152238]">NORDIC MOTION</p><p className="mt-1 text-[7px] text-slate-400">Motion systems · Oslo, Norway</p></div>
              <span className="rounded bg-[#edf4fb] px-2 py-1 text-[7px] font-bold text-[#52759f]">RFQ</span>
            </div>
            <p className="mt-7 text-[9px] font-bold text-[#152238]">Request for quotation — Servo drive assemblies</p>
            <p className="mt-3 text-[7px] leading-4 text-slate-500">Please provide your best commercial and technical offer for the items listed below.</p>
            <div className="mt-6 space-y-2">
              {ITEMS.map((item) => (
                <div key={item.code} className="rounded border border-slate-100 p-2">
                  <div className="flex justify-between text-[7px] font-bold text-[#152238]"><span>{item.name}</span><span>{item.qty} pcs</span></div>
                  <p className="mt-1 text-[6px] text-slate-400">Part no. {item.code} · {item.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-7 rounded bg-amber-50 p-2 text-[7px] text-amber-700"><b>Buyer note</b><br />Confirm final material grade and expected delivery date.</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExtractionCard({ onApprove }: { onApprove: () => void }) {
  return (
    <Card className="border-0 shadow-[0_10px_30px_rgba(28,49,76,0.06)]">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
        <div><CardTitle className="text-base text-[#152238]">Extracted request data</CardTitle><p className="mt-1 text-xs text-slate-400">AI-assisted · review every field before approval</p></div>
        <Badge className="rounded-full border-0 bg-[#eaf0f8] text-[10px] text-[#315477]"><Sparkles className="mr-1 h-3 w-3" />AI extracted</Badge>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer" value="Nordic Motion Systems" />
          <Field label="RFQ number" value="NMS-2026-884" />
          <Field label="Contact name" value="Lena Hoffmann" />
          <Field label="Email" value="lena.hoffmann@nordicmotion.com" />
          <Field label="Deadline" value="September 12, 2026" warn />
          <Field label="Currency" value="USD" />
        </div>
        <div>
          <div className="mb-3 flex justify-between"><p className="text-xs font-semibold text-[#152238]">Line items <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">3</span></p><Button variant="ghost" size="sm" className="h-7 text-[11px] text-[#315477]">+ Add item</Button></div>
          <div className="space-y-2">
            {ITEMS.map((item) => (
              <div key={item.code} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf4fb] text-[10px] font-bold text-[#52759f]">{item.qty}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><p className="text-xs font-semibold text-[#152238]">{item.name}</p><span className={`text-[10px] font-semibold ${item.confidence === "72%" ? "text-amber-600" : "text-emerald-600"}`}>{item.confidence} match</span></div><p className="mt-1 text-[11px] text-slate-500">{item.code} · {item.detail}</p></div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4"><div className="flex gap-3"><CircleAlert className="h-4 w-4 shrink-0 text-amber-600" /><div><p className="text-xs font-semibold text-amber-800">2 fields need attention</p><p className="mt-1 text-xs leading-5 text-amber-700">Delivery date and material grade were not explicit in the source document.</p></div></div></div>
        <Button onClick={onApprove} className="w-full rounded-xl bg-[#152238] hover:bg-[#223653]"><ClipboardCheck className="mr-2 h-4 w-4" />Approve extraction</Button>
      </CardContent>
    </Card>
  );
}

function RequirementsCard({ requirements, setRequirements, onClarify, onPersist }: { requirements: Requirement[]; setRequirements: React.Dispatch<React.SetStateAction<Requirement[]>>; onClarify: (label: string) => void; onPersist: (requirement: Requirement) => void }) {
  const ready = requirements.filter((requirement) => requirement.status !== "missing").length;
  const update = (index: number, patch: Partial<Requirement>) => setRequirements((current) => current.map((requirement, currentIndex) => { if (currentIndex !== index) return requirement; const next = { ...requirement, ...patch }; onPersist(next); return next; }));
  return (
    <Card className="border-0 shadow-[0_10px_30px_rgba(28,49,76,0.06)]">
      <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-base text-[#152238]">Requirements check</CardTitle><p className="mt-1 text-xs text-slate-400">Record the decision, exception, and evidence for each gate.</p></div><span className={`text-sm font-semibold ${ready === requirements.length ? "text-emerald-600" : "text-amber-600"}`}>{ready} / {requirements.length} ready</span></CardHeader>
      <CardContent className="space-y-3">
        {requirements.map((requirement, index) => (
          <div key={requirement.label} className={`rounded-xl border p-3 ${requirement.status === "approved" ? "border-emerald-100 bg-emerald-50/40" : requirement.status === "exception" ? "border-violet-100 bg-violet-50/40" : "border-amber-100 bg-amber-50/50"}`}>
            <div className="flex items-center gap-3"><span className={`grid h-6 w-6 place-items-center rounded-full ${requirement.status === "approved" ? "bg-emerald-500 text-white" : requirement.status === "exception" ? "bg-violet-500 text-white" : "bg-amber-400 text-white"}`}>{requirement.status === "approved" ? <Check className="h-3 w-3" /> : <Flag className="h-3 w-3" />}</span><span className="flex-1 text-xs font-semibold text-slate-700">{requirement.label}</span><select aria-label={`Decision for ${requirement.label}`} value={requirement.status} onChange={(event) => update(index, { status: event.target.value as RequirementStatus })} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600"><option value="approved">Approved</option><option value="missing">Missing</option><option value="exception">Exception</option></select>{requirement.status === "missing" && <Button onClick={() => onClarify(requirement.label)} variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-amber-700"><MessageSquareText className="mr-1 h-3 w-3" />Clarify</Button>}</div>
            {(requirement.status !== "approved" || requirement.note) && <Input aria-label={`Evidence for ${requirement.label}`} value={requirement.note} onChange={(event) => update(index, { note: event.target.value })} placeholder={requirement.status === "exception" ? "Log the approved exception..." : "Add evidence or next step..."} className="mt-3 h-8 rounded-lg border-white/80 bg-white text-[11px]" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ClarificationPanel({ subject, setSubject, body, setBody, status, clarificationId, onSave, onUpdate, onClose }: { subject: string; setSubject: (value: string) => void; body: string; setBody: (value: string) => void; status: ClarificationStatus; clarificationId: number | null; onSave: () => void; onUpdate: (status: ClarificationStatus) => void; onClose: () => void }) {
  const copy = () => navigator.clipboard?.writeText(`Subject: ${subject}\n\n${body}`);
  return (
    <Card className="border-0 bg-[#f8fbfe] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-base text-[#152238]">Customer clarification</CardTitle><p className="mt-1 text-xs text-slate-400">Review the draft before it leaves your workspace.</p></div><Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button></CardHeader>
      <CardContent className="space-y-4"><div className="flex items-center gap-2"><Badge className="rounded-full border-0 bg-amber-50 text-[10px] text-amber-700">{status}</Badge><span className="text-[11px] text-slate-400">RFQ-1048 · customer response requested</span></div><div><label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Subject</label><Input value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded-lg border-slate-200 text-xs" /></div><div><label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Message</label><Textarea value={body} onChange={(event) => setBody(event.target.value)} className="min-h-32 rounded-lg border-slate-200 text-xs leading-5" /></div><div className="flex flex-wrap gap-2"><Button onClick={onSave} className="rounded-xl bg-[#152238] hover:bg-[#223653]"><FileText className="mr-2 h-4 w-4" />Save draft</Button><Button onClick={() => onUpdate("sent")} variant="outline" className="rounded-xl border-slate-200"><Send className="mr-2 h-4 w-4" />Mark as sent</Button><Button onClick={copy} variant="outline" className="rounded-xl border-slate-200"><Copy className="mr-2 h-4 w-4" />Copy</Button><Button onClick={() => onUpdate("resolved")} variant="ghost" className="rounded-xl text-emerald-700">Mark resolved</Button><Button onClick={() => onUpdate("cancelled")} variant="ghost" className="rounded-xl text-rose-600">Cancel</Button></div>{clarificationId && <p className="text-[11px] text-slate-400">Saved to workflow record #{clarificationId}.</p>}</CardContent>
    </Card>
  );
}

export default function RfqDetail() {
  const [, setLocation] = useLocation();
  const createClarification = trpc.rfq.clarification.create.useMutation();
  const updateClarification = trpc.rfq.clarification.update.useMutation();
  const updateRequirement = trpc.rfq.requirement.update.useMutation();
  const saveNote = trpc.rfq.note.useMutation();
  const setStatus = trpc.rfq.setStatus.useMutation();
  const [requirements, setRequirements] = useState(INITIAL_REQUIREMENTS);
  const [internalNotes, setInternalNotes] = useState("Engineering should confirm enclosure material before pricing. Do not promise delivery until Nordic Motion confirms the required arrival date.");
  const [extractionApproved, setExtractionApproved] = useState(false);
  const [clarificationOpen, setClarificationOpen] = useState(false);
  const [clarificationId, setClarificationId] = useState<number | null>(null);
  const [clarificationStatus, setClarificationStatus] = useState<ClarificationStatus>("draft");
  const [subject, setSubject] = useState("Clarification Required — RFQ-1048");
  const [body, setBody] = useState("Hello Lena,\n\nTo complete our quotation for the servo drive assemblies, could you please confirm the required material grade for Item #2 and the required delivery date?\n\nThank you,");
  const ready = useMemo(() => requirements.every((requirement) => requirement.status !== "missing"), [requirements]);
  const openClarification = (label: string) => { setSubject("Clarification Required — RFQ-1048"); setBody(`Hello Lena,\n\nTo complete our quotation, could you please confirm: ${label.toLowerCase()}?\n\nThank you,`); setClarificationOpen(true); };
  const saveClarification = () => createClarification.mutate({ rfqNumber: "RFQ-1048", subject, body }, { onSuccess: (result) => { setClarificationId(result?.id ?? null); setClarificationStatus("draft"); } });
  const updateClarificationStatus = (next: ClarificationStatus) => { setClarificationStatus(next); if (clarificationId) updateClarification.mutate({ id: clarificationId, status: next, body }); };
  const persistRequirement = (requirement: Requirement) => updateRequirement.mutate({ id: requirement.id, status: requirement.status, note: requirement.note });
  const persistStage = () => setStatus.mutate({ rfqNumber: "RFQ-1048", status: ready ? "READY_FOR_QUOTE" : "REVIEW_REQUIRED" });
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => setLocation("/inbox")} className="-ml-2 text-slate-500"><ArrowLeft className="mr-1 h-4 w-4" />Back to inbox</Button><span className="text-slate-300">/</span><span className="text-xs font-semibold text-[#315477]">RFQ-1048</span><Badge className="rounded-full border-0 bg-amber-50 text-[10px] text-amber-700">{ready ? "Ready for quote" : "Review required"}</Badge></div>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6885a5]">RFQ-1048 · Received today at 08:42</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#152238]">Nordic Motion Systems</h1><p className="mt-2 text-sm text-slate-500">Servo motor assembly · 3 line items · $48,600 estimated value</p></div><Link href="/quotes"><Button className="rounded-xl bg-[#152238] hover:bg-[#223653]"><FileText className="mr-2 h-4 w-4" />Open quote studio</Button></Link></header>
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div className="text-xs font-semibold text-slate-500">Received <span className="mx-3 text-slate-300">→</span> Extracted <span className="mx-3 text-slate-300">→</span> Reviewed <span className="mx-3 text-slate-300">→</span> <span className="text-amber-600">Requirements check</span> <span className="mx-3 text-slate-300">→</span> Pricing <span className="mx-3 text-slate-300">→</span> Quote ready</div><Button onClick={persistStage} variant="outline" className="rounded-xl border-slate-200 text-xs">{ready ? "Mark ready for quote" : "Keep in review"}</Button></div>
      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]"><SourcePreview /><div className="space-y-5"><ExtractionCard onApprove={() => setExtractionApproved(true)} />{extractionApproved && <div className="-mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">Extraction approved. Human-reviewed fields are now the working source for pricing.</div>}<RequirementsCard requirements={requirements} setRequirements={setRequirements} onClarify={openClarification} onPersist={persistRequirement} /><Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base text-[#152238]">Internal notes</CardTitle><p className="mt-1 text-xs text-slate-400">Visible only to your team. Capture exceptions, decisions, and handoff context.</p></CardHeader><CardContent className="space-y-3"><Textarea value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} className="min-h-24 rounded-lg border-slate-200 text-xs leading-5" /><div className="flex items-center justify-between"><span className="text-[11px] text-slate-400">Autosaves to the RFQ activity trail.</span><Button onClick={() => saveNote.mutate({ rfqNumber: "RFQ-1048", body: internalNotes })} variant="outline" className="rounded-xl border-slate-200 text-xs">Save note</Button></div></CardContent></Card>{clarificationOpen && <ClarificationPanel subject={subject} setSubject={setSubject} body={body} setBody={setBody} status={clarificationStatus} clarificationId={clarificationId} onSave={saveClarification} onUpdate={updateClarificationStatus} onClose={() => setClarificationOpen(false)} />}</div></div>
    </div>
  );
}
