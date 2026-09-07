import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import Stripe from "stripe";

export async function POST(request: Request) {
  try {
    const body = await request.text();

    const signature = request.headers.get(
      "stripe-signature"
    );

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature." },
        { status: 400 }
      );
    }

    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        {
          error:
            "Stripe webhook secret is not configured.",
        },
        { status: 500 }
      );
    }

    // Verify that the webhook really came from Stripe
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    // Admin client is required because Stripe webhooks
    // don't have a logged-in Supabase user session.
    const supabase = createAdminSupabaseClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        const userId =
          session.metadata?.user_id;

        if (!userId) {
          console.error(
            "No user_id found in checkout session."
          );
          break;
        }

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        const { error } =
          await supabase
            .from("profiles")
            .update({
              plan: "pro",
              stripe_subscription_id:
                subscriptionId || null,
              subscription_status: "active",
            })
            .eq("id", userId);

        if (error) {
          console.error(
            "Failed to upgrade user:",
            error
          );
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription =
          event.data.object as Stripe.Subscription;

        const userId =
          subscription.metadata?.user_id;

        if (!userId) {
          console.error(
            "No user_id found in subscription."
          );
          break;
        }

        const { error } =
          await supabase
            .from("profiles")
            .update({
              subscription_status:
                subscription.status,
              plan:
                subscription.status === "active"
                  ? "pro"
                  : "free",
            })
            .eq("id", userId);

        if (error) {
          console.error(
            "Failed to update subscription:",
            error
          );
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription =
          event.data.object as Stripe.Subscription;

        const userId =
          subscription.metadata?.user_id;

        if (!userId) {
          console.error(
            "No user_id found in deleted subscription."
          );
          break;
        }

        const { error } =
          await supabase
            .from("profiles")
            .update({
              plan: "free",
              subscription_status: "canceled",
            })
            .eq("id", userId);

        if (error) {
          console.error(
            "Failed to downgrade user:",
            error
          );
        }

        break;
      }

      default:
        console.log(
          `Unhandled Stripe event: ${event.type}`
        );
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Stripe webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Webhook error.",
      },
      { status: 400 }
    );
  }
}