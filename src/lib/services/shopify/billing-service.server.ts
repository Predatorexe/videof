/**
 * Shopify Billing service — appSubscriptionCreate + usage records.
 *
 * The frontend Upgrade button carries data-shopify-billing-action markers;
 * this service is what those hook into.
 */
import type { ShopifyAdminClient } from "./admin-client.server";

const APP_SUBSCRIPTION_CREATE = /* GraphQL */ `
  mutation AppSubscriptionCreate(
    $name: String!, $lineItems: [AppSubscriptionLineItemInput!]!,
    $returnUrl: URL!, $trialDays: Int, $test: Boolean
  ) {
    appSubscriptionCreate(name: $name, lineItems: $lineItems, returnUrl: $returnUrl, trialDays: $trialDays, test: $test) {
      confirmationUrl
      appSubscription { id status name }
      userErrors { field message }
    }
  }
`;

const APP_USAGE_RECORD_CREATE = /* GraphQL */ `
  mutation AppUsageRecordCreate($subscriptionLineItemId: ID!, $price: MoneyInput!, $description: String!) {
    appUsageRecordCreate(subscriptionLineItemId: $subscriptionLineItemId, price: $price, description: $description) {
      appUsageRecord { id }
      userErrors { field message }
    }
  }
`;

export interface CreateSubscriptionInput {
  name: string;
  monthlyPrice: number;
  currencyCode: string;
  returnUrl: string;
  trialDays?: number;
  usageCapped?: { amount: number; terms: string };
  test?: boolean;
}

export class ShopifyBillingService {
  constructor(private readonly client: ShopifyAdminClient) {}

  async createSubscription(input: CreateSubscriptionInput) {
    const lineItems: unknown[] = [
      {
        plan: {
          appRecurringPricingDetails: {
            price: { amount: input.monthlyPrice, currencyCode: input.currencyCode },
            interval: "EVERY_30_DAYS",
          },
        },
      },
    ];
    if (input.usageCapped) {
      lineItems.push({
        plan: {
          appUsagePricingDetails: {
            cappedAmount: { amount: input.usageCapped.amount, currencyCode: input.currencyCode },
            terms: input.usageCapped.terms,
          },
        },
      });
    }
    return this.client.graphql(APP_SUBSCRIPTION_CREATE, {
      name: input.name,
      lineItems,
      returnUrl: input.returnUrl,
      trialDays: input.trialDays,
      test: input.test ?? false,
    });
  }

  async recordUsage(subscriptionLineItemId: string, amount: number, currency: string, description: string) {
    return this.client.graphql(APP_USAGE_RECORD_CREATE, {
      subscriptionLineItemId,
      price: { amount, currencyCode: currency },
      description,
    });
  }
}
