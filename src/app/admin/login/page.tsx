// Admin login - Auth.js Credentials provider ile.
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export const metadata = {
  title: "Giriş — Emay Panel Admin",
};

async function loginAction(formData: FormData): Promise<void> {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Auth.js sign-in basarisizliklarini AuthError olarak throw eder.
      // Hata tipine gore login sayfasina ?error= parametresiyle geri don.
      const code = error.type ?? "Default";
      redirect(`/admin/login?error=${encodeURIComponent(code)}`);
    }
    // Re-throw redirect error (Next.js icin signal)
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/admin");

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Emay Panel Admin
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Yönetici hesabınızla giriş yapın
          </p>
        </div>

        <form
          action={loginAction}
          className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
        >
          {error ? (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              E-posta veya şifre hatalı.
            </div>
          ) : null}

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              E-posta
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="admin@emay.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Giriş Yap
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Sadece yetkili personel için
        </p>
      </div>
    </div>
  );
}
