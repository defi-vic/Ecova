import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type PickupStatus = "REQUESTED" | "ASSIGNED" | "ARRIVED" | "COLLECTED" | "AT HUB" | "RECYCLED";
export type MaterialCondition = "Clean" | "Mostly clean" | "Mixed" | "Contaminated";

export type SharedPickup = {
  id: string;
  date: string;
  material: string;
  weight: string;
  estimatedWeight: number;
  verifiedWeight?: number;
  collector: string;
  status: PickupStatus;
  estimated?: string;
  pickupWindow: string;
  location: string;
  reward: number;
  condition?: MaterialCondition;
  arrivedAt?: string;
  verifiedAt?: string;
};

type RewardTransaction = { id: string; amount: number; pickupId: string; item: string; date: string; negative?: boolean };
type ImpactMetrics = { totalDiverted: number; plasticDiverted: number; verifiedCollections: number; co2e: number; facilities: number };

type CreatePickupInput = { material: string; estimatedWeight: number; location: string; pickupWindow: string };
type EcovaDataContextValue = {
  pickups: SharedPickup[];
  balance: number;
  transactions: RewardTransaction[];
  impact: ImpactMetrics;
  collectorOnline: boolean;
  notifications: string[];
  setCollectorOnline: (online: boolean) => void;
  createPickup: (input: CreatePickupInput) => string;
  acceptPickup: (id: string) => void;
  markArrived: (id: string) => void;
  markCollected: (id: string) => void;
  verifyWeight: (id: string, weight: number, condition: MaterialCondition) => void;
  redeemReward: (amount: number) => void;
};

const seedPickups: SharedPickup[] = [
  { id: "EC-1048", date: "12 SEP", material: "PET Plastic", weight: "4.70 KG", estimatedWeight: 5, verifiedWeight: 4.7, collector: "Daniel O.", status: "RECYCLED", pickupWindow: "14:00 – 16:00", location: "Eastside collection zone", reward: 470, condition: "Clean", verifiedAt: "12 SEP · 14:38" },
  { id: "EC-1042", date: "09 SEP", material: "Cardboard", weight: "8.20 KG", estimatedWeight: 8.5, verifiedWeight: 8.2, collector: "M. Okafor", status: "RECYCLED", pickupWindow: "10:00 – 12:00", location: "North district", reward: 820, condition: "Mostly clean", verifiedAt: "09 SEP · 12:18" },
  { id: "EC-1038", date: "04 SEP", material: "PET Plastic", weight: "3.10 KG", estimatedWeight: 3.5, verifiedWeight: 3.1, collector: "Daniel O.", status: "RECYCLED", pickupWindow: "16:00 – 18:00", location: "Ikeja zone 02", reward: 310, condition: "Clean", verifiedAt: "04 SEP · 16:44" },
];

const seedTransactions: RewardTransaction[] = [
  { id: "TX-1048", amount: 470, pickupId: "EC-1048", item: "PET Plastic · Verified collection", date: "13 SEP 2026" },
  { id: "TX-1042", amount: 820, pickupId: "EC-1042", item: "Cardboard · Verified collection", date: "10 SEP 2026" },
  { id: "TX-004", amount: -500, pickupId: "REDEEM-004", item: "Mobile Data · Prototype redemption", date: "08 SEP 2026", negative: true },
];

const initialImpact: ImpactMetrics = { totalDiverted: 342, plasticDiverted: 216.4, verifiedCollections: 27, co2e: 89.5, facilities: 3 };
const STORAGE_KEY = "ecova-demo-material-flow-v1";

function loadInitial() {
  if (typeof window === "undefined") return { pickups: seedPickups, balance: 1450, transactions: seedTransactions, impact: initialImpact };
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* fall back to seeded demo data */ }
  return { pickups: seedPickups, balance: 1450, transactions: seedTransactions, impact: initialImpact };
}

const EcovaDataContext = createContext<EcovaDataContextValue | null>(null);

