import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST() {
  try {
    const supabase =
      await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const { data: profile, error } =
      await supabase
        .from("profiles")
        .select("stripe_customer_id, stripe_subscription_id, plan")
        .eq("id", user.id)
        .single();

    if (error) {
      console.error("Profile error:", error);

      return NextResponse.json(
        { error: "Could not load your profile." },
        { status: 500 }
      );
    }

    if (!profile.stripe_subscription_id) {
      return NextResponse.json(
        {
          error:
            "No active Stripe subscription was found.",
        },
        { status: 400 }
      );
    }

    if (profile.plan !== "pro") {
      return NextResponse.json(
        {
          error:
            "You are not currently on the Pro plan.",
        },
        { status: 400 }
      );
    }

    // Cancel at the end of the current billing period.
    const subscription =
      await stripe.subscriptions.update(
        profile.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        }
      );

    return NextResponse.json({
      success: true,
      status: subscription.status,
      cancelAtPeriodEnd:
        subscription.cancel_at_period_end,
    });
  } catch (error) {
    console.error(
      "Stripe cancellation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to cancel subscription.",
      },
      { status: 500 }
    );
  }
}