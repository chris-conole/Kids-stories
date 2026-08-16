"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/Logo";
import {
  Chip,
  CompanionsEditor,
  Field,
  Section,
  Toggle,
  emptyDraft,
  useMultiToggle,
  type PreferenceDraft,
} from "@/components/prefs/controls";
import {
  READING_LEVELS,
  THEME_OPTIONS,
  TONE_OPTIONS,
  VALUE_OPTIONS,
} from "@/lib/story-engine/options";

/**
 * Onboarding wizard. Collects the story "recipe" client-side, stashes it in
 * localStorage, then sends a magic-link. After sign-in the dashboard reads the
 * draft, creates the child, and generates the free first story.
 */

const CURRENT_YEAR = new Date().getFullYear();
const STEPS = ["Your child", "Their worlds", "The feel", "Their world", "Finish"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<PreferenceDraft>(emptyDraft);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (patch: Partial<PreferenceDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));
  const toggle = useMultiToggle(draft, set);

  const canProceed = () => {
    if (step === 0) return draft.name.trim().length > 0;
    if (step === 1) return draft.themes.length > 0;
    if (step === 2) return draft.tone.length > 0;
    return true;
  };

  async function finish() {
    if (!email) return;
    setSubmitting(true);
    localStorage.setItem("dreamloom:onboarding", JSON.stringify(draft));
    await signIn("resend", { email, redirectTo: "/dashboard?onboard=1" });
  }

  return (
    <main className="min-h-screen bg-night-50 px-6 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <span className="text-sm text-night-500">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>

        <div className="mb-8 flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? "bg-night-600" : "bg-night-200"
              }`}
            />
          ))}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          {step === 0 && (
            <Section title="Who is tonight's story for?">
              <Field label="Child's first name">
                <input
                  autoFocus
                  value={draft.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="e.g. Amara"
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
              <Field label="Birth year (optional — helps us pitch the language)">
                <input
                  type="number"
                  min={2010}
                  max={CURRENT_YEAR}
                  value={draft.birthYear ?? ""}
                  onChange={(e) =>
                    set({ birthYear: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="e.g. 2019"
                  className="input"
                />
              </Field>
              <Field label="Reading level">
                <div className="space-y-2">
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
          )}

          {step === 1 && (
            <Section
              title="Which worlds does your child love?"
              subtitle="Pick up to 5. We'll draw from these each night."
            >
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
          )}

          {step === 2 && (
            <Section title="How should the stories feel?" subtitle="Pick up to 3.">
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
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-night-700">
                  Gently encourage… <span className="text-night-400">(optional, up to 3)</span>
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
          )}

          {step === 3 && (
            <Section
              title="Make it theirs"
              subtitle="These little details are what make a story feel truly personal."
            >
              <Field label="Friends, family & pets to feature (optional)">
                <CompanionsEditor
                  companions={draft.companions}
                  onChange={(companions) => set({ companions })}
                />
              </Field>
              <Field label="Favourite things (optional)">
                <textarea
                  value={draft.favouriteThings}
                  onChange={(e) => set({ favouriteThings: e.target.value })}
                  placeholder="Loves the colour green, red wellies, and counting stars"
                  className="input h-20"
                  maxLength={300}
                />
              </Field>
              <Field label="Anything to avoid? (optional)">
                <textarea
                  value={draft.avoid}
                  onChange={(e) => set({ avoid: e.target.value })}
                  placeholder="No witches, nothing spooky, no thunderstorms"
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
          )}

          {step === 4 && (
            <Section
              title="Where should we send the magic?"
              subtitle="We'll email you a link to sign in and read the first story free."
            >
              <Field label="Your email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                />
              </Field>
              <div className="rounded-xl bg-night-50 p-4 text-sm text-night-600">
                <p className="font-medium text-night-800">
                  {draft.name || "Your child"}'s story recipe
                </p>
                <p className="mt-1">
                  {draft.themes.length} worlds · {draft.tone.length} tones ·{" "}
                  {draft.targetMinutes}-minute stories
                  {draft.serialiseAdventures ? " · connected adventures" : ""}
                </p>
              </div>
              <button
                disabled={!email || submitting}
                onClick={finish}
                className="w-full rounded-xl bg-night-800 px-4 py-3 font-semibold text-white hover:bg-night-700 disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Send my magic link ✨"}
              </button>
            </Section>
          )}

          {step < 4 && (
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="text-night-500 hover:text-night-800 disabled:opacity-40"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="rounded-full bg-night-800 px-6 py-2.5 font-semibold text-white hover:bg-night-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
