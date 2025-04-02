import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const POST = async (request: Request) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("Missing Stripe keys", { status: 500 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new NextResponse("Missing Stripe keys", { status: 500 });
  }
  const text = await request.text();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-10-28.acacia",
  });

  try {
    const event = stripe.webhooks.constructEvent(
      text,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object;
        console.log("invoice: ", invoice);

        const customer = invoice.customer;
        let subscriptionId = invoice.subscription;

        if (!subscriptionId) {
          console.log(
            "Subscription ID is null. Trying to fetch using customer ID...",
          );
          if (!customer || typeof customer !== "string") {
            console.error("Invalid customer ID:", customer);
            return new NextResponse("Invalid customer ID", { status: 400 });
          }
          // Buscar a assinatura com o customer ID
          const subscriptions = await stripe.subscriptions.list({
            customer: customer,
            status: "active",
            limit: 1, // Pegamos apenas a assinatura mais recente
          });

          if (subscriptions.data.length > 0) {
            subscriptionId = subscriptions.data[0].id;
            console.log("Found subscription from customer ID:", subscriptionId);
          } else {
            return new NextResponse("Subscription ID not found", {
              status: 400,
            });
          }
        }

        // Buscar detalhes da assinatura
        const subscriptionData = await stripe.subscriptions.retrieve(
          subscriptionId as string,
        );
        console.log("subscriptionData: ", subscriptionData);

        const clerkUserId = subscriptionData.metadata?.clerk_user_id;
        if (!clerkUserId) {
          return new NextResponse("Clerk user ID not found", { status: 400 });
        }

        await clerkClient().users.updateUser(clerkUserId, {
          privateMetadata: {
            stripeCustomerId: customer,
            stripeSubscriptionId: subscriptionId,
          },
          publicMetadata: {
            subscriptionPlan: "premium",
          },
        });

        break;
      }
      case "customer.subscription.deleted": {
        // Remover plano premium do usuário
        const subscription = await stripe.subscriptions.retrieve(
          event.data.object.id,
        );
        const clerkUserId = subscription.metadata.clerk_user_id;
        if (!clerkUserId) {
          return NextResponse.error();
        }
        await clerkClient().users.updateUser(clerkUserId, {
          privateMetadata: {
            stripeCustomerId: null,
            stripeSubscriptionId: null,
          },
          publicMetadata: {
            subscriptionPlan: null,
          },
        });
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return new NextResponse("Invalid webhook signature", { status: 400 });
  }

  return NextResponse.json({ received: true });
};
