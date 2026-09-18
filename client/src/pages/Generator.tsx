import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  FileCheck2,
  GlassWater,
  Leaf,
  MapPin,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  Recycle,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Truck,
  Upload,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { SharedPickup, useEcovaData } from "@/contexts/EcovaDataContext";

type View = "overview" | "pickups" | "rewards" | "impact" | "guide";
type Modal = "schedule" | "flow" | "redeem" | null;
type Material = "Plastic" | "Paper / Cardboard" | "Glass" | "E-Waste" | "Organic";

type Pickup = SharedPickup;

const materials: { name: Material; icon: typeof PackageCheck; color: string; accepted: string; notAccepted: string }[] = [
  { name: "Plastic", icon: PackageCheck, color: "green", accepted: "PET bottles, clean containers", notAccepted: "Plastic film, dirty mixed waste" },
  { name: "Paper / Cardboard", icon: FileCheck2, color: "blue", accepted: "Boxes, paper, flattened cartons", notAccepted: "Waxed paper, food-soiled paper" },
  { name: "Glass", icon: GlassWater, color: "amber", accepted: "Bottles and jars", notAccepted: "Mirrors, ceramics, window glass" },
  { name: "E-Waste", icon: Zap, color: "violet", accepted: "Small devices, cables, batteries", notAccepted: "Large appliances, leaking batteries" },
  { name: "Organic", icon: Leaf, color: "olive", accepted: "Food scraps, garden waste", notAccepted: "Plastic-lined or chemical waste" },
];

const flowSteps = [
  ["01", "REQUESTED", "12 SEP · 10:42", "Pickup request created."],
  ["02", "COLLECTOR ASSIGNED", "12 SEP · 11:03", "Collector: Daniel O. · Verified collector"],
  ["03", "COLLECTED & WEIGHED", "12 SEP · 14:38", "Verified weight: 4.70 KG"],
  ["04", "DELIVERED TO SORTING HUB", "12 SEP · 16:12", "Facility: EC-HUB-07"],
  ["05", "RECYCLING CONFIRMED", "13 SEP · 09:20", "Material processed."],
  ["06", "REWARD CREDITED", "13 SEP · 09:21", "+470 ECO"],
];

