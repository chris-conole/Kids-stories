"use client";

import { useState } from "react";

/**
 * Shared form primitives for capturing a child's story "recipe". Used by both
 * the onboarding wizard (stepped) and the preference editor (single page) so
 * the two never drift apart.
 */

export interface Companion {
  name: string;
  relationship?: string;
}

/** The full editable preference shape shared by onboarding + editor. */
export interface PreferenceDraft {
  name: string;
  pronouns: string;
  birthYear?: number;
  readingLevel: string;
  themes: string[];
  tone: string[];
  values: string[];
  companions: Companion[];
  favouriteThings: string;
  avoid: string;
  windDownEnding: boolean;
  serialiseAdventures: boolean;
  targetMinutes: number;
  bedtimeLocal: string;
  timezone: string;
}

export const emptyDraft: PreferenceDraft = {
  name: "",
  pronouns: "they/them",
  readingLevel: "early",
  themes: [],
  tone: ["gentle"],
  values: [],
  companions: [],
  favouriteThings: "",
  avoid: "",
  windDownEnding: true,
  serialiseAdventures: true,
  targetMinutes: 15,
  bedtimeLocal: "19:30",
  timezone: "Europe/London",
};

/** Build the API `preferences` object from a draft (shared by both flows). */
export function draftToPreferences(draft: PreferenceDraft) {
  return {
    targetMinutes: draft.targetMinutes ?? 15,
    tone: draft.tone?.length ? draft.tone : ["gentle"],
    themes: draft.themes ?? [],
    values: draft.values ?? [],
    companions: draft.companions ?? [],
    favouriteThings: draft.favouriteThings?.trim() || undefined,
    avoid: draft.avoid?.trim() || undefined,
    windDownEnding: draft.windDownEnding ?? true,
    serialiseAdventures: draft.serialiseAdventures ?? true,
  };
}

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-night-900">{title}</h2>
      {subtitle && <p className="mt-1 text-night-500">{subtitle}</p>}
      <div className="mt-6 space-y-5">{children}</div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-night-700">{label}</span>
      {children}
    </label>
  );
}

export function Chip({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border text-left transition ${
        small ? "px-3 py-1.5 text-sm" : "px-3 py-2.5 text-sm"
      } ${
        active
          ? "border-night-600 bg-night-600 text-white"
          : "border-night-200 bg-white text-night-700 hover:border-night-400"
      }`}
    >
      {children}
    </button>
  );
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-night-200 p-3 text-left"
    >
      <span>
        <span className="font-medium text-night-900">{label}</span>
        <span className="block text-sm text-night-500">{hint}</span>
      </span>
      <span
        className={`ml-3 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 ${
          checked ? "bg-night-600" : "bg-night-200"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white transition ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
    </button>
  );
}

export function CompanionsEditor({
  companions,
  onChange,
}: {
  companions: Companion[];
  onChange: (c: Companion[]) => void;
}) {
  const [name, setName] = useState("");
  const [rel, setRel] = useState("");

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {companions.map((c, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-night-100 px-3 py-1 text-sm text-night-700"
          >
            {c.name}
            {c.relationship ? ` (${c.relationship})` : ""}
            <button
              type="button"
              onClick={() => onChange(companions.filter((_, j) => j !== i))}
              className="text-night-400 hover:text-night-700"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="input flex-1"
        />
        <input
          value={rel}
          onChange={(e) => setRel(e.target.value)}
          placeholder="e.g. puppy"
          className="input flex-1"
        />
        <button
          type="button"
          onClick={() => {
            if (name.trim() && companions.length < 5) {
              onChange([
                ...companions,
                { name: name.trim(), relationship: rel.trim() || undefined },
              ]);
              setName("");
              setRel("");
            }
          }}
          className="rounded-xl bg-night-100 px-4 font-medium text-night-700 hover:bg-night-200"
        >
          Add
        </button>
      </div>
    </div>
  );
}

/** Multi-select toggler used by themes/tone/values, capped at `max`. */
export function useMultiToggle<T>(draft: T, set: (patch: Partial<T>) => void) {
  return (key: keyof T, value: string, max: number) => {
    const list = ((draft[key] as unknown as string[]) ?? []).slice();
    if (list.includes(value)) {
      set({ [key]: list.filter((v) => v !== value) } as Partial<T>);
    } else if (list.length < max) {
      set({ [key]: [...list, value] } as Partial<T>);
    }
  };
}
