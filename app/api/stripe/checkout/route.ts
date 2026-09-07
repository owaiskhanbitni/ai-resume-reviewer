import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    // Get Stripe Price ID
    const priceId = process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe Price ID is not configured yet." },
        { status: 500 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("stripe_customer_id, plan")
        .eq("id", user.id)
        .single();

    if (profileError) {
      console.error("Profile error:", profileError);

      return NextResponse.json(
        { error: "Could not load your profile." },
        { status: 500 }
      );
    }

    // Don't allow Pro users to purchase Pro again
    if (profile.plan === "pro") {
      return NextResponse.json(
        { error: "You are already on the Pro plan." },
        { status: 400 }
      );
    }

    let customerId = profile.stripe_customer_id;

    // Create Stripe customer if one doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });

      customerId = customer.id;

      // Save Stripe customer ID
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          stripe_customer_id: customerId,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error(
          "Customer ID save error:",
          updateError
        );

        return NextResponse.json(
          {
            error:
              "Could not save Stripe customer information.",
          },
          { status: 500 }
        );
      }
    }

    // Website URL
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    // Create Stripe Checkout Session
    const session =
      await stripe.checkout.sessions.create({
        customer: customerId,

        mode: "subscription",

        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],

        success_url:
          `${origin}/dashboard?checkout=success`,

        cancel_url:
          `${origin}/dashboard?checkout=cancelled`,

        metadata: {
          user_id: user.id,
        },

        subscription_data: {
          metadata: {
            user_id: user.id,
          },
        },
      });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error(
      "Stripe checkout error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session.",
      },
      { status: 500 }
    );
  }
}