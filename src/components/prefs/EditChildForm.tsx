"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Chip,
  CompanionsEditor,
  Field,
  Section,
  Toggle,
  draftToPreferences,
  useMultiToggle,
  type PreferenceDraft,
} from "@/components/prefs/controls";
import {
  READING_LEVELS,
  THEME_OPTIONS,
  TONE_OPTIONS,
  VALUE_OPTIONS,
} from "@/lib/story-engine/options";

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Single-page preference editor. Reuses the same controls as onboarding, but
 * shows everything at once (parents editing want the whole picture) and saves
 * via POST /api/children with the child's id.
 */
export function EditChildForm({
  childId,
  initial,
}: {
  childId: string;
  initial: PreferenceDraft;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<PreferenceDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<PreferenceDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setSaved(false);
  };
  const toggle = useMultiToggle(draft, set);

  async function save() {
    if (!draft.name.trim() || draft.themes.length === 0 || draft.tone.length === 0) {
      setError("Please add a name, at least one world, and at least one tone.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: childId,
          name: draft.name.trim(),
          pronouns: draft.pronouns,
          birthYear: draft.birthYear,
          readingLevel: draft.readingLevel,
          bedtimeLocal: draft.bedtimeLocal,
          timezone: draft.timezone,
          preferences: draftToPreferences(draft),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save changes");
      }
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Remove ${draft.name}'s profile and all their stories? This can't be undone.`))
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/children/${childId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not remove profile");
      router.push("/dashboard/profile");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Basics */}
      <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <Section title="About your child">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name">
              <input
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="They go by">
              <select
                value={draft.pronouns}
                onChange={(e) => set({ pronouns: e.target.value })}
                className="input"
              >
                <option value="she/her">she / her</option>
                <option value="he/him">he / him</option>
                <option value="they/them">they / them</option>
              </select>
            </Field>
            <Field label="Birth year (optional)">
              <input
                type="number"
                min={2010}
                max={CURRENT_YEAR}
                value={draft.birthYear ?? ""}
                onChange={(e) =>
                  set({ birthYear: e.target.value ? Number(e.target.value) : undefined })
                }
                className="input"
              />
            </Field>
            <Field label="Bedtime (local)">
              <input
                type="time"
                value={draft.bedtimeLocal}
                onChange={(e) => set({ bedtimeLocal: e.target.value })}
                className="input"
              />
            </Field>
          </div>
          <Field label="Reading level">
            <div className="grid gap-2 sm:grid-cols-2">
              {READING_LEVELS.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                    draft.readingLevel === r.value
                      ? "border-night-500 bg-night-50"
                      : "border-night-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="reading"
                    checked={draft.readingLevel === r.value}
                    onChange={() => set({ readingLevel: r.value })}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium text-night-900">{r.label}</span>
                    <span className="block text-sm text-night-500">{r.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </Field>
        </Section>
      </div>

      {/* Worlds */}
      <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <Section title="Their worlds" subtitle="Pick up to 5.">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {THEME_OPTIONS.map((t) => (
              <Chip
                key={t.value}
                active={draft.themes.includes(t.value)}
                onClick={() => toggle("themes", t.value, 5)}
              >
                <span className="mr-1">{t.emoji}</span>
                {t.label}
              </Chip>
            ))}
          </div>
        </Section>
      </div>

      {/* Feel */}
      <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <Section title="How the stories feel" subtitle="Tone (up to 3) and gentle themes.">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TONE_OPTIONS.map((t) => (
              <Chip
                key={t.value}
                active={draft.tone.includes(t.value)}
                onClick={() => toggle("tone", t.value, 3)}
              >
                <span className="mr-1">{t.emoji}</span>
                {t.label}
              </Chip>
            ))}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-night-700">
              Gently encourage… <span className="text-night-400">(up to 3)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {VALUE_OPTIONS.map((v) => (
                <Chip
                  key={v.value}
                  small
                  active={draft.values.includes(v.value)}
                  onClick={() => toggle("values", v.value, 3)}
                >
                  {v.label}
                </Chip>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* Personal touches */}
      <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <Section title="Personal touches">
          <Field label="Friends, family & pets to feature">
            <CompanionsEditor
              companions={draft.companions}
              onChange={(companions) => set({ companions })}
            />
          </Field>
          <Field label="Favourite things">
            <textarea
              value={draft.favouriteThings}
              onChange={(e) => set({ favouriteThings: e.target.value })}
              className="input h-20"
              maxLength={300}
            />
          </Field>
          <Field label="Anything to avoid?">
            <textarea
              value={draft.avoid}
              onChange={(e) => set({ avoid: e.target.value })}
              className="input h-16"
              maxLength={300}
            />
          </Field>
          <div className="space-y-3 pt-2">
            <Toggle
              label="Wind-down endings"
              hint="Stories get calmer and sleepier toward the end."
              checked={draft.windDownEnding}
              onChange={(v) => set({ windDownEnding: v })}
            />
            <Toggle
              label="Connected adventures"
              hint="Recurring characters and stories that grow over time."
              checked={draft.serialiseAdventures}
              onChange={(v) => set({ serialiseAdventures: v })}
            />
          </div>
        </Section>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {/* Sticky-ish action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={remove}
          disabled={deleting}
          className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          {deleting ? "Removing…" : "Remove this child"}
        </button>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">Saved ✓</span>}
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-night-800 px-6 py-2.5 font-semibold text-white hover:bg-night-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
