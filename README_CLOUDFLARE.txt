KITSUNE BLOSSOM GRAPHICS — CLOUDFLARE PAGES

This package keeps the existing storefront, product pages, cart, admin panel, Supabase connection, and Stripe embedded Checkout integration.

DEPLOYMENT
1. Create a GitHub repository and upload the CONTENTS of this folder (not the parent folder).
2. In Cloudflare, create a Pages project connected to this GitHub repository.
3. Framework preset: None. Build command: leave blank. Build output directory: / (root).
4. In Pages project Settings > Variables and Secrets, add these for Production:
   STRIPE_SECRET_KEY = your matching live Stripe restricted/secret key
   STRIPE_PUBLISHABLE_KEY = your matching live Stripe publishable key
   Do not put secret values in source files or GitHub.
5. Deploy and test using the Cloudflare pages.dev address before changing custom-domain DNS.

FUNCTION ROUTE
The checkout endpoint is now /api/create-checkout-session and is implemented in functions/api/create-checkout-session.js. Cloudflare Pages automatically deploys this as a Pages Function.

DOMAIN SAFETY
Do not remove the existing Netlify site or change domain DNS until the Cloudflare deployment and checkout have been tested successfully.

SUPABASE
The existing public Supabase URL and publishable key remain in supabase-config.js. Keep the existing Supabase Row Level Security policies.
