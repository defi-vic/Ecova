import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export type PickupStatus = "REQUESTED" | "ASSIGNED" | "ARRIVED" | "COLLECTED" | "VERIFIED" | "DELIVERED" | "AT HUB" | "RECYCLED";
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
  imageUrl?: string;
  proofImageUrl?: string;
  aiConfidence?: number;
  aiNotes?: string;
  contaminationEstimate?: string;
  events: { id: number; type: string; actorRole: string | null; actor: string | null; metadata: Record<string, unknown>; createdAt: string }[];
};

type RewardTransaction = { id: string; amount: number; pickupId: string; item: string; date: string; negative?: boolean };
type ImpactMetrics = { totalDiverted: number; plasticDiverted: number; verifiedCollections: number; co2e: number; facilities: number };
type CreatePickupInput = { material: string; estimatedWeight: number; location: string; pickupWindow: string; imageData?: string; detectedMaterial?: string; aiConfidence?: number | null; aiNotes?: string; contaminationEstimate?: string };
type ClassificationResult = { detectedMaterial: string; confidence: number | null; contaminationEstimate: string; estimatedWeight: number; isFallback: boolean; notes: string };
type EcovaDataContextValue = {
  pickups: SharedPickup[];
  balance: number;
  transactions: RewardTransaction[];
  collectorEarnings: RewardTransaction[];
  impact: ImpactMetrics;
  collectorOnline: boolean;
  notifications: string[];
  dataLoading: boolean;
  dataError?: string;
  syncStatus: "loading" | "live" | "degraded";
  isMutating: boolean;
  setCollectorOnline: (online: boolean) => Promise<void>;
  classifyWaste: (imageData: string | undefined, estimatedWeight: number, selectedMaterial: string) => Promise<ClassificationResult>;
  createPickup: (input: CreatePickupInput) => Promise<string>;
  acceptPickup: (id: string) => Promise<void>;
  markArrived: (id: string) => Promise<void>;
  markCollected: (id: string) => Promise<void>;
  verifyWeight: (id: string, weight: number, condition: MaterialCondition, proofImageData?: string, notes?: string) => Promise<{ rewardAmount: number }>;
  deliverToHub: (id: string) => Promise<void>;
  confirmRecycling: (id: string) => Promise<void>;
  redeemReward: (amount: number) => Promise<void>;
};

const seedPickups: SharedPickup[] = [
  { id: "EC-1048", date: "12 SEP", material: "PET Plastic", weight: "4.70 KG", estimatedWeight: 5, verifiedWeight: 4.7, collector: "Daniel O.", status: "RECYCLED", pickupWindow: "14:00 – 16:00", location: "Eastside collection zone", reward: 470, condition: "Clean", verifiedAt: "12 SEP · 14:38", events: [] },
  { id: "EC-1042", date: "09 SEP", material: "Cardboard", weight: "8.20 KG", estimatedWeight: 8.5, verifiedWeight: 8.2, collector: "M. Okafor", status: "RECYCLED", pickupWindow: "10:00 – 12:00", location: "North district", reward: 820, condition: "Mostly clean", verifiedAt: "09 SEP · 12:18", events: [] },
  { id: "EC-1038", date: "04 SEP", material: "PET Plastic", weight: "3.10 KG", estimatedWeight: 3.5, verifiedWeight: 3.1, collector: "Daniel O.", status: "RECYCLED", pickupWindow: "16:00 – 18:00", location: "Ikeja zone 02", reward: 310, condition: "Clean", verifiedAt: "04 SEP · 16:44", events: [] },
];
const seedTransactions: RewardTransaction[] = [
  { id: "TX-1048", amount: 470, pickupId: "EC-1048", item: "PET Plastic · Verified collection", date: "13 SEP 2026" },
  { id: "TX-1042", amount: 820, pickupId: "EC-1042", item: "Cardboard · Verified collection", date: "10 SEP 2026" },
  { id: "TX-004", amount: -500, pickupId: "REDEEM-004", item: "Mobile Data · Prototype redemption", date: "08 SEP 2026", negative: true },
];
const seedImpact: ImpactMetrics = { totalDiverted: 342, plasticDiverted: 216.4, verifiedCollections: 27, co2e: 89.5, facilities: 3 };

function getSessionKey(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const existing = window.sessionStorage.getItem(name);
  if (existing) return existing;
  const generated = `${fallback}-${crypto.randomUUID()}`;
  window.sessionStorage.setItem(name, generated);
  return generated;
}

const EcovaDataContext = createContext<EcovaDataContextValue | null>(null);

