/**
 * Webhook subscription registration (Admin API).
 * Called on OAuth completion so that every required topic is subscribed.
 */
import type { ShopifyAdminClient } from "./admin-client.server";

const WEBHOOK_TOPICS = [
  "APP_UNINSTALLED",
  "APP_SUBSCRIPTIONS_UPDATE",
  "PRODUCTS_UPDATE",
  "COLLECTIONS_UPDATE",
  "CUSTOMERS_DATA_REQUEST",
  "CUSTOMERS_REDACT",
  "SHOP_REDACT",
  "ORDERS_CREATE",
  "ORDERS_PAID",
] as const;

const WEBHOOK_SUBSCRIPTION_CREATE = /* GraphQL */ `
  mutation WebhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
      webhookSubscription { id }
      userErrors { field message }
    }
  }
`;

export class ShopifyWebhookService {
  constructor(private readonly client: ShopifyAdminClient, private readonly appUrl: string) {}

  async registerAll() {
    const results: Array<{ topic: string; ok: boolean; error?: string }> = [];
    for (const topic of WEBHOOK_TOPICS) {
      try {
        await this.client.graphql(WEBHOOK_SUBSCRIPTION_CREATE, {
          topic,
          webhookSubscription: {
            callbackUrl: `${this.appUrl}/api/public/shopify/webhooks/${topic.toLowerCase().replace(/_/g, "-")}`,
            format: "JSON",
          },
        });
        results.push({ topic, ok: true });
      } catch (err) {
        results.push({ topic, ok: false, error: (err as Error).message });
      }
    }
    return results;
  }
}

export { WEBHOOK_TOPICS };
