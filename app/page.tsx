
"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";

type Condition = "new" | "used" | "refurbished";

type AgentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

interface ShoppingRequest {
  productName: string;
  model?: string;
  storage?: string;
  condition: Condition;
  country: string;
  currency?: string;
}

interface VerifiedOffer {
  productName: string;
  sellerName: string | null;
  productUrl: string;
  price: number | null;
  currency: string | null;
  shippingCost: number | null;
  condition: string | null;
  availability: string | null;
  verificationStatus:
    | "verified"
    | "partially_verified"
    | "unverified";
  evidence: string[];
  riskFlags: string[];
}

interface ShoppingResearch {
  id: string;
  request: ShoppingRequest;
  products: unknown[];
  offers: unknown[];
  rankedOffers: unknown[];
  verifiedOffers: VerifiedOffer[];
  agentStatus: Record<string, AgentStatus>;
  analysisSummary: string | null;
  verificationSummary: string | null;
  finalReport: string | null;
  errors: string[];
  completed: boolean;
}

interface Research {
  _id: string;
  topic: string;
  status: "pending" | "processing" | "completed" | "failed";
  summary: string;
  sources: {
    title: string;
    url: string;
  }[];
  createdAt: string;
}

interface ShoppingHistoryItem {
  id: string;
  request: ShoppingRequest;
  agentStatus: Record<string, AgentStatus>;
  verifiedOffers: VerifiedOffer[];
  finalReport: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

const agents = [
  { key: "productScout", label: "Product Scout", icon: "🔎" },
  { key: "priceExtractor", label: "Price Extractor", icon: "💰" },
  { key: "priceAnalyst", label: "Price Analyst", icon: "📊" },
  { key: "verificationAgent", label: "Verification Agent", icon: "🛡️" },
  { key: "reportAgent", label: "Report Agent", icon: "📝" },
];

const statusStyles: Record<string, string> = {
  pending: "bg-gray-100 text-gray-500",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  verified: "bg-emerald-100 text-emerald-700",
  partially_verified: "bg-amber-100 text-amber-700",
  unverified: "bg-gray-100 text-gray-600",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        statusStyles[status] || statusStyles.pending
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export default function Home() {
  const [form, setForm] = useState<ShoppingRequest>({
    productName: "",
    model: "",
    storage: "",
    condition: "new",
    country: "Somalia",
    currency: "USD",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeResearchId, setActiveResearchId] = useState("");
  const [activeResearch, setActiveResearch] =
    useState<ShoppingResearch | null>(null);

  const [researches, setResearches] = useState<Research[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  const [shoppingHistory, setShoppingHistory] =
  useState<ShoppingHistoryItem[]>([]);

  const updateForm = <K extends keyof ShoppingRequest>(
    field: K,
    value: ShoppingRequest[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Load legacy research history
  const fetchResearches = useCallback(async () => {
    try {
      setFetchingHistory(true);
      const response = await axios.get("/api/research");
      setResearches(response.data.researches || []);
    } catch (err) {
      console.error("History error:", err);
    } finally {
      setFetchingHistory(false);
    }
  }, []);

  // Load shopping-agent research history
  const fetchShoppingHistory = useCallback(async () => {
    try {
      const response = await axios.get("/api/shopping-research");
      setShoppingHistory(response.data.researches || []);
    } catch (err) {
      console.error("Failed to fetch shopping history:", err);
    }
  }, []);

  // Load both histories once, with stable callback dependencies
  useEffect(() => {
    void fetchResearches();
    void fetchShoppingHistory();
  }, [fetchResearches, fetchShoppingHistory]);

  // Poll active shopping research
  useEffect(() => {
    if (!activeResearchId) return;

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const pollResearch = async () => {
      try {
        const response = await axios.get(
          `/api/shopping-research/${activeResearchId}`
        );

        if (cancelled) return;

        const research: ShoppingResearch =
          response.data.research;

        setActiveResearch(research);

        if (!research.completed) {
          timeout = setTimeout(pollResearch, 4000);
        } else {
          void fetchResearches();
          void fetchShoppingHistory();
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Research polling error:", err);
          timeout = setTimeout(pollResearch, 6000);
        }
      }
    };

    pollResearch();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [activeResearchId, fetchResearches, fetchShoppingHistory]);

  const handleResearch = async () => {
    if (!form.productName.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (!form.country.trim()) {
      setError("Please enter your country.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");
      setActiveResearch(null);

      const response = await axios.post(
        "/api/shopping-research",
        {
          ...form,
          productName: form.productName.trim(),
        }
      );

      const researchId = response.data.researchId;

      setActiveResearchId(researchId);
      setMessage("Your shopping research has started.");

      setForm((previous) => ({
        ...previous,
        productName: "",
        model: "",
        storage: "",
      }));
    } catch (err) {
      console.error("Shopping research error:", err);
      setError("Could not start research. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const completedAgents = activeResearch
    ? Object.values(activeResearch.agentStatus || {}).filter(
        (status) => status === "completed"
      ).length
    : 0;

  const progress = activeResearch
    ? Math.round((completedAgents / agents.length) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-6 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-200">
              ✦
            </div>
            <div>
              <h1 className="font-bold tracking-tight">
                ResearchAI
              </h1>
              <p className="text-xs text-slate-400">
                Shopping Intelligence
              </p>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            <a
              href="#dashboard"
              className="flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700"
            >
              <span>▦</span>
              Dashboard
            </a>

            <a
              href="#research"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span>⌕</span>
              Product Research
            </a>

            <a
              href="#history"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span>◷</span>
              Research History
            </a>
          </nav>

          <div className="mt-auto rounded-2xl bg-slate-900 p-4 text-white">
            <p className="text-sm font-semibold">
              AI-powered research
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Compare products, analyze prices, and review seller evidence.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">

          {/* Header */}
          <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
                  Shopping Research Workspace
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                  Research Dashboard
                </h2>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                  Multi-Agent System
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                  AI
                </div>
              </div>
            </div>
          </header>

          <div
            id="dashboard"
            className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8"
          >

            {/* Welcome */}
            <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-100 sm:p-8">
              <div className="relative z-10 max-w-2xl">
                <p className="text-sm font-medium text-indigo-100">
                  Welcome to your research workspace
                </p>

                <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
                  Make smarter shopping decisions.
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                  Search products, compare available offers, and review
                  seller evidence with your AI research agents.
                </p>

                <a
                  href="#research"
                  className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                >
                  Start product research →
                </a>
              </div>
            </section>

            {/* Overview cards */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Research History
                </p>
                <p className="mt-3 text-3xl font-bold">
                  {shoppingHistory.length}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Previous research records
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Active Research
                </p>
                <p className="mt-3 text-3xl font-bold">
                  {activeResearch && !activeResearch.completed
                    ? "1"
                    : "0"}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Current workflow
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Offers Found
                </p>
                <p className="mt-3 text-3xl font-bold">
                  {activeResearch?.verifiedOffers?.length || 0}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Offers in current research
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Agent Progress
                </p>
                <p className="mt-3 text-3xl font-bold">
                  {progress}%
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Current workflow completion
                </p>
              </div>
            </section>

            {/* Research form */}
            <section
              id="research"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
            >
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                    🔍
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      New Product Research
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Enter product details to begin your analysis.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Product name *
                  </label>
                  <input
                    value={form.productName}
                    onChange={(e) =>
                      updateForm("productName", e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !loading) {
                        handleResearch();
                      }
                    }}
                    placeholder="e.g. iPhone 15"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Model
                  </label>
                  <input
                    value={form.model}
                    onChange={(e) =>
                      updateForm("model", e.target.value)
                    }
                    placeholder="Specific model (optional)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Storage / Variant
                  </label>
                  <input
                    value={form.storage}
                    onChange={(e) =>
                      updateForm("storage", e.target.value)
                    }
                    placeholder="e.g. 128GB"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Condition
                  </label>
                  <select
                    value={form.condition}
                    onChange={(e) =>
                      updateForm("condition", e.target.value as Condition)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="new">Brand new</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Country *
                  </label>
                  <input
                    value={form.country}
                    onChange={(e) =>
                      updateForm("country", e.target.value)
                    }
                    placeholder="e.g. Somalia"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) =>
                      updateForm("currency", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="USD">USD — US Dollar</option>
                    <option value="SOS">SOS — Somali Shilling</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="TRY">TRY — Turkish Lira</option>
                    <option value="AED">AED — UAE Dirham</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              {message && (
                <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                  {message}
                </div>
              )}

              <button
                onClick={handleResearch}
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? "Starting research..." : "Start AI Research"}
                {!loading && <span>→</span>}
              </button>
            </section>

            {/* Agent progress */}
            {activeResearch && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      Live Workflow
                    </p>
                    <h2 className="mt-2 text-xl font-bold">
                      {activeResearch.request.productName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Your research agents are processing the request.
                    </p>
                  </div>

                  <StatusBadge
                    status={
                      activeResearch.completed
                        ? "completed"
                        : "processing"
                    }
                  />
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">
                      Workflow progress
                    </span>
                    <span className="text-indigo-600">
                      {progress}%
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {agents.map((agent) => {
                    const status =
                      activeResearch.agentStatus[agent.key] ||
                      "pending";

                    return (
                      <div
                        key={agent.key}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="text-xl">
                          {agent.icon}
                        </div>
                        <p className="mt-3 text-sm font-semibold">
                          {agent.label}
                        </p>
                        <div className="mt-3">
                          <StatusBadge status={status} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Verified offers */}
                {activeResearch.verifiedOffers?.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold">
                      Research Offers
                    </h3>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {activeResearch.verifiedOffers.map(
                        (offer, index) => (
                          <article
                            key={`${offer.productUrl}-${index}`}
                            className="rounded-2xl border border-slate-200 p-5 transition hover:border-indigo-200 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-semibold">
                                  {offer.productName}
                                </h4>
                                <p className="mt-1 text-sm text-slate-500">
                                  {offer.sellerName ||
                                    "Seller not identified"}
                                </p>
                              </div>

                              <StatusBadge
                                status={offer.verificationStatus}
                              />
                            </div>

                            <p className="mt-5 text-2xl font-bold text-indigo-700">
                              {offer.price !== null
                                ? `${offer.currency || ""} ${offer.price}`
                                : "Price unavailable"}
                            </p>

                            {offer.shippingCost !== null && (
                              <p className="mt-1 text-xs text-slate-500">
                                Shipping: {offer.shippingCost}
                              </p>
                            )}

                            {offer.availability && (
                              <p className="mt-2 text-sm text-slate-500">
                                Availability: {offer.availability}
                              </p>
                            )}

                            {offer.riskFlags?.length > 0 && (
                              <p className="mt-3 text-xs text-amber-700">
                                Risk flags: {offer.riskFlags.join(", ")}
                              </p>
                            )}

                            <a
                              href={offer.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              View source →
                            </a>
                          </article>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Final report */}
                {activeResearch.finalReport && (
                  <div className="mt-8 rounded-2xl bg-slate-50 p-5 sm:p-6">
                    <h3 className="text-lg font-bold">
                      Final Research Report
                    </h3>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                      {activeResearch.finalReport}
                    </p>
                  </div>
                )}

                {activeResearch.verificationSummary && (
                  <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-5">
                    <h3 className="text-sm font-bold text-amber-900">
                      Verification Summary
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-amber-800">
                      {activeResearch.verificationSummary}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Shopping research history */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Shopping Research History</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Open a previous multi-agent product comparison.
                  </p>
                </div>
                <button
                  onClick={() => void fetchShoppingHistory()}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50"
                >
                  Refresh shopping history
                </button>
              </div>

              {shoppingHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <div className="text-3xl">🛍️</div>
                  <p className="mt-3 font-semibold">No shopping research yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Completed and ongoing product research will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {shoppingHistory.map((item) => {
                    const itemCompletedAgents = Object.values(
                      item.agentStatus || {}
                    ).filter((status) => status === "completed").length;
                    const itemProgress = Math.round(
                      (itemCompletedAgents / agents.length) * 100
                    );

                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-md"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {item.request?.productName || "Product research"}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              {[item.request?.model, item.request?.storage]
                                .filter(Boolean)
                                .join(" · ") || "Model/variant not specified"}
                            </p>
                          </div>
                          <StatusBadge
                            status={item.completed ? "completed" : "processing"}
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                          <span>
                            {item.verifiedOffers?.length || 0} verified/reviewed offers
                          </span>
                          <span>{itemProgress}% agents complete</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-600 transition-all"
                            style={{ width: `${itemProgress}%` }}
                          />
                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString()
                            : "Date unavailable"}
                        </p>

                        <button
                          onClick={() => {
                            setActiveResearch(null);
                            setActiveResearchId(item.id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="mt-4 inline-flex rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                        >
                          Open research details →
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Previous history */}
            <section id="history" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">
                    Research History
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Your previous research records.
                  </p>
                </div>

                <button
                  onClick={() => {
                    void fetchResearches();
                    void fetchShoppingHistory();
                  }}
                  disabled={fetchingHistory}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {fetchingHistory ? "Loading..." : "Refresh"}
                </button>
              </div>

              {fetchingHistory ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                  Loading history...
                </div>
              ) : researches.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <div className="text-3xl">📚</div>
                  <p className="mt-3 font-semibold">
                    No research history yet
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Your previous research will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {researches.map((research) => (
                    <article
                      key={research._id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold">
                          {research.topic}
                        </h3>
                        <StatusBadge status={research.status} />
                      </div>

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                        {research.summary ||
                          "Summary not available yet."}
                      </p>

                      <p className="mt-4 text-xs text-slate-400">
                        {new Date(
                          research.createdAt
                        ).toLocaleString()}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <footer className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
              ResearchAI · Multi-Agent Shopping Research Assistant
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
