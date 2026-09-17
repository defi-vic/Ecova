import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  ExternalLink,
  MapPin,
  Menu,
  PackageCheck,
  Recycle,
  ScanLine,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

type Role = "Generator" | "Collector" | "Recycling Hub" | "Admin";

type FlowEvent = {
  label: string;
  title: string;
  time: string;
  detail: string;
  tone: "green" | "blue" | "amber" | "ink";
};

const roles: Role[] = ["Generator", "Collector", "Recycling Hub", "Admin"];

const flowEvents: FlowEvent[] = [
  {
    label: "01 / REQUESTED",
    title: "Pickup request created",
    time: "09:12:04 · 17 SEP 2026",
    detail: "Household collection tagged as PET plastic.",
    tone: "ink",
  },
  {
    label: "02 / ASSIGNED",
    title: "Collector assigned",
    time: "09:18:26 · 17 SEP 2026",
    detail: "M. Okafor · Route 07 · North district",
    tone: "blue",
  },
  {
    label: "03 / VERIFIED",
    title: "Weight verified",
    time: "10:03:41 · 17 SEP 2026",
    detail: "4.70 kg recorded at point of collection.",
    tone: "green",
  },
  {
    label: "04 / DELIVERED",
    title: "Delivered to hub",
    time: "12:44:19 · 17 SEP 2026",
    detail: "Eastside Materials Hub · Bay 02",
    tone: "blue",
  },
  {
    label: "05 / CONFIRMED",
    title: "Recycling confirmed",
    time: "18 SEP 2026 · DEMO EVENT",
    detail: "Material accepted into a PET recovery batch.",
    tone: "green",
  },
];

function FlowMark({ size = 32, dark = false }: { size?: number; dark?: boolean }) {
  const stroke = dark ? "#dffcf2" : "#0f172a";
  const accent = dark ? "#62e0b4" : "#10b981";
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18 4.5C24.9 4.5 30.5 10.1 30.5 17" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" />
      <path d="M30.5 17C30.5 23.9 24.9 29.5 18 29.5C11.1 29.5 5.5 23.9 5.5 17" stroke={accent} strokeWidth="2.8" strokeLinecap="round" />
      <path d="M5.5 17C5.5 10.1 11.1 4.5 18 4.5" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" strokeDasharray="2 4" />
      <path d="M18 1.8L21.4 6.2L15.8 6.7" fill={accent} />
      <path d="M33.6 17L28.2 14.9L29.1 20.4" fill={accent} />
      <path d="M4 17L9.4 19.1L8.5 13.6" fill={stroke} />
      <circle cx="18" cy="17" r="3.2" fill={accent} />
    </svg>
  );
}

