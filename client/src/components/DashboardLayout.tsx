import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import { BarChart3, Bell, CheckCheck, FileCheck2, Inbox, LayoutDashboard, LogOut, PanelLeft, Settings2, Sparkles, Users2 } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Command center", path: "/", section: "WORKSPACE" },
  { icon: Inbox, label: "RFQ inbox", path: "/inbox", section: "WORKSPACE", badge: "12" },
  { icon: FileCheck2, label: "Quote studio", path: "/quotes", section: "WORKSPACE" },
  { icon: BarChart3, label: "Analytics", path: "/analytics", section: "INSIGHTS" },
  { icon: Users2, label: "Team & routing", path: "/team", section: "ADMIN" },
  { icon: Settings2, label: "Workspace settings", path: "/settings", section: "ADMIN" },
];
const SIDEBAR_WIDTH_KEY = "sidebar-width";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : 264;
  });
  const { loading, user } = useAuth();
  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()), [sidebarWidth]);
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <div className="min-h-screen grid place-items-center bg-[#f7f8fb]"><div className="max-w-sm space-y-5 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#152238] text-white shadow-xl"><Sparkles className="h-6 w-6" /></div><h1 className="text-2xl font-semibold text-[#152238]">Welcome to Lattice RFQ</h1><p className="text-sm leading-6 text-slate-500">Sign in to access your quotation operations workspace.</p><Button onClick={() => startLogin()} className="w-full rounded-xl bg-[#152238] hover:bg-[#223653]">Sign in to workspace</Button></div></div>;
  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

