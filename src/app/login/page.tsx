import Link from "next/link";
import AuthShell from "@/components/auth/auth-shell";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to broadcast your next Eid offer or discount msg to all customers at once."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Create a free account
          </Link>{" "}
          — upload your Excel list and send your first broadcast today.
          <p className="mt-3">
            Platform admin?{" "}
            <Link href="/admin" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Log in to admin dashboard
            </Link>
          </p>
        </>
      }
    >
      <LoginForm submitLabel="Log in & Broadcast" />
    </AuthShell>
  );
}
