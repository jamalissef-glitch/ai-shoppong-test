
"use client";

import { useEffect, useState } from "react";
import axios from "axios";

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

export default function Home() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [researches, setResearches] = useState<Research[]>([]);
  const [error, setError] = useState("");

  // Fetch research history
  const fetchResearches = async () => {
    try {
      setFetching(true);
      setError("");

      const response = await axios.get("/api/research");

      setResearches(response.data.researches);
    } catch (error) {
      console.error("Failed to fetch researches:", error);
      setError("Failed to load research history.");
    } finally {
      setFetching(false);
    }
  };

  // Load research history when page opens
  useEffect(() => {
    fetchResearches();
  }, []);

  // Start new research
  const handleResearch = async () => {
    if (!topic.trim()) {
      setMessage("Please enter a research topic.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await axios.post("/api/research", {
        topic: topic.trim(),
      });

      setMessage(response.data.message);
      setTopic("");

      // Refresh research history
      await fetchResearches();
    } catch (error) {
      console.error("Research error:", error);
      setMessage("Failed to start research.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold text-gray-900">
            AI Research Assistant
          </h1>

          <p className="mt-2 text-gray-600">
            Start your research and manage your research history.
          </p>
        </header>

        {/* Research Form */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Start New Research
          </h2>

          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) {
                handleResearch();
              }
            }}
            placeholder="Enter research topic..."
            className="w-full rounded-lg border p-3 outline-none focus:border-black"
          />

          <button
            onClick={handleResearch}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-black p-3 text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Starting..." : "Start Research"}
          </button>

          {message && (
            <p className="mt-3 text-sm text-gray-700">
              {message}
            </p>
          )}
        </section>

        {/* Research History */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Research History
            </h2>

            <button
              onClick={fetchResearches}
              disabled={fetching}
              className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
            >
              {fetching ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </p>
          )}

          {fetching ? (
            <p className="text-gray-500">
              Loading research history...
            </p>
          ) : researches.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center">
              <p className="font-medium text-gray-700">
                No research found.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Start your first research to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {researches.map((research) => (
                <article
                  key={research._id}
                  className="rounded-xl border bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {research.topic}
                    </h3>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      {research.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {research.summary || "Summary not available yet."}
                  </p>

                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-800">
                      Sources ({research.sources.length})
                    </h4>

                    <ul className="mt-2 space-y-2">
                      {research.sources.map((source, index) => (
                        <li key={index}>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {source.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="mt-4 text-xs text-gray-400">
                    Created:{" "}
                    {new Date(research.createdAt).toLocaleString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
