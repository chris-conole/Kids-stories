import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="min-h-screen bg-night-50">
      <header className="border-b border-night-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <nav className="flex items-center gap-5 text-sm text-night-600">
            <Link href="/dashboard" className="hover:text-night-900">
              Library
            </Link>
            <Link href="/dashboard/profile" className="hover:text-night-900">
              Profiles
            </Link>
            <Link href="/dashboard/billing" className="hover:text-night-900">
              Billing
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="text-night-400 hover:text-night-700">Sign out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
