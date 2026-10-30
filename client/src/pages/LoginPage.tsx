import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { loginUser } from "../services/authService";
import { useAuthStore } from "../stores/authStore";
import { getErrorMessage } from "../utils/errorMessage";

export default function LoginPage() {
  const navigate = useNavigate();

  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);

      const data = await loginUser({
        email,
        password,
      });

      setAuth(data.user, data.accessToken);

      toast.success("Welcome to GarageFlow");

      const destination =
        data.user.role === "MECHANIC" ? "/my-jobs" : "/dashboard";
      navigate(destination);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm dark:border dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8">
          <h1 className="text-3xl font-bold dark:text-slate-100">GarageFlow</h1>

          <p className="mt-2 text-gray-500 dark:text-slate-400">Sign in to your garage dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium dark:text-slate-300">Email</label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium dark:text-slate-300">Password</label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer w-full rounded-lg bg-black px-4 py-2.5 font-medium text-white disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
