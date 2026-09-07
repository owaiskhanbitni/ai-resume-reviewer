"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Profile = {
  plan: string;
  subscription_status: string | null;
};

export default function BillingPage() {
  const supabase = createClient();

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadBilling();
  }, []);

  async function loadBilling() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("plan, subscription_status")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(
        "Billing profile error:",
        error
      );
      setLoading(false);
      return;
    }

    setProfile(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-gray-600">
          Loading billing information...
        </p>
      </main>
    );
  }

  const isPro = profile?.plan === "pro";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Billing
            </h1>

            <p className="mt-2 text-gray-600">
              Manage your ResumeAI subscription.
            </p>
          </div>

          <button
            onClick={() =>
              (window.location.href =
                "/dashboard")
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Current Plan
          </p>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {isPro
                  ? "Pro Plan"
                  : "Free Plan"}
              </h2>

              <p className="mt-1 text-gray-600">
                {isPro
                  ? "Unlimited resume reviews and detailed AI analysis."
                  : "3 resume reviews with basic AI analysis."}
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                isPro
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {isPro ? "Active" : "Free"}
            </span>
          </div>

          {isPro && (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="text-sm text-gray-500">
                Subscription status
              </p>

              <p className="mt-1 font-semibold capitalize">
                {profile?.subscription_status ||
                  "Active"}
              </p>

              <button
  className="mt-6 rounded-lg border border-red-300 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
  onClick={async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel your Pro subscription?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        "/api/stripe/portal",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to cancel subscription."
        );
      }

      alert(
        "Your subscription will be cancelled at the end of the current billing period."
      );

      await loadBilling();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    }
  }}
>
  Cancel Subscription
</button>
            </div>
          )}

          {!isPro && (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold">
                Upgrade to Pro
              </h3>

              <p className="mt-2 text-gray-600">
                Get unlimited resume reviews and
                detailed AI-powered recommendations.
              </p>

              <button
                onClick={() =>
                  (window.location.href =
                    "/dashboard")
                }
                className="mt-5 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Upgrade to Pro — $9/month
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}