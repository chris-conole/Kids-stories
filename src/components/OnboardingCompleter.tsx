"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Runs once after magic-link sign-in returns to /dashboard?onboard=1. Reads the
 * onboarding draft from localStorage, creates the child, and kicks off the free
 * first story. Clears the draft so it never double-creates.
 */
export function OnboardingCompleter() {
  const router = useRouter();
  const started = useRef(false);
  const [status, setStatus] = useState<string>("Setting up your child's profile…");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const raw = localStorage.getItem("dreamloom:onboarding");
    if (!raw) {
      router.replace("/dashboard");
      return;
    }

    (async () => {
      try {
        const draft = JSON.parse(raw);
        const preferences = {
          targetMinutes: draft.targetMinutes ?? 15,
          tone: draft.tone?.length ? draft.tone : ["gentle"],
          themes: draft.themes ?? [],
          values: draft.values ?? [],
          companions: draft.companions ?? [],
          favouriteThings: draft.favouriteThings || undefined,
          avoid: draft.avoid || undefined,
          windDownEnding: draft.windDownEnding ?? true,
          serialiseAdventures: draft.serialiseAdventures ?? true,
        };

        const res = await fetch("/api/children", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: draft.name,
            pronouns: draft.pronouns,
            birthYear: draft.birthYear,
            readingLevel: draft.readingLevel,
            preferences,
          }),
        });
        if (!res.ok) throw new Error("Could not create profile");
        const { child } = await res.json();

        setStatus(`Writing ${draft.name}'s first story… this takes a moment ✨`);
        localStorage.removeItem("dreamloom:onboarding");

        const gen = await fetch(`/api/children/${child.id}/generate`, {
          method: "POST",
        });
        const genData = await gen.json();

        if (genData.storyId) {
          router.replace(`/dashboard/story/${genData.storyId}?first=1`);
        } else {
          router.replace("/dashboard");
        }
      } catch (e) {
        console.error(e);
        setStatus("Something went wrong. Redirecting to your dashboard…");
        setTimeout(() => router.replace("/dashboard"), 1500);
      }
    })();
  }, [router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="text-5xl">🌙</div>
      <p className="mt-4 max-w-sm font-display text-xl text-night-800">{status}</p>
      <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-night-100">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-night-500" />
      </div>
    </div>
  );
}
