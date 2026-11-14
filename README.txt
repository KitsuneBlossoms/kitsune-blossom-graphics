KITSUNE BLOSSOM GRAPHICS — WEBSITE + ADMIN PANEL

Files:
- index.html: public homepage and custom order form
- shop.html: public shop collection, loaded from Supabase
- product.html: individual product details pages with decal size/color choices and custom request handoff
- admin.html: private admin sign-in and product manager
- supabase-config.js: Supabase project URL and public publishable key
- assets/: site artwork

DEPLOY
1. Upload the contents of this folder (index.html, shop.html, product.html, admin.html, supabase-config.js, inventory.js, and assets/) to your Netlify site. Easiest: zip the folder contents and drag the ZIP into Netlify Deploys, or drag the extracted folder.
2. The public shop is at /shop.html. Each product card opens its own /product.html page.
3. The admin panel is at /admin.html. Sign in with the email/password created in Supabase Authentication.

DATABASE UPDATE (run once in Supabase SQL Editor before deploying this update)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customizable boolean NOT NULL DEFAULT true;

ADMIN FEATURES
- Add/edit/delete products
- Upload product photos to the public-read `product-images` bucket
- Set price, category, description, availability, customizable/ready-made status, and publish/hide status
- Only Supabase users listed in public.admin_users can manage inventory

SECURITY
- supabase-config.js contains only the public Supabase URL and publishable key. This is expected for browser apps when Row Level Security is enabled.
- NEVER add a Supabase secret key or service_role key to website files.
- Keep the products and storage Row Level Security policies enabled.

SHOPPING CART + STRIPE CHECKOUT
- Customers can add products to a cart and pay through Stripe Checkout.
- Shipping is US-only.
- Decal-only orders under $50: $5 shipping.
- Orders containing non-decals under $50 (including mixed decal + other-product orders): $10 shipping.
- Orders of $50 or more: free shipping.
- Checkout validates product availability and prices against the published Supabase product records.

NETLIFY DEPLOY
1. Upload all contents of this ZIP to the existing Netlify site, preserving the netlify/ folder and netlify.toml file.
2. In Netlify, confirm STRIPE_SECRET_KEY is available to Netlify Functions. It should be the test key beginning sk_test_ for test purchases.
3. Trigger a fresh deploy after changing environment variable scopes.
4. Open /shop.html, add an available test product to the cart, and use Stripe's test card 4242 4242 4242 4242 with any future expiry, any CVC, and a US billing/shipping address.
5. This is TEST MODE only while STRIPE_SECRET_KEY begins sk_test_. Real payments require switching the Netlify variable to a live Stripe secret key after Stripe account activation.

SECURITY
- Never place the Stripe secret key in any website file or send it in chat. It belongs only in Netlify environment variables.
- The checkout function uses the Stripe secret key server-side and checks current published/available product prices in Supabase.
- Keep Supabase Row Level Security enabled.