function GeneratorMark({ size = 28 }: { size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36" fill="none"><path d="M18 4.5C24.9 4.5 30.5 10.1 30.5 17" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" /><path d="M30.5 17C30.5 23.9 24.9 29.5 18 29.5C11.1 29.5 5.5 23.9 5.5 17" stroke="#10b981" strokeWidth="2.8" strokeLinecap="round" /><path d="M5.5 17C5.5 10.1 11.1 4.5 18 4.5" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" strokeDasharray="2 4" /><path d="M18 1.8L21.4 6.2L15.8 6.7" fill="#10b981" /><path d="M33.6 17L28.2 14.9L29.1 20.4" fill="#10b981" /><path d="M4 17L9.4 19.1L8.5 13.6" fill="#0f172a" /><circle cx="18" cy="17" r="3.2" fill="#10b981" /></svg>;
}

function Kicker({ children }: { children: React.ReactNode }) { return <p className="gen-kicker">{children}</p>; }

function Generator() {
  const { pickups, balance, transactions, impact, createPickup: createSharedPickup, classifyWaste, redeemReward } = useEcovaData();
  const [view, setView] = useState<View>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [selectedPickup, setSelectedPickup] = useState("EC-1048");
  const [scheduleStep, setScheduleStep] = useState(1);
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>(["Plastic"]);
  const [weight, setWeight] = useState(5);
  const [location, setLocation] = useState("14 Olufemi Street, Ikeja");
  const [slot, setSlot] = useState("Today · 14:00 – 16:00");
  const [redeemAmount, setRedeemAmount] = useState(500);
  const [aiDetected, setAiDetected] = useState(false);
  const [wasteImage, setWasteImage] = useState<string | undefined>();
  const [classification, setClassification] = useState<{ detectedMaterial: string; confidence: number | null; contaminationEstimate: string; estimatedWeight: number; isFallback: boolean; notes: string } | null>(null);

  const currentPickup = pickups.find((pickup) => pickup.id === selectedPickup) ?? pickups[0];
  const viewTitle = { overview: "Overview", pickups: "Pickups", rewards: "Rewards", impact: "Impact", guide: "Material Guide" }[view];
  const navItems: { key: View; label: string; icon: typeof Recycle }[] = [
    { key: "overview", label: "Overview", icon: ScanLine },
    { key: "pickups", label: "Pickups", icon: Truck },
    { key: "rewards", label: "Rewards", icon: WalletCards },
    { key: "impact", label: "Impact", icon: Leaf },
  ];

  const switchView = (next: View) => { setView(next); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openFlow = (id = "EC-1048") => { setSelectedPickup(id); setModal("flow"); };
  const toggleMaterial = (name: Material) => setSelectedMaterials((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  const updateWeight = (delta: number) => setWeight((current) => Math.max(0.5, Math.min(100, Number((current + delta).toFixed(1)))));
  const onImageSelected = (file: File) => { const reader = new FileReader(); reader.onload = () => { setWasteImage(String(reader.result)); setAiDetected(false); setClassification(null); }; reader.readAsDataURL(file); };
  const runAi = async () => { const result = await classifyWaste(wasteImage, weight, selectedMaterials.join(" + ") || "Plastic"); setClassification(result); setAiDetected(true); };
  const createPickup = async () => {
    const id = await createSharedPickup({ material: selectedMaterials.join(" + ") || "PET Plastic", estimatedWeight: weight, location, pickupWindow: slot, imageData: wasteImage, detectedMaterial: classification?.detectedMaterial, aiConfidence: classification?.confidence, aiNotes: classification?.notes, contaminationEstimate: classification?.contaminationEstimate });
    setSelectedPickup(id); setModal(null); setScheduleStep(1); setView("pickups");
    toast("Pickup requested", { description: `${id} is now in your material record.` });
  };
  const redeem = () => { redeemReward(redeemAmount); setModal(null); toast("Demo redemption recorded", { description: `-${redeemAmount} ECO · Mobile Data · Prototype transaction` }); };

  return <div className="generator-app">
    <aside className={`generator-sidebar ${mobileNav ? "generator-sidebar-open" : ""}`}>
      <div className="gen-brand"><a href="/" aria-label="Back to Ecova landing page"><GeneratorMark size={30} /><span>ecova</span></a><div className="gen-role">/ GENERATOR</div></div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="gen-nav" aria-label="Generator navigation">
        {navItems.map(({ key, label, icon: Icon }) => <button key={key} className={view === key ? "gen-nav-active" : ""} onClick={() => switchView(key)}><Icon size={17} /><span>{label}</span>{view === key && <span className="nav-active-mark" />}</button>)}
      </nav>
      <div className="sidebar-secondary"><div className="sidebar-label">RESOURCES</div><button className={view === "guide" ? "gen-nav-active" : ""} onClick={() => switchView("guide")}><Recycle size={17} /><span>Material Guide</span></button><button onClick={() => toast("Help center", { description: "Demo support is available in the production roadmap." })}><CircleHelp size={17} /><span>Help</span></button></div>
      <div className="sidebar-bottom"><div className="demo-label">DEMO ROLE</div><button className="demo-role-button" onClick={() => window.location.href = "/collector"}><span className="demo-avatar"><GeneratorMark size={17} /></span><span><b>Generator</b><small>Switch to Collector</small></span><ChevronRight size={15} /></button><a className="back-to-site" href="/">← Back to public site</a></div>
    </aside>

    <div className="generator-main">
      <header className="generator-header"><button className="mobile-gen-menu" onClick={() => setMobileNav((current) => !current)} aria-label="Toggle navigation">{mobileNav ? <X size={20} /> : <Menu size={20} />}</button><div className="mobile-gen-brand"><GeneratorMark size={25} /><span>ecova</span><b>/ generator</b></div><div className="generator-header-right"><span className="session-chip"><i /> DEMO SESSION</span><button className="header-help" onClick={() => toast("Demo environment", { description: "Values shown in this workspace are seeded sample data." })}><CircleHelp size={17} /></button></div></header>
      <div className="generator-content">
        <div className="generator-breadcrumb"><span>ECOVA</span><ChevronRight size={13} /><span>GENERATOR</span><ChevronRight size={13} /><b>{viewTitle.toUpperCase()}</b></div>
        {view === "overview" && <Overview pickups={pickups} impact={impact} onSchedule={() => setModal("schedule")} onFlow={openFlow} onView={switchView} />}
        {view === "pickups" && <Pickups pickups={pickups} onFlow={openFlow} onSchedule={() => setModal("schedule")} />}
        {view === "rewards" && <Rewards balance={balance} transactions={transactions} onRedeem={() => setModal("redeem")} />}
        {view === "impact" && <Impact impact={impact} onFlow={openFlow} />}
        {view === "guide" && <Guide />}
      </div>
    </div>

    {modal === "flow" && <FlowDrawer pickup={currentPickup} onClose={() => setModal(null)} />}
    {modal === "schedule" && <ScheduleFlow step={scheduleStep} setStep={setScheduleStep} materials={selectedMaterials} toggleMaterial={toggleMaterial} weight={weight} updateWeight={updateWeight} location={location} setLocation={setLocation} slot={slot} setSlot={setSlot} aiDetected={aiDetected} runAi={runAi} wasteImage={wasteImage} onImageSelected={onImageSelected} classification={classification} onClose={() => { setModal(null); setScheduleStep(1); }} onConfirm={createPickup} />}
    {modal === "redeem" && <RedeemModal balance={balance} amount={redeemAmount} setAmount={setRedeemAmount} onClose={() => setModal(null)} onConfirm={redeem} />}
  </div>;
}

function Overview({ pickups, impact, onSchedule, onFlow, onView }: { pickups: Pickup[]; impact: { totalDiverted: number; co2e: number; verifiedCollections: number }; onSchedule: () => void; onFlow: (id?: string) => void; onView: (view: View) => void }) {
  const active = pickups.find((pickup) => pickup.status !== "RECYCLED") ?? pickups[0];
  const activeStatus = active?.status ?? "RECYCLED";
  return <>
    <section className="gen-welcome"><div><Kicker>GOOD MORNING · DEMO GENERATOR</Kicker><h1>Keep your materials<br /><em>moving.</em></h1><p>Schedule a collection, follow verified pickups, and see the impact of what you recover.</p></div><div className="gen-actions"><button className="gen-primary" onClick={onSchedule}><Plus size={17} /> Schedule pickup</button><button className="gen-secondary" onClick={() => onView("guide")}>Find a drop-off <ArrowRight size={15} /></button></div></section>
    <section className="gen-metrics"><div className="metrics-head"><span>IMPACT SUMMARY</span><span className="demo-data"><i /> DEMO DATA</span></div><div className="metrics-row"><Metric label="TOTAL DIVERTED" value={impact.totalDiverted.toFixed(1)} unit="KG" detail="Material recovered" /><Metric label="CO₂e ESTIMATE" value={impact.co2e.toFixed(1)} unit="KG" detail="Estimated impact" /><Metric label="VERIFIED PICKUPS" value={String(impact.verifiedCollections)} detail="Chain records" /><Metric label="ACTIVE STREAK" value="4" unit="WEEKS" detail="Keep it moving" /></div></section>
    {active && <section className="active-pickup-card"><div className="active-pickup-top"><div><Kicker>ACTIVE PICKUP</Kicker><h2>{active.id}</h2></div><span className="status-status"><i /> {activeStatus === "COLLECTED" ? "COLLECTED & WEIGHED" : activeStatus === "ASSIGNED" ? "COLLECTOR ASSIGNED" : activeStatus === "ARRIVED" ? "COLLECTOR ARRIVED" : activeStatus}</span></div><div className="active-pickup-grid"><div><span>MATERIAL</span><b>{active.material}</b></div><div><span>WEIGHT</span><b>{active.verifiedWeight ? `${active.verifiedWeight.toFixed(2)} KG` : `${active.estimatedWeight.toFixed(1)} KG`} <small>{active.verifiedWeight ? "VERIFIED" : "ESTIMATED"}</small></b></div><div><span>COLLECTOR</span><b>{active.collector}</b></div><div><span>EXPECTED TODAY</span><b>{active.pickupWindow}</b></div><button onClick={() => onFlow(active.id)}>Track pickup <ArrowRight size={15} /></button></div><div className="pickup-route"><span className="route-node done"><Check size={11} /></span><span className="route-fill" /><span className={`route-node ${activeStatus !== "REQUESTED" ? "active" : ""}`}><Truck size={11} /></span><span className="route-dash" /><span className={`route-node ${activeStatus === "RECYCLED" ? "active" : ""}`}><Recycle size={11} /></span><div className="route-labels"><span>REQUESTED</span><span>{activeStatus === "COLLECTED" ? "COLLECTED & WEIGHED" : activeStatus === "ARRIVED" ? "ARRIVED" : activeStatus === "ASSIGNED" ? "ASSIGNED" : "EN ROUTE"}</span><span>RECYCLING HUB</span></div></div></section>}
    <section className="activity-section"><div className="activity-heading"><div><Kicker>RECENT MATERIAL FLOW</Kicker><h2>Every handoff has a record.</h2></div><button onClick={() => onView("pickups")}>View all pickups <ArrowRight size={15} /></button></div><ActivityTable pickups={pickups} onFlow={onFlow} /></section>
  </>;
}

function Metric({ label, value, unit, detail }: { label: string; value: string; unit?: string; detail: string }) { return <div className="gen-metric"><span>{label}</span><strong>{value} {unit && <small>{unit}</small>}</strong><p>{detail}</p></div>; }

function ActivityTable({ pickups, onFlow }: { pickups: Pickup[]; onFlow: (id?: string) => void }) { return <div className="activity-table"><div className="activity-table-head"><span>DATE</span><span>MATERIAL</span><span>WEIGHT</span><span>PICKUP</span><span>STATUS</span><span /></div>{pickups.slice(0, 5).map((pickup) => <button className="activity-row" key={pickup.id} onClick={() => onFlow(pickup.id)}><span>{pickup.date}</span><strong>{pickup.material}</strong><span>{pickup.weight}</span><span>{pickup.id}</span><span className="table-status"><i /> {pickup.status}</span><ChevronRight size={15} /></button>)}</div>; }

function Pickups({ pickups, onFlow, onSchedule }: { pickups: Pickup[]; onFlow: (id?: string) => void; onSchedule: () => void }) { const [tab, setTab] = useState("Active"); const filtered = tab === "Active" ? pickups.filter((item) => ["REQUESTED", "ASSIGNED", "COLLECTED", "AT HUB"].includes(item.status)) : tab === "Completed" ? pickups.filter((item) => item.status === "RECYCLED") : pickups; return <section className="page-view"><div className="page-view-heading"><div><Kicker>GENERATOR / PICKUPS</Kicker><h1>Keep an eye<br /><em>on the handoffs.</em></h1></div><button className="gen-primary" onClick={onSchedule}><Plus size={17} /> Schedule pickup</button></div><div className="tab-row">{["Active", "Upcoming", "Completed"].map((item) => <button className={tab === item ? "tab-active" : ""} key={item} onClick={() => setTab(item)}>{item}<span>{item === "Completed" ? 3 : item === "Active" ? 0 : 0}</span></button>)}</div>{filtered.length ? <div className="pickup-list">{filtered.map((pickup) => <button className="pickup-list-row" key={pickup.id} onClick={() => onFlow(pickup.id)}><div className="pickup-list-id"><span>{pickup.id}</span><small>{pickup.date}</small></div><div><span className="list-label">MATERIAL</span><b>{pickup.material}</b></div><div><span className="list-label">WEIGHT</span><b>{pickup.weight}</b></div><div><span className="list-label">COLLECTOR</span><b>{pickup.collector}</b></div><div className={`status-text status-${pickup.status.replace(" ", "-").toLowerCase()}`}><i /> {pickup.status}</div><ChevronRight size={17} /></button>)}</div> : <EmptyState onSchedule={onSchedule} />}</section>; }

function Rewards({ balance, transactions, onRedeem }: { balance: number; transactions: { id: string; amount: number; pickupId: string; item: string; date: string; negative?: boolean }[]; onRedeem: () => void }) { return <section className="page-view"><div className="page-view-heading rewards-heading"><div><Kicker>GENERATOR / ECO WALLET</Kicker><h1>Value that follows<br /><em>the material.</em></h1></div><button className="gen-primary" onClick={onRedeem}><WalletCards size={16} /> Redeem ECO</button></div><div className="wallet-layout"><div className="wallet-balance"><div className="wallet-top"><span>ECO BALANCE</span><span className="demo-badge">DEMO VALUE</span></div><strong>{balance.toLocaleString()} <small>ECO</small></strong><p>Estimated value <b>₦{balance.toLocaleString()}</b></p><div className="wallet-bottom"><span>REWARD RATE</span><b>1 KG VERIFIED ≈ 100 ECO</b></div></div><div className="wallet-aside"><Sparkles size={20} /><p>Rewards are calculated from verified weight at collection, not AI estimates.</p></div></div><div className="transactions"><div className="activity-heading"><div><Kicker>TRANSACTION HISTORY</Kicker><h2>Movement in your wallet.</h2></div><span className="demo-data"><i /> SIMULATED</span></div><div className="transaction-list">{transactions.slice(0, 6).map((transaction) => <Transaction key={transaction.id} sign={transaction.amount < 0 ? "–" : "+"} amount={String(Math.abs(transaction.amount))} id={transaction.pickupId} item={transaction.item} date={transaction.date} negative={transaction.amount < 0} />)}</div></div></section>; }
function Transaction({ sign, amount, id, item, date, negative }: { sign: string; amount: string; id: string; item: string; date: string; negative?: boolean }) { return <div className="transaction-row"><div className={`transaction-sign ${negative ? "negative" : ""}`}>{sign}</div><div><b>{sign}{amount} ECO</b><span>{id} · {item}</span></div><time>{date}</time><ChevronRight size={15} /></div>; }

function Impact({ impact, onFlow }: { impact: { totalDiverted: number; plasticDiverted: number; verifiedCollections: number; co2e: number; facilities: number }; onFlow: (id?: string) => void }) { return <section className="page-view"><div className="page-view-heading impact-page-heading"><div><Kicker>GENERATOR / IMPACT PASSPORT</Kicker><h1>Your waste has a<br /><em>measurable footprint.</em></h1><p>Every verified collection adds a line to your environmental record. Calculations shown are estimates for this demo.</p></div><button className="gen-secondary" onClick={() => onFlow("EC-1048")}>View verification history <ArrowRight size={15} /></button></div><div className="impact-stat-grid"><div><span>TOTAL MATERIAL RECOVERED</span><strong>{impact.totalDiverted.toFixed(1)} <small>KG</small></strong></div><div><span>PLASTIC DIVERTED</span><strong>{impact.plasticDiverted.toFixed(1)} <small>KG</small></strong></div><div><span>VERIFIED COLLECTIONS</span><strong>{impact.verifiedCollections}</strong></div><div><span>RECYCLING FACILITIES</span><strong>{impact.facilities}</strong></div><div className="impact-stat-wide"><span>ESTIMATED CO₂e IMPACT</span><strong>{impact.co2e.toFixed(1)} <small>KG</small></strong><b>ESTIMATED · DEMO CALCULATION</b></div></div><div className="passport-record"><div className="passport-record-copy"><Kicker>IMPACT PASSPORT</Kicker><h2>A living record<br />of recovery.</h2><p>Generator ID <b>GC-DEMO-001</b></p><button className="text-button" onClick={() => onFlow("EC-1048")}>View verification history <ArrowRight size={15} /></button></div><div className="passport-record-card"><div className="passport-card-mark"><GeneratorMark size={40} /></div><span>ECOVA / ENVIRONMENTAL RECORD</span><strong>GC-DEMO-001</strong><div className="passport-card-grid"><div><small>MATERIALS RECOVERED</small><b>5 TYPES</b></div><div><small>VERIFIED COLLECTIONS</small><b>{impact.verifiedCollections} EVENTS</b></div><div><small>FACILITIES REACHED</small><b>{impact.facilities} HUBS</b></div><div><small>LATEST VERIFIED</small><b>EC-1048</b></div></div><div className="passport-card-footer"><ShieldCheck size={14} /> Record integrity maintained across material flow</div></div></div></section>; }

function Guide() { return <section className="page-view"><div className="page-view-heading"><div><Kicker>GENERATOR / MATERIAL GUIDE</Kicker><h1>Sort with<br /><em>confidence.</em></h1><p>Practical guidance for preparing material before collection.</p></div></div><div className="guide-grid">{materials.map(({ name, icon: Icon, color, accepted, notAccepted }) => <article className="guide-card" key={name}><div className={`guide-icon guide-${color}`}><Icon size={19} /></div><h2>{name}</h2><div className="guide-rule" /><div><span className="accepted"><Check size={13} /> ACCEPTED</span><p>{accepted}</p></div><div><span className="not-accepted"><X size={13} /> NOT ACCEPTED</span><p>{notAccepted}</p></div></article>)}</div></section>; }

function EmptyState({ onSchedule }: { onSchedule: () => void }) { return <div className="empty-state"><div className="empty-mark"><GeneratorMark size={48} /></div><Kicker>NO ACTIVE PICKUPS</Kicker><h2>Nothing moving yet.</h2><p>Schedule your first collection to start your material record.</p><button className="gen-primary" onClick={onSchedule}>Schedule pickup <ArrowRight size={15} /></button></div>; }

function FlowDrawer({ pickup, onClose }: { pickup: Pickup; onClose: () => void }) {
  const eventFor = (...types: string[]) => pickup.events.find((event) => types.includes(event.type));
  const eventLabels = ["PICKUP_REQUESTED", "COLLECTOR_ASSIGNED", "WEIGHT_VERIFIED", "DELIVERED_TO_HUB", "RECYCLING_CONFIRMED", "REWARD_ISSUED"];
  const eventDetails = (index: number, fallback: string) => {
    const event = eventFor(eventLabels[index]);
    if (index === 1 && event) return `Collector: ${pickup.collector} · Verified collector`;
    if (index === 2 && pickup.verifiedWeight) return `${pickup.verifiedWeight.toFixed(2)} KG VERIFIED`;
    if (index === 3 && event) return `Facility: ${String(event.metadata.facility ?? "EC-HUB-07")}`;
    if (index === 5 && pickup.reward > 0) return `+${pickup.reward} ECO`;
    return fallback;
  };
  const isDone = (index: number) => Boolean(eventFor(eventLabels[index])) || (index === 2 && Boolean(pickup.verifiedWeight));
  return <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="flow-drawer"><div className="drawer-header"><div><Kicker>MATERIAL FLOW</Kicker><h2>{pickup.id}</h2></div><button className="drawer-close" onClick={onClose}><X size={19} /></button></div><div className="drawer-summary"><div><span>MATERIAL</span><b>{pickup.material}</b></div><div><span>ESTIMATED</span><b>{pickup.estimatedWeight.toFixed(2)} KG</b></div><div><span>VERIFIED</span><b>{pickup.verifiedWeight ? `${pickup.verifiedWeight.toFixed(2)} KG` : "PENDING"}</b></div><div><span>STATUS</span><strong>{pickup.status === "COLLECTED" ? "COLLECTED & WEIGHED" : pickup.status}</strong></div></div><div className="audit-note"><ShieldCheck size={16} /><span>CHAIN OF CUSTODY · WHO → WHAT → WHEN → WHERE → VERIFIED</span></div><div className="flow-audit">{flowSteps.map(([number, label, date, detail], index) => { const event = eventFor(eventLabels[index]); const done = isDone(index); return <div className={`audit-step ${done ? "audit-step-done" : ""}`} key={number}><div className="audit-index">{done ? <Check size={13} /> : number}</div>{index < flowSteps.length - 1 && <span className="audit-connector" />}<div className="audit-copy"><span>{label}</span><time>{event?.createdAt ?? (index === 2 && pickup.verifiedAt ? pickup.verifiedAt : date)}</time><p>{eventDetails(index, detail)}</p>{index === 2 && pickup.verifiedWeight && <b className="verified-weight"><Check size={12} /> WEIGHT VERIFIED</b>}{index === 5 && pickup.reward > 0 && <b className="eco-credit">+{pickup.reward} ECO</b>}</div></div>; })}</div><div className="drawer-footer"><span>RECORD LAST UPDATED</span><b>{pickup.verifiedAt ?? "17 SEP 2026 · DEMO"}</b></div></aside></div>;
}

function ScheduleFlow({ step, setStep, materials: selected, toggleMaterial, weight, updateWeight, location, setLocation, slot, setSlot, aiDetected, runAi, wasteImage, onImageSelected, classification, onClose, onConfirm }: { step: number; setStep: (step: number) => void; materials: Material[]; toggleMaterial: (name: Material) => void; weight: number; updateWeight: (delta: number) => void; location: string; setLocation: (value: string) => void; slot: string; setSlot: (value: string) => void; aiDetected: boolean; runAi: () => void; wasteImage?: string; onImageSelected: (file: File) => void; classification: { detectedMaterial: string; confidence: number | null; contaminationEstimate: string; estimatedWeight: number; isFallback: boolean; notes: string } | null; onClose: () => void; onConfirm: () => void }) { return <div className="modal-backdrop"><section className="schedule-modal"><header className="schedule-header"><div><Kicker>SCHEDULE A PICKUP</Kicker><h2>{step === 1 ? "What are you recycling?" : step === 2 ? "Where should we collect?" : "Ready to move it?"}</h2></div><button onClick={onClose}><X size={19} /></button></header><div className="schedule-progress">{["MATERIAL", "LOCATION & TIME", "CONFIRM"].map((label, index) => <div className={step >= index + 1 ? "progress-active" : ""} key={label}><span>{String(index + 1).padStart(2, "0")}</span>{label}</div>)}</div>{step === 1 && <div className="schedule-body"><div className="material-select-grid">{materials.map(({ name, icon: Icon, color }) => <button className={`${selected.includes(name) ? "material-selected" : ""}`} key={name} onClick={() => toggleMaterial(name)}><span className={`material-select-icon guide-${color}`}><Icon size={18} /></span><b>{name}</b>{selected.includes(name) && <Check className="material-check" size={14} />}</button>)}</div><div className="weight-block"><div className="weight-label"><span>ESTIMATED WEIGHT</span><small>Final reward is based on verified weight.</small></div><div className="weight-control"><button onClick={() => updateWeight(-0.5)}><Minus size={16} /></button><input type="number" value={weight} onChange={(event) => updateWeight(Number(event.target.value) - weight)} min="0.5" step="0.5" /><span>KG</span><button onClick={() => updateWeight(0.5)}><Plus size={16} /></button></div><div className="weight-presets">{[["Small bag", 2], ["Medium bag", 5], ["Large bag", 10], ["Bulk", 25]].map(([label, value]) => <button className={weight === value ? "preset-active" : ""} key={label as string} onClick={() => updateWeight((value as number) - weight)}>{label}<b>{value as number} KG</b></button>)}</div></div><label className="ai-button"><Upload size={16} /><span><b>{wasteImage ? "Replace waste photo" : "Upload waste photo"}</b><small>Stored with the pickup record · image required for real submission</small></span><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImageSelected(file); }} style={{ width: 120, height: 36, opacity: 0.01, position: "absolute", cursor: "pointer" }} /></label><button className="ai-button" onClick={runAi}><ScanLine size={16} /><span><b>Identify material</b><small>{wasteImage ? "Fallback classifier · vision service not configured" : "Select a photo first · estimate remains provisional"}</small></span><ArrowRight size={15} /></button>{aiDetected && classification && <div className="ai-result"><div><ScanLine size={18} /><span>MATERIAL ANALYSIS · {classification.isFallback ? "FALLBACK" : "AI"}</span></div><strong>{classification.detectedMaterial}</strong><p>{classification.confidence === null ? "No external vision model configured" : `Confidence ${Math.round(classification.confidence * 100)}%`} · Possible contamination: <b>{classification.contaminationEstimate}</b></p><small>{classification.notes}</small></div>}</div>}{step === 2 && <div className="schedule-body location-body"><label className="field-label">PICKUP LOCATION<input value={location} onChange={(event) => setLocation(event.target.value)} /><small><MapPin size={13} /> Use current location</small></label><div className="map-preview"><div className="map-grid" /><span className="map-zone">COLLECTION ZONE 04</span><span className="map-pin"><MapPin size={18} /></span><span className="map-collector"><Truck size={14} /> NEARBY COLLECTOR</span><div className="map-route-line" /></div><div className="time-select"><span className="field-label">DATE & TIME WINDOW</span><div className="time-options">{["Today · 14:00 – 16:00", "Tomorrow · 10:00 – 12:00"].map((option) => <button className={slot === option ? "time-active" : ""} onClick={() => setSlot(option)} key={option}><Clock3 size={15} /><b>{option.split(" · ")[0]}</b><span>{option.split(" · ")[1]}</span>{slot === option && <Check size={14} />}</button>)}</div></div><div className="network-note"><span><i /> DEMO NETWORK</span><b>3 collectors nearby</b><small>Estimated arrival: 18–32 min</small></div></div>}{step === 3 && <div className="schedule-body confirm-body"><div className="confirm-flow"><div className="confirm-icon"><GeneratorMark size={38} /></div><div className="confirm-line" /><div className="confirm-icon confirm-icon-end"><Truck size={19} /></div></div><div className="confirm-summary"><div><span>MATERIAL</span><b>{selected.join(" + ") || "PET Plastic"}</b></div><div><span>ESTIMATED WEIGHT</span><b>{weight.toFixed(1)} KG</b></div><div><span>PICKUP</span><b>{slot}</b></div><div><span>LOCATION</span><b>{location}</b></div><div><span>ESTIMATED REWARD</span><b className="eco-text">~{Math.round(weight * 100)} ECO</b></div></div><div className="confirm-notice"><ShieldCheck size={16} /><span>Reward is finalized after verified weighing.</span></div></div>}<footer className="schedule-footer"><button className="back-button" onClick={() => step === 1 ? onClose() : setStep(step - 1)}>{step === 1 ? "Cancel" : <><ArrowLeft size={15} /> Back</>}</button><button className="gen-primary" onClick={() => step < 3 ? setStep(step + 1) : onConfirm()}>{step < 3 ? "Continue" : "Confirm pickup"} <ArrowRight size={15} /></button></footer></section></div>; }

function RedeemModal({ balance, amount, setAmount, onClose, onConfirm }: { balance: number; amount: number; setAmount: (value: number) => void; onClose: () => void; onConfirm: () => void }) { return <div className="modal-backdrop"><section className="redeem-modal"><button className="drawer-close redeem-close" onClick={onClose}><X size={19} /></button><div className="redeem-mark"><WalletCards size={21} /></div><Kicker>PROTOTYPE REDEMPTION</Kicker><h2>Redeem ECO.</h2><p>Choose a demo redemption. Production rewards will connect to verified partners.</p><div className="redeem-options"><button className="redeem-option redeem-option-active"><span>▣</span><b>Mobile Data</b><small>PROTOTYPE</small></button>{["Electricity", "Cash", "Partner Rewards"].map((item) => <button className="redeem-option" key={item} onClick={() => toast(`${item} is coming in production`)}><span>+</span><b>{item}</b><small>COMING SOON</small></button>)}</div><label className="redeem-amount">AMOUNT<input type="number" value={amount} onChange={(event) => setAmount(Math.max(100, Math.min(balance, Number(event.target.value))))} /><span>ECO</span></label><div className="redeem-confirm"><span>Balance after redemption</span><b>{(balance - amount).toLocaleString()} ECO</b></div><button className="gen-primary redeem-button" onClick={onConfirm}>Redeem {amount} ECO <ArrowRight size={15} /></button><small className="redeem-disclaimer">Simulated transaction · no real financial transfer</small></section></div>; }

export default Generator;
