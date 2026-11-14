# Stripe Checkout Integration — Remaining Setup

## Values to Replace

There are no placeholder product or price values in the existing Checkout Session call. The website builds real `line_items` dynamically from published, available products in Supabase and calculates the current shipping rules server-side. The existing one-time `mode=payment` is correct for the store's purchases.

## Configured Parameters

**File:** [netlify/functions/create-checkout-session.js](netlify/functions/create-checkout-session.js)

| Parameter | Value |
|---|---|
| `ui_mode` | `form` |
| `mode` | `payment` (existing one-time purchase flow) |
| `billing_address_collection` | `auto` |
| `phone_number_collection.enabled` | `false` |
| `automatic_tax.enabled` | `false` |
| `payment_method_collection` | Omitted, as required for one-time payment mode by this integration specification |
| `submit_type` | `auto` |
| `name_collection.individual.enabled` | `true` |
| `name_collection.individual.optional` | `true` |
| `name_collection.business.enabled` | `true` |
| `name_collection.business.optional` | `true` |
| `integration_identifier` | `custom_embedded_web_0002` |
| `line_items` | Real, dynamic product data and prices verified from Supabase; not placeholder Price IDs |
| `shipping_address_collection` | US only |
| `shipping_options` | Calculated from the store's existing shipping rules |
| Stripe API version | `2026-03-25.dahlia` |

**Client-side file:** [cart.html](cart.html)

The existing client loads Stripe.js from `https://js.stripe.com/dahlia/stripe.js`, requests the Checkout Session client secret from the Netlify Function, initializes the Checkout Form SDK, mounts the embedded form, and handles confirmation. This client code was preserved.

## Setup and Testing

1. In Netlify, set `STRIPE_SECRET_KEY` to a Stripe secret or restricted key and `STRIPE_PUBLISHABLE_KEY` to its matching publishable key. Both must be in the same mode: `sk_test_`/`rk_test_` with `pk_test_`, or `sk_live_`/`rk_live_` with `pk_live_`.
2. If using a restricted key, ensure it has **Checkout Sessions: Write** permission. Keep all secret keys in Netlify environment variables; never place them in browser code or share them.
3. After changing environment variables or deploying this update, publish a fresh Netlify deploy so the function receives the latest code and variables.
4. Test with matching **test-mode** keys first and a Stripe test card. Do not use live keys for test card transactions.
5. After a successful test, switch both variables together to matching live keys. Confirm the Stripe account is activated and able to accept live payments before taking customer orders.

## How Checkout Works

The customer adds products to the website cart. The Netlify Function re-reads product details and prices from Supabase, validates availability, calculates shipping, and creates a Stripe Checkout Session. The browser uses the returned client secret to render Stripe's embedded payment form. Stripe returns the customer to the site's success page after checkout.

## Remaining Work Before Automated Fulfillment

- Add a signed Stripe webhook for `checkout.session.completed` (and asynchronous payment success events if enabled).
- Persist paid orders in the store's database and build order tracking/fulfillment handling. The current success page alone is not proof of payment and should not be used as the fulfillment authority.
- Verify live account activation, business details, and payout bank setup in Stripe before accepting live payments.

## Resources

- [Stripe API keys](https://dashboard.stripe.com/apikeys)
- [Stripe Checkout Sessions API](https://docs.stripe.com/api/checkout/sessions)
- [Stripe support](https://support.stripe.com)