export function EcovaDataProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(loadInitial, []);
  const [pickups, setPickups] = useState<SharedPickup[]>(initial.pickups);
  const [balance, setBalance] = useState<number>(initial.balance);
  const [transactions, setTransactions] = useState<RewardTransaction[]>(initial.transactions);
  const [impact, setImpact] = useState<ImpactMetrics>(initial.impact);
  const [collectorOnline, setCollectorOnline] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ pickups, balance, transactions, impact }));
  }, [pickups, balance, transactions, impact]);

  const notify = (message: string) => setNotifications((current) => [message, ...current].slice(0, 5));
  const updatePickup = (id: string, update: Partial<SharedPickup>) => setPickups((current) => current.map((pickup) => pickup.id === id ? { ...pickup, ...update } : pickup));

  const createPickup = (input: CreatePickupInput) => {
    const existingNumbers = pickups.map((pickup) => Number(pickup.id.replace("EC-", ""))).filter(Number.isFinite);
    const nextNumber = Math.max(1050, ...existingNumbers) + 1;
    const id = `EC-${nextNumber}`;
    const pickup: SharedPickup = { id, date: "TODAY", material: input.material, weight: `${input.estimatedWeight.toFixed(1)} KG EST.`, estimated: `${input.estimatedWeight.toFixed(1)} KG EST.`, estimatedWeight: input.estimatedWeight, collector: "Matching in progress", status: "REQUESTED", pickupWindow: input.pickupWindow, location: input.location, reward: 0 };
    setPickups((current) => [pickup, ...current]);
    notify(`NEW PICKUP REQUEST · ${id} · ${input.material} · ${input.estimatedWeight.toFixed(1)} KG`);
    return id;
  };

  const acceptPickup = (id: string) => { updatePickup(id, { status: "ASSIGNED", collector: "Demo Collector" }); notify(`PICKUP ASSIGNED · ${id}`); };
  const markArrived = (id: string) => { updatePickup(id, { status: "ARRIVED", arrivedAt: "17 SEP · 14:32" }); notify(`COLLECTOR ARRIVED · ${id}`); };
  const markCollected = (id: string) => { updatePickup(id, { status: "COLLECTED" }); notify(`MATERIAL COLLECTED · ${id}`); };
  const verifyWeight = (id: string, verifiedWeight: number, condition: MaterialCondition) => {
    const pickup = pickups.find((item) => item.id === id);
    if (!pickup) return;
    const reward = Math.round(verifiedWeight * 100);
    updatePickup(id, { status: "COLLECTED", verifiedWeight, weight: `${verifiedWeight.toFixed(2)} KG`, reward, condition, verifiedAt: "17 SEP · 14:38" });
    setBalance((current) => current + reward);
    setTransactions((current) => [{ id: `TX-${id.replace("EC-", "")}`, amount: reward, pickupId: id, item: `${pickup.material} · ${verifiedWeight.toFixed(2)} KG verified`, date: "17 SEP 2026" }, ...current]);
    setImpact((current) => ({ ...current, totalDiverted: Number((current.totalDiverted + verifiedWeight).toFixed(1)), plasticDiverted: pickup.material.toLowerCase().includes("plastic") ? Number((current.plasticDiverted + verifiedWeight).toFixed(1)) : current.plasticDiverted, verifiedCollections: current.verifiedCollections + 1, co2e: Number((current.co2e + verifiedWeight * 0.19).toFixed(1)) }));
    notify(`WEIGHT VERIFIED · ${id} · ${verifiedWeight.toFixed(2)} KG · +${reward} ECO`);
  };
  const redeemReward = (amount: number) => { setBalance((current) => current - amount); setTransactions((current) => [{ id: `TX-REDEEM-${Date.now()}`, amount: -amount, pickupId: "REDEEM-DEMO", item: "Mobile Data · Prototype redemption", date: "TODAY", negative: true }, ...current]); };

  const value = { pickups, balance, transactions, impact, collectorOnline, notifications, setCollectorOnline, createPickup, acceptPickup, markArrived, markCollected, verifyWeight, redeemReward };
  return <EcovaDataContext.Provider value={value}>{children}</EcovaDataContext.Provider>;
}

export function useEcovaData() {
  const value = useContext(EcovaDataContext);
  if (!value) throw new Error("useEcovaData must be used inside EcovaDataProvider");
  return value;
}