export function EcovaDataProvider({ children }: { children: React.ReactNode }) {
  const generatorSessionKey = useMemo(() => getSessionKey("ecova-generator-session", "ecova-generator"), []);
  const collectorSessionKey = useMemo(() => getSessionKey("ecova-collector-session", "ecova-collector"), []);
  const utils = trpc.useUtils();
  const generatorQuery = trpc.ecova.generatorState.useQuery({ generatorSessionKey, collectorSessionKey }, { refetchInterval: 3000, staleTime: 1000 });
  const collectorQuery = trpc.ecova.collectorState.useQuery({ collectorSessionKey, generatorSessionKey }, { refetchInterval: 3000, staleTime: 1000 });
  const [notifications, setNotifications] = useState<string[]>([]);
  const classifyMutation = trpc.ecova.classifyWaste.useMutation();
  const createMutation = trpc.ecova.createPickup.useMutation();
  const availabilityMutation = trpc.ecova.setCollectorAvailability.useMutation();
  const acceptMutation = trpc.ecova.acceptPickup.useMutation();
  const arriveMutation = trpc.ecova.markArrived.useMutation();
  const collectMutation = trpc.ecova.markCollected.useMutation();
  const verifyMutation = trpc.ecova.verifyWeight.useMutation();
  const hubMutation = trpc.ecova.deliverToHub.useMutation();
  const recycleMutation = trpc.ecova.confirmRecycling.useMutation();
  const redeemMutation = trpc.ecova.redeemReward.useMutation();
  const notify = (message: string) => setNotifications((current) => [message, ...current].slice(0, 6));
  const sync = async () => { await Promise.all([utils.ecova.generatorState.invalidate(), utils.ecova.collectorState.invalidate()]); };
  const handleError = (error: unknown) => { const message = error instanceof Error ? error.message : "The action could not be synchronized."; toast.error(message); throw error; };

  useEffect(() => {
    const error = generatorQuery.error ?? collectorQuery.error;
    if (error) toast.error(error.message || "Ecova data could not be loaded.");
  }, [generatorQuery.error, collectorQuery.error]);

  const classifyWaste = async (imageData: string | undefined, estimatedWeight: number, selectedMaterial: string) => {
    try { return await classifyMutation.mutateAsync({ imageData, estimatedWeight, selectedMaterial }); } catch (error) { return handleError(error) as never; }
  };
  const createPickup = async (input: CreatePickupInput) => {
    try {
      const result = await createMutation.mutateAsync({ ...input, generatorSessionKey, collectorSessionKey });
      await sync();
      notify(`NEW PICKUP REQUEST · ${result.pickupCode}`);
      return result.pickupCode;
    } catch (error) { return handleError(error) as never; }
  };
  const setCollectorOnline = async (online: boolean) => { try { await availabilityMutation.mutateAsync({ collectorSessionKey, online }); await sync(); } catch (error) { handleError(error); } };
  const acceptPickup = async (id: string) => { try { await acceptMutation.mutateAsync({ collectorSessionKey, pickupCode: id }); await sync(); notify(`PICKUP ASSIGNED · ${id}`); } catch (error) { handleError(error); } };
  const markArrived = async (id: string) => { try { await arriveMutation.mutateAsync({ collectorSessionKey, pickupCode: id }); await sync(); notify(`COLLECTOR ARRIVED · ${id}`); } catch (error) { handleError(error); } };
  const markCollected = async (id: string) => { try { await collectMutation.mutateAsync({ collectorSessionKey, pickupCode: id }); await sync(); notify(`MATERIAL COLLECTED · ${id}`); } catch (error) { handleError(error); } };
  const verifyWeight = async (id: string, weight: number, condition: MaterialCondition, proofImageData?: string, notes?: string) => {
    if (!Number.isFinite(weight) || weight <= 0) throw new Error("Enter a verified weight greater than zero.");
    try { const result = await verifyMutation.mutateAsync({ collectorSessionKey, pickupCode: id, verifiedWeight: weight, materialCondition: condition, proofImageData, notes }); await sync(); notify(`WEIGHT VERIFIED · ${id} · ${weight.toFixed(2)} KG · +${result.rewardAmount} ECO`); return { rewardAmount: result.rewardAmount }; } catch (error) { return handleError(error) as never; }
  };
  const deliverToHub = async (id: string) => { try { await hubMutation.mutateAsync({ collectorSessionKey, pickupCode: id }); await sync(); notify(`HUB RECEIVED · ${id}`); } catch (error) { handleError(error); } };
  const confirmRecycling = async (id: string) => { try { await recycleMutation.mutateAsync({ collectorSessionKey, pickupCode: id }); await sync(); notify(`RECYCLING CONFIRMED · ${id}`); } catch (error) { handleError(error); } };
  const redeemReward = async (amount: number) => { try { await redeemMutation.mutateAsync({ generatorSessionKey, amount }); await sync(); } catch (error) { handleError(error); } };

  const generatorState = generatorQuery.data;
  const collectorState = collectorQuery.data;
  const value: EcovaDataContextValue = {
    pickups: (generatorState?.pickups ?? []).map((pickup) => ({ ...pickup, status: pickup.status as PickupStatus })),
    balance: generatorState?.balance ?? 0,
    transactions: generatorState?.transactions ?? [],
    collectorEarnings: collectorState?.earnings ?? [],
    impact: generatorState?.impact ?? seedImpact,
    collectorOnline: collectorState?.collector.availabilityStatus === "OFFLINE" ? false : true,
    notifications,
    dataLoading: generatorQuery.isLoading || collectorQuery.isLoading,
    dataError: generatorQuery.error?.message ?? collectorQuery.error?.message,
    syncStatus: generatorQuery.isLoading || collectorQuery.isLoading ? "loading" : generatorQuery.error || collectorQuery.error ? "degraded" : "live",
    isMutating: [classifyMutation, createMutation, availabilityMutation, acceptMutation, arriveMutation, collectMutation, verifyMutation, hubMutation, recycleMutation, redeemMutation].some((mutation) => mutation.isPending),
    setCollectorOnline,
    classifyWaste,
    createPickup,
    acceptPickup,
    markArrived,
    markCollected,
    verifyWeight,
    deliverToHub,
    confirmRecycling,
    redeemReward,
  };
  return <EcovaDataContext.Provider value={value}>{children}</EcovaDataContext.Provider>;
}

export function useEcovaData() {
  const value = useContext(EcovaDataContext);
  if (!value) throw new Error("useEcovaData must be used inside EcovaDataProvider");
  return value;
}
