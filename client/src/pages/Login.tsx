import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { ArrowRight, CheckCircle2, FileText, LockKeyhole, Sparkles, Workflow } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Login() {
  const [isStarting, setIsStarting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsStarting(true);
    const result = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setError(result.error.message);
    else if (isSignUp && !result.data.session) setError("Check your email to confirm your account before signing in.");
    else window.location.href = "/";
    setIsStarting(false);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fb] text-[#152238]">
      <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-[#152238] px-6 py-8 text-white sm:px-10 lg:px-14 lg:py-10">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute -bottom-48 -left-24 h-[32rem] w-[32rem] rounded-full border border-[#7aa4cf]/20" />
          <Link href="/" className="relative flex w-fit items-center gap-3" aria-label="Lattice RFQ home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d5a860] text-[#152238]"><Sparkles className="h-5 w-5" /></span>
            <span><span className="block text-base font-semibold tracking-tight">Lattice RFQ</span><span className="block text-[10px] uppercase tracking-[0.18em] text-[#b9d4f2]">Quote operations</span></span>
          </Link>
          <div className="relative max-w-lg py-16 lg:py-0">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#b9d4f2]">The command center for faster quotes</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-6xl">Turn every RFQ into a clear next move.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-300">Bring requests, technical review, pricing, and customer follow-up into one calm, accountable workflow.</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {["See the full quote pipeline", "Keep technical details together", "Route work to the right owner", "Move from inbox to quote faster"].map((item) => <div key={item} className="flex items-start gap-2.5 text-sm text-slate-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d5a860]" />{item}</div>)}
            </div>
          </div>
          <p className="relative text-xs text-slate-400">Secure workspace access for your quotation team.</p>
        </section>
        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden"><Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#152238] text-white"><Sparkles className="h-5 w-5" /></span><span className="font-semibold">Lattice RFQ</span></Link></div>
            <div className="mb-8"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#6885a5]">Welcome back</p><h2 className="text-3xl font-semibold tracking-[-0.04em]">Sign in to your workspace</h2><p className="mt-3 text-sm leading-6 text-slate-500">Access your RFQs, quote studio, and team workload from one place.</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(28,49,76,0.08)] sm:p-8">
              <div className="mb-6 grid grid-cols-3 gap-2"><div className="flex flex-col items-center gap-2 rounded-xl bg-[#edf4fb] p-3 text-center"><FileText className="h-4 w-4 text-[#52759f]" /><span className="text-[10px] font-semibold text-[#315477]">RFQs</span></div><div className="flex flex-col items-center gap-2 rounded-xl bg-[#f5f1fb] p-3 text-center"><Workflow className="h-4 w-4 text-[#806ca9]" /><span className="text-[10px] font-semibold text-[#69558f]">Workflow</span></div><div className="flex flex-col items-center gap-2 rounded-xl bg-[#eef8f1] p-3 text-center"><LockKeyhole className="h-4 w-4 text-[#5b9a71]" /><span className="text-[10px] font-semibold text-[#43855a]">Secure</span></div></div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div><label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Work email</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#52759f] focus:ring-2 focus:ring-[#52759f]/20" placeholder="you@company.com" /></div>
                <div><label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">Password</label><input id="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#52759f] focus:ring-2 focus:ring-[#52759f]/20" placeholder="At least 6 characters" /></div>
                <Button type="submit" disabled={isStarting} className="h-12 w-full rounded-xl bg-[#152238] text-sm font-semibold hover:bg-[#223653]">{isStarting ? "Checking…" : isSignUp ? "Create account" : "Sign in"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
              </form>
              {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-xs leading-5 text-rose-700">{error}</p>}
              <button type="button" onClick={() => { setIsSignUp((value) => !value); setError(null); }} className="mt-5 w-full text-center text-xs font-medium text-[#52759f] hover:underline">{isSignUp ? "Already have an account? Sign in" : "Need an account? Create one"}</button>
            </div>
            <p className="mt-8 text-center text-xs text-slate-400">Need access? Contact your workspace administrator.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export function Landing() {
  return <Login />;
}