function SectionKicker({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <p className={`section-kicker ${dark ? "section-kicker-dark" : ""}`}>{children}</p>;
}

function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState<Role>("Generator");
  const [activeEvent, setActiveEvent] = useState(2);

  const handlePickup = () => {
    document.getElementById("material-flow")?.scrollIntoView({ behavior: "smooth" });
    toast("Demo flow opened", {
      description: "The pickup request flow is represented by EC-1048 in this MVP.",
    });
  };

  const handleNetwork = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  const selectRole = (nextRole: Role) => {
    setRole(nextRole);
    toast(`Demo role: ${nextRole}`, {
      description: "This switcher changes the demonstration perspective only — it is not authentication.",
    });
  };

  return (
    <div className="ecova-app">
      <header className="site-header">
        <div className="nav-shell">
          <a className="brand" href="#top" aria-label="Ecova home">
            <FlowMark size={32} />
            <span>ecova</span>
          </a>

          <nav className={`main-nav ${mobileOpen ? "main-nav-open" : ""}`} aria-label="Primary navigation">
            <a href="#how-it-works" onClick={() => setMobileOpen(false)}>How it works</a>
            <a href="#material-flow" onClick={() => setMobileOpen(false)}>Material flow</a>
            <a href="#impact" onClick={() => setMobileOpen(false)}>Impact</a>
            <a href="#collectors" onClick={() => setMobileOpen(false)}>For collectors</a>
          </nav>

          <div className="nav-actions">
            <label className="role-switcher" title="Demo role switcher — not authentication">
              <span>Demo role</span>
              <select value={role} onChange={(event) => selectRole(event.target.value as Role)} aria-label="Select demo role">
                {roles.map((item) => <option key={item}>{item}</option>)}
              </select>
              <ChevronDown size={13} strokeWidth={2.2} />
            </label>
            <button className="nav-cta" onClick={handlePickup}>
              Recycle with Ecova <ArrowUpRight size={15} />
            </button>
            <button className="mobile-menu" aria-label={mobileOpen ? "Close menu" : "Open menu"} onClick={() => setMobileOpen((open) => !open)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-grid page-shell">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-dot" /> MATERIAL RECOVERY INFRASTRUCTURE</div>
              <h1>Turn waste<br /><em>into verified</em> value.</h1>
              <p className="hero-lede">Ecova connects people, collectors and recycling facilities to make recyclable waste traceable from collection to recovery.</p>
              <div className="hero-actions">
                <button className="button button-primary" onClick={handlePickup}>Schedule a pickup <ArrowRight size={17} /></button>
                <button className="button button-quiet" onClick={handleNetwork}>Explore the network <ArrowDown size={16} /></button>
              </div>
              <div className="hero-note"><ShieldCheck size={15} /> Every collection creates a record.</div>
            </div>

            <div className="hero-visual" aria-label="Material flow from household to recycled material">
              <div className="visual-topline">
                <span>LIVE MATERIAL FLOW</span>
                <span className="visual-status"><span className="status-pulse" /> DEMO NETWORK</span>
              </div>
              <div className="flow-visual-grid">
                <div className="flow-visual-side">
                  <div className="flow-node flow-node-muted">
                    <div className="flow-node-icon"><PackageCheck size={20} /></div>
                    <div><span className="micro-label">01 / ORIGIN</span><strong>Household</strong><small>Sorted at source</small></div>
                  </div>
                  <div className="flow-node flow-node-active">
                    <div className="flow-node-icon"><MapPin size={20} /></div>
                    <div><span className="micro-label">02 / HANDOFF</span><strong>Collector</strong><small>Route 07 · on the move</small></div>
                  </div>
                </div>
                <div className="flow-orbit">
                  <svg className="orbit-lines" viewBox="0 0 280 390" fill="none" aria-hidden="true">
                    <path d="M140 20V370" stroke="rgba(223,252,242,0.18)" strokeDasharray="3 7" />
                    <path d="M25 101C25 101 83 127 140 127C197 127 255 101 255 101" stroke="#10b981" strokeWidth="1.6" strokeDasharray="4 7" />
                    <path d="M25 286C25 286 83 260 140 260C197 260 255 286 255 286" stroke="#0284c7" strokeWidth="1.6" strokeDasharray="4 7" />
                    <circle cx="140" cy="194" r="75" stroke="rgba(223,252,242,0.16)" />
                    <circle cx="140" cy="194" r="46" stroke="rgba(16,185,129,0.32)" strokeDasharray="2 6" />
                    <circle cx="140" cy="194" r="7" fill="#62e0b4" />
                    <circle cx="140" cy="194" r="12" stroke="#62e0b4" strokeOpacity="0.3" />
                  </svg>
                  <div className="orbit-label orbit-label-top"><Check size={12} /> VERIFIED</div>
                  <div className="orbit-center"><FlowMark size={39} dark /><span>EC-1048</span></div>
                  <div className="orbit-label orbit-label-bottom"><ScanLine size={12} /> CHAIN OF CUSTODY</div>
                </div>
                <div className="flow-visual-side flow-visual-side-right">
                  <div className="flow-node flow-node-active">
                    <div className="flow-node-icon"><Recycle size={20} /></div>
                    <div><span className="micro-label">03 / DESTINATION</span><strong>Recycling hub</strong><small>Eastside · Bay 02</small></div>
                  </div>
                  <div className="flow-node flow-node-muted">
                    <div className="flow-node-icon"><CircleCheck size={20} /></div>
                    <div><span className="micro-label">04 / OUTCOME</span><strong>Recycled</strong><small>Recovery confirmed</small></div>
                  </div>
                </div>
              </div>
              <div className="visual-footer">
                <span><span className="micro-label">MATERIAL</span> PET PLASTIC</span>
                <span><span className="micro-label">VERIFIED WEIGHT</span> 4.70 KG</span>
                <span><span className="micro-label">STATUS</span> <b>RECYCLED</b></span>
              </div>
            </div>
          </div>
          <div className="hero-foot page-shell">
            <span>Designed for accountable cities</span>
            <span className="scroll-cue"><span /> Scroll to follow the material</span>
            <span>01 — 06</span>
          </div>
        </section>

        <section className="problem-section page-shell" id="problem">
          <div className="problem-intro">
            <SectionKicker>01 / THE PROBLEM</SectionKicker>
            <h2>Waste doesn't disappear when it leaves your hands.</h2>
          </div>
          <div className="problem-body">
            <p className="lead-paragraph">When recyclable material leaves a home or business, its story often stops there. Collection gaps, mixed waste and informal dumping erase the value inside the material — and the visibility around it.</p>
            <div className="problem-list">
              <div><span>01</span><p>Recyclables mixed with general waste</p></div>
              <div><span>02</span><p>Weak traceability after collection</p></div>
              <div><span>03</span><p>Recovery value lost between handoffs</p></div>
            </div>
          </div>
        </section>

        <section className="works-section" id="how-it-works">
          <div className="page-shell">
            <div className="section-heading-row">
              <div><SectionKicker>02 / HOW ECOVA WORKS</SectionKicker><h2>A record at every handoff.</h2></div>
              <p>Each stage turns an invisible movement into a verifiable event — from the first sort to the final measure.</p>
            </div>
            <div className="stage-grid">
              {([
                ["01", "SORT", "Identify recyclable material.", PackageCheck],
                ["02", "REQUEST", "Schedule a local collection.", Clock3],
                ["03", "VERIFY", "Record the actual weight.", ScanLine],
                ["04", "REWARD", "Receive ECO credits.", Sparkles],
                ["05", "RECYCLE", "Track the material to destination.", Recycle],
                ["06", "MEASURE", "Understand the environmental impact.", CircleCheck],
              ] as [string, string, string, LucideIcon][]).map(([number, title, detail, StageIcon], index) => {
                return <div className={`stage-item stage-item-${index + 1}`} key={number}>
                  <div className="stage-number">{number}</div>
                  <div className="stage-icon"><StageIcon size={19} /></div>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                  {index < 5 && <div className="stage-connector" aria-hidden="true"><ArrowRight size={14} /></div>}
                </div>;
              })}
            </div>
          </div>
        </section>

        <section className="material-section page-shell" id="material-flow">
          <div className="section-heading-row material-heading">
            <div><SectionKicker>03 / FOLLOW THE MATERIAL</SectionKicker><h2>Your waste has a receipt.</h2></div>
            <div className="material-heading-side"><span className="id-chip">EC-1048</span><span>PET PLASTIC · 4.70 KG</span></div>
          </div>
          <div className="material-layout">
            <div className="timeline-panel">
              <div className="timeline-line" />
              {flowEvents.map((event, index) => (
                <button className={`timeline-event ${activeEvent === index ? "timeline-event-active" : ""}`} key={event.label} onClick={() => setActiveEvent(index)}>
                  <span className={`timeline-dot timeline-dot-${event.tone}`} />
                  <span className="timeline-copy"><span className="timeline-label">{event.label}</span><strong>{event.title}</strong><small>{event.time}</small></span>
                  {activeEvent === index && <ArrowRight className="timeline-arrow" size={17} />}
                </button>
              ))}
            </div>
            <div className="passport-panel">
              <div className="passport-gridmark"><FlowMark size={42} dark /></div>
              <div className="passport-topline"><span>IMPACT PASSPORT</span><span className="passport-check"><Check size={12} /> VERIFIED</span></div>
              <div className="passport-id">{flowEvents[activeEvent].label.split(" / ")[1]}<br /><span>EC-1048</span></div>
              <div className="passport-detail"><span>ACTIVE EVENT</span><strong>{flowEvents[activeEvent].title}</strong><p>{flowEvents[activeEvent].detail}</p></div>
              <div className="passport-meta"><div><span>COLLECTOR</span><b>M. OKAFOR</b></div><div><span>DESTINATION</span><b>EASTSIDE HUB</b></div></div>
              <div className="passport-footer"><span>CHAIN INTEGRITY</span><span className="integrity"><i /> 100%</span></div>
            </div>
          </div>
        </section>

        <section className="impact-section" id="impact">
          <div className="page-shell">
            <div className="impact-header"><div><SectionKicker dark>04 / DEMO IMPACT</SectionKicker><h2>Make recovery<br /><em>measurable.</em></h2></div><p>Demo data only — a glimpse of the accountability Ecova is designed to create across a connected recovery network.</p></div>
            <div className="metric-grid">
              <div className="metric-card metric-feature"><span className="metric-label">MATERIAL RECOVERED</span><strong>342.0 <small>KG</small></strong><div className="metric-rule"><span style={{ width: "72%" }} /></div><span className="metric-foot">Across verified collection events</span></div>
              <div className="metric-card"><span className="metric-label">EST. CO₂e AVOIDED</span><strong>89.5 <small>KG</small></strong><span className="metric-foot">Calculated from demo material mix</span></div>
              <div className="metric-card"><span className="metric-label">VERIFIED COLLECTIONS</span><strong>27</strong><span className="metric-foot">Events with recorded handoffs</span></div>
              <div className="metric-card"><span className="metric-label">ECO EARNED</span><strong>1,450</strong><span className="metric-foot">Demo credits issued</span></div>
            </div>
            <div className="impact-note"><span className="impact-note-mark" /> DEMO DATA · NOT LIVE ECOVA PLATFORM STATISTICS</div>
          </div>
        </section>

        <section className="rewards-section page-shell" id="collectors">
          <div className="rewards-aside"><SectionKicker>05 / VERIFIED REWARDS</SectionKicker><div className="reward-orbit"><div className="reward-orbit-inner"><Sparkles size={22} /><span>ECO</span></div><span className="reward-arc reward-arc-one" /><span className="reward-arc reward-arc-two" /></div></div>
          <div className="rewards-copy"><h2>Good material<br />should return <em>value.</em></h2><p>Verified recyclable material can generate ECO rewards. The final reward is based on the weight recorded in the real world — not an AI estimate.</p><div className="reward-equation"><div><span>01.00 KG</span><small>VERIFIED MATERIAL</small></div><ArrowRight size={24} /><div className="equation-result"><span>+ ECO</span><small>REWARD ISSUED</small></div></div><p className="future-note"><span>FUTURE REDEMPTION</span> Mobile data · electricity · cash · partner rewards</p></div>
        </section>

        <section className="vision-section">
          <div className="page-shell vision-grid"><div><SectionKicker>06 / THE LONG VIEW</SectionKicker><h2>Built for one city.<br /><em>Designed for every city.</em></h2></div><div className="vision-copy"><p>Ecova starts with the local handoffs that are easiest to lose — then builds a system that can move with the city. A shared language for generators, collectors, hubs and recyclers wherever infrastructure is fragmented.</p><div className="vision-route"><span>LOCAL PILOT</span><div className="route-line"><i /><i /><i /><i /></div><span>CONNECTED CITIES</span></div></div></div>
        </section>

        <section className="final-section page-shell">
          <div className="final-mark"><FlowMark size={55} /></div>
          <SectionKicker>READY WHEN YOU ARE</SectionKicker>
          <h2>Ready to give your waste<br /><em>a destination?</em></h2>
          <div className="final-actions"><button className="button button-primary" onClick={handlePickup}>Start recovering value <ArrowUpRight size={17} /></button><button className="text-link" onClick={handleNetwork}>Explore the collection network <ExternalLink size={15} /></button></div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-shell footer-grid"><a className="brand brand-footer" href="#top"><FlowMark size={29} /><span>ecova</span></a><p>Waste should not become invisible<br />when it leaves someone's hands.</p><div className="footer-meta"><span>© 2026 ECOVA MVP</span><span>VERIFIED MATERIAL FLOW</span></div></div>
      </footer>
    </div>
  );
}

export default Home;
