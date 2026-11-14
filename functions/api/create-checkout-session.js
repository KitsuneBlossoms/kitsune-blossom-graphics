export async function onRequest({ request, env }) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  try {
    const secret = env.STRIPE_SECRET_KEY;
    const publishableKey = env.STRIPE_PUBLISHABLE_KEY;
    if (!secret || !/^(sk|rk)_(test|live)_/.test(secret)) throw new Error('Stripe is not configured. Add a valid Stripe secret or restricted key in STRIPE_SECRET_KEY.');
    if (!publishableKey || (!publishableKey.startsWith('pk_test_') && !publishableKey.startsWith('pk_live_'))) throw new Error('Add STRIPE_PUBLISHABLE_KEY in Netlify environment variables.');
    const secretIsTest = /^(sk|rk)_test_/.test(secret);
    const secretIsLive = /^(sk|rk)_live_/.test(secret);
    if ((!secretIsTest && !secretIsLive) || secretIsTest !== publishableKey.startsWith('pk_test_')) throw new Error('Your Stripe secret/restricted key and publishable key must both be test keys or both be live keys.');
    const body = await request.json();
    if (!Array.isArray(body.items) || !body.items.length || body.items.length > 50) throw new Error('Your cart is empty or too large.');
    const base = 'https://czfihngiqgssetlbastl.supabase.co/rest/v1/products';
    const key = 'sb_publishable_M1PKnJev0jp3JNgshITgjQ_JwA8-4iA';
    const ids = [...new Set(body.items.map(x => String(x.id || '')))];
    if (ids.some(x => !/^[0-9a-f-]{16,}$/i.test(x))) throw new Error('A cart item is invalid.');
    const query = new URLSearchParams({ select: 'id,name,description,price,category,image_url,available,published', id: `in.(${ids.join(',')})`, published: 'eq.true', available: 'eq.true' });
    const productResponse = await fetch(`${base}?${query}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!productResponse.ok) throw new Error('Could not verify products. Please try again.');
    const products = await productResponse.json();
    if (products.length !== ids.length) throw new Error('One or more products are unavailable. Please refresh your cart.');
    const lookup = new Map(products.map(p => [String(p.id), p]));
    let subtotal = 0, decalOnly = true;
    const lineItems = [];
    for (const item of body.items) {
      const p = lookup.get(String(item.id));
      const qty = Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)));
      const isDecal = String(p.category || '').toLowerCase() === 'decals';
      if (!isDecal) decalOnly = false;
      let unit = Math.round(Number(p.price) * 100);
      let label = p.name;
      if (isDecal && item.size) {
        const prices = { Small: 500, Medium: 1000, Large: 1500 };
        if (!prices[item.size]) throw new Error('Invalid decal size.');
        unit = prices[item.size]; label += ` — ${item.size}`;
      }
      if (!Number.isSafeInteger(unit) || unit < 50) throw new Error(`Invalid price for ${p.name}.`);
      subtotal += unit * qty;
      const description = [item.color ? `Color: ${String(item.color).slice(0,100)}` : '', item.notes ? `Details: ${String(item.notes).slice(0,300)}` : ''].filter(Boolean).join(' | ');
      const productData = { name: label };
      if (description) productData.description = description;
      if (p.image_url && /^https:\/\//.test(p.image_url)) productData.images = [p.image_url];
      lineItems.push({ price_data: { currency: 'usd', unit_amount: unit, product_data: productData }, quantity: qty });
    }
    const shipping = subtotal >= 5000 ? 0 : (decalOnly ? 500 : 1000);
    const form = new URLSearchParams();
    form.set('mode', 'payment');
    form.set('ui_mode', 'form');
    form.set('return_url', 'https://kitsuneblossoms.com/success.html?session_id={CHECKOUT_SESSION_ID}');
    form.set('billing_address_collection', 'auto');
    form.set('phone_number_collection[enabled]', 'false');
    form.set('automatic_tax[enabled]', 'false');
    form.set('submit_type', 'auto');
    form.set('name_collection[individual][enabled]', 'true');
    form.set('name_collection[individual][optional]', 'true');
    form.set('name_collection[business][enabled]', 'true');
    form.set('name_collection[business][optional]', 'true');
    form.set('integration_identifier', 'custom_embedded_web_0002');
    form.set('shipping_address_collection[allowed_countries][0]', 'US');
    form.set('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
    form.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(shipping));
    form.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'usd');
    form.set('shipping_options[0][shipping_rate_data][display_name]', shipping === 0 ? 'Free shipping' : (decalOnly ? 'Decal shipping' : 'Standard shipping'));
    lineItems.forEach((li, i) => { form.set(`line_items[${i}][price_data][currency]`, 'usd'); form.set(`line_items[${i}][price_data][unit_amount]`, String(li.price_data.unit_amount)); form.set(`line_items[${i}][price_data][product_data][name]`, li.price_data.product_data.name); if(li.price_data.product_data.description) form.set(`line_items[${i}][price_data][product_data][description]`,li.price_data.product_data.description); if(li.price_data.product_data.images) form.set(`line_items[${i}][price_data][product_data][images][0]`,li.price_data.product_data.images[0]); form.set(`line_items[${i}][quantity]`,String(li.quantity)); });
    const stripe = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Stripe-Version': '2026-03-25.dahlia' }, body: form });
    const result = await stripe.json();
    if (!stripe.ok) throw new Error(result.error?.message || 'Stripe could not start checkout.');
    return new Response(JSON.stringify({ client_secret: result.client_secret, publishable_key: publishableKey }), { status: 200, headers });
  } catch (error) { return new Response(JSON.stringify({ error: error.message || 'Unable to start checkout.' }), { status: 400, headers }); }
};
