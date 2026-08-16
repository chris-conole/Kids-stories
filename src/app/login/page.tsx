import Link from "next/link";
import { Logo } from "@/components/Logo";
import { signIn } from "@/lib/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { check?: string; callbackUrl?: string };
}) {
  const checkInbox = searchParams.check === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-night-900 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        {checkInbox ? (
          <div className="text-center">
            <div className="text-4xl">📬</div>
            <h1 className="mt-4 font-display text-2xl text-night-900">
              Check your inbox
            </h1>
            <p className="mt-2 text-night-600">
              We've emailed you a magic link to sign in. It expires shortly.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block text-sm text-night-500 hover:text-night-800"
            >
              ← Back home
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-center font-display text-2xl text-night-900">
              Sign in
            </h1>
            <p className="mt-2 text-center text-night-600">
              We'll email you a secure link — no password needed.
            </p>
            <form
              action={async (formData: FormData) => {
                "use server";
                const email = String(formData.get("email"));
                await signIn("resend", {
                  email,
                  redirectTo: searchParams.callbackUrl || "/dashboard",
                });
              }}
              className="mt-6 space-y-3"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-night-200 px-4 py-3 focus:border-night-500 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-night-800 px-4 py-3 font-semibold text-white hover:bg-night-700"
              >
                Email me a magic link
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-night-500">
              New here?{" "}
              <Link href="/onboarding" className="text-night-700 underline">
                Create your child's first story
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
