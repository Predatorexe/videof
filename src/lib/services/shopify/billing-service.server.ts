/**
 * Shopify Billing API wrapper.
 *
 * Wraps `appSubscriptionCreate`, `appSubscription` lookup, and
 * `appSubscriptionCancel`. All calls go through a `ShopifyAdminClient`
 * that is already scoped to a specific shop's offline access token.
 */
import type { ShopifyAdminClient } from "./admin-client.server";
import { ExternalServiceError } from "@/lib/errors";

const APP_SUBSCRIPTION_CREATE = /* GraphQL */ `
  mutation AppSubscriptionCreate(
    $name: String!
    $lineItems: [AppSubscriptionLineItemInput!]!
    $returnUrl: URL!
    $trialDays: Int
    $test: Boolean
  ) {
    appSubscriptionCreate(
      name: $name
      lineItems: $lineItems
      returnUrl: $returnUrl
      trialDays: $trialDays
      test: $test
    ) {
      confirmationUrl
      appSubscription {
        id
        status
        name
        test
        currentPeriodEnd
        trialDays
        createdAt
      }
      userErrors { field message }
    }
  }
`;

const APP_SUBSCRIPTION_CANCEL = /* GraphQL */ `
  mutation AppSubscriptionCancel($id: ID!) {
    appSubscriptionCancel(id: $id) {
      appSubscription { id status }
      userErrors { field message }
    }
  }
`;

const APP_SUBSCRIPTION_GET = /* GraphQL */ `
  query AppSubscription($id: ID!) {
    node(id: $id) {
      ... on AppSubscription {
        id
        name
        status
        test
        currentPeriodEnd
        trialDays
        createdAt
        lineItems { id plan { pricingDetails { __typename } } }
      }
    }
  }
`;

const APP_USAGE_RECORD_CREATE = /* GraphQL */ `
  mutation AppUsageRecordCreate(
    $subscriptionLineItemId: ID!
    $price: MoneyInput!
    $description: String!
  ) {
    appUsageRecordCreate(
      subscriptionLineItemId: $subscriptionLineItemId
      price: $price
      description: $description
    ) {
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

export interface AppSubscriptionNode {
  id: string;
  name: string;
  status: "PENDING" | "ACTIVE" | "DECLINED" | "EXPIRED" | "FROZEN" | "CANCELLED" | "ACCEPTED";
  test: boolean;
  currentPeriodEnd: string | null;
  trialDays: number | null;
  createdAt: string;
}

export interface CreateSubscriptionResult {
  confirmationUrl: string;
  appSubscription: AppSubscriptionNode;
}

/**
 * Extract the numeric charge ID from a GraphQL global ID.
 * Example: "gid://shopify/AppSubscription/12345" → "12345".
 */
export function chargeIdFromGid(gid: string | null | undefined): string | null {
  if (!gid) return null;
  const match = /\/AppSubscription\/(\d+)/.exec(gid);
  return match?.[1] ?? gid;
}

export class ShopifyBillingService {
  constructor(private readonly client: ShopifyAdminClient) {}

  /**
   * Create a recurring app subscription. The merchant must approve the
   * returned `confirmationUrl`; on approval Shopify redirects them to the
   * `returnUrl` we passed in and fires the APP_SUBSCRIPTIONS_UPDATE webhook.
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
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
    const res = await this.client.graphql<{
      appSubscriptionCreate: {
        confirmationUrl: string | null;
        appSubscription: AppSubscriptionNode | null;
        userErrors: Array<{ field?: string[] | null; message: string }>;
      };
    }>(APP_SUBSCRIPTION_CREATE, {
      name: input.name,
      lineItems,
      returnUrl: input.returnUrl,
      trialDays: input.trialDays,
      test: input.test ?? false,
    });
    const payload = res.appSubscriptionCreate;
    if (payload.userErrors?.length) {
      throw new ExternalServiceError(
        "shopify.billing.create",
        payload.userErrors.map((e) => e.message).join("; "),
        payload.userErrors,
      );
    }
    if (!payload.confirmationUrl || !payload.appSubscription) {
      throw new ExternalServiceError("shopify.billing.create", "Empty response from Shopify");
    }
    return {
      confirmationUrl: payload.confirmationUrl,
      appSubscription: payload.appSubscription,
    };
  }

  /** Fetch the current state of a subscription (used from the return callback). */
  async getSubscription(id: string): Promise<AppSubscriptionNode | null> {
    const res = await this.client.graphql<{ node: AppSubscriptionNode | null }>(
      APP_SUBSCRIPTION_GET,
      { id },
    );
    return res.node ?? null;
  }

  /** Cancel an existing subscription (used when the merchant downgrades). */
  async cancelSubscription(id: string): Promise<void> {
    const res = await this.client.graphql<{
      appSubscriptionCancel: {
        appSubscription: { id: string; status: string } | null;
        userErrors: Array<{ field?: string[] | null; message: string }>;
      };
    }>(APP_SUBSCRIPTION_CANCEL, { id });
    const errors = res.appSubscriptionCancel.userErrors ?? [];
    if (errors.length) {
      throw new ExternalServiceError(
        "shopify.billing.cancel",
        errors.map((e) => e.message).join("; "),
        errors,
      );
    }
  }

  async recordUsage(
    subscriptionLineItemId: string,
    amount: number,
    currency: string,
    description: string,
  ) {
    return this.client.graphql(APP_USAGE_RECORD_CREATE, {
      subscriptionLineItemId,
      price: { amount, currencyCode: currency },
      description,
    });
  }
}
