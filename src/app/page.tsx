import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PLANS } from "@/lib/plans";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Dreamloom";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-night-900 via-night-800 to-night-700 text-night-50">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-night-50">
          <Logo className="text-night-50" />
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="#how" className="hidden text-night-200 hover:text-white sm:block">
            How it works
          </Link>
          <Link href="#pricing" className="hidden text-night-200 hover:text-white sm:block">
            Pricing
          </Link>
          <Link href="/login" className="text-night-100 hover:text-white">
            Sign in
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full bg-dawn-400 px-5 py-2 font-semibold text-night-900 hover:bg-dawn-300"
          >
            Start free
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-12 text-center sm:pt-20">
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-dawn-300">
          A bedtime ritual, reimagined
        </p>
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">
          A brand-new bedtime story for your child.
          <span className="block text-dawn-300">Every single night.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-night-100">
          Tell us who your child is and the worlds they love. Each evening,{" "}
          {APP_NAME} weaves a fresh, ~15-minute story starring them — gentle,
          personal, and made to help little ones drift off to sleep.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/onboarding"
            className="rounded-full bg-dawn-400 px-8 py-3 font-semibold text-night-900 hover:bg-dawn-300"
          >
            Create your child's first story
          </Link>
          <Link href="#how" className="px-6 py-3 text-night-100 hover:text-white">
            See how it works →
          </Link>
        </div>
        <p className="mt-4 text-sm text-night-300">
          Free first story · Cancel anytime
        </p>
      </section>

      {/* How it works */}
      <section id="how" className="bg-night-50 py-20 text-night-900">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center font-display text-3xl font-semibold">
            Three quiet minutes now. A magical bedtime every night.
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: "✨",
                title: "1. Set the scene",
                body: "Add your child, their friends and pets, and pick the tone and worlds they love — space, fairies, dinosaurs, and more.",
              },
              {
                icon: "🌙",
                title: "2. We weave the story",
                body: "Every evening our story engine writes a fresh, wholesome, wind-down tale made just for them — with recurring characters who grow over time.",
              },
              {
                icon: "📖",
                title: "3. Snuggle up",
                body: "Read it in the app or your inbox. Add Plus for soft illustrations and gentle audio narration.",
              },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="text-3xl">{s.icon}</div>
                <h3 className="mt-4 font-display text-xl">{s.title}</h3>
                <p className="mt-2 text-night-700">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-night-100 py-20 text-night-900">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center font-display text-3xl font-semibold">
            Simple pricing
          </h2>
          <p className="mt-2 text-center text-night-600">
            One subscription, every child in your family.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {Object.values(PLANS).map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl border bg-white p-8 ${
                  plan.id === "PLUS"
                    ? "border-dawn-400 shadow-lg ring-2 ring-dawn-300"
                    : "border-night-200 shadow-sm"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-2xl">{plan.name}</h3>
                  {plan.id === "PLUS" && (
                    <span className="rounded-full bg-dawn-200 px-3 py-1 text-xs font-semibold text-dawn-500">
                      Most loved
                    </span>
                  )}
                </div>
                <p className="mt-1 text-night-600">{plan.blurb}</p>
                <p className="mt-4 font-display text-3xl">{plan.priceLabel}</p>
                <ul className="mt-6 space-y-2 text-sm text-night-700">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-dawn-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/onboarding"
                  className="mt-8 block rounded-full bg-night-800 px-6 py-3 text-center font-semibold text-white hover:bg-night-700"
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-night-900 py-10 text-center text-sm text-night-300">
        <Logo className="text-night-100" />
        <p className="mt-3">Made with care for bedtimes everywhere.</p>
      </footer>
    </main>
  );
}
