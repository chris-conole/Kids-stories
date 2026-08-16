"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Manually generate tonight's story for a child (regenerates if one exists). */
export function GenerateNowButton({ childId }: { childId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const res = await fetch(`/api/children/${childId}/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.storyId) router.push(`/dashboard/story/${data.storyId}`);
      else router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={go}
      disabled={loading}
      className="rounded-full border border-night-300 px-4 py-2 text-sm font-medium text-night-700 hover:bg-night-50 disabled:opacity-50"
    >
      {loading ? "Writing…" : "Generate tonight's story"}
    </button>
  );
}
