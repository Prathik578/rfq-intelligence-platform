import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  ClipboardCheck,
  FileText,
  Flag,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "wouter";

const items = [
  [
    "SM-4400",
    "Servo motor assembly",
    "4-axis, IP65, 2.4kW continuous",
    "12",
    "98%",
  ],
  ["ENC-22", "Control enclosure", "NEMA 4X stainless steel", "4", "83%"],
  ["CAB-15", "Shielded cable set", "15m, M23 connectors", "12", "72%"],
] as const;

function Field({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </label>
        {warn && (
          <span className="text-[10px] font-semibold text-amber-600">
            Low confidence
          </span>
        )}
      </div>
      <Input
        defaultValue={value}
        className={`h-9 rounded-lg text-xs ${warn ? "border-amber-200 bg-amber-50/40" : "border-slate-200"}`}
      />
    </div>
  );
}

function SourcePreview() {
  return (
    <Card className="border-0 shadow-[0_10px_30px_rgba(28,49,76,0.06)]">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-base text-[#152238]">
          <FileText className="h-4 w-4 text-[#52759f]" />
          Original request
        </CardTitle>
        <p className="text-xs text-slate-400">
          nordic-motion-rfq-1048.pdf · 4 pages
        </p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[600px] rounded-xl border border-slate-200 bg-[#f4f5f7] p-7">
          <div className="mx-auto max-w-[370px] rounded bg-white p-7 shadow-lg">
            <div className="flex justify-between border-b-2 border-[#152238] pb-4">
              <div>
                <p className="text-[9px] font-bold tracking-[0.2em] text-[#152238]">
                  NORDIC MOTION
                </p>
                <p className="mt-1 text-[7px] text-slate-400">
                  Motion systems · Oslo, Norway
                </p>
              </div>
              <span className="rounded bg-[#edf4fb] px-2 py-1 text-[7px] font-bold text-[#52759f]">
                RFQ
              </span>
            </div>
            <p className="mt-7 text-[9px] font-bold text-[#152238]">
              Request for quotation — Servo drive assemblies
            </p>
            <p className="mt-3 text-[7px] leading-4 text-slate-500">
              Please provide your best commercial and technical offer for the
              items listed below.
            </p>
            <div className="mt-6 space-y-2">
              {items.map(([code, name, detail, qty]) => (
                <div key={code} className="rounded border border-slate-100 p-2">
                  <div className="flex justify-between text-[7px] font-bold text-[#152238]">
                    <span>{name}</span>
                    <span>{qty} pcs</span>
                  </div>
                  <p className="mt-1 text-[6px] text-slate-400">
                    Part no. {code} · {detail}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-7 rounded bg-amber-50 p-2 text-[7px] text-amber-700">
              <b>Buyer note</b>
              <br />
              Confirm final material grade and expected delivery date.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExtractionCard() {
  return (
    <Card className="border-0 shadow-[0_10px_30px_rgba(28,49,76,0.06)]">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
        <div>
          <CardTitle className="text-base text-[#152238]">
            Extracted request data
          </CardTitle>
          <p className="mt-1 text-xs text-slate-400">
            AI-assisted · review every field before approval
          </p>
        </div>
        <Badge className="rounded-full border-0 bg-[#eaf0f8] text-[10px] text-[#315477]">
          <Sparkles className="mr-1 h-3 w-3" />
          AI extracted
        </Badge>
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
          <div className="mb-3 flex justify-between">
            <p className="text-xs font-semibold text-[#152238]">
              Line items{" "}
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                3
              </span>
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-[#315477]"
            >
              + Add item
            </Button>
          </div>
          <div className="space-y-2">
            {items.map(([code, name, detail, qty, confidence]) => (
              <div
                key={code}
                className="rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf4fb] text-[10px] font-bold text-[#52759f]">
                    {qty}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <p className="text-xs font-semibold text-[#152238]">
                        {name}
                      </p>
                      <span
                        className={`text-[10px] font-semibold ${confidence === "72%" ? "text-amber-600" : "text-emerald-600"}`}
                      >
                        {confidence} match
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {code} · {detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex gap-3">
            <CircleAlert className="h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-xs font-semibold text-amber-800">
                2 fields need attention
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-700">
                Delivery date and material grade were not explicit in the source
                document.
              </p>
            </div>
          </div>
        </div>
        <Button className="w-full rounded-xl bg-[#152238] hover:bg-[#223653]">
          <ClipboardCheck className="mr-2 h-4 w-4" />
          Approve extraction
        </Button>
      </CardContent>
    </Card>
  );
}

function RequirementsCard() {
  const checks = [
    ["Customer identified", true],
    ["Product and quantity identified", true],
    ["Specifications available", true],
    ["Delivery location available", true],
    ["Required delivery date available", false],
    ["Material grade confirmed", false],
  ] as const;
  return (
    <Card className="border-0 shadow-[0_10px_30px_rgba(28,49,76,0.06)]">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base text-[#152238]">
            Requirements check
          </CardTitle>
          <p className="mt-1 text-xs text-slate-400">
            Readiness for pricing and quote release
          </p>
        </div>
        <span className="text-sm font-semibold text-amber-600">
          4 / 6 ready
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        {checks.map(([label, ok]) => (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${ok ? "bg-emerald-50/60" : "bg-amber-50/70"}`}
          >
            <span
              className={`grid h-5 w-5 place-items-center rounded-full ${ok ? "bg-emerald-500 text-white" : "bg-amber-400 text-white"}`}
            >
              {ok ? (
                <Check className="h-3 w-3" />
              ) : (
                <Flag className="h-3 w-3" />
              )}
            </span>
            <span className="flex-1 text-xs font-medium text-slate-700">
              {label}
            </span>
            {!ok && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-amber-700"
              >
                <MessageSquareText className="mr-1 h-3 w-3" />
                Clarify
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function RfqDetail() {
  const [, setLocation] = useLocation();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/inbox")}
          className="-ml-2 text-slate-500"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to inbox
        </Button>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-semibold text-[#315477]">RFQ-1048</span>
        <Badge className="rounded-full border-0 bg-amber-50 text-[10px] text-amber-700">
          Review required
        </Badge>
      </div>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6885a5]">
            RFQ-1048 · Received today at 08:42
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#152238]">
            Nordic Motion Systems
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Servo motor assembly · 3 line items · $48,600 estimated value
          </p>
        </div>
        <Link href="/quotes">
          <Button className="rounded-xl bg-[#152238] hover:bg-[#223653]">
            <FileText className="mr-2 h-4 w-4" />
            Open quote studio
          </Button>
        </Link>
      </header>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs font-semibold text-slate-500 shadow-sm">
        Received <span className="mx-3 text-slate-300">→</span> Extracted{" "}
        <span className="mx-3 text-slate-300">→</span> Reviewed{" "}
        <span className="mx-3 text-slate-300">→</span>{" "}
        <span className="text-amber-600">Requirements check</span>{" "}
        <span className="mx-3 text-slate-300">→</span> Pricing{" "}
        <span className="mx-3 text-slate-300">→</span> Quote ready
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <SourcePreview />
        <div className="space-y-5">
          <ExtractionCard />
          <RequirementsCard />
        </div>
      </div>
    </div>
  );
}