function NotificationCenter() {
  const { data: notifications = [] } = trpc.notifications.list.useQuery();
  const markRead = trpc.notifications.markRead.useMutation();
  const { data: deadlineSchedule } = trpc.notifications.deadlineScheduleStatus.useQuery();
  const utils = trpc.useUtils();
  const scheduleMutation = trpc.notifications.deadlineSchedule.useMutation({ onSuccess: () => void utils.notifications.deadlineScheduleStatus.invalidate() });
  const demo = [
    { id: -1, title: "Material grade clarification open", body: "RFQ-1048 needs a customer response before quote release.", readAt: null, createdAt: new Date() },
    { id: -2, title: "Quote review milestone", body: "QT-2026-018 is ready for manager review.", readAt: null, createdAt: new Date(Date.now() - 3600000) },
    { id: -3, title: "New RFQ received", body: "Kestrel Waterworks submitted a pump skid package.", readAt: new Date(), createdAt: new Date(Date.now() - 7200000) },
  ];
  const items = notifications.length ? notifications : demo;
  const unread = items.filter(item => !item.readAt).length;
  return <DropdownMenu><DropdownMenuTrigger asChild><button aria-label="Open notifications" className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-[#c9d9e8] hover:text-[#315477]"><Bell className="h-4 w-4" />{unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#d5a860] ring-2 ring-white" />}</button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-[360px] rounded-2xl border-slate-200 p-2 shadow-xl"><div className="flex items-center justify-between px-3 py-2"><div><p className="text-sm font-semibold text-[#152238]">Notifications</p><p className="text-[11px] text-slate-400">{unread} need your attention</p></div><CheckCheck className="h-4 w-4 text-[#52759f]" /></div><div className="mb-2 flex items-center justify-between rounded-xl bg-[#edf4fb] px-3 py-2"><div><p className="text-[11px] font-semibold text-[#315477]">Deadline alerts</p><p className="text-[10px] text-slate-500">{deadlineSchedule?.enabled ? "Automatic checks are active." : "Enable a two-hour RFQ deadline check."}</p></div><Button onClick={() => scheduleMutation.mutate({ action: deadlineSchedule?.enabled ? "disable" : "enable" })} disabled={scheduleMutation.isPending} variant="outline" size="sm" className="h-7 rounded-lg border-[#c9d9e8] bg-white px-2 text-[10px] text-[#315477]">{scheduleMutation.isPending ? "Saving…" : deadlineSchedule?.enabled ? "Pause" : "Enable"}</Button></div><div className="space-y-1">{items.map(item => <DropdownMenuItem key={item.id} onClick={() => item.id > 0 && markRead.mutate({ id: item.id })} className={`cursor-pointer items-start gap-3 rounded-xl p-3 ${item.readAt ? "opacity-60" : "bg-[#f6f9fc]"}`}><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-slate-300" : "bg-[#d5a860]"}`} /><span className="min-w-0"><span className="block text-xs font-semibold text-[#152238]">{item.title}</span><span className="mt-1 block whitespace-normal text-[11px] leading-4 text-slate-500">{item.body}</span></span></DropdownMenuItem>)}</div></DropdownMenuContent></DropdownMenu>;
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const [resizing, setResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => { if (resizing) setSidebarWidth(Math.min(420, Math.max(220, e.clientX - (sidebarRef.current?.getBoundingClientRect().left ?? 0)))); };
    const up = () => setResizing(false);
    if (resizing) { document.addEventListener("mousemove", move); document.addEventListener("mouseup", up); }
    return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
  }, [resizing, setSidebarWidth]);
  const sections = Array.from(new Set(menuItems.map(item => item.section)));
  return <><div ref={sidebarRef} className="relative"><Sidebar collapsible="icon" className="border-r border-slate-200 bg-[#f9fafc]" disableTransition={resizing}><SidebarHeader className="h-[76px] border-b border-slate-200 px-3"><div className="flex items-center gap-3 px-2"><button onClick={toggleSidebar} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#152238] text-white shadow-sm"><PanelLeft className="h-4 w-4" /></button>{!isCollapsed && <div><p className="text-[15px] font-semibold tracking-tight text-[#152238]">Lattice RFQ</p><p className="text-[10px] font-medium uppercase tracking-[0.17em] text-slate-400">Quote operations</p></div>}</div></SidebarHeader><SidebarContent className="px-2 py-5">{sections.map(section => <div key={section} className="mb-5"><p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.17em] text-slate-400 group-data-[collapsible=icon]:hidden">{section}</p><SidebarMenu>{menuItems.filter(item => item.section === section).map(item => { const active = location === item.path || (item.path !== "/" && location.startsWith(item.path)); return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={active} onClick={() => setLocation(item.path)} tooltip={item.label} className={`h-10 rounded-xl font-medium ${active ? "bg-[#eaf0f8] text-[#152238]" : "text-slate-500 hover:bg-slate-100 hover:text-[#152238]"}`}><item.icon className="h-[17px] w-[17px]" /><span>{item.label}</span>{item.badge && !isCollapsed && <span className="ml-auto rounded-full bg-[#dce7f5] px-2 py-0.5 text-[10px] font-semibold text-[#315477]">{item.badge}</span>}</SidebarMenuButton></SidebarMenuItem>; })}</SidebarMenu></div>)}</SidebarContent><SidebarFooter className="border-t border-slate-200 p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left hover:bg-slate-100"><Avatar className="h-9 w-9 border border-white shadow-sm"><AvatarFallback className="bg-[#dbe7f5] text-xs font-semibold text-[#315477]">{user?.name?.slice(0, 2).toUpperCase() || "PR"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-semibold text-[#152238]">{user?.name || "Prathik"}</p><p className="truncate text-xs text-slate-400">Operations lead</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52"><DropdownMenuItem onClick={logout} className="cursor-pointer text-rose-600"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><div onMouseDown={() => !isCollapsed && setResizing(true)} className={`absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize hover:bg-[#c5d6e8] ${isCollapsed ? "hidden" : ""}`} /></div><SidebarInset className="bg-[#f7f8fb]">{isMobile ? <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur"><div className="flex items-center gap-3"><SidebarTrigger /><span className="text-sm font-semibold text-[#152238]">Lattice RFQ</span></div><NotificationCenter /></div> : <div className="flex h-16 items-center justify-end gap-3 border-b border-slate-200 bg-[#f7f8fb] px-6"><NotificationCenter /></div>}<main className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</main></SidebarInset></>;
}
