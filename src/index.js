export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol === 'http:') { return Response.redirect(SITE + url.pathname + url.search, 301); }
    const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname; if (url.hostname.startsWith('www.')) { return Response.redirect(SITE + url.pathname + url.search, 301); } if (path !== url.pathname || path === '/index.html') { return Response.redirect(SITE + (path === '/index.html' ? '/' : path) + url.search, 301); } if (path === '/favicon.ico' || path === '/favicon.png' || path === '/apple-touch-icon.png') { return new Response(Uint8Array.from(atob(FAVICON_B64), function (c) { return c.charCodeAt(0); }), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' } }); }
    if (path === '/api/enquiry' && request.method === 'POST') { return handleEnquiry(request, env, url); }
    if (path.startsWith('/files/')) { return serveUpload(path, env); }
    if (path === '/styles.css') { return new Response(STYLES, { headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-cache' } }); }
    if (path === '/script.js') { return new Response(SCRIPT, { headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache' } }); }
    if (path === '/privacy') { return new Response(privacyPage(), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } }); } if (path === '/terms') { return new Response(termsPage(), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } }); }
    if (path === '/sample-estimate.pdf') {
      if (!env.Files) { return new Response('R2 binding "Files" is missing', { status: 500 }); }
      const obj = await env.Files.get('sample-estimate.pdf');
      if (!obj) { return new Response('File not found', { status: 404 }); }
      return new Response(obj.body, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="sample-estimate.pdf"', 'Cache-Control': 'public, max-age=3600' } });
    }
    const extra = routeExtraPage(path); if (extra) { return extra; }
    if (path !== '/') { return new Response(notFoundPage(), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } }); }
    return new Response(HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
  }
};

// Upload limits for drawings sent through the quote form
const FAVICON_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAAAYFBMVEUPeCyyzsBmnoEeckeArpadwK4fc0c+hGAAXCwecEb9/f0ic0oQZzobbUMAAAB0p43i7edJi2kAVVW50sUeckZYlXaTuqapyLgdckaFspvH29HS4trd6eNhm30dcUY5gVw3zHuwAAAAIHRSTlMD//+K//9A///+/////gD///8D/8n///9q//////85/ywN7O8AAAPISURBVHja7VqJbqMwEDVJ09aMXUMCIeEI//+XO74PIG1XsVYrMWqlhLHn2XM8DwHypeSM/+/Hhr5EmuO7MYlCjP3zraFAXyRAm9vZIBBt/9FI6/w19qUZaB4agSj7Nwqc0xcK50BvCoHIvxvQDAI3bf0s7fPX2+cS4fxF0P80h31lFONACGny2JcIDZpHB2WyjwgyDKShGQW38KBZ5UGOkNM+HPOF2IaZZpYdYAfYAXaAHWAH+GcAoGVTQ3+jISu9N2dKeDIBYEPxRLMEwKF8boUQUw2MheNRAzUqhFLEUxi0VpPeZZBk9QzuQ6ml6mpcklOx+VQZDSqCOQxEbxRl0XIG2wB4k/BWhtKBHQ5MhIqrv51g0xhq+jpGIJF9uJSJtHo4sGt8vbAAqaIsRYRAol61L8tVhGT9ag/KDLBuOeUtRCChM936++JiI1HivhBafx5EXVuHz3gd2N1PKfpk2wmAW2UlQGZcbdbWYS4ZVaeT8aS+3OX12pi8y1TiYNw1BncEJHCQTpIBZDrLajCrw6jpvY1UKjATVFR7CXCxQ7gsNc7aRRjIYgM2cdx09LbGvkcBHzHAdeIS67LLKkCfgFsHDNyEYLIAd+0Hm1qdN2eD5X1EtlVo6iDrc8Iwd1JmToMdDBx4b33oHa1KWiwBwLivi5JYB5UadrKT+KBHmjWNUa2yaGgIICIPcSWOIgOutCMnTDRdc3ZNagpNWNUDXEM/W8pekrCPjN30dWUKbAK0pkCv1VgZGWdPec6+St5D6ZMLN+amjJUvtS2AkAHmkFMnRwcLgGDKYRNgegaAbC48E8Uu+h5ABEQV0FIAgJV6DZjOeuvyQ4AwTYG3dxTDazb/HZubVDNpWuk847Wa0kW5sl1oKps/u+ASUsiQLC8uNFUsnyKpPZKStVmdTjZFQT3XLqirMp5s41YEeWqsrFCF8+HsyU6EDjfpM84LspIOgehKv0J2jq5HUNyLO56CFVv4HrivJWCFpVMzZa426TpIA6FOj4+TO3CQBMyXE/OCNvmHPUA/1IFjWoaR8vUj0yX/cEmOTLPS8uKlQz8HuRlOWT8y5W8jG4e+zbBYZCBh2VRsH/oy0YvVpmIb4HdtiyxVUUXdjz4/nwFQ1g4/bbySPnB0rSOHoVrIAPaA4wdHLMX0tHU0zS+0eFS2UfMLKxI0tNgWH0y//Lz53Wzf+Yr8Xfv+zX3G9q9/P78B2W8Cd4AdYAfYAXaA/xIg+2Ou7A/qsj9qzP6wNP/j3twPrLM/cs/+0kD+1x7yv7iR/9WT/C/P5Hz95w8Sf2RnpNE8bwAAAABJRU5ErkJggg=='; const MAX_FILES = 10;
const MAX_FILE_BYTES = 25 * 1024 * 1024;   // 25MB per file
const MAX_TOTAL_BYTES = 90 * 1024 * 1024;  // 90MB per enquiry (Cloudflare allows 100MB per request)
const ALLOWED_EXT = ['pdf', 'dwg', 'dxf', 'jpg', 'jpeg', 'png', 'zip'];

function json(data, status) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

function safeFileName(name) {
  const cleaned = String(name || 'file').replace(/[^A-Za-z0-9._ -]/g, '_').replace(/\s+/g, ' ').trim();
  return (cleaned || 'file').slice(0, 120);
}

async function handleEnquiry(request, env, url) {
  if (!env.Files) { return json({ ok: false, error: 'Storage is not configured.' }, 500); }
  let form;
  try { form = await request.formData(); } catch (e) { return json({ ok: false, error: 'Could not read the form. Please try again.' }, 400); }
  if (form.get('_honey')) { return json({ ok: true, id: 'ignored', links: [] }); }
  const name = String(form.get('name') || '').trim();
  const email = String(form.get('email') || '').trim();
  const message = String(form.get('message') || '').trim();
  if (!name || !email || !message) { return json({ ok: false, error: 'Please fill in your name, email and project details.' }, 400); }

  const files = form.getAll('file').filter(function (f) { return f && typeof f === 'object' && f.size > 0; });
  if (files.length > MAX_FILES) { return json({ ok: false, error: 'Please upload no more than ' + MAX_FILES + ' files.' }, 400); }
  let total = 0;
  for (const f of files) {
    const ext = String(f.name || '').split('.').pop().toLowerCase();
    if (ALLOWED_EXT.indexOf(ext) === -1) { return json({ ok: false, error: f.name + ' is not an accepted file type (PDF, DWG, DXF, JPG, PNG or ZIP).' }, 400); }
    if (f.size > MAX_FILE_BYTES) { return json({ ok: false, error: f.name + ' is over 25MB. Please email it or send a WeTransfer link.' }, 400); }
    total += f.size;
  }
  if (total > MAX_TOTAL_BYTES) { return json({ ok: false, error: 'Total upload is over 90MB. Please email the larger files or send a WeTransfer link.' }, 400); }

  const id = crypto.randomUUID();
  const links = [];
  const used = new Set(['enquiry.json']);
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    let fname = safeFileName(f.name);
    if (used.has(fname)) { fname = (i + 1) + '-' + fname; }
    used.add(fname);
    await env.Files.put('enquiries/' + id + '/' + fname, f.stream(), { httpMetadata: { contentType: f.type || 'application/octet-stream' } });
    links.push(url.origin + '/files/' + id + '/' + encodeURIComponent(fname));
  }

  // Keep a copy of every enquiry in storage as a backup to the email
  const record = {
    received: new Date().toISOString(),
    name: name, company: String(form.get('company') || ''), email: email,
    phone: String(form.get('phone') || ''), service: String(form.get('service') || ''), referrer: String(form.get('referrer') || '').slice(0, 120),
    message: message, files: links
  };
  await env.Files.put('enquiries/' + id + '/enquiry.json', JSON.stringify(record, null, 2), { httpMetadata: { contentType: 'application/json' } });

  return json({ ok: true, id: id, links: links });
}

async function serveUpload(path, env) {
  if (!env.Files) { return new Response('Not found', { status: 404 }); }
  const parts = path.split('/'); // ['', 'files', id, name]
  if (parts.length !== 4) { return new Response('Not found', { status: 404 }); }
  const id = parts[2];
  let name;
  try { name = decodeURIComponent(parts[3]); } catch (e) { return new Response('Not found', { status: 404 }); }
  if (!/^[0-9a-f-]{36}$/.test(id) || !name || name === 'enquiry.json' || name.indexOf('/') !== -1) { return new Response('Not found', { status: 404 }); }
  const obj = await env.Files.get('enquiries/' + id + '/' + name);
  if (!obj) { return new Response('Not found', { status: 404 }); }
  return new Response(obj.body, { headers: {
    'Content-Type': (obj.httpMetadata && obj.httpMetadata.contentType) || 'application/octet-stream',
    'Content-Disposition': 'attachment; filename="' + name.replace(/"/g, '') + '"',
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex'
  } });
}
const HTML = `<!DOCTYPE html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0"><title>Building Estimating Services UK | TheGo2Guys</title><meta name="description" content="Building estimates for UK builders: extensions, loft conversions and new homes. Measured from your drawings, priced at current UK rates. From £120, 3–5 working days."><link rel="canonical" href="https://thego2guys.uk/"><meta name="theme-color" content="#18211D"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..800&family=Public+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="icon" type="image/png" sizes="96x96" href="/favicon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/styles.css"><script type="application/ld+json">{"@context":"https://schema.org","@type":"ProfessionalService","name":"TheGo2Guys","url":"https://thego2guys.uk/","description":"Building estimating service for UK builders and homeowners: extensions, loft conversions and new homes, measured from drawings and priced at current UK rates.","telephone":"+441516621274","email":"hello@thego2guys.uk","address":{"@type":"PostalAddress","addressLocality":"Liverpool","addressRegion":"Merseyside","addressCountry":"GB"},"areaServed":[{"@type":"City","name":"Liverpool"},{"@type":"AdministrativeArea","name":"North West England"},{"@type":"Country","name":"United Kingdom"}],"priceRange":"From £120"}</script></head><body><a class="skip" href="#main">Skip to content</a><header><div class="container nav-bar"><a href="#top" class="logo"><div class="logo-icon">G2G</div>TheGo2Guys</a><ul class="nav-links" id="navLinks"><li><a href="#services">Services</a></li><li><a href="/calculators">Free tools</a></li><li><a href="/guides">Cost guides</a></li><li><a href="/insights">Insights</a></li><li><a href="#pricing">Pricing</a></li><li><a href="tel:01516621274" class="nav-phone">0151 662 1274</a></li><li><a href="#contact" class="nav-cta">Request a quote</a></li></ul><button class="mobile-menu-btn" aria-label="Menu" aria-controls="navLinks" onclick="document.getElementById('navLinks').classList.toggle('open')">&#9776;</button></div></header><main id="main"><section class="hero" id="top"><div class="container"><div class="hero-copy"><h1>Building estimates for extensions and new homes</h1><p class="lede">Send us your drawings. We measure every item, price it at current UK rates and return a clear, itemised estimate within 3&ndash;5 working days.</p><div class="hero-cta"><a href="#contact" class="btn-primary">Request a quote</a><a href="#sample" class="btn-ghost">See an example estimate</a></div><dl class="facts"><div><dt>Prices from</dt><dd>£120</dd></div><div><dt>Turnaround</dt><dd>3&ndash;5 days</dd></div><div><dt>Express</dt><dd>48 hours</dd></div><div><dt>Coverage</dt><dd>UK-wide</dd></div></dl></div></div></section><section class="services" id="services"><div class="container split"><div class="split-head"><h2>What we prepare</h2><p>Estimates for builders and contractors working on residential projects, from single-storey extensions to new-build houses.</p><div class="includes"><h3>Every estimate includes</h3><ul><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>An elemental summary with cost per m²</li><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>Every item measured, with quantities and rates</li><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>Assumptions and exclusions set out clearly</li><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>A PDF with revision control, ready to share</li></ul></div></div><dl class="service-list"><div><dt>Material takeoffs</dt><dd>Quantities for every item on your drawings, so you can order from your merchant with confidence.</dd></div><div><dt>Cost estimates</dt><dd>Labour, materials and plant priced at current UK rates, with an elemental summary and cost per m².</dd></div><div><dt>Bills of quantities</dt><dd>Itemised and measured generally to RICS NRM2, ready to send to subcontractors or your client.</dd></div><div><dt>Tender pricing</dt><dd>Priced schedules for tender returns, set out so every figure is easy to check.</dd></div></dl></div></section><section class="process" id="process"><div class="container"><h2>How it works</h2><ol class="steps"><li><span class="step-n">1</span><h3>Send your drawings and specification</h3><p>Upload plans, sections, elevations and any specification through the form below, or email them. We confirm the scope and price within 24 hours.</p></li><li><span class="step-n">2</span><h3>We measure and price</h3><p>We do a full takeoff from your drawings and price every item at current rates for your region.</p></li><li><span class="step-n">3</span><h3>You receive your estimate</h3><p>An itemised PDF in 3&ndash;5 working days, or 48 hours with express. If you have any questions about it, we'll go through them with you directly.</p></li></ol></div></section><section class="sample" id="sample"><div class="container sample-grid"><div class="sample-copy"><h2>See an example</h2><p>A sample estimate for a single-storey rear extension, in the same format your project would be issued in.</p><p>It runs to seven pages: an elemental summary, every measured item with quantities and rates, and the assumptions and exclusions behind the figures.</p><a href="/sample-estimate.pdf" target="_blank" rel="noopener" class="btn-ghost">Open the sample estimate (PDF)</a></div><div class="sample-doc"><a href="/sample-estimate.pdf" target="_blank" rel="noopener" class="doc" aria-label="Open the full sample estimate (PDF)"><span class="doc-stamp">Sample</span><div class="doc-head"><span class="logo-icon sm">G2G</span><span>Cost estimate</span><span class="doc-ref">G2G-EST-0001 Rev P02</span></div><p class="doc-title">Single-storey rear extension</p><p class="doc-sub">Estimate summary, Merseyside, Q4 2026 prices</p><dl class="doc-kpis"><div><dt>Total excl. VAT</dt><dd>£46,451</dd></div><div><dt>Cost per m²</dt><dd>£2,853</dd></div><div><dt>Floor area</dt><dd>16.28 m²</dd></div><div><dt>Programme</dt><dd>10 weeks</dd></div></dl><table class="doc-table"><thead><tr><th>Ref</th><th>Element</th><th>£</th></tr></thead><tbody><tr><td>1</td><td>Preliminaries</td><td>6,210</td></tr><tr><td>2</td><td>Demolitions and alterations</td><td>3,888</td></tr><tr><td>3</td><td>Substructure</td><td>4,545</td></tr><tr><td>4</td><td>Ground floor</td><td>1,743</td></tr><tr><td>5</td><td>External walls</td><td>6,370</td></tr><tr><td>6</td><td>Roof</td><td>6,347</td></tr><tr><td>7</td><td>Windows and external doors</td><td>5,820</td></tr><tr><td>8</td><td>Internal finishes</td><td>1,781</td></tr><tr><td>9</td><td>Services</td><td>2,200</td></tr><tr><td>10</td><td>Drainage</td><td>1,038</td></tr><tr><td>11</td><td>External works</td><td>450</td></tr></tbody><tfoot><tr><td></td><td>Construction cost</td><td>40,393</td></tr><tr><td></td><td>Overheads, profit and contingency</td><td>6,059</td></tr><tr class="doc-total"><td></td><td>Estimate total excl. VAT</td><td>46,451</td></tr></tfoot></table><span class="doc-open">Open the full 7-page PDF</span></a></div></div></section><section class="pricing" id="pricing"><div class="container split"><div class="split-head"><h2>Pricing</h2><p>Typical starting prices. Send your drawings and we confirm the exact price before any work starts. Larger or unusual projects are quoted individually.</p></div><div><table class="price-table"><thead><tr><th scope="col">Work</th><th scope="col">Scope</th><th scope="col" class="num">From</th></tr></thead><tbody><tr><th scope="row">Material takeoff</th><td>Quantities only, for jobs you price yourself</td><td class="num">£120</td></tr><tr><th scope="row">Single-storey extension</th><td>Full measured estimate</td><td class="num">£150</td></tr><tr><th scope="row">Double-storey extension</th><td>Full measured estimate</td><td class="num">£250</td></tr><tr><th scope="row">New-build house</th><td>Full measured estimate, single dwelling</td><td class="num">£450</td></tr></tbody></table><div class="price-notes"><p><strong>Standard turnaround:</strong> 3&ndash;5 working days from receipt of full drawings.</p><p><strong>Express:</strong> 48 hours, at an extra 50%.</p></div><a href="#contact" class="btn-primary">Request a quote</a></div></div></section><section class="contact" id="contact"><div class="container contact-grid"><div class="contact-info"><h2>Request a quote</h2><p>Send your drawings and a few details. We reply within 24 hours with a price and a delivery date.</p><dl class="contact-list"><div><dt>Email</dt><dd><a href="mailto:hello@thego2guys.uk">hello@thego2guys.uk</a></dd></div><div><dt>Phone</dt><dd><a href="tel:01516621274">0151 662 1274</a></dd></div><div><dt>Coverage</dt><dd>UK-wide</dd></div></dl></div><form class="contact-form" id="quoteForm" novalidate><div class="form-row"><div class="form-group"><label for="name">Full name *</label><input type="text" id="name" name="name" required autocomplete="name"></div><div class="form-group"><label for="company">Company</label><input type="text" id="company" name="company" autocomplete="organization"></div></div><div class="form-row"><div class="form-group"><label for="email">Email *</label><input type="email" id="email" name="email" required autocomplete="email"></div><div class="form-group"><label for="phone">Phone</label><input type="tel" id="phone" name="phone" autocomplete="tel"></div></div><div class="form-group"><label for="service">Service *</label><select id="service" name="service" required><option value="">Select a service</option><option value="Material Takeoffs">Material takeoff</option><option value="Cost Estimates">Cost estimate</option><option value="Bills of Quantities">Bill of quantities</option><option value="Tender Pricing">Tender pricing</option><option value="Multiple Services">Not sure / more than one</option></select></div><div class="form-group"><label for="message">Project details *</label><textarea id="message" name="message" required placeholder="Type of project, approximate size, location and when you need the estimate"></textarea></div><div class="form-group"><label for="referrer">Referred by another builder?</label><input type="text" id="referrer" name="referrer" placeholder="Their name or company (optional)" autocomplete="off"></div><div class="form-group"><label for="file">Drawings</label><input type="file" id="file" name="file" accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.zip" multiple><p class="form-hint">PDF, DWG, DXF, JPG, PNG or ZIP. Up to 10 files, 25MB each.</p></div><div style="position:absolute;left:-9999px;" aria-hidden="true"><label for="hp">Leave this empty</label><input type="text" id="hp" name="_honey" tabindex="-1" autocomplete="off"></div><button type="submit" class="form-submit" id="quoteSubmit">Send request</button><div class="form-status" id="formStatus" role="status" aria-live="polite"></div><p class="form-note">Files too large? Email them to <a href="mailto:hello@thego2guys.uk">hello@thego2guys.uk</a> or send a WeTransfer link.</p></form></div></section></main><footer><div class="container"><div class="footer-top"><div class="footer-brand"><a href="#top" class="logo"><div class="logo-icon">G2G</div>TheGo2Guys</a><p>Building estimates for UK builders and contractors.</p></div><div class="footer-col"><h4>Services</h4><ul><li><a href="#services">Material takeoffs</a></li><li><a href="#services">Cost estimates</a></li><li><a href="#services">Bills of quantities</a></li><li><a href="#services">Tender pricing</a></li></ul></div><div class="footer-col"><h4>Company</h4><ul><li><a href="#process">How it works</a></li><li><a href="#pricing">Pricing</a></li><li><a href="/calculators">Free calculators</a></li><li><a href="/guides">Cost guides</a></li><li><a href="/insights">Insights</a></li><li><a href="/sample-estimate.pdf" target="_blank" rel="noopener">Sample estimate</a></li><li><a href="/refer">Refer a builder</a></li><li><a href="/terms">Terms and conditions</a></li><li><a href="/privacy">Privacy policy</a></li></ul></div><div class="footer-col"><h4>Contact</h4><ul><li><a href="mailto:hello@thego2guys.uk">hello@thego2guys.uk</a></li><li><a href="tel:01516621274">0151 662 1274</a></li><li>UK-wide</li></ul></div></div><div class="footer-bottom"><p>&copy; 2026 TheGo2Guys. Building estimating services, UK.</p></div></div></footer><script src="/script.js"></script><script>(function(){try{var r=new URLSearchParams(location.search).get('ref');var f=document.getElementById('referrer');if(r&&f){f.value=r.slice(0,80);}}catch(e){}})();</script></body></html>`;
const STYLES = `:root{--ink:#18211D;--ink-2:#2B3530;--paper:#fff;--mist:#F2F4F1;--rule:#D8DDD8;--muted:#5B6660;--green:#1E7046;--green-dark:#155535;--green-tint:#E5F0E9;--amber:#B57A00;
--navy:var(--ink);--navy-light:var(--ink-2);--blue:var(--green);--blue-light:#2A8A58;--blue-50:var(--green-tint);--green-light:var(--green-tint);--steel:var(--muted);--steel-50:var(--mist);--gray-50:var(--mist);--gray-100:#E8ECE8;--gray-200:var(--rule);--gray-300:#C5CCC6;--gray-500:var(--muted);--gray-700:#36403B;--gray-800:var(--ink);--gray-900:#121915;--white:#fff;--radius:6px;--shadow-lg:0 1px 2px rgba(24,33,29,.06),0 8px 24px -12px rgba(24,33,29,.18);--shadow-xl:0 2px 4px rgba(24,33,29,.06),0 24px 48px -20px rgba(24,33,29,.35);
--display:'Archivo','Arial Narrow',Arial,sans-serif;--body:'Public Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;scroll-padding-top:84px}
body{font-family:var(--body);font-size:17px;color:var(--ink);line-height:1.6;background:var(--paper);-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:var(--green)}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #7FB89A;outline-offset:2px}
.skip{position:absolute;left:-9999px;top:8px;background:var(--ink);color:#fff;padding:8px 14px;z-index:200}.skip:focus{left:8px}
.container{max-width:1160px;margin:0 auto;padding:0 24px}
h1,h2,h3,h4{font-family:var(--display);font-stretch:112%;color:var(--ink);font-weight:700;line-height:1.08;letter-spacing:-.01em}
h2{font-size:clamp(28px,3.4vw,40px);margin-bottom:14px}
header{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-bottom:1px solid var(--rule)}
.nav-bar{display:flex;align-items:center;justify-content:space-between;height:72px}
.logo{display:flex;align-items:center;gap:10px;font-family:var(--display);font-stretch:112%;font-weight:800;font-size:20px;color:var(--ink);text-decoration:none}
.logo-icon{width:40px;height:40px;background:var(--green);border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--display);font-size:14px;font-weight:800;flex-shrink:0}
.logo-icon.sm{width:26px;height:26px;font-size:10px;border-radius:4px}
.nav-links{display:flex;gap:28px;list-style:none;align-items:center}.nav-links a{text-decoration:none;color:var(--gray-700);font-weight:500;font-size:15px}.nav-links a:hover{color:var(--green)}
.nav-phone{font-variant-numeric:tabular-nums;color:var(--ink)!important;font-weight:600!important}
.nav-cta{background:var(--green);color:#fff!important;padding:10px 18px;border-radius:6px;font-weight:600!important}.nav-cta:hover{background:var(--green-dark)}
.mobile-menu-btn{display:none;background:none;border:none;font-size:24px;cursor:pointer;color:var(--ink);padding:8px}
.btn-primary,.btn-ghost,.form-submit{display:inline-flex;align-items:center;justify-content:center;font-family:var(--body);font-size:16px;font-weight:600;padding:14px 24px;border-radius:6px;text-decoration:none;cursor:pointer;transition:background-color .15s,border-color .15s}
.btn-primary{background:var(--green);color:#fff;border:1px solid var(--green)}.btn-primary:hover{background:var(--green-dark);border-color:var(--green-dark)}
.btn-ghost{background:transparent;color:var(--ink);border:1px solid var(--gray-300)}.btn-ghost:hover{border-color:var(--ink)}
section{padding:96px 0}
.hero{padding:96px 0 88px;background:var(--mist);border-bottom:1px solid var(--rule)}
.hero-copy{max-width:760px}.sample{background:var(--mist);border-bottom:1px solid var(--rule)}.sample-grid{display:grid;grid-template-columns:5fr 7fr;gap:72px;align-items:center}.sample-copy p{color:var(--gray-700);margin-bottom:16px;max-width:28em}.sample-copy .btn-ghost{margin-top:12px;background:#fff}
.hero h1{font-size:clamp(38px,5.6vw,72px);font-weight:800;margin-bottom:22px;letter-spacing:-.02em}
.lede{font-size:19px;color:var(--gray-700);max-width:34em;margin-bottom:32px}
.hero-cta{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:44px}
.facts{display:grid;grid-template-columns:repeat(4,auto);justify-content:start;gap:0;border-top:1px solid var(--gray-300);padding-top:20px}
.facts div{padding-right:28px;margin-right:28px;border-right:1px solid var(--rule)}.facts div:last-child{border-right:none;margin-right:0;padding-right:0}
.facts dt{font-size:13px;color:var(--muted)}.facts dd{font-family:var(--display);font-stretch:112%;font-weight:700;font-size:22px;color:var(--ink)}
.doc{position:relative;display:block;background:#fff;border:1px solid var(--rule);border-radius:4px;padding:28px 28px 22px;box-shadow:var(--shadow-xl);text-decoration:none;color:var(--ink);font-size:13px;line-height:1.4;font-variant-numeric:tabular-nums;transition:box-shadow .2s,transform .2s}
.doc:hover{transform:translateY(-3px);box-shadow:0 2px 4px rgba(24,33,29,.06),0 32px 56px -20px rgba(24,33,29,.42)}
.doc-stamp{position:absolute;top:22px;right:-10px;background:var(--amber);color:#fff;font-weight:700;font-size:12px;padding:5px 14px 5px 12px;border-radius:3px 0 0 3px;box-shadow:0 2px 6px rgba(0,0,0,.15)}
.doc-head{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--muted);padding-bottom:12px;border-bottom:2px solid var(--green);margin-bottom:16px}
.doc-ref{margin-left:auto;padding-right:56px}
.doc-title{font-family:var(--display);font-stretch:112%;font-weight:700;font-size:21px}.doc-sub{font-size:12px;color:var(--muted);margin:2px 0 16px}
.doc-kpis{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--rule);border-radius:3px;margin-bottom:16px}
.doc-kpis div{padding:9px 10px;border-right:1px solid var(--rule)}.doc-kpis div:last-child{border-right:none}
.doc-kpis dt{font-size:10.5px;color:var(--muted)}.doc-kpis dd{font-weight:700;font-size:15px}
.doc-table{width:100%;border-collapse:collapse;font-size:12px}
.doc-table th{text-align:left;font-size:11px;font-weight:600;color:var(--muted);border-bottom:1px solid var(--gray-300);padding:5px 4px}
.doc-table td{padding:3.5px 4px;border-bottom:1px solid #EEF1EE}
.doc-table td:first-child,.doc-table th:first-child{width:28px;color:var(--muted)}
.doc-table td:last-child,.doc-table th:last-child{text-align:right}
.doc-table tfoot td{font-weight:600;border-bottom:none;padding-top:6px}.doc-table tfoot tr:first-child td{border-top:1px solid var(--gray-300)}
.doc-total td{background:var(--ink);color:#fff;font-weight:700;padding:7px 6px}
.doc-open{display:block;margin-top:14px;text-align:right;font-size:13px;font-weight:600;color:var(--green)}
.split{display:grid;grid-template-columns:5fr 7fr;gap:72px;align-items:start}
.split-head>p{color:var(--gray-700);max-width:28em}
.includes{margin-top:32px;padding-top:24px;border-top:1px solid var(--rule)}
.includes h3{font-size:17px;margin-bottom:12px}.includes ul{list-style:none}.includes li{display:flex;gap:10px;align-items:baseline;padding:5px 0;font-size:16px;color:var(--gray-700)}.includes svg{color:var(--green);flex-shrink:0;position:relative;top:2px}
.service-list{border-top:2px solid var(--ink)}
.service-list div{display:grid;grid-template-columns:200px 1fr;gap:24px;padding:24px 0;border-bottom:1px solid var(--rule)}
.service-list dt{font-family:var(--display);font-stretch:112%;font-weight:700;font-size:19px}.service-list dd{color:var(--gray-700)}
.process{background:var(--ink);color:#DDE3DF}.process h2{color:#fff;margin-bottom:40px}
.steps{list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:40px;counter-reset:none}
.steps li{border-top:1px solid rgba(255,255,255,.22);padding-top:20px}
.step-n{display:block;font-family:var(--display);font-stretch:112%;font-weight:800;font-size:44px;line-height:1;color:#7FB89A;margin-bottom:14px}
.steps h3{color:#fff;font-size:20px;margin-bottom:8px}.steps p{font-size:16px;color:#C3CCC6}
.pricing{background:#fff}
.price-table{width:100%;border-collapse:collapse;border-top:2px solid var(--ink);margin-bottom:24px;font-variant-numeric:tabular-nums}
.price-table th,.price-table td{padding:18px 12px 18px 0;border-bottom:1px solid var(--rule);text-align:left;vertical-align:baseline}
.price-table thead th{font-size:13px;font-weight:600;color:var(--muted);padding-top:12px;padding-bottom:12px}
.price-table tbody th{font-family:var(--display);font-stretch:112%;font-weight:700;font-size:18px}
.price-table td{color:var(--gray-700);font-size:15px}
.price-table .num{text-align:right;padding-right:0}.price-table tbody .num{font-family:var(--display);font-stretch:112%;font-weight:700;font-size:24px;color:var(--ink)}
.price-notes{display:grid;gap:6px;margin-bottom:28px;font-size:15px;color:var(--gray-700)}.price-notes strong{color:var(--ink)}
.contact{background:var(--mist);border-top:1px solid var(--rule)}
.contact-grid{display:grid;grid-template-columns:5fr 7fr;gap:72px;align-items:start}
.contact-info>p{color:var(--gray-700);margin-bottom:28px}
.contact-list div{padding:14px 0;border-top:1px solid var(--rule)}.contact-list dt{font-size:13px;color:var(--muted)}.contact-list dd{font-weight:600}.contact-list a{color:var(--ink);text-decoration:none}.contact-list a:hover{color:var(--green)}
.contact-form{position:relative;background:#fff;border:1px solid var(--rule);border-radius:6px;padding:32px;box-shadow:var(--shadow-lg)}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}.form-group{margin-bottom:18px}
.form-group label{display:block;font-size:14px;font-weight:600;color:var(--ink);margin-bottom:6px}
.form-group input,.form-group select,.form-group textarea{width:100%;padding:12px 14px;border:1px solid var(--gray-300);border-radius:5px;font-size:16px;font-family:inherit;color:var(--ink);background:#fff}
.form-group input:focus,.form-group select:focus,.form-group textarea:focus{border-color:var(--green)}
.form-group textarea{resize:vertical;min-height:110px}.form-group input[type=file]{padding:10px;background:var(--mist)}
.form-hint{font-size:13px;color:var(--muted);margin-top:6px}
.form-submit{width:100%;background:var(--green);color:#fff;border:1px solid var(--green)}.form-submit:hover{background:var(--green-dark)}.form-submit:disabled{opacity:.7;cursor:wait}
.form-status{display:none;margin-top:14px;padding:12px 14px;border-radius:5px;font-size:15px}.form-status.show{display:block}.form-status.ok{background:var(--green-tint);color:var(--green-dark)}.form-status.err{background:#FBE9E7;color:#A12A1B}
.form-note{font-size:13px;color:var(--muted);margin-top:14px;text-align:center}
.section-header{text-align:center;max-width:640px;margin:0 auto 48px}.section-tag{display:inline-block;color:var(--green);font-size:14px;font-weight:600;margin-bottom:10px}
.section-header h2{font-size:clamp(28px,3.4vw,40px)}.section-header p{font-size:17px;color:var(--muted)}
footer{background:var(--gray-900);color:rgba(255,255,255,.62);padding:56px 0 28px}
.footer-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:40px}
.footer-brand .logo{color:#fff;margin-bottom:14px}.footer-brand p{font-size:14px;max-width:300px}
.footer-col h4{color:#fff;font-size:15px;margin-bottom:14px}.footer-col ul{list-style:none}.footer-col li{margin-bottom:9px;font-size:14px}
.footer-col a{color:rgba(255,255,255,.62);text-decoration:none}.footer-col a:hover{color:#fff}
.footer-bottom{border-top:1px solid rgba(255,255,255,.12);padding-top:22px;font-size:13px}
.page-hero{padding:72px 0 56px;background:var(--mist);border-bottom:1px solid var(--rule)}
.crumbs{font-size:14px;color:var(--muted);margin-bottom:14px}.crumbs a{color:var(--muted)}
.page-hero h1{font-size:clamp(34px,4.6vw,56px);font-weight:800;margin-bottom:16px;letter-spacing:-.02em;max-width:18em}
.page-hero .lede{margin-bottom:0}
section.plain{padding:72px 0}section.plain.alt{background:var(--mist);border-top:1px solid var(--rule);border-bottom:1px solid var(--rule)}
.tool-grid{display:grid;grid-template-columns:6fr 5fr;gap:48px;align-items:start}
.calc{background:#fff;border:1px solid var(--rule);border-radius:6px;padding:28px;box-shadow:var(--shadow-lg)}
.calc h2{font-size:22px;margin-bottom:18px}
.calc-out{background:var(--ink);color:#DDE3DF;border-radius:6px;padding:28px;position:sticky;top:96px}
.calc-out h2{color:#fff;font-size:22px;margin-bottom:12px}
.out-list div{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:12px 0;border-top:1px solid rgba(255,255,255,.16)}
.out-list dt{color:#C3CCC6;font-size:15px}.out-list dd{font-family:var(--display);font-stretch:112%;font-weight:700;font-size:20px;color:#fff;text-align:right;font-variant-numeric:tabular-nums}
.out-list div.big dd{font-size:28px;color:#9FD3B4}
.out-note{font-size:13px;color:#A9B4AD;margin-top:14px}
.calc-out .btn-primary{margin-top:20px;width:100%}
.prose{max-width:760px}.prose h2{margin-top:48px}.prose h2:first-child{margin-top:0}.prose h3{font-size:20px;margin:28px 0 8px}.prose p,.prose li{color:var(--gray-700);margin-bottom:14px}.prose ul,.prose ol{padding-left:22px;margin-bottom:14px}.prose strong{color:var(--ink)}
.table-wrap{overflow-x:auto;margin:8px 0 24px}
.data-table{width:100%;border-collapse:collapse;border-top:2px solid var(--ink);font-variant-numeric:tabular-nums;font-size:15px}.data-table th,.data-table td{padding:12px 12px 12px 0;border-bottom:1px solid var(--rule);text-align:left;vertical-align:top}.data-table thead th{font-size:13px;color:var(--muted);font-weight:600}.data-table tbody th{font-weight:600;color:var(--ink)}.data-table td{color:var(--gray-700)}.data-table .num{text-align:right;padding-right:0;white-space:nowrap}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px}
.card{display:block;background:#fff;border:1px solid var(--rule);border-radius:6px;padding:24px;text-decoration:none;color:var(--ink);transition:border-color .15s,box-shadow .15s}.card:hover{border-color:var(--green);box-shadow:var(--shadow-lg)}.card h3{font-size:20px;margin-bottom:8px}.card p{color:var(--gray-700);font-size:15px}.card-go{display:inline-block;margin-top:14px;font-weight:600;color:var(--green);font-size:15px}
.cta-band{background:var(--ink);padding:64px 0}.cta-inner{display:flex;justify-content:space-between;align-items:center;gap:32px;flex-wrap:wrap}.cta-band h2{color:#fff}.cta-band p{color:#C3CCC6;max-width:36em}
.callout{background:var(--green-tint);border-left:4px solid var(--green);padding:18px 20px;border-radius:0 6px 6px 0;margin:8px 0 24px}.callout p{margin:0;color:var(--ink)}.callout ul{margin:8px 0 0}
.pub-date{font-size:14px;color:var(--muted)}.card-date{font-size:13px;color:var(--muted);margin-bottom:6px}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:16px 0 24px}
.two-col .card:hover{border-color:var(--rule);box-shadow:none}
.legal h2{font-size:22px;margin-top:36px;margin-bottom:8px}.legal h2:first-child{margin-top:0}
@media(max-width:968px){.nav-links{display:none}.mobile-menu-btn{display:block}
.nav-links.open{display:flex;flex-direction:column;align-items:flex-start;position:absolute;top:72px;left:0;right:0;background:#fff;padding:20px 24px 24px;border-bottom:1px solid var(--rule);gap:18px;box-shadow:var(--shadow-lg)}
.sample-grid,.split,.contact-grid{grid-template-columns:1fr;gap:48px}.steps{grid-template-columns:1fr;gap:28px}section{padding:72px 0}.hero{padding:56px 0 72px}.footer-top{grid-template-columns:1fr 1fr}
.tool-grid,.two-col{grid-template-columns:1fr}.calc-out{position:static}}
@media(max-width:600px){body{font-size:16px}.container{padding:0 16px}.nav-bar{height:64px}.nav-links.open{top:64px}.logo{font-size:18px}.logo-icon{width:36px;height:36px;font-size:13px}
.lede{font-size:17px}.hero-cta{flex-direction:column}.hero-cta a{width:100%}
.facts{grid-template-columns:1fr 1fr;row-gap:16px}.facts div{border-right:none;margin-right:0;padding-right:12px}
.doc{padding:20px 16px 16px}.doc-ref{display:none}.doc-kpis{grid-template-columns:1fr 1fr}.doc-kpis div:nth-child(2){border-right:none}.doc-kpis div:nth-child(-n+2){border-bottom:1px solid var(--rule)}.doc-stamp{right:-6px;top:16px}
.service-list div{grid-template-columns:1fr;gap:6px}.price-table thead th:nth-child(2),.price-table tbody td:not(.num){display:none}
.form-row{grid-template-columns:1fr}.contact-form{padding:22px 18px}.footer-top{grid-template-columns:1fr}
.page-hero{padding:48px 0 40px}section.plain{padding:56px 0}.calc{padding:20px 16px}.calc-out{padding:22px 18px}.data-table{font-size:14px}.cta-band{padding:48px 0}.cta-inner .btn-primary{width:100%}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important}}`;
const SCRIPT = `(function(){
var nav=document.getElementById('navLinks');
document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var href=a.getAttribute('href');if(!href||href==='#')return;var t=document.querySelector(href);if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});if(nav)nav.classList.remove('open')}})});
var form=document.getElementById('quoteForm');if(!form)return;
var btn=document.getElementById('quoteSubmit'),statusEl=document.getElementById('formStatus');
var NOTIFY='https://formsubmit.co/ajax/harry@thego2guys.uk';
var MAX_FILES=10,MAX_FILE=25*1024*1024,MAX_TOTAL=90*1024*1024;
function show(msg,ok){statusEl.textContent=msg;statusEl.className='form-status show '+(ok?'ok':'err');}
function busy(on,label){btn.disabled=on;btn.textContent=label||'Send Request';}
form.addEventListener('submit',function(e){
e.preventDefault();statusEl.className='form-status';
var d=new FormData(form);
var name=String(d.get('name')||'').trim(),email=String(d.get('email')||'').trim(),service=String(d.get('service')||''),message=String(d.get('message')||'').trim();
if(!name||!email||!service||!message){show('Please fill in your name, email, service and project details.',false);return;}
if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)){show('Please enter a valid email address.',false);return;}
var files=document.getElementById('file').files,total=0;
if(files.length>MAX_FILES){show('Please upload no more than 10 files.',false);return;}
for(var i=0;i<files.length;i++){if(files[i].size>MAX_FILE){show(files[i].name+' is over 25MB. Please email it or send a WeTransfer link.',false);return;}total+=files[i].size;}
if(total>MAX_TOTAL){show('Total upload is over 90MB. Please email the larger files or send a WeTransfer link.',false);return;}
busy(true,files.length?'Uploading drawings...':'Sending...');
fetch('/api/enquiry',{method:'POST',body:d}).then(function(r){return r.json().then(function(j){if(!r.ok||!j.ok)throw new Error(j.error||'Upload failed');return j;});}).then(function(j){
if(j.id==='ignored')return {ok:true};
busy(true,'Sending...');
var payload={
_subject:'New quote request: '+service+' - '+name,
_template:'table',
_captcha:'false',
Name:name,
Company:String(d.get('company')||''),
email:email,
Phone:String(d.get('phone')||''),
Service:service,
'Project details':message,
'Referred by':String(d.get('referrer')||'')||'None',
Drawings:j.links.length?j.links.join('\\n'):'None uploaded',
Reference:j.id
};
return fetch(NOTIFY,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)}).then(function(r){if(!r.ok)throw new Error('notify');return r.json();}).then(function(res){if(!res||String(res.success)!=='true')throw new Error('notify');return {ok:true};});
}).then(function(){
form.reset();busy(false);
show('Thanks '+name.split(' ')[0]+', your request has been sent. We will be in touch within 24 hours.',true);
}).catch(function(err){
busy(false);
var m=err&&err.message&&err.message!=='notify'&&err.message!=='Failed to fetch'?err.message:'Sorry, something went wrong sending your request. Please email hello@thego2guys.uk or call 0151 662 1274.';
show(m,false);
});
});
})();`;

// ---------------------------------------------------------------------------
// Free calculators and cost guides
// ---------------------------------------------------------------------------
const SITE = 'https://thego2guys.uk';
const PAGE_HEADERS = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' };

function routeExtraPage(path) {
  const pages = {
    '/calculators': calculatorsIndexPage,
    '/calculators/bricks-and-blocks': brickCalcPage,
    '/calculators/concrete': concreteCalcPage,
    '/calculators/plaster': plasterCalcPage,
    '/guides': guidesIndexPage,
    '/guides/house-extension-cost': extensionGuidePage,
    '/guides/loft-conversion-cost': loftGuidePage,
    '/guides/extension-preliminaries': prelimsGuidePage,
    '/guides/garage-conversion-cost': garageGuidePage,
    '/guides/house-extension-cost-liverpool': extensionLiverpoolPage,
    '/guides/loft-conversion-cost-liverpool': loftLiverpoolPage,
    '/refer': referPage,
    '/insights': insightsIndexPage,
    '/insights/autumn-budget-2026-extensions-small-builders': budgetInsightPage,
    '/insights/steel-prices-mortgage-rates-october-2026': steelMortgageInsightPage,
    '/insights/construction-jobs-plan-builder-shortages-october-2026': jobsPlanInsightPage
  };
  if (pages[path]) { return new Response(pages[path](), { headers: PAGE_HEADERS }); }
  if (path === '/sitemap.xml') { return new Response(sitemapXml(), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }); }
  if (path === '/robots.txt') { return new Response('User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /files/\n\nSitemap: ' + SITE + '/sitemap.xml\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
  return null;
}

function sitemapXml() {
  const paths = ['/', '/calculators', '/calculators/bricks-and-blocks', '/calculators/concrete', '/calculators/plaster', '/guides', '/guides/house-extension-cost', '/guides/loft-conversion-cost', '/guides/extension-preliminaries', '/guides/garage-conversion-cost', '/guides/house-extension-cost-liverpool', '/guides/loft-conversion-cost-liverpool', '/insights', '/insights/autumn-budget-2026-extensions-small-builders', '/insights/steel-prices-mortgage-rates-october-2026', '/insights/construction-jobs-plan-builder-shortages-october-2026', '/refer', '/terms', '/privacy'];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map(function (p) { return '  <url><loc>' + SITE + (p === '/' ? '/' : p) + '</loc></url>'; }).join('\n') + '\n</urlset>\n';
}

// Runs a client-side function on the page once it has loaded
function inlineScript(fn) { return '<script>(' + fn.toString() + ')();</script>'; }

function pageShell(o) {
  return `<!DOCTYPE html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0"><title>${o.title}</title><meta name="description" content="${o.desc}">${o.noindex ? '<meta name="robots" content="noindex">' : '<link rel="canonical" href="' + SITE + o.path + '">'}<meta property="og:title" content="${o.title}"><meta property="og:description" content="${o.desc}"><meta property="og:url" content="${SITE}${o.path}"><meta property="og:type" content="website"><meta name="theme-color" content="#18211D"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..800&family=Public+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="icon" type="image/png" sizes="96x96" href="/favicon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/styles.css">${o.schema ? '<script type="application/ld+json">' + JSON.stringify(o.schema) + '</script>' : ''}</head><body><a class="skip" href="#main">Skip to content</a><header><div class="container nav-bar"><a href="/" class="logo"><div class="logo-icon">G2G</div>TheGo2Guys</a><ul class="nav-links" id="navLinks"><li><a href="/#services">Services</a></li><li><a href="/calculators">Free tools</a></li><li><a href="/guides">Cost guides</a></li><li><a href="/insights">Insights</a></li><li><a href="/#pricing">Pricing</a></li><li><a href="tel:01516621274" class="nav-phone">0151 662 1274</a></li><li><a href="/#contact" class="nav-cta">Request a quote</a></li></ul><button class="mobile-menu-btn" aria-label="Menu" aria-controls="navLinks" onclick="document.getElementById('navLinks').classList.toggle('open')">&#9776;</button></div></header><main id="main">${o.body}</main><footer><div class="container"><div class="footer-top"><div class="footer-brand"><a href="/" class="logo"><div class="logo-icon">G2G</div>TheGo2Guys</a><p>Building estimates for UK builders and contractors.</p></div><div class="footer-col"><h4>Free tools</h4><ul><li><a href="/calculators/bricks-and-blocks">Brick and block calculator</a></li><li><a href="/calculators/concrete">Concrete calculator</a></li><li><a href="/calculators/plaster">Plaster calculator</a></li><li><a href="/guides/house-extension-cost">Extension cost guide</a></li><li><a href="/guides/loft-conversion-cost">Loft conversion cost guide</a></li></ul></div><div class="footer-col"><h4>Company</h4><ul><li><a href="/#services">Services</a></li><li><a href="/#pricing">Pricing</a></li><li><a href="/sample-estimate.pdf" target="_blank" rel="noopener">Sample estimate</a></li><li><a href="/refer">Refer a builder</a></li><li><a href="/terms">Terms and conditions</a></li><li><a href="/privacy">Privacy policy</a></li></ul></div><div class="footer-col"><h4>Contact</h4><ul><li><a href="mailto:hello@thego2guys.uk">hello@thego2guys.uk</a></li><li><a href="tel:01516621274">0151 662 1274</a></li><li>UK-wide</li></ul></div></div><div class="footer-bottom"><p>&copy; 2026 TheGo2Guys. Building estimating services, UK.</p></div></div></footer><script src="/script.js"></script>${o.script || ''}</body></html>`;
}

function pageHero(crumbs, h1, lede) {
  const trail = crumbs.map(function (c) { return '<a href="' + c[0] + '">' + c[1] + '</a>'; }).join(' / ');
  return `<section class="page-hero"><div class="container"><p class="crumbs">${trail}</p><h1>${h1}</h1><p class="lede">${lede}</p></div></section>`;
}

function ctaBand(h, p) {
  return `<section class="cta-band"><div class="container cta-inner"><div><h2>${h}</h2><p>${p}</p></div><a class="btn-primary" href="/#contact">Request a quote</a></div></section>`;
}

const CALC_CTA = ctaBand('Need the whole job measured?', 'Send us your drawings and we take off every item, price it at current UK rates and send back an itemised estimate. From £120, in 3&ndash;5 working days.');

// --------------------------- Calculators index -----------------------------
function calculatorsIndexPage() {
  return pageShell({
    path: '/calculators',
    title: 'Free Building Material Calculators UK | TheGo2Guys',
    desc: 'Free calculators for UK builders: bricks and blocks, mortar, concrete and plaster. Quick quantities for pricing and ordering.',
    body: pageHero([['/', 'Home'], ['/calculators', 'Free tools']], 'Free building calculators', 'Quick quantities for pricing a job or putting an order together with your merchant. No sign-up.') +
      `<section class="plain"><div class="container"><div class="card-grid">
<a class="card" href="/calculators/bricks-and-blocks"><h3>Bricks, blocks and mortar</h3><p>Bricks or blocks for a wall, with the cement and building sand for the mortar.</p><span class="card-go">Open calculator &rarr;</span></a>
<a class="card" href="/calculators/concrete"><h3>Concrete</h3><p>How much concrete you need for a slab, shed base, basement floor or footing, as ready-mix or bags to mix yourself.</p><span class="card-go">Open calculator &rarr;</span></a>
<a class="card" href="/calculators/plaster"><h3>Plaster and plasterboard</h3><p>Bags of skim and undercoat, and sheets of board, for a room or a set area.</p><span class="card-go">Open calculator &rarr;</span></a>
<a class="card" href="/guides/house-extension-cost"><h3>Extension cost calculator</h3><p>A rough cost range for a single or double-storey extension by size, specification and region.</p><span class="card-go">Open calculator &rarr;</span></a>
<a class="card" href="/guides/loft-conversion-cost"><h3>Loft conversion budget</h3><p>A rough cost range for a Velux, dormer, hip-to-gable or mansard conversion.</p><span class="card-go">Open calculator &rarr;</span></a>
</div></div></section>` + CALC_CTA
  });
}

// ------------------------ Bricks, blocks and mortar ------------------------
const BRICK_FAQ = [
  ['How many bricks do I need per m²?', 'About 60 bricks per m² for a single-skin (half-brick) wall and 120 per m² for a one-brick (215mm) wall, using standard 215 x 102.5 x 65mm bricks with 10mm joints. Add around 5% for cuts and breakages.'],
  ['How many blocks are in a m²?', 'Ten standard 440 x 215mm concrete blocks make 1m² of wall, whatever the block thickness.'],
  ['How much mortar do I need for a block wall?', 'Roughly 0.009m³ of mortar per m² of 100mm blockwork. At a 1:5 mix that is about one 25kg bag of cement for every 8 to 9m² of wall, or a bag every 6 to 7m² if you allow for droppings and part-used mixes.'],
  ['What mortar mix should I use?', 'A 1:5 or 1:6 cement-to-sand mix suits most general walling above ground. Use a stronger 1:4 mix below the damp-proof course and in exposed garden walls.']
];

function brickCalcPage() {
  return pageShell({
    path: '/calculators/bricks-and-blocks',
    title: 'Brick Calculator UK: How Many Bricks and Blocks Do I Need? | TheGo2Guys',
    desc: 'How many bricks or blocks do you need? Enter your wall size to get the number of bricks or blocks, plus the cement and building sand for the mortar. Free UK calculator.',
    schema: faqSchema(BRICK_FAQ),
    body: pageHero([['/', 'Home'], ['/calculators', 'Free tools'], ['/calculators/bricks-and-blocks', 'Bricks and blocks']], 'Brick and block calculator', 'How many bricks or blocks you need for a wall, and the cement and building sand to lay them.') +
      `<section class="plain"><div class="container tool-grid"><form class="calc" id="calc" onsubmit="return false"><h2>Your wall</h2>
<div class="form-row"><div class="form-group"><label for="len">Wall length (m)</label><input id="len" type="number" inputmode="decimal" min="0" step="0.01" value="5"></div><div class="form-group"><label for="ht">Wall height (m)</label><input id="ht" type="number" inputmode="decimal" min="0" step="0.01" value="2.4"></div></div>
<div class="form-group"><label for="open">Openings to deduct (m²)</label><input id="open" type="number" inputmode="decimal" min="0" step="0.01" value="0"><p class="form-hint">Doors and windows. A standard door is about 1.7&nbsp;m², a typical window 1.2&ndash;2&nbsp;m².</p></div>
<div class="form-group"><label for="unit">Wall type</label><select id="unit"><option value="half">Bricks, half-brick wall (102.5mm)</option><option value="one">Bricks, one-brick wall (215mm)</option><option value="b100">Blocks, 100mm (440 x 215)</option><option value="b140">Blocks, 140mm (440 x 215)</option></select></div>
<div class="form-row"><div class="form-group"><label for="mix">Mortar mix</label><select id="mix"><option value="4">1:4 (stronger, below DPC)</option><option value="5" selected>1:5 (general)</option><option value="6">1:6 (internal / lightly loaded)</option></select></div><div class="form-group"><label for="waste">Wastage (%)</label><input id="waste" type="number" inputmode="decimal" min="0" max="50" step="1" value="5"></div></div>
</form>
<div class="calc-out" aria-live="polite"><h2>You'll need about</h2><dl class="out-list">
<div><dt>Wall area</dt><dd id="o-area">&ndash;</dd></div>
<div class="big"><dt id="o-unit-label">Bricks</dt><dd id="o-units">&ndash;</dd></div>
<div><dt>Mortar (wet volume)</dt><dd id="o-mortar">&ndash;</dd></div>
<div><dt>Cement (25kg bags)</dt><dd id="o-cement">&ndash;</dd></div>
<div><dt>Building sand</dt><dd id="o-sand">&ndash;</dd></div>
</dl><p class="out-note">Includes your wastage allowance. Quantities are approximate; check against your drawings and your merchant's product sizes before ordering.</p><a class="btn-primary" href="/#contact">Get the full job measured</a></div></div></section>
<section class="plain alt"><div class="container prose"><h2>How the numbers are worked out</h2>
<p>The calculator uses standard UK sizes: bricks at 215 x 102.5 x 65mm and blocks at 440 x 215mm, both with 10mm mortar joints.</p>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Wall type</th><th class="num">Units per m²</th><th class="num">Mortar per m²</th></tr></thead><tbody>
<tr><th>Half-brick wall (102.5mm)</th><td class="num">60 bricks</td><td class="num">0.022 m³</td></tr>
<tr><th>One-brick wall (215mm)</th><td class="num">120 bricks</td><td class="num">0.050 m³</td></tr>
<tr><th>100mm blockwork</th><td class="num">10 blocks</td><td class="num">0.009 m³</td></tr>
<tr><th>140mm blockwork</th><td class="num">10 blocks</td><td class="num">0.012 m³</td></tr>
</tbody></table></div>
<p>Mortar allowances include filling the frogs on bricks. To get cement and sand, the wet mortar volume is increased by about 27% to allow for the dry materials bulking down when mixed, then split by the mix ratio. Cement is taken at 1,440&nbsp;kg/m³ and building sand at 1.6 tonnes/m³.</p>
<h3>Things the calculator doesn't cover</h3>
<ul><li>Cavity walls: work out each leaf separately (for example, a half-brick outer leaf and a 100mm block inner leaf), then add wall ties at about 2.5 per m² and cavity insulation.</li><li>Piers, returns and fair-faced work, which use more bricks and more cutting.</li><li>Lintels, DPC, cavity closers and weep vents.</li><li>Plasticiser and any lime in the mix.</li></ul>
<h2>How to estimate mortar for a block wall</h2>
<p>Allow about 0.009&nbsp;m³ of wet mortar per m² of 100mm blockwork, and 0.012&nbsp;m³ for 140mm blocks. For a 10&nbsp;m² wall in 100mm blocks at a 1:5 mix with 5% wastage, that comes to:</p>
<div class="table-wrap"><table class="data-table"><thead><tr><th>10 m² wall at 1:5</th><th class="num">Blocks</th><th class="num">Cement (25kg)</th><th class="num">Building sand</th></tr></thead><tbody>
<tr><th>100mm blocks</th><td class="num">105</td><td class="num">About 1&ndash;2 bags</td><td class="num">0.16 t</td></tr>
<tr><th>140mm blocks</th><td class="num">105</td><td class="num">About 2 bags</td><td class="num">0.21 t</td></tr>
<tr><th>Half-brick wall (for comparison)</th><td class="num">630 bricks</td><td class="num">About 3 bags</td><td class="num">0.39 t</td></tr>
</tbody></table></div>
<p>On paper that is about one 25kg bag of cement for every 8&ndash;9&nbsp;m² of 100mm blockwork; many bricklayers allow a bag every 6&ndash;7&nbsp;m² to cover droppings and part-used mixes. Order building sand in bulk bags (around 0.8&ndash;0.9 tonnes each) rather than small bags once you go above a few square metres.</p>
<h2>Building a shed or garden wall base</h2>
<p>For a small garden wall or a block plinth for a shed, work out the wall here, then use the <a href="/calculators/concrete">concrete calculator</a> for the footing or base underneath it. A low garden wall usually sits on a concrete strip footing about twice the width of the wall and 150&ndash;225mm deep.</p>
<h2>Common questions</h2>${faqHtml(BRICK_FAQ)}
</div></section>` + CALC_CTA,
    script: inlineScript(function () {
      var RATES = { half: { per: 60, mortar: 0.022, label: 'Bricks' }, one: { per: 120, mortar: 0.05, label: 'Bricks' }, b100: { per: 10, mortar: 0.009, label: 'Blocks' }, b140: { per: 10, mortar: 0.012, label: 'Blocks' } };
      function num(id) { var v = parseFloat(document.getElementById(id).value); return isFinite(v) && v > 0 ? v : 0; }
      function set(id, t) { document.getElementById(id).textContent = t; }
      function fmt(n, dp) { return n.toLocaleString('en-GB', { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }); }
      function run() {
        var r = RATES[document.getElementById('unit').value];
        var area = Math.max(0, num('len') * num('ht') - num('open'));
        var w = 1 + num('waste') / 100;
        var n = parseFloat(document.getElementById('mix').value);
        var units = Math.ceil(area * r.per * w);
        var mortar = area * r.mortar * w;
        var dry = mortar * 1.27;
        var cementBags = Math.ceil(dry / (1 + n) * 1440 / 25);
        var sandT = dry * n / (1 + n) * 1.6;
        set('o-area', fmt(area, 2) + ' m²');
        set('o-unit-label', r.label);
        set('o-units', fmt(units));
        set('o-mortar', fmt(mortar, 2) + ' m³');
        set('o-cement', area > 0 ? fmt(cementBags) : '0');
        set('o-sand', fmt(sandT, 2) + ' t');
      }
      document.getElementById('calc').addEventListener('input', run);
      run();
    })
  });
}

// -------------------------------- Concrete ---------------------------------
const CONCRETE_FAQ = [
  ['How much concrete do I need for a 10m² slab?', 'At 100mm thick, a 10m² slab needs 1m³ of concrete, or about 1.05m³ with 5% wastage. At 150mm thick it needs 1.5m³, or about 1.6m³ with wastage.'],
  ['How do I calculate concrete in cubic metres?', 'Multiply the length by the width by the depth, all in metres. A 4m x 3m slab at 100mm (0.1m) deep is 4 x 3 x 0.1 = 1.2m³. Add 5 to 10% for wastage and uneven ground.'],
  ['How many bags of cement for 1m³ of concrete?', 'For a general-purpose 1:2:4 mix, about 13 bags of 25kg cement, with roughly 0.7 tonnes of sharp sand and 1.3 tonnes of 20mm gravel, or about 2 tonnes of all-in ballast.'],
  ['What is a yard of concrete in m³?', 'One cubic yard is about 0.76m³, and one cubic metre is about 1.31 cubic yards. UK suppliers sell ready-mix by the cubic metre.'],
  ['How thick should a shed base be?', 'For most garden sheds, 75 to 100mm of concrete on 75 to 100mm of compacted hardcore. Use the thicker end for large or heavy sheds and workshops.'],
  ['Is it cheaper to mix concrete yourself or order ready-mix?', 'For small jobs under about 1m³, mixing by hand or with a hired mixer is usually cheaper. Above that, ready-mix normally works out cheaper once you allow for labour, and it gives a more consistent pour.']
];

function concreteCalcPage() {
  return pageShell({
    path: '/calculators/concrete',
    title: 'Concrete Calculator UK: How Much Concrete Do I Need? | TheGo2Guys',
    desc: 'How much concrete do you need? Enter the size of your slab, shed base, basement floor or footing to get m³ of ready-mix, tonnes, cubic yards, or bags of cement, sand and gravel.',
    schema: faqSchema(CONCRETE_FAQ),
    body: pageHero([['/', 'Home'], ['/calculators', 'Free tools'], ['/calculators/concrete', 'Concrete']], 'Concrete calculator: how much concrete do I need?', 'Enter the length, width and depth of your slab, shed base, basement floor or footing. You get the volume in m³ to order as ready-mix, or the bags to mix on site.') +
      `<section class="plain"><div class="container tool-grid"><form class="calc" id="calc" onsubmit="return false"><h2>Your pour</h2>
<div class="form-group"><label for="shape">What are you pouring?</label><select id="shape"><option value="slab">Slab, patio or driveway</option><option value="shed">Shed base</option><option value="basement">Basement floor slab</option><option value="trench">Trench-fill footing</option></select></div>
<div class="form-row"><div class="form-group"><label for="len">Length (m)</label><input id="len" type="number" inputmode="decimal" min="0" step="0.01" value="4"><p class="form-hint" id="len-hint">Length of the slab.</p></div><div class="form-group"><label for="wid" id="wid-label">Width (m)</label><input id="wid" type="number" inputmode="decimal" min="0" step="0.01" value="4"></div></div>
<div class="form-row"><div class="form-group"><label for="dep">Depth (mm)</label><input id="dep" type="number" inputmode="decimal" min="0" step="5" value="150"></div><div class="form-group"><label for="waste">Wastage (%)</label><input id="waste" type="number" inputmode="decimal" min="0" max="50" step="1" value="5"></div></div>
</form>
<div class="calc-out" aria-live="polite"><h2>You'll need about</h2><dl class="out-list">
<div class="big"><dt>Concrete volume</dt><dd id="o-vol">&ndash;</dd></div>
<div><dt>Ready-mix to order</dt><dd id="o-order">&ndash;</dd></div>
<div><dt>Weight (approx.)</dt><dd id="o-tonnes">&ndash;</dd></div>
<div><dt>In cubic yards</dt><dd id="o-yards">&ndash;</dd></div>
<div><dt>If mixing yourself:</dt><dd></dd></div>
<div><dt>Cement (25kg bags)</dt><dd id="o-cement">&ndash;</dd></div>
<div><dt>Sharp sand</dt><dd id="o-sand">&ndash;</dd></div>
<div><dt>20mm gravel</dt><dd id="o-gravel">&ndash;</dd></div>
</dl><p class="out-note">Includes your wastage allowance. Hand-mix quantities are for a general-purpose 1:2:4 mix (roughly C20). Footing depths and concrete grade should come from your engineer or building control.</p><a class="btn-primary" href="/#contact">Get the full job measured</a></div></div></section>
<section class="plain alt"><div class="container prose"><h2>How the numbers are worked out</h2>
<p>Volume is length x width x depth, plus your wastage allowance. The ready-mix figure is rounded up to the next 0.25&nbsp;m³. Many suppliers have a minimum load or charge a part-load fee under about 3&nbsp;m³, so check before you book.</p>
<p>For a 1:2:4 mix, each cubic metre of finished concrete takes roughly 320&nbsp;kg of cement (13 bags), 0.7 tonnes of sharp sand and 1.3 tonnes of 20mm gravel. You can use about 2 tonnes of all-in ballast instead of the separate sand and gravel.</p>
<h3>Typical depths</h3>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Use</th><th class="num">Typical depth</th></tr></thead><tbody>
<tr><th>Garden shed base</th><td class="num">75&ndash;100mm</td></tr>
<tr><th>Ground-bearing floor slab</th><td class="num">100&ndash;150mm</td></tr>
<tr><th>Driveway</th><td class="num">100&ndash;150mm</td></tr>
<tr><th>Basement floor slab</th><td class="num">Often 150&ndash;250mm, reinforced</td></tr>
<tr><th>Trench-fill footing (extension)</th><td class="num">Often 1&ndash;1.5m deep, 600mm wide</td></tr>
</tbody></table></div>
<p>These are only rules of thumb. Footing depth depends on the ground, nearby trees and drains, and is set by your engineer or building control.</p>
<h2>How much concrete do I need? Worked examples</h2>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Job</th><th>Size</th><th class="num">Concrete (incl. 5% waste)</th></tr></thead><tbody>
<tr><th>Shed base</th><td>2.4m x 1.8m x 100mm</td><td class="num">0.45 m³</td></tr>
<tr><th>Patio or garden slab</th><td>4m x 4m x 100mm</td><td class="num">1.68 m³</td></tr>
<tr><th>Extension floor slab</th><td>5m x 4m x 150mm</td><td class="num">3.15 m³</td></tr>
<tr><th>Single garage base</th><td>6m x 3m x 150mm</td><td class="num">2.84 m³</td></tr>
<tr><th>Extension trench-fill footings</th><td>12m run x 0.6m x 1m</td><td class="num">7.56 m³</td></tr>
</tbody></table></div>
<p>As a quick check: every 1&nbsp;m² of slab at 100mm thick is 0.1&nbsp;m³ of concrete. At 150mm it is 0.15&nbsp;m³. One cubic metre of concrete weighs about 2.4 tonnes.</p>
<h2>Concrete slab calculator</h2>
<p>For a slab, choose <em>Slab, patio or driveway</em> and enter the length, width and finished thickness. If the slab sits on hardcore, measure the depth of concrete only, not the hardcore. Thicken the edges by hand and add about 10% rather than 5% if the ground is uneven, because the concrete fills every dip.</p>
<p>A ground-bearing floor slab in an extension is usually 100&ndash;150mm of concrete on a damp-proof membrane, insulation and compacted hardcore. Driveways for cars are normally 100mm on a good sub-base, or 150mm where heavier vehicles will use them.</p>
<h2>Shed base calculator</h2>
<p>Most garden sheds sit on a 75&ndash;100mm concrete base over 75&ndash;100mm of compacted hardcore. Make the base about 50mm bigger than the shed floor on each side so rainwater runs off rather than under it. A typical 8 x 6ft shed (about 2.4m x 1.8m) needs just under half a cubic metre at 100mm, which is around 6 bags of cement with sand and gravel, or roughly 45 bags of 25kg ready-to-use concrete mix. That is usually too small for a ready-mix lorry, so most people mix it by hand or use a mini-mix supplier.</p>
<h2>Concrete for a basement</h2>
<p>A basement floor is normally a reinforced slab of 150&ndash;250mm, and the walls are often reinforced concrete too. Both are designed by a structural engineer, who sets the thickness, grade (often C28/35 or above) and steel. Use the <em>Basement floor slab</em> option to get the slab volume, then work out each wall as length x height x thickness and add them together. Basements are usually poured with a concrete pump, and the pump hire can cost as much as the concrete on a small pour.</p>
<h2>Ordering ready-mix concrete</h2>
<p>There are two main ways to buy ready-mix:</p>
<ul><li><strong>Drum lorry (pre-mixed).</strong> Batched at the plant to the volume you order. A full load is usually 6&ndash;8&nbsp;m³, and small orders often carry a part-load charge. Order to the nearest 0.25&nbsp;m³ and make sure you have your wastage in the figure.</li><li><strong>Volumetric or on-site mixer.</strong> The lorry carries the cement, sand and stone separately and mixes on your drive. You pay for what is actually used, so it suits jobs where the volume is hard to pin down, like footings in uneven ground.</li></ul>
<p>Tell the supplier the grade you need. As a guide, C20 suits shed bases and garden slabs, C25 house floor slabs and paths, C30 driveways, and GEN or FND mixes footings. Your engineer or building control will confirm what your job needs.</p>
<h2>Common questions</h2>${faqHtml(CONCRETE_FAQ)}
</div></section>` + CALC_CTA,
    script: inlineScript(function () {
      function num(id) { var v = parseFloat(document.getElementById(id).value); return isFinite(v) && v > 0 ? v : 0; }
      function set(id, t) { document.getElementById(id).textContent = t; }
      function fmt(n, dp) { return n.toLocaleString('en-GB', { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }); }
      var shape = document.getElementById('shape');
      function labels() {
        var trench = shape.value === 'trench';
        set('len-hint', trench ? 'Total run of trench.' : 'Length of the slab.');
        set('wid-label', trench ? 'Trench width (m)' : 'Width (m)');
      }
      function run() {
        var vol = num('len') * num('wid') * num('dep') / 1000 * (1 + num('waste') / 100);
        set('o-vol', fmt(vol, 2) + ' m³');
        set('o-order', fmt(Math.ceil(vol * 4 - 1e-9) / 4, 2) + ' m³');
        set('o-tonnes', fmt(vol * 2.4, 2) + ' t');
        set('o-yards', fmt(vol * 1.308, 2) + ' yd³');
        set('o-cement', fmt(Math.ceil(vol * 13 - 1e-9)));
        set('o-sand', fmt(vol * 0.7, 2) + ' t');
        set('o-gravel', fmt(vol * 1.3, 2) + ' t');
      }
      shape.addEventListener('change', function () {
        var PRESET = { slab: [4, 4, 150], shed: [2.4, 1.8, 100], basement: [6, 5, 200], trench: [12, 0.6, 1000] };
        var p = PRESET[shape.value];
        document.getElementById('len').value = p[0]; document.getElementById('wid').value = p[1]; document.getElementById('dep').value = p[2];
        labels(); run();
      });
      document.getElementById('calc').addEventListener('input', run);
      labels(); run();
    })
  });
}

// -------------------------------- Plaster ----------------------------------
function plasterCalcPage() {
  return pageShell({
    path: '/calculators/plaster',
    title: 'Plaster Calculator UK: Skim, Hardwall and Plasterboard | TheGo2Guys',
    desc: 'Work out bags of Multi-Finish skim, Hardwall undercoat and sheets of plasterboard for a room or a set area. Free UK plastering calculator.',
    body: pageHero([['/', 'Home'], ['/calculators', 'Free tools'], ['/calculators/plaster', 'Plaster']], 'Plaster calculator', 'Bags of skim and undercoat, and sheets of plasterboard, for a room or a set area.') +
      `<section class="plain"><div class="container tool-grid"><form class="calc" id="calc" onsubmit="return false"><h2>Your room</h2>
<div class="form-row"><div class="form-group"><label for="len">Room length (m)</label><input id="len" type="number" inputmode="decimal" min="0" step="0.01" value="4"></div><div class="form-group"><label for="wid">Room width (m)</label><input id="wid" type="number" inputmode="decimal" min="0" step="0.01" value="3.5"></div></div>
<div class="form-row"><div class="form-group"><label for="ht">Ceiling height (m)</label><input id="ht" type="number" inputmode="decimal" min="0" step="0.01" value="2.4"></div><div class="form-group"><label for="open">Openings to deduct (m²)</label><input id="open" type="number" inputmode="decimal" min="0" step="0.01" value="3"></div></div>
<div class="form-row"><div class="form-group"><label for="walls">Walls</label><select id="walls"><option value="1">Include walls</option><option value="0">Leave out walls</option></select></div><div class="form-group"><label for="ceil">Ceiling</label><select id="ceil"><option value="1">Include ceiling</option><option value="0">Leave out ceiling</option></select></div></div>
<div class="form-group"><label for="area">Or enter a total area (m²)</label><input id="area" type="number" inputmode="decimal" min="0" step="0.1" placeholder="Leave blank to use the room sizes"></div>
<div class="form-row"><div class="form-group"><label for="job">Job</label><select id="job"><option value="board">New plasterboard, then skim</option><option value="skim">Skim over existing plaster</option><option value="two">Hardwall and skim on masonry</option></select></div><div class="form-group"><label for="waste">Wastage (%)</label><input id="waste" type="number" inputmode="decimal" min="0" max="50" step="1" value="10"></div></div>
</form>
<div class="calc-out" aria-live="polite"><h2>You'll need about</h2><dl class="out-list">
<div><dt>Area to plaster</dt><dd id="o-area">&ndash;</dd></div>
<div id="r-board"><dt>Plasterboard (2400 x 1200)</dt><dd id="o-board">&ndash;</dd></div>
<div id="r-hard"><dt>Hardwall (25kg bags)</dt><dd id="o-hard">&ndash;</dd></div>
<div class="big"><dt>Multi-Finish (25kg bags)</dt><dd id="o-skim">&ndash;</dd></div>
</dl><p class="out-note">Includes your wastage allowance. Based on manufacturers' coverage figures; uneven walls and thicker coats will use more.</p><a class="btn-primary" href="/#contact">Get the full job measured</a></div></div></section>
<section class="plain alt"><div class="container prose"><h2>How the numbers are worked out</h2>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Material</th><th class="num">Coverage</th></tr></thead><tbody>
<tr><th>Thistle Multi-Finish, 25kg</th><td class="num">About 10 m² at 2mm</td></tr>
<tr><th>Thistle Hardwall, 25kg</th><td class="num">About 3 m² at 11mm</td></tr>
<tr><th>Plasterboard, 2400 x 1200mm</th><td class="num">2.88 m² per sheet</td></tr>
</tbody></table></div>
<p>Wall area is the room perimeter times the ceiling height, less the openings you enter. The ceiling is length x width. If you enter a total area, the room sizes are ignored.</p>
<h3>Things the calculator doesn't cover</h3>
<ul><li>Bonding coat on smooth or low-suction backgrounds such as dense concrete, which covers differently to Hardwall.</li><li>Scrim tape, angle beads, PVA and board adhesive or screws.</li><li>Extra board for double-boarding fire-rated ceilings or partitions.</li></ul>
</div></section>` + CALC_CTA,
    script: inlineScript(function () {
      function num(id) { var v = parseFloat(document.getElementById(id).value); return isFinite(v) && v > 0 ? v : 0; }
      function set(id, t) { document.getElementById(id).textContent = t; }
      function show(id, on) { document.getElementById(id).style.display = on ? '' : 'none'; }
      function fmt(n, dp) { return n.toLocaleString('en-GB', { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }); }
      function run() {
        var L = num('len'), W = num('wid'), H = num('ht');
        var area = num('area');
        if (!area) {
          area = (document.getElementById('walls').value === '1' ? 2 * (L + W) * H : 0) + (document.getElementById('ceil').value === '1' ? L * W : 0) - num('open');
        }
        area = Math.max(0, area);
        var w = 1 + num('waste') / 100;
        var job = document.getElementById('job').value;
        set('o-area', fmt(area, 2) + ' m²');
        set('o-board', fmt(Math.ceil(area * w / 2.88 - 1e-9)) + ' sheets');
        set('o-hard', fmt(Math.ceil(area * w / 3 - 1e-9)));
        set('o-skim', fmt(Math.ceil(area * w / 10 - 1e-9)));
        show('r-board', job === 'board');
        show('r-hard', job === 'two');
      }
      document.getElementById('calc').addEventListener('input', run);
      document.getElementById('calc').addEventListener('change', run);
      run();
    })
  });
}

// ------------------------------ Guides index -------------------------------
function guidesIndexPage() {
  return pageShell({
    path: '/guides',
    title: 'Building Cost Guides UK 2026 | TheGo2Guys',
    desc: 'Plain-English UK building cost guides for 2026: house extensions, loft conversions and pricing preliminaries, with budget calculators.',
    body: pageHero([['/', 'Home'], ['/guides', 'Cost guides']], 'Building cost guides', 'What common residential jobs cost in the UK in 2026, what pushes the price up, and a quick budget calculator for each.') +
      `<section class="plain"><div class="container"><div class="card-grid">
<a class="card" href="/guides/house-extension-cost"><h3>House extension cost UK (2026)</h3><p>Cost per m² for single and double-storey extensions, where the money goes, and the extras people forget.</p><span class="card-go">Read the guide &rarr;</span></a>
<a class="card" href="/guides/loft-conversion-cost"><h3>Loft conversion cost UK (2026)</h3><p>Velux, dormer, hip-to-gable and mansard conversions compared, with typical prices and timescales.</p><span class="card-go">Read the guide &rarr;</span></a>
<a class="card" href="/guides/garage-conversion-cost"><h3>Garage conversion cost UK (2026)</h3><p>Single, double and detached garage conversions, an all-in example budget, Building Regulations and Liverpool fees.</p><span class="card-go">Read the guide &rarr;</span></a>
<a class="card" href="/guides/house-extension-cost-liverpool"><h3>House extension cost in Liverpool (2026)</h3><p>Cost per m² for extensions in Liverpool and Merseyside, with a real Merseyside estimate broken down.</p><span class="card-go">Read the guide &rarr;</span></a>
<a class="card" href="/guides/loft-conversion-cost-liverpool"><h3>Loft conversion cost in Liverpool (2026)</h3><p>Velux, dormer, hip-to-gable and mansard prices for Liverpool and the North West.</p><span class="card-go">Read the guide &rarr;</span></a>
<a class="card" href="/guides/extension-preliminaries"><h3>Pricing preliminaries on an extension</h3><p>For builders: what goes in preliminaries, a real 2026 breakdown, and the items most often left out of a quote.</p><span class="card-go">Read the guide &rarr;</span></a>
</div></div></section>` + CALC_CTA
  });
}

// --------------------------- Shared budget script --------------------------
// Rates are £ per m² of new floor area, ex VAT, before regional and size factors
const REGION_OPTIONS = '<option value="0.92">North of England, Wales, Scotland, NI</option><option value="0.97" selected>Midlands</option><option value="1.08">South and East (outside London)</option><option value="1.3">London</option>';

function faqSchema(items) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(function (q) { return { '@type': 'Question', name: q[0], acceptedAnswer: { '@type': 'Answer', text: q[1].replace(/<[^>]+>/g, '') } }; }) };
}

function faqHtml(items) {
  return items.map(function (q) { return '<h3>' + q[0] + '</h3><p>' + q[1] + '</p>'; }).join('');
}

// ------------------------- House extension guide ---------------------------
const SAMPLE_ELEMENTS = [['Preliminaries', 6210], ['Demolitions and alterations', 3888], ['Substructure', 4545], ['Ground floor', 1743], ['External walls', 6370], ['Roof', 6347], ['Windows and external doors', 5820], ['Internal finishes', 1781], ['Services', 2200], ['Drainage', 1038], ['External works', 450]];

const EXTENSION_FAQ = [
  ['How much does a single-storey extension cost per m² in 2026?', 'Most UK single-storey extensions come in at roughly £1,800 to £3,200 per m² of new floor area, with a standard specification usually around £2,200 to £2,900 per m². London and the South East run higher.'],
  ['Is a double-storey extension cheaper per m²?', 'Yes. The foundations and roof are shared across two floors, so the rate per m² is usually lower, often 10 to 20% below a single-storey rate. The total cost is still higher because you are building more floor area.'],
  ['Does the cost per m² include a kitchen?', 'Usually not. Most per m² figures cover the shell and basic finishes. A new kitchen, bathroom fittings and flooring are normally priced separately.'],
  ['How much contingency should I allow?', 'Allow 10 to 15% of the build cost for a straightforward extension, and closer to 20% on older houses or where the ground and drainage are unknown.'],
  ['Are the figures with or without VAT?', 'The figures on this page are before VAT. A VAT-registered builder will add 20%.'],
  ['How do I calculate the cost of an extension?', 'Measure the internal floor area of the new space in m², multiply it by a cost per m² for the type and specification of extension, adjust for your region, then add 10 to 15% contingency, professional fees and VAT. The calculator on this page does the first steps for you. For a figure you can rely on, have the drawings measured and priced item by item.'],
  ['Are 2022 and 2023 extension cost calculators still accurate?', 'Not really. Labour and materials have both gone up since then, so calculators and guides from 2022 or 2023 tend to read low. Use current rates, like the 2026 figures on this page, or get a measured estimate priced at today&rsquo;s rates.']
];

function extensionGuidePage() {
  const total = 40393; // construction cost as issued in the sample estimate (element figures are rounded)
  const rows = SAMPLE_ELEMENTS.map(function (e) { return '<tr><th>' + e[0] + '</th><td class="num">£' + e[1].toLocaleString('en-GB') + '</td><td class="num">' + (e[1] / total * 100).toFixed(1) + '%</td></tr>'; }).join('');
  return pageShell({
    path: '/guides/house-extension-cost',
    title: 'House Extension Cost Calculator UK 2026: Cost per m² | TheGo2Guys',
    desc: 'Free 2026 extension cost calculator for the UK. Enter the size, type, spec and region of your single or double-storey extension to get a budget range and cost per m².',
    schema: faqSchema(EXTENSION_FAQ),
    body: pageHero([['/', 'Home'], ['/guides', 'Cost guides'], ['/guides/house-extension-cost', 'House extension cost']], 'House extension cost calculator (UK, 2026)', 'Most single-storey extensions cost £1,800&ndash;£3,200 per m² to build in 2026. Use the calculator for a budget on your own extension, then read on for where that range comes from and where the money goes.') +
      `<section class="plain"><div class="container tool-grid"><form class="calc" id="calc" onsubmit="return false"><h2>Extension budget calculator</h2>
<div class="form-row"><div class="form-group"><label for="area">Floor area (m²)</label><input id="area" type="number" inputmode="decimal" min="0" step="0.5" value="20"><p class="form-hint">Internal floor area of the new space. For two storeys, add both floors.</p></div><div class="form-group"><label for="type">Type</label><select id="type"><option value="1">Single-storey</option><option value="0.85">Double-storey</option></select></div></div>
<div class="form-row"><div class="form-group"><label for="spec">Specification</label><select id="spec"><option value="basic">Basic</option><option value="std" selected>Standard</option><option value="high">High</option></select></div><div class="form-group"><label for="region">Region</label><select id="region">${REGION_OPTIONS}</select></div></div>
</form>
<div class="calc-out" aria-live="polite"><h2>Rough build cost</h2><dl class="out-list">
<div class="big"><dt>Budget range</dt><dd id="o-range">&ndash;</dd></div>
<div><dt>Rate per m²</dt><dd id="o-rate">&ndash;</dd></div>
<div><dt>Plus contingency (10&ndash;15%)</dt><dd id="o-cont">&ndash;</dd></div>
</dl><p class="out-note">Excludes VAT, kitchen and bathroom fit-out, professional fees and planning. A rough guide only. A measured estimate from your drawings will be far tighter.</p><a class="btn-primary" href="/#contact">Get a measured estimate from £150</a></div></div></section>
<section class="plain alt"><div class="container prose">
<h2>How much does a house extension cost in the UK?</h2>
<p>For a typical 20&nbsp;m² single-storey rear extension with a standard finish, expect roughly £44,000&ndash;£58,000 before VAT in 2026, plus a 10&ndash;15% contingency. The calculator above adjusts that for your size, specification and region. Rates on this page are updated for 2026 prices, so they will read higher than extension calculators and guides written in 2022 or 2023.</p>
<h2>Extension cost per m² in 2026</h2>
<p>These are typical build costs per m² of new internal floor area, before VAT, for a finished shell with standard finishes.</p>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Extension</th><th class="num">Cost per m²</th><th class="num">20 m² example</th></tr></thead><tbody>
<tr><th>Single-storey, basic finish</th><td class="num">£1,800&ndash;£2,200</td><td class="num">£36,000&ndash;£44,000</td></tr>
<tr><th>Single-storey, standard finish</th><td class="num">£2,200&ndash;£2,900</td><td class="num">£44,000&ndash;£58,000</td></tr>
<tr><th>Single-storey, high finish</th><td class="num">£2,900&ndash;£3,500</td><td class="num">£58,000&ndash;£70,000</td></tr>
<tr><th>Double-storey, standard finish</th><td class="num">£1,800&ndash;£2,700</td><td class="num">Per m² of both floors</td></tr>
</tbody></table></div>
<p>Small extensions cost more per m² because things like scaffolding, foundations, steelwork and the connection to the house cost much the same whatever the size. London is typically 20&ndash;40% above these figures, and the North of England a little below. See our <a href="/guides/house-extension-cost-liverpool">Liverpool extension cost guide</a> for North West rates.</p>
<h2>Where the money goes: a real example</h2>
<p>This is the elemental summary from our <a href="/sample-estimate.pdf" target="_blank" rel="noopener">sample estimate</a> for a 16.28&nbsp;m² single-storey rear extension in Merseyside, priced at Q4 2026 rates. The total came to £46,451 before VAT, or £2,853 per m².</p>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Element</th><th class="num">Cost</th><th class="num">Share of build</th></tr></thead><tbody>${rows}<tr><th>Construction cost</th><td class="num"><strong>£${total.toLocaleString('en-GB')}</strong></td><td class="num">100%</td></tr></tbody></table></div>
<p>The walls, roof and glazing make up nearly half the build cost. Preliminaries, which cover site set-up, scaffolding, skips and supervision, are the next biggest item on a small job and are often where quick quotes are short.</p>
<h2>What pushes the price up</h2>
<ul><li><strong>Ground conditions.</strong> Clay, nearby trees or made ground can mean deeper footings or piles.</li><li><strong>Opening up the house.</strong> Knocking through the back wall needs steel beams, padstones and temporary support.</li><li><strong>Glazing.</strong> Large bifolds, sliders and roof lanterns can cost more than the walls they replace.</li><li><strong>Drains.</strong> Building over or near a public sewer needs water company approval and sometimes a diversion.</li><li><strong>Access.</strong> No side access means everything goes through the house by hand, which adds labour.</li></ul>
<h2>Costs outside the build</h2>
<ul><li>Architectural drawings and a structural engineer's calculations.</li><li>Building control fees, and a planning application if the extension isn't permitted development.</li><li>Party wall agreements: roughly £700&ndash;£3,000 per neighbour where they are needed.</li><li>Kitchen, bathroom, flooring and decorating, if not in the builder's price.</li><li>VAT at 20% from a VAT-registered builder.</li></ul>
<div class="callout"><p>Single-storey rear extensions can often be built under permitted development up to 3m deep on a terraced or semi-detached house, or 4m on a detached house, and no more than 4m high. Check the current rules with your council before relying on this.</p></div>
<h2>Common questions</h2>${faqHtml(EXTENSION_FAQ)}
</div></section>` + ctaBand('Pricing an extension?', 'Send us the drawings and we measure every item, price it at current rates for your area and send back an estimate like the sample above. From £150, in 3&ndash;5 working days.'),
    script: inlineScript(function () {
      var SPEC = { basic: [1800, 2200], std: [2200, 2900], high: [2900, 3500] };
      function num(id) { var v = parseFloat(document.getElementById(id).value); return isFinite(v) && v > 0 ? v : 0; }
      function set(id, t) { document.getElementById(id).textContent = t; }
      function money(n) { return '£' + (Math.round(n / 500) * 500).toLocaleString('en-GB'); }
      function run() {
        var a = num('area');
        var f = parseFloat(document.getElementById('type').value) * parseFloat(document.getElementById('region').value);
        if (a > 0 && a < 20) { f *= 1.1; } else if (a > 40) { f *= 0.95; }
        var s = SPEC[document.getElementById('spec').value];
        var lo = s[0] * f, hi = s[1] * f;
        set('o-range', a ? money(a * lo) + ' – ' + money(a * hi) : '–');
        set('o-rate', '£' + (Math.round(lo / 10) * 10).toLocaleString('en-GB') + ' – £' + (Math.round(hi / 10) * 10).toLocaleString('en-GB'));
        set('o-cont', a ? money(a * lo * 0.1) + ' – ' + money(a * hi * 0.15) : '–');
      }
      document.getElementById('calc').addEventListener('input', run);
      document.getElementById('calc').addEventListener('change', run);
      run();
    })
  });
}

// -------------------------- Loft conversion guide --------------------------
const LOFT_FAQ = [
  ['How much does a loft conversion cost in 2026?', 'Outside London, a simple rooflight (Velux) conversion typically costs £20,000 to £45,000, a rear dormer £35,000 to £70,000, a hip-to-gable with dormer £50,000 to £80,000 and a mansard £60,000 to £90,000 or more. London prices are noticeably higher.'],
  ['Is my loft high enough to convert?', 'A common rule of thumb is at least 2.2m from the top of the ceiling joists to the underside of the ridge. Less than that usually means a dormer, a mansard or lowering the ceiling below, all of which add cost.'],
  ['Do I need planning permission for a loft conversion?', 'Many loft conversions are permitted development, within volume limits of 40 m³ for terraced houses and 50 m³ for semi-detached and detached houses. Mansards and front dormers usually need planning. All loft conversions need building regulations approval.'],
  ['How long does a loft conversion take?', 'Roughly 4 to 6 weeks for a rooflight conversion, 6 to 8 weeks for a dormer and 6 to 10 weeks for a hip-to-gable, once work starts.']
];

function loftGuidePage() {
  return pageShell({
    path: '/guides/loft-conversion-cost',
    title: 'Loft Conversion Cost UK 2026: Velux, Dormer, Hip-to-Gable | TheGo2Guys',
    desc: 'What a loft conversion costs in the UK in 2026: Velux, dormer, hip-to-gable and mansard prices compared, what pushes the cost up, and a free budget calculator.',
    schema: faqSchema(LOFT_FAQ),
    body: pageHero([['/', 'Home'], ['/guides', 'Cost guides'], ['/guides/loft-conversion-cost', 'Loft conversion cost']], 'How much does a loft conversion cost in the UK?', 'From around £20,000 for a simple rooflight conversion to £90,000 or more for a mansard. Here is how the main types compare, and a calculator for a rough budget.') +
      `<section class="plain"><div class="container tool-grid"><form class="calc" id="calc" onsubmit="return false"><h2>Loft conversion budget calculator</h2>
<div class="form-row"><div class="form-group"><label for="area">New floor area (m²)</label><input id="area" type="number" inputmode="decimal" min="0" step="0.5" value="25"><p class="form-hint">Usable floor area of the finished loft.</p></div><div class="form-group"><label for="type">Type</label><select id="type"><option value="velux">Rooflight (Velux)</option><option value="dormer" selected>Rear dormer</option><option value="h2g">Hip-to-gable with dormer</option><option value="mansard">Mansard</option></select></div></div>
<div class="form-group"><label for="region">Region</label><select id="region">${REGION_OPTIONS}</select></div>
</form>
<div class="calc-out" aria-live="polite"><h2>Rough build cost</h2><dl class="out-list">
<div class="big"><dt>Budget range</dt><dd id="o-range">&ndash;</dd></div>
<div><dt>Rate per m²</dt><dd id="o-rate">&ndash;</dd></div>
<div><dt>Typical build time</dt><dd id="o-time">&ndash;</dd></div>
</dl><p class="out-note">Excludes VAT, professional fees, party wall costs and an en-suite fit-out. A rough guide only. A measured estimate from your drawings will be far tighter.</p><a class="btn-primary" href="/#contact">Get a measured estimate</a></div></div></section>
<section class="plain alt"><div class="container prose">
<h2>Loft conversion costs by type</h2>
<p>Typical 2026 costs outside London, before VAT, for a finished conversion with a new staircase. In the North West? See our <a href="/guides/loft-conversion-cost-liverpool">Liverpool loft conversion cost guide</a>.</p>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Type</th><th class="num">Typical cost</th><th class="num">Build time</th></tr></thead><tbody>
<tr><th>Rooflight (Velux)</th><td class="num">£20,000&ndash;£45,000</td><td class="num">4&ndash;6 weeks</td></tr>
<tr><th>Rear dormer</th><td class="num">£35,000&ndash;£70,000</td><td class="num">6&ndash;8 weeks</td></tr>
<tr><th>Hip-to-gable with dormer</th><td class="num">£50,000&ndash;£80,000</td><td class="num">6&ndash;10 weeks</td></tr>
<tr><th>Mansard</th><td class="num">£60,000&ndash;£90,000+</td><td class="num">8&ndash;12 weeks</td></tr>
</tbody></table></div>
<h3>Rooflight (Velux)</h3><p>The roof shape stays the same and windows go into the existing slope. It's the cheapest option, but only works where there is already enough head height.</p>
<h3>Rear dormer</h3><p>A box-shaped extension off the rear slope gives full-height walls and much more usable floor. It's the most common type on terraced and semi-detached houses.</p>
<h3>Hip-to-gable</h3><p>The sloping side of a hipped roof is built up into a vertical gable wall. It's usually combined with a rear dormer on semis and detached houses with hipped roofs.</p>
<h3>Mansard</h3><p>The rear slope, and sometimes the front, is rebuilt almost vertical. It gives the most space but nearly always needs planning permission, and costs the most.</p>
<h2>What pushes the price up</h2>
<ul><li><strong>Steelwork.</strong> Most dormers and hip-to-gables need steel beams to carry the new roof and floor.</li><li><strong>Head height.</strong> Too little height can mean lowering the ceilings below or rebuilding more of the roof.</li><li><strong>Bathrooms.</strong> An en-suite adds plumbing, drainage runs and fittings.</li><li><strong>Fire safety.</strong> A protected escape route, fire doors and mains-wired smoke alarms are needed to meet building regulations.</li><li><strong>Stairs.</strong> A basic new staircase is often £1,000&ndash;£1,500. Bespoke stairs cost much more.</li></ul>
<h2>Common questions</h2>${faqHtml(LOFT_FAQ)}
</div></section>` + ctaBand('Pricing a loft conversion?', 'Send us the drawings and we measure every item, from steels and joists to plasterboard and fire doors, and price it at current rates. Back in 3&ndash;5 working days.'),
    script: inlineScript(function () {
      var TYPES = { velux: [1200, 1700, '4–6 weeks'], dormer: [1500, 2100, '6–8 weeks'], h2g: [1800, 2600, '6–10 weeks'], mansard: [2000, 2800, '8–12 weeks'] };
      function num(id) { var v = parseFloat(document.getElementById(id).value); return isFinite(v) && v > 0 ? v : 0; }
      function set(id, t) { document.getElementById(id).textContent = t; }
      function money(n) { return '£' + (Math.round(n / 500) * 500).toLocaleString('en-GB'); }
      function run() {
        var a = num('area');
        var t = TYPES[document.getElementById('type').value];
        var f = parseFloat(document.getElementById('region').value);
        var lo = t[0] * f, hi = t[1] * f;
        set('o-range', a ? money(a * lo) + ' – ' + money(a * hi) : '–');
        set('o-rate', '£' + (Math.round(lo / 10) * 10).toLocaleString('en-GB') + ' – £' + (Math.round(hi / 10) * 10).toLocaleString('en-GB'));
        set('o-time', t[2]);
      }
      document.getElementById('calc').addEventListener('input', run);
      document.getElementById('calc').addEventListener('change', run);
      run();
    })
  });
}

// ------------------------------ Referral scheme -----------------------------
const REFER_FAQ = [
  ['How much do I get for a referral?', '£20 off your next estimate for every builder you refer who goes on to pay for an estimate. There is no limit on how many builders you can refer.'],
  ['When is the discount applied?', 'Once the builder you referred has paid for their first estimate, £20 comes off the next estimate you order. Referrals add up, so three referrals means £60 off.'],
  ['How do you know they came from me?', 'Send them your personal link from this page, or ask them to put your name or company in the &ldquo;Referred by&rdquo; box on the quote form.'],
  ['Who counts as a referral?', 'Any builder, contractor or homeowner who has not used TheGo2Guys before. The discount is for estimating fees only and cannot be swapped for cash.']
];

function referPage() {
  return pageShell({
    path: '/refer',
    title: 'Refer a Builder: £20 Off Your Next Estimate | TheGo2Guys',
    desc: 'Know a builder who spends their evenings pricing jobs? Refer them to TheGo2Guys and get £20 off your next estimate for every one who orders.',
    schema: faqSchema(REFER_FAQ),
    body: pageHero([['/', 'Home'], ['/refer', 'Refer a builder']], 'Refer a builder, get £20 off', 'Know a builder still pricing jobs at the kitchen table? Send them our way. For every one who orders an estimate, you get £20 off your next one. No limit.') +
      `<section class="plain"><div class="container tool-grid"><form class="calc" id="refform" onsubmit="return false"><h2>Get your referral link</h2>
<div class="form-group"><label for="refname">Your name or company</label><input id="refname" type="text" maxlength="60" placeholder="e.g. Smith Building Ltd" autocomplete="organization"><p class="form-hint">This goes in the &ldquo;Referred by&rdquo; box when they request a quote, so we know to credit you.</p></div>
</form>
<div class="calc-out" aria-live="polite"><h2>Your link</h2><p id="reflink" style="word-break:break-all;font-weight:600">Type your name to create your link.</p><button class="btn-primary" type="button" id="refcopy">Copy link</button><p class="out-note" id="refmsg">Send it by WhatsApp, text or email. They can also just put your name in the &ldquo;Referred by&rdquo; box on our quote form.</p></div></div></section>
<section class="plain alt"><div class="container prose">
<h2>How it works</h2>
<ol><li><strong>Share your link</strong> with a builder, contractor or homeowner who needs a job priced.</li><li><strong>They request a quote</strong> through the link, or put your name in the &ldquo;Referred by&rdquo; box.</li><li><strong>They order their first estimate</strong> and pay for it.</li><li><strong>You get £20 off</strong> your next estimate. Refer three builders and that's £60 off.</li></ol>
<h2>Common questions</h2>${faqHtml(REFER_FAQ)}
</div></section>` + ctaBand('Need a job priced yourself?', 'Send us your drawings and we take off every item, price it at current UK rates and send back an itemised estimate. From £120, in 3&ndash;5 working days.'),
    script: inlineScript(function () {
      var input = document.getElementById('refname'), out = document.getElementById('reflink'), msg = document.getElementById('refmsg');
      function link() { var v = input.value.trim(); return v ? 'https://thego2guys.uk/?ref=' + encodeURIComponent(v) + '#contact' : ''; }
      input.addEventListener('input', function () { out.textContent = link() || 'Type your name to create your link.'; });
      document.getElementById('refcopy').addEventListener('click', function () {
        var l = link(); if (!l) { input.focus(); return; }
        try { navigator.clipboard.writeText(l).then(function () { msg.textContent = 'Copied. Send it by WhatsApp, text or email.'; }); } catch (e) { msg.textContent = 'Copy the link above and send it on.'; }
      });
    })
  });
}

// ------------------- Local guides: Liverpool / North West -------------------
// Figures are the national guide rates x 0.92, the North of England factor used in REGION_OPTIONS
const EXT_LPL_FAQ = [
  ['How much does an extension cost in Liverpool in 2026?', 'Using our North of England rates, a single-storey extension with a standard finish typically costs around £2,000 to £2,650 per m² before VAT. A 20 m² rear extension comes to roughly £40,500 to £53,500, plus 10 to 15% contingency.'],
  ['Are extensions cheaper in Liverpool than the rest of the UK?', 'A little. Build costs in the North of England usually run slightly below the Midlands and well below London and the South East. Small extensions still cost more per m², wherever you are.'],
  ['How much is building control for an extension in Liverpool?', 'Liverpool City Council sets its own building regulation fees, which depend on the size of the extension. Check the current fee schedule on the council website before you budget.'],
  ['Do I need planning permission for an extension in Liverpool?', 'Many single-storey rear extensions are permitted development: up to 3m deep on a terraced or semi-detached house, or 4m on a detached house. Check with Liverpool City Council before relying on this, especially in a conservation area.']
];

function extensionLiverpoolPage() {
  return pageShell({
    path: '/guides/house-extension-cost-liverpool',
    title: 'House Extension Cost Liverpool 2026: Cost per m² | TheGo2Guys',
    desc: 'What a house extension costs in Liverpool and Merseyside in 2026: cost per m² for single and double-storey extensions, and a real Merseyside estimate broken down.',
    schema: faqSchema(EXT_LPL_FAQ),
    body: pageHero([['/', 'Home'], ['/guides', 'Cost guides'], ['/guides/house-extension-cost-liverpool', 'Extension cost Liverpool']], 'House extension cost in Liverpool (2026)', 'Most single-storey extensions in Liverpool cost around £2,000&ndash;£2,650 per m² to build with a standard finish. Here is what that means for your extension, and a real Merseyside estimate to compare against.') +
      `<section class="plain alt"><div class="container prose">
<h2>Extension cost per m² in Liverpool</h2>
<p>Typical 2026 build costs per m² of new internal floor area in Liverpool and Merseyside, before VAT, for a finished shell with standard finishes. These are our UK rates adjusted for the North of England.</p>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Extension</th><th class="num">Cost per m²</th><th class="num">20 m² example</th></tr></thead><tbody>
<tr><th>Single-storey, basic finish</th><td class="num">£1,650&ndash;£2,000</td><td class="num">£33,000&ndash;£40,500</td></tr>
<tr><th>Single-storey, standard finish</th><td class="num">£2,000&ndash;£2,650</td><td class="num">£40,500&ndash;£53,500</td></tr>
<tr><th>Single-storey, high finish</th><td class="num">£2,650&ndash;£3,200</td><td class="num">£53,500&ndash;£64,500</td></tr>
<tr><th>Double-storey, standard finish</th><td class="num">£1,650&ndash;£2,500</td><td class="num">Per m² of both floors</td></tr>
</tbody></table></div>
<p>Add 10&ndash;15% contingency, more on older terraces where the drains and foundations are unknown. Want a figure for your own size and spec? Use the <a href="/guides/house-extension-cost">extension cost calculator</a> and pick &ldquo;North of England&rdquo; as the region.</p>
<h2>A real Merseyside extension, priced</h2>
<p>Our <a href="/sample-estimate.pdf" target="_blank" rel="noopener">sample estimate</a> is for a 16.28&nbsp;m² single-storey rear extension in Merseyside, priced at Q4 2026 rates. It came to £46,451 before VAT, or £2,853 per m². That is above the standard range in the table because it is a small extension: scaffolding, foundations, steelwork and the connection to the house cost much the same whatever the size, so the rate per m² goes up as the floor area goes down.</p>
<h2>What affects the price in Liverpool</h2>
<ul><li><strong>Older terraces.</strong> Much of Liverpool's housing is Victorian and Edwardian terraced stock, where shallow footings, shared drains and party walls add cost.</li><li><strong>Access.</strong> No side access means materials and spoil go through the house by hand, which adds labour.</li><li><strong>Opening up.</strong> Knocking through the back wall needs steel beams, padstones and temporary support.</li><li><strong>Glazing.</strong> Large bifolds and roof lanterns can cost more than the walls they replace.</li><li><strong>Party walls.</strong> Building on or near a shared boundary usually needs a party wall agreement with each neighbour.</li></ul>
<h2>Common questions</h2>${faqHtml(EXT_LPL_FAQ)}
</div></section>` + ctaBand('Pricing an extension in Liverpool?', 'We are based in Liverpool. Send us the drawings and we measure every item, price it at current North West rates and send back an itemised estimate. From £150, in 3&ndash;5 working days.')
  });
}

const LOFT_LPL_FAQ = [
  ['How much does a loft conversion cost in Liverpool in 2026?', 'Using our North of England rates, a 25 m² loft typically costs around £27,500 to £39,000 as a rooflight (Velux) conversion, £34,500 to £48,500 as a rear dormer and £41,500 to £60,000 as a hip-to-gable with dormer, before VAT.'],
  ['What is the most common loft conversion in Liverpool?', 'Rear dormers are the most common on terraced and semi-detached houses, because they add full-height walls and much more usable floor. Hip-to-gable conversions suit semis and detached houses with hipped roofs.'],
  ['Do I need planning permission for a loft conversion in Liverpool?', 'Many loft conversions are permitted development, within 40 m³ of extra volume for terraced houses and 50 m³ for semi-detached and detached houses. Mansards, front dormers and homes in conservation areas usually need planning. All loft conversions need building regulations approval.']
];

function loftLiverpoolPage() {
  return pageShell({
    path: '/guides/loft-conversion-cost-liverpool',
    title: 'Loft Conversion Cost Liverpool 2026: Velux, Dormer, Hip-to-Gable | TheGo2Guys',
    desc: 'What a loft conversion costs in Liverpool and the North West in 2026: Velux, dormer, hip-to-gable and mansard prices, and what pushes the cost up.',
    schema: faqSchema(LOFT_LPL_FAQ),
    body: pageHero([['/', 'Home'], ['/guides', 'Cost guides'], ['/guides/loft-conversion-cost-liverpool', 'Loft conversion cost Liverpool']], 'Loft conversion cost in Liverpool (2026)', 'From around £27,500 for a rooflight conversion to £60,000 or more for a hip-to-gable with dormer, for a typical 25&nbsp;m² loft. Here is how the main types compare in Liverpool and the North West.') +
      `<section class="plain alt"><div class="container prose">
<h2>Loft conversion costs in Liverpool by type</h2>
<p>Typical 2026 costs for a 25&nbsp;m² finished loft in Liverpool and the North West, before VAT, including a new staircase. These are our UK rates adjusted for the North of England.</p>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Type</th><th class="num">25 m² loft</th><th class="num">Build time</th></tr></thead><tbody>
<tr><th>Rooflight (Velux)</th><td class="num">£27,500&ndash;£39,000</td><td class="num">4&ndash;6 weeks</td></tr>
<tr><th>Rear dormer</th><td class="num">£34,500&ndash;£48,500</td><td class="num">6&ndash;8 weeks</td></tr>
<tr><th>Hip-to-gable with dormer</th><td class="num">£41,500&ndash;£60,000</td><td class="num">6&ndash;10 weeks</td></tr>
<tr><th>Mansard</th><td class="num">£46,000&ndash;£64,500</td><td class="num">8&ndash;12 weeks</td></tr>
</tbody></table></div>
<p>For your own floor area, use the <a href="/guides/loft-conversion-cost">loft conversion calculator</a> and pick &ldquo;North of England&rdquo; as the region.</p>
<h2>What pushes the price up</h2>
<ul><li><strong>Steelwork.</strong> Most dormers and hip-to-gables need steel beams to carry the new roof and floor.</li><li><strong>Head height.</strong> Less than about 2.2m from the top of the ceiling joists to the ridge usually means a dormer or more roof work.</li><li><strong>Bathrooms.</strong> An en-suite adds plumbing, drainage runs and fittings.</li><li><strong>Fire safety.</strong> A protected escape route, fire doors and mains-wired smoke alarms are needed to meet building regulations.</li><li><strong>Party walls.</strong> On terraces and semis, steels bearing on the shared wall usually need a party wall agreement.</li></ul>
<h2>Common questions</h2>${faqHtml(LOFT_LPL_FAQ)}
</div></section>` + ctaBand('Pricing a loft conversion in Liverpool?', 'We are based in Liverpool. Send us the drawings and we measure every item, from steels and joists to fire doors, and price it at current North West rates. Back in 3&ndash;5 working days.')
  });
}

// ---------------------- Insight: extension preliminaries -------------------
// Figures are the preliminaries section of the sample estimate (G2G-EST-0001 Rev P02)
const SAMPLE_PRELIMS = [
  ['Site set-up and protection to the existing house, floors and access route', '1 item', 650],
  ['Scaffold: erect, adapt, 8 weeks hire, dismantle', '1 item', 1650],
  ['Welfare: portable WC and hand wash, serviced weekly', '10 weeks', 450],
  ['Waste: two 8-yard skips, including permit and waste transfer notes', '2 skips', 660],
  ['Supervision: part-time working foreman', '10 weeks', 2500],
  ['Builder\'s clean on completion', '1 item', 300]
];

const PRELIMS_FAQ = [
  ['What are preliminaries in a building quote?', 'Preliminaries are the costs of running the site that do not belong to any one part of the building: scaffolding, skips, welfare, protecting the existing house, supervision and the final clean. Most of them depend on how long the job takes.'],
  ['What percentage should preliminaries be on an extension?', 'There is no fixed figure, because it depends on the programme, access and site. On our sample single-storey rear extension they came to 15.4% of the construction cost. On a small domestic job, a figure well below 10% usually means something has been left out.'],
  ['Are planning and building control fees part of preliminaries?', 'Usually not. Planning and building control fees are normally paid by the client and listed as exclusions, as they are in our sample estimate.'],
  ['Do I need welfare facilities on a domestic extension?', 'Yes. Under the CDM Regulations 2015 every construction site, including domestic work, needs toilets, washing facilities and drinking water. On many extensions that means hiring a portable unit for the length of the job.']
];

function prelimsGuidePage() {
  const total = SAMPLE_PRELIMS.reduce(function (s, p) { return s + p[2]; }, 0);
  const rows = SAMPLE_PRELIMS.map(function (p) { return '<tr><th>' + p[0] + '</th><td>' + p[1] + '</td><td class="num">£' + p[2].toLocaleString('en-GB') + '</td><td class="num">' + (p[2] / total * 100).toFixed(0) + '%</td></tr>'; }).join('');
  return pageShell({
    path: '/guides/extension-preliminaries',
    title: 'Pricing Preliminaries on an Extension: What to Include (2026) | TheGo2Guys',
    desc: 'What to include in preliminaries when pricing a house extension, with a real 2026 breakdown: scaffold, skips, welfare, supervision and the items small builders most often miss.',
    schema: faqSchema(PRELIMS_FAQ),
    body: pageHero([['/', 'Home'], ['/guides', 'Cost guides'], ['/guides/extension-preliminaries', 'Extension preliminaries']], 'Preliminaries: the line that sinks extension quotes', 'On a small extension, preliminaries cost nearly as much as the roof, and they are the easiest part of the job to under-price. Here is what goes in them, using a real 2026 estimate.') +
      `<section class="plain"><div class="container prose">
<h2>Why preliminaries matter on small jobs</h2>
<p>Preliminaries are the costs of running the site rather than building any one part of it: scaffolding, skips, welfare, protecting the client's house, supervision and the final clean. On a big project they disappear into the overall price. On a 16&nbsp;m² extension they are one of the largest items in the estimate.</p>
<p>In our <a href="/sample-estimate.pdf" target="_blank" rel="noopener">sample estimate</a> for a single-storey rear extension in Merseyside, preliminaries came to <strong>£${total.toLocaleString('en-GB')}</strong>. That is <strong>15.4% of the £40,393 construction cost</strong>, close to the cost of the roof (£6,347) or the external walls (£6,370).</p>
<p>Most of that money depends on time. Spread over a 10-week programme it works out at about <strong>£621 a week</strong>. If the job runs two weeks over, the scaffold, welfare and supervision keep costing money, and that comes straight out of your margin.</p>
<h2>A real breakdown</h2>
<p>These are the preliminaries from the sample estimate, priced at Q4 2026 rates.</p>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Item</th><th>Quantity</th><th class="num">Cost</th><th class="num">Share</th></tr></thead><tbody>${rows}<tr><th>Total preliminaries</th><td></td><td class="num"><strong>£${total.toLocaleString('en-GB')}</strong></td><td class="num">100%</td></tr></tbody></table></div>
<p>Supervision is the biggest line at 40%, followed by the scaffold at 27%. Together they make up two-thirds of the total.</p>
</div></section>
<section class="plain alt"><div class="container prose">
<h2>What gets missed</h2>
<h3>1. Your own time on site</h3>
<p>If you run the job yourself, it is tempting to leave supervision out because you are not paying anyone. But every day you spend organising trades, taking deliveries and dealing with the client is a day you are not earning elsewhere. In the sample, a part-time working foreman is £250 a week. Leave it out and you are running the job for free.</p>
<h3>2. Scaffold for the whole time it stands</h3>
<p>Scaffold is usually hired by the week. Price it for the weeks it will actually be up, not the weeks you hope it will be up, and allow for adapting it when the roof goes on. The sample prices 8 weeks of hire on a 10-week job.</p>
<h3>3. Skip permits</h3>
<p>A skip on the road needs a permit from the council, and the cost and lead time vary from one council to the next. Check before you price, especially if there is no room for the skip on the drive.</p>
<h3>4. Protecting the client's house</h3>
<p>Floor protection along the access route, dust sheets and a temporary screen when you knock through. It is a small line, but leaving it out tends to cost far more in callbacks and complaints.</p>
<h3>5. Welfare</h3>
<p>The trades need a toilet, hand washing and drinking water. If the client's bathroom is not available, that means hiring a portable unit for the length of the job, serviced weekly.</p>
<h3>6. The final clean</h3>
<p>Handing over a clean extension is part of the job. Price a builder's clean rather than assuming someone will do it at the end of the last day.</p>
<div class="callout"><p><strong>A quick check before you send a price:</strong> if your preliminaries come in well under 10% of the build cost on a small extension, look again. The usual gaps are supervision time, extra scaffold hire and waste.</p></div>
<h2>Price them by the week</h2>
<p>The simplest way to get preliminaries right is to split them into two groups and work from the programme:</p>
<ul><li><strong>Time-related items</strong> such as scaffold hire, welfare and supervision. Multiply the weekly cost by the number of weeks in the programme.</li><li><strong>Fixed items</strong> such as site set-up, protection, skips and the final clean. Price these once.</li></ul>
<p>Laying them out like this also makes it easy to show a client why a longer programme or a change of scope costs more.</p>
<h2>Common questions</h2>${faqHtml(PRELIMS_FAQ)}
</div></section>` + ctaBand('Want every line priced, preliminaries included?', 'Send us your drawings and we price the whole job, with preliminaries set out item by item like the example above. From £150 for a single-storey extension, in 3&ndash;5 working days.')
  });
}

// ------------------------- Garage conversion guide -------------------------
const GARAGE_FAQ = [
  ['How much does it cost to convert a single garage in 2026?', 'Around £10,000 to £14,000 before VAT for an integral garage turned into a basic room, or £15,000 to £22,000 with a shower room. Northern England, including the North West, generally prices 10 to 20% below the UK average.'],
  ['Is a garage conversion cheaper than an extension?', 'Yes, by a wide margin. Checkatrade puts conversions at about £625 to £1,250 per m², against £1,800 to £3,000 per m² for a new extension.'],
  ['Do I need planning permission to convert my garage?', 'Usually not for internal work. The exception is a house where permitted development rights were removed, most often by a condition on a newer estate that keeps the garage for parking.'],
  ['Do I need Building Regulations approval?', 'Yes, even without planning. In Liverpool a full plans application costs £660 including VAT, and building control will want to see the footing under the old door opening before it is covered up.'],
  ['How long does a garage conversion take?', 'Two to four weeks on site for a simple single conversion. Allow up to five weeks before that for a full plans decision, so get the drawings in early.']
];

function garageGuidePage() {
  return pageShell({
    path: '/guides/garage-conversion-cost',
    title: 'Garage Conversion Cost UK 2026: Single, Double and Detached | TheGo2Guys',
    desc: 'What a garage conversion costs in the UK in 2026: single, double and detached garages, an all-in example budget, Building Regulations, Liverpool fees and what pushes the price up.',
    schema: faqSchema(GARAGE_FAQ),
    body: pageHero([['/', 'Home'], ['/guides', 'Cost guides'], ['/guides/garage-conversion-cost', 'Garage conversion cost']], 'How much does a garage conversion cost in the UK?', 'Turning a single integral garage into a habitable room costs around £10,000&ndash;£14,000 before VAT in 2026. A double garage is more like £20,000&ndash;£30,000, and a detached garage from £15,000. Northern England, including Liverpool and the North West, generally prices 10&ndash;20% below the UK average.') +
      `<section class="plain"><div class="container prose">
<h2>Garage conversion costs in 2026</h2>
<p>A garage conversion is usually the cheapest way to add a room, because the shell is already built. Most of the money goes on bricking up the door opening and insulating the room to current standards. Electrics, heating and finishes make up the rest.</p>
<p>An integral garage sits inside the footprint of the house, often with a bedroom above. An attached garage stands against the side of the house under its own roof. A detached garage is a separate building.</p>
<p>Typical 2026 costs for a finished room with standard finishes, generally quoted before VAT:</p>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Conversion</th><th class="num">Typical size</th><th class="num">Typical cost (ex VAT)</th></tr></thead><tbody>
<tr><th>Partial (front kept as store or utility)</th><td class="num">Part of a single</td><td class="num">£5,500&ndash;£8,500</td></tr>
<tr><th>Single integral garage, basic room</th><td class="num">15&ndash;18 m²</td><td class="num">£10,000&ndash;£14,000</td></tr>
<tr><th>Single attached garage, basic room</th><td class="num">15&ndash;18 m²</td><td class="num">£10,000&ndash;£20,000</td></tr>
<tr><th>Single, bedroom with shower room</th><td class="num">15&ndash;18 m²</td><td class="num">£15,000&ndash;£22,000</td></tr>
<tr><th>Double integral or attached</th><td class="num">30&ndash;36 m²</td><td class="num">£20,000&ndash;£30,000</td></tr>
<tr><th>Detached garage</th><td class="num">Varies</td><td class="num">£15,000&ndash;£31,000 (single), up to £45,000 (double)</td></tr>
</tbody></table></div>
<p>The ranges come from the Checkatrade, MyJobQuote and BestBuilders 2026 cost guides. MyJobQuote puts northern England 10&ndash;20% below the UK average, and the guides put London and the South East 15&ndash;35% above it. An integral garage is the cheapest to convert: it already shares walls with the house and sits next to the existing heating and electrical circuits. A detached garage often needs a new floor, power, water and drainage run across the garden, and sometimes planning permission.</p>
<h2>An example budget</h2>
<p>For a single integral garage at £12,000 for the build, the all-in figure looks more like this:</p>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Item</th><th class="num">Cost</th></tr></thead><tbody>
<tr><th>Build cost</th><td class="num">£12,000</td></tr>
<tr><th>VAT at 20%, if the builder is VAT-registered</th><td class="num">£2,400</td></tr>
<tr><th>Drawings</th><td class="num">£1,000</td></tr>
<tr><th>Liverpool building control, full plans (inc VAT)</th><td class="num">£660</td></tr>
<tr><th>Contingency at 10% of the build</th><td class="num">£1,200</td></tr>
<tr><th>Total</th><td class="num"><strong>£17,260</strong></td></tr>
</tbody></table></div>
<p>Many small builders in the North West trade below the VAT threshold, so the VAT line won't apply to every quote. Make sure any two quotes you compare are on the same basis.</p>
<h2>Where the money goes on a single conversion</h2>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Item</th><th class="num">Typical cost</th></tr></thead><tbody>
<tr><th>Filling the door opening: footing or beam, insulated wall, window</th><td class="num">£2,500&ndash;£6,000</td></tr>
<tr><th>Insulation and damp-proofing to floor, walls and ceiling</th><td class="num">£1,500&ndash;£5,000</td></tr>
<tr><th>Electrics: sockets, lighting, smoke alarms</th><td class="num">£600&ndash;£2,000</td></tr>
<tr><th>Extra radiator off the existing heating</th><td class="num">From around £800</td></tr>
<tr><th>Plumbing and drainage, if adding a sink or WC</th><td class="num">£800&ndash;£3,000</td></tr>
<tr><th>Shower room or bathroom, if wanted</th><td class="num">£5,500&ndash;£9,000</td></tr>
</tbody></table></div>
<p>Plastering, the internal door and joinery, flooring, decorating, the skip, and the builder's overheads and profit make up the rest of a full quote.</p>
<p>The door infill has the widest range. A rendered blockwork panel with a uPVC window is the cheap end. Reclaimed brick to match, a new footing, a bay, or a front door as well as a window push it towards £6,000.</p>
</div></section>
<section class="plain alt"><div class="container prose">
<h2>What Building Regulations will ask for</h2>
<p>Converting a garage into a habitable room needs Building Regulations approval, even when it needs no planning permission. The points that drive cost:</p>
<ul><li><strong>Support under the old door opening.</strong> Garage foundations often stop either side of the door. The infill wall needs a new footing, or a concrete beam spanning between the existing foundations where building control accepts it.</li><li><strong>The floor.</strong> Garage slabs sit 100&ndash;150 mm below the house floor. A damp-proof membrane, insulation and screed or chipboard take up most of that, but the build-up can come out higher or lower. Get it drawn so it finishes level with the house floor, with no trip step at the doorway.</li><li><strong>Insulation.</strong> The new infill wall needs a U-value of 0.18 W/m²K or better. Existing walls, floor and ceiling are upgraded to around 0.30, 0.25 and 0.16 W/m²K, and new windows and doors to 1.4. A single-skin garage wall needs an insulated lining inside, which takes floor space as well as money.</li><li><strong>Fire safety.</strong> Building control will want mains-wired, interlinked smoke alarms. If the room doesn't open directly onto a hall leading to the front door, it also needs an escape window with an opening of at least 0.33 m² and 450 mm each way, its bottom edge no more than 1,100 mm above the floor.</li><li><strong>Ventilation.</strong> Trickle vents in the new window, an opening window big enough to air the room quickly, and extract fans in any shower room or utility.</li><li><strong>Electrics.</strong> New circuits are notifiable under Part P. An electrician registered with a competent person scheme can certify the work; otherwise building control has to inspect it.</li></ul>
<h2>Fees and approvals</h2>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Item</th><th class="num">Typical cost</th></tr></thead><tbody>
<tr><th>Drawings (architect or technician)</th><td class="num">£500&ndash;£2,500</td></tr>
<tr><th>Structural engineer, if needed</th><td class="num">£500&ndash;£1,200</td></tr>
<tr><th>Liverpool City Council building control, full plans (plan and inspection charge, inc VAT)</th><td class="num">£660</td></tr>
<tr><th>Liverpool City Council building notice (inc VAT)</th><td class="num">£672</td></tr>
<tr><th>Lawful Development Certificate, proposed development (half the householder fee)</th><td class="num">£274</td></tr>
<tr><th>Householder planning application, if needed</th><td class="num">£548</td></tr>
</tbody></table></div>
<p>Full plans means the drawings are approved before work starts, which also gives builders a fixed specification to price. A building notice is quicker to get going but leaves more decisions to be made on site. Other councils and registered building control approvers charge their own rates, so ask for a quote.</p>
<p>Most garage conversions don't need planning permission when the work is internal and the building isn't made bigger. Planning is needed where permitted development rights have been removed by a planning condition or an Article 4 direction. That is common on newer estates, where a condition may require the garage to stay available for parking, and in some conservation areas. Listed buildings need listed building consent, and turning a garage into a separate dwelling may need permission whatever the work involves. Check the original planning approval for your house before starting.</p>
<h2>What pushes the price up</h2>
<ul><li><strong>No footing under the door opening</strong>, or poor ground.</li><li><strong>A cracked or uneven slab</strong> that has to be broken out and relaid.</li><li><strong>Moving the boiler or meters</strong>, which are often in the garage on newer houses. Get these priced separately; meter moves are arranged through the supplier and can take weeks.</li><li><strong>A shower room or kitchen</strong>: drainage runs, extract fans and fittings.</li><li><strong>A detached garage</strong>: services across the garden, and often a new roof.</li><li><strong>A shared garage wall</strong>, where a party wall agreement can cost from about £700 per neighbour.</li></ul>
<h2>Extras people forget</h2>
<ul><li>Plastering, skirting, doors, flooring and decorating, if the quote stops at &ldquo;first fix&rdquo;.</li><li>Making good the drive where the door used to be.</li><li>Somewhere to put whatever lives in the garage now.</li><li>A contingency of 10&ndash;15%, more on an older or detached garage.</li><li>Telling your home insurer about the work.</li></ul>
<h2>How long it takes</h2>
<p>Most integral or attached single conversions take two to four weeks on site. Adding a shower room pushes that to four to six weeks, and a detached garage needing new services six to ten. Before that, allow time for drawings and approval: a council has five weeks to decide a full plans application, or two months if you agree, and a planning decision can take up to eight weeks.</p>
<div class="callout"><p><strong>What to do next:</strong> check your house's original planning approval for a condition about the garage, get drawings done and submitted to building control, then get two or three quotes against the same drawings and compare them line by line, on the same VAT basis.</p></div>
<h2>Common questions</h2>${faqHtml(GARAGE_FAQ)}
<h2>Sources</h2>
<ul>
<li><a href="https://checkatrade.com/blog/cost-guides/garage-conversion-cost" rel="noopener">Checkatrade, Garage conversion cost in the UK, updated May 2026</a></li>
<li><a href="https://www.myjobquote.co.uk/costs/garage-conversion-cost" rel="noopener">MyJobQuote, Garage conversion cost, 9 July 2026</a></li>
<li><a href="https://www.bestbuilders.co.uk/guides/costs/how-much-does-a-garage-conversion-cost-in-2026-uk" rel="noopener">BestBuilders, How much does a garage conversion cost in 2026, 1 September 2026</a></li>
<li><a href="https://www.fmb.org.uk/resource/homeowner-s-guide-to-garage-conversion-costs.html" rel="noopener">Federation of Master Builders, Homeowner&rsquo;s guide to garage conversion costs, updated February 2026</a></li>
<li><a href="https://liverpool.gov.uk/planning-and-building-control/building-control/building-regulation-fees/fees-for-domestic-extensions-and-alterations/" rel="noopener">Liverpool City Council, Fees for domestic extensions and alterations (category 4), viewed October 2026</a></li>
<li><a href="https://www.ribblevalley.gov.uk/downloads/file/4972/planning-application-fees-from-1-april-2026-table-" rel="noopener">Planning application fees from 1 April 2026 (national schedule, as published by Ribble Valley Borough Council)</a></li>
<li><a href="https://www.planningportal.co.uk/permission/common-projects/garage-conversion/planning-permission" rel="noopener">Planning Portal, Garage conversion: planning permission</a></li>
<li><a href="https://cncbuildingcontrol.gov.uk/wp-content/uploads/2025/02/CNCD-052-Garage-Conversion-Easy-Guide-V1.2.pdf" rel="noopener">CNC Building Control, Garage conversion easy guide</a></li>
</ul>
</div></section>` + ctaBand('Pricing a garage conversion?', 'Got drawings or quotes? We measure every item, from the infill wall to the skirting, and price it at current North West rates, so you can check a quote or build your own. Back in 3&ndash;5 working days.')
  });
}

// ------------------------------- Insights ----------------------------------
// Newest first. Each insight: [path, date label, title, summary]
const INSIGHTS = [
  ['/insights/autumn-budget-2026-extensions-small-builders', '31 October 2026', 'Autumn Budget 2026: what it means for extensions and small builders', 'VAT stays at 20%, the National Living Wage rises to &pound;13.21 and major Building Regulations changes are paused. What it means for an extension price and for small firms.'],
  ['/insights/construction-jobs-plan-builder-shortages-october-2026', '25 October 2026', 'Builder shortages and the Construction Jobs Plan: what changes for extensions', 'The new jobs plan, the general builder apprenticeship and the &pound;2,000 hiring payment, and how to plan an extension around the shortage of electricians and other trades.'],
  ['/insights/steel-prices-mortgage-rates-october-2026', '18 October 2026', 'Structural steel up 21%, five-year fixes at 6%: pricing an extension this autumn', 'August&rsquo;s materials figures, the new steel import duty and dearer mortgages, and what homeowners and builders should do about them.']
];

function insightsIndexPage() {
  const cards = INSIGHTS.map(function (i) { return '<a class="card" href="' + i[0] + '"><p class="card-date">' + i[1] + '</p><h3>' + i[2] + '</h3><p>' + i[3] + '</p><span class="card-go">Read more &rarr;</span></a>'; }).join('\n');
  return pageShell({
    path: '/insights',
    title: 'UK Construction Insights for Homeowners and Builders | TheGo2Guys',
    desc: 'UK construction news explained for homeowners planning building work and small builders: material prices, borrowing costs, regulations and what they mean for your project.',
    body: pageHero([['/', 'Home'], ['/insights', 'Insights']], 'Insights', 'UK construction news that affects extensions and renovations, with what it means for your budget and what to do about it.') +
      `<section class="plain"><div class="container"><div class="card-grid">
${cards}
</div></div></section>` + CALC_CTA
  });
}

function steelMortgageInsightPage() {
  const path = '/insights/steel-prices-mortgage-rates-october-2026';
  const title = 'Structural steel up 21%, five-year fixes at 6%: pricing an extension this autumn';
  return pageShell({
    path: path,
    title: 'Steel Prices Up 21%, Mortgages at 6%: Extension Costs (Oct 2026)',
    desc: 'Structural steel was 21.2% dearer in August 2026 and five-year fixed mortgages now average 6%. What it means for extension budgets and quotes, and what to do about it.',
    schema: { '@context': 'https://schema.org', '@type': 'Article', headline: title, datePublished: '2026-10-18', author: { '@type': 'Organization', name: 'TheGo2Guys' }, publisher: { '@type': 'Organization', name: 'TheGo2Guys' }, mainEntityOfPage: SITE + path },
    body: pageHero([['/', 'Home'], ['/insights', 'Insights'], [path, 'Steel prices and mortgage rates']], title, 'Fabricated structural steel cost 21.2% more in August than a year earlier, and on 5 October the average five-year fixed mortgage reached 6%. Homeowners about to sign for an extension, and the builders pricing it, are dealing with both at once.') +
      `<section class="plain"><div class="container prose">
<p class="pub-date">Published 18 October 2026</p>
<div class="callout"><p><strong>In short</strong></p><ul><li>Construction materials were 6.4% dearer in August than a year before. Steel beams and pipework rose far faster; concrete and timber barely moved.</li><li>Fixed mortgage rates have climbed quickly, so extensions paid for by remortgaging cost more to fund.</li><li>If you have a quote from the summer, ask the builder to recheck it, especially the steel, before you sign.</li></ul></div>
<h2>August&rsquo;s materials prices</h2>
<p>On 7 October the Department for Business and Trade (DBT) published its monthly building materials figures, covering August 2026. Materials across all construction work were 6.4% dearer than a year before, up from 5.9% in July. For repair and maintenance work, which is how the official figures class home extensions and improvements, the rise was 5.9%.</p>
<p>Individual materials moved very differently:</p>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Material</th><th>Used for</th><th class="num">Change, Aug 2025 to Aug 2026</th></tr></thead><tbody>
<tr><th>Fabricated structural steel</th><td>Steel beams (RSJs) for knock-throughs and openings</td><td class="num">+21.2%</td></tr>
<tr><th>Pipes and fittings (rigid)</th><td>Drainage and plumbing</td><td class="num">+15.5%</td></tr>
<tr><th>Concrete reinforcing bars (steel)</th><td>Reinforcement in foundations and slabs</td><td class="num">+12.5%</td></tr>
<tr><th>All construction materials</th><td></td><td class="num">+6.4%</td></tr>
<tr><th>Repair and maintenance materials</th><td></td><td class="num">+5.9%</td></tr>
<tr><th>Ready-mixed concrete</th><td>Foundations and floor slabs</td><td class="num">&minus;0.7%</td></tr>
<tr><th>Cement</th><td>Mortar, render, site-mixed concrete</td><td class="num">&minus;0.8%</td></tr>
<tr><th>Imported sawn or planed wood</th><td>Roof timbers, stud walls</td><td class="num">&minus;1.6%</td></tr>
</tbody></table></div>
<p>Source: DBT, Building materials and components statistics, published 7 October 2026.</p>
<p>Steel has risen most, and import controls are likely part of the reason. Since 1 July, steel brought into the UK above a set quota has paid a 50% duty, and the duty-free quota is about half what it was. Steel sections and reinforcing bar are both covered. Older contracts signed before 14 March were exempt until 30 September, so the August figures may not yet show the full effect.</p>
<p>The Construction Products Association (CPA) expects further rises. Its head of construction research, Rebecca Larkin, said higher oil and energy prices are already feeding into energy-intensive materials, with the risk &ldquo;clearly on the upside&rdquo; for further inflation. She said smaller specialist contractors, with less buying power, are particularly exposed if prices rise after a contract has been awarded.</p>
<p>On 8 October the Building Cost Information Service (BCIS) estimated that building costs rose 4.3% in the year to the third quarter of 2026, while tender prices, the prices contractors actually win work at, rose 3.2%. Its chief economist, Dr David Crosthwaite, said: &ldquo;Contractors are absorbing or mitigating some cost increases to remain competitive.&rdquo; BCIS expects costs to keep running ahead of tender prices in the near term.</p>
<h2>Borrowing costs</h2>
<p>Moneyfacts reported on 5 October that the average five-year fixed mortgage had reached 6% for the first time in about three years, with the average two-year fix at 5.98%. At the start of September there were nearly 1,500 fixed deals under 5%. By 5 October there were nine.</p>
<p>On &pound;40,000 borrowed over 25 years, a repayment mortgage at 6% costs about &pound;258 a month, against about &pound;234 at 5%. That is roughly &pound;24 a month more for every &pound;40,000 of building work.</p>
<p>The Bank of England held Bank Rate at 3.75% on 17 September, but three of the nine members of its Monetary Policy Committee voted to raise it to 4%. The next decision is due on 5 November.</p>
<p>The S&amp;P Global UK Construction PMI, a monthly survey of construction firms, was 46.1 for September; anything under 50 means less work than the month before. House building was the weakest part of the industry, which S&amp;P Global linked to rising borrowing costs.</p>
</div></section>
<section class="plain alt"><div class="container prose">
<h2>If you are planning an extension</h2>
<p>Waiting is unlikely to bring materials prices down. The CPA and BCIS both expect further rises, and borrowing costs are still climbing. The quieter market helps in one way: BCIS says competition for work is keeping tender prices down, so builders may have more availability and price more keenly than they did a year ago.</p>
<p>Before you sign, ask the builder:</p>
<ol><li>How long is this price valid, and what date are the steel and other supplier prices from?</li><li>Which items are fixed and which are provisional sums, meaning an allowance to be adjusted once the real cost is known?</li><li>Has the steel been priced from the structural engineer&rsquo;s calculations, or is it a guess? If the engineer hasn&rsquo;t sized the beams yet, get that done before asking for final prices.</li><li>If a material price rises before it is ordered, how will that be handled? Make sure the answer is written into the contract.</li></ol>
<p>Keep a contingency of 10&ndash;15% of the build cost for a straightforward extension, and more on an older house. Hold it yourself, outside the contract price. It covers what turns up once the ground is open or the wall comes down. Material price rises should be dealt with in the contract.</p>
<p>If you are remortgaging or taking a further advance to pay for the work, talk to a broker before you sign with a builder. Rates are moving quickly and lenders can withdraw deals at short notice.</p>
<p>Treat a quote far below the others with care. With costs rising faster than tender prices, a very low price may leave the builder too little margin to finish without coming back for more.</p>
<h2>If you are pricing the work</h2>
<p>Most domestic quotes are already held for around 30 days, but fabricator quotes for steel are often valid for much less, sometimes only to the date of order. Put the supplier&rsquo;s quote date and its expiry on your own price, so the client can see where the steel figure came from and when it runs out.</p>
<p>The standard homeowner and minor works contracts are fixed price, with no clause for passing on material rises. If you cannot hold the steel price, show it as a provisional sum or as an item adjusted to the supplier&rsquo;s invoice, and agree that in writing before the contract is signed. With a homeowner client, a price-change term has to be clear and prominent to be enforceable under consumer law. Raising the price mid-job without one usually ends in an argument over the final account.</p>
<p>Order steel as soon as building control has accepted the calculations and the dimensions are checked on site. If the contract was signed at the client&rsquo;s home, the 14-day cancellation period applies, and ordering made-to-measure steel inside it needs the client&rsquo;s written request.</p>
<p>Recheck your <a href="/guides/extension-preliminaries">preliminaries</a> as well. If steel arrives late or a client is slow to make decisions once work starts, the programme runs long, and scaffold hire, welfare and supervision are all charged by the week.</p>
<h2>What it does to an extension price</h2>
<p>Steel supply is a modest share of a single-storey extension, usually a few per cent. On a typical knock-through, steel that cost &pound;800 to supply last August would be about &pound;970 at the index rise. Fitting it, padstones, props and fire protection have not risen anywhere near as much, so the whole steel line moves by less than the headline.</p>
<p>Ready-mixed concrete is slightly cheaper, but reinforcement is up 12.5% and drainage pipes and fittings are up 15.5%. Roof timbers have held steady.</p>
<p>The national index for all materials has been rising by around 0.4% a month. On these figures, an extension priced from June supplier rates could be around 1&ndash;3% short across the whole job, with most of the gap in steel and pipework. On a &pound;50,000 extension that is &pound;500 to &pound;1,500, which can be most of the margin on a tightly priced job. Recheck the steel and drainage figures before the contract is signed.</p>
<h2>Getting a current price</h2>
<p>TheGo2Guys prices extensions from drawings at current rates, with steel and other volatile items on separate lines so both builder and client can see what has moved. A full measured estimate for a single-storey extension starts at &pound;150. Homeowners without drawings yet will need an architect or designer, and then a structural engineer, before a full price is possible. Send drawings through the quote form; the fee and delivery date are confirmed within 24 hours.</p>
<h2>Sources</h2>
<ul>
<li><a href="https://www.gov.uk/government/statistics/building-materials-and-components-statistics-september-2026/construction-building-materials-commentary-september-2026" rel="noopener">Department for Business and Trade, Building materials and components statistics: September 2026 (August data), 7 October 2026</a></li>
<li><a href="https://www.gov.uk/government/publications/uks-steel-trade-measure-from-1-july-2026/uks-steel-trade-measure-from-1-july-2026" rel="noopener">GOV.UK, UK&rsquo;s steel trade measure from 1 July 2026 (updated 1 October 2026)</a></li>
<li><a href="https://constructionwave.co.uk/2026/10/13/uk-construction-braced-for-delayed-hike-in-prices/" rel="noopener">Construction Wave, &ldquo;UK construction braced for &lsquo;delayed&rsquo; hike in prices&rdquo;, 13 October 2026 (comments from Rebecca Larkin, CPA)</a></li>
<li><a href="https://www.bcis.co.uk/news/bcis-construction-industry-forecast/" rel="noopener">BCIS, Construction Industry Forecast, 8 October 2026</a></li>
<li><a href="https://moneyfactscompare.co.uk/news/mortgages/avg-5-year-fixed-rate-at-6pc/" rel="noopener">Moneyfacts, average five-year fixed rate at 6%, 5 October 2026</a></li>
<li><a href="https://www.bankofengland.co.uk/monetary-policy-summary-and-minutes/2026/september-2026" rel="noopener">Bank of England, Monetary Policy Summary and minutes, 17 September 2026</a></li>
<li><a href="https://www.pbctoday.co.uk/news/planning-construction-news/september-2026-pmi-shows-slowing-contraction/166419/" rel="noopener">PBC Today, &ldquo;September 2026 PMI shows slowing contraction&rdquo;, 7 October 2026 (S&amp;P Global UK Construction PMI)</a></li>
</ul>
</div></section>` + ctaBand('Want a price at this month&rsquo;s rates?', 'Send your drawings and every item is priced at current rates, with steel and other volatile materials shown on their own lines. From &pound;150 for a single-storey extension, in 3&ndash;5 working days.')
  });
}

function jobsPlanInsightPage() {
  const path = '/insights/construction-jobs-plan-builder-shortages-october-2026';
  const title = 'Builder shortages and the Construction Jobs Plan: what changes for extensions';
  return pageShell({
    path: path,
    title: 'Construction Jobs Plan and Builder Shortages: What It Means for Extensions, October 2026 | TheGo2Guys',
    desc: 'The Construction Jobs Plan, the new general builder apprenticeship and the £2,000 hiring payment explained, with what homeowners and small builders should do about the shortage of electricians and other trades.',
    schema: { '@context': 'https://schema.org', '@type': 'Article', headline: title, datePublished: '2026-10-25', author: { '@type': 'Organization', name: 'TheGo2Guys' }, publisher: { '@type': 'Organization', name: 'TheGo2Guys' }, mainEntityOfPage: SITE + path },
    body: pageHero([['/', 'Home'], ['/insights', 'Insights'], [path, 'Construction Jobs Plan']], title, 'The government published its Construction Jobs Plan on 19 October, four days after a new Level 2 general builder apprenticeship became available. Neither will put more electricians or bricklayers on site this winter. For small builders the main change is a &pound;2,000 payment for taking on a young apprentice. For homeowners the shortage matters more, because it decides how long the job takes. Plan for it before signing a contract.') +
      `<section class="plain"><div class="container prose">
<p class="pub-date">Published 25 October 2026</p>
<div class="callout"><p><strong>In short</strong></p><ul><li>Electricians and plumbers (known in the trade as M&amp;E, mechanical and electrical) are the trades most often blamed for holding up projects, according to construction professionals. Bricklayers, carpenters and groundworkers are also short.</li><li>For a homeowner, the shortage mostly affects how long the job takes rather than the price. Ask any builder how they will cover these trades before you sign.</li><li>In England, small firms taking on a new apprentice aged 16 to 24 can now claim up to &pound;2,000, paid in two instalments.</li><li>The training schemes in the plan will take years to make a difference on site.</li></ul></div>
<h2>If you are planning an extension or renovation</h2>
<p>The shortage shows up in the schedule (builders call it the programme) more than in the price. On a typical single-storey extension the electrician comes at least three times: first fix, running cables once the stud walls and ceiling joists are in and before plastering; second fix, fitting sockets, switches and lights after plastering; and a final visit to test and certify the work. If the electrician cannot come when the walls are ready, the plasterer waits, and so does everything after.</p>
<p>Before you sign:</p>
<ol><li>Ask the builder which trades they employ and which they subcontract. A builder with their own electrician, or one they use regularly, is less likely to stall.</li><li>Ask for a programme with dates for the first and second fix electrics and plumbing, not just a start and finish date.</li><li>Check the electrician is registered with a competent person scheme such as NICEIC or NAPIT. Building control will need their certificate before signing off the extension.</li><li>Read what the contract says about delays, and make sure stage payments are tied to work completed rather than to dates.</li><li>Do not choose a builder only because they can start next week. In research published in April, the Federation of Master Builders (FMB) and the HomeOwners Alliance found that nearly one in five homeowners had put off work because they could not find a builder they trusted. Look at recent jobs, check insurance and take up references whatever the start date.</li></ol>
<h2>What was announced</h2>
<p>The Construction Jobs Plan brings together funding that had mostly been announced already, including the &pound;625 million construction skills package from March 2025. It backs an industry ambition, set by the Construction Skills Mission Board, of 100,000 construction job opportunities a year by the end of this Parliament. The plan does not define a job opportunity.</p>
<p>For small firms, the useful parts are:</p>
<ul><li><strong>A hiring payment of up to &pound;2,000.</strong> In England, employers that do not pay the apprenticeship levy (a payroll tax on large employers, so this covers almost every small builder) can claim it when they take on a new employee aged 16 to 24 as an apprentice. It applies to apprenticeships starting from 1 October 2026 and is paid in two equal instalments, after 90 days and after 365 days (or 242 days if the apprenticeship is shorter than a year). The government&rsquo;s guidance says it can be claimed on top of existing apprenticeship payments.</li><li><strong>Funded training.</strong> Training for eligible apprentices under 25 is fully funded, so the firm does not pay the college or training provider.</li><li><strong>Foundation apprenticeships.</strong> Up to 10,000 places on these shorter, entry-level courses for young people.</li><li><strong>Help with recruitment.</strong> CITB&rsquo;s New Entrant Support Team can help find a candidate and a training provider, and shared or flexi-job apprenticeship schemes let an agency employ the apprentice and place them with different firms.</li></ul>
<p>The plan&rsquo;s own figures show why training is hard for small firms: 35.1% of the construction workforce is aged 50 or over, and almost all construction firms employ fewer than ten people. The plan says small firms often lack the time, money and help with paperwork that taking on a trainee needs.</p>
<p>On 15 October the FMB announced that the Level 2 General Builder apprenticeship standard is now available. It was developed by small and medium-sized firms and gives apprentices a grounding in bricklaying, carpentry, plastering and painting, which suits the mixed work a small builder does on extensions, repairs and refurbishments.</p>
<p>The National Federation of Builders was less positive about the plan. Its chief executive, Richard Beresford, blamed &ldquo;stealth taxation, particularly in the construction industry&rdquo; for firms shedding staff, and warned that without a better business environment learners would struggle to find employers to train with.</p>
<h2>How short are the trades?</h2>
<p>In Gleeds&rsquo; UK market report for the third quarter of 2026, reported on 16 October, almost nine in ten construction professionals said labour shortages were hurting their projects, and more than half said the effect was moderate or severe. More than a third named M&amp;E as the trade with the greatest impact on delivery. Bricklayers, carpenters and groundworkers were also cited.</p>
<p>The shortage persists even though there is less work about. The Office for National Statistics reported on 15 October that construction output fell 1.0% in the three months to August. Repair and maintenance, the category that includes most home improvement work, fell 0.3%.</p>
</div></section>
<section class="plain alt"><div class="container prose">
<h2>If you run a small building firm</h2>
<p>The &pound;2,000 and the funded training reduce the cost of an apprentice, but they do not cover the wage or the time spent supervising on site, and the money arrives at day 90 and day 365, not at the start. The general builder standard suits a firm that needs someone to help across trades rather than a specialist. If you cannot offer steady work for the whole apprenticeship, a shared scheme lets an agency employ the apprentice and move them between firms.</p>
<p>When pricing, allow realistic time for M&amp;E in the programme and in the preliminaries (the site running costs such as welfare, supervision, skips and scaffold). On the sample estimate in the <a href="/guides/extension-preliminaries">preliminaries guide</a>, welfare and part-time supervision alone come to about &pound;300 a week. A week lost waiting for an electrician costs that and puts the agreed finish date at risk.</p>
<h2>VAT on energy-saving work and the Budget</h2>
<p>The Budget is on 28 October. In its submission the FMB has asked for VAT relief to be extended beyond energy-saving work to wider home improvements, for more support for small firms taking on apprentices, and for funding for mandatory licensing of building firms. None of this is confirmed.</p>
<p>What is already set: installing qualifying energy-saving materials in existing homes, such as insulation, heating controls, draught-proofing, heat pumps, solar panels and batteries, is zero-rated for VAT until 31 March 2027, after which the rate is due to go to 5%. If a renovation includes this kind of work, have it priced as a separate item. Insulation built into the walls and floor of a new extension may not qualify. The rate charged depends on when the work is invoiced or paid for, not when it is finished, so payments made after 31 March 2027 are likely to carry 5%. Check the details with the installer or an accountant before relying on the saving.</p>
<h2>An estimator&rsquo;s view</h2>
<p>For the next year or two, expect electricians and plumbers to be the hardest trades to book. Allow for that in both the price and the programme.</p>
<h2>Getting a price</h2>
<p>TheGo2Guys is a Liverpool-based estimating service. Homeowners can get an independent, itemised price before signing with a builder; builders can hand over their take-offs and pricing. Every trade is shown on its own line, with time for M&amp;E allowed in the preliminaries. Send your drawings through the quote form, or call <a href="tel:01516621274">0151 662 1274</a>, and the fee and delivery date are confirmed within 24 hours.</p>
<h2>Sources</h2>
<ul>
<li><a href="https://www.gov.uk/government/publications/construction-jobs-plan" rel="noopener">GOV.UK, Construction Jobs Plan, 19 October 2026</a></li>
<li><a href="https://help.apprenticeships.education.gov.uk/hc/en-gb/articles/37226219811090-Financial-support-to-hire-a-young-person" rel="noopener">Apprenticeship service, Financial support to hire a young person</a></li>
<li><a href="https://help.apprenticeships.education.gov.uk/hc/en-gb/articles/34063554413202-Non-levy-incentive-for-hiring-a-young-apprentice" rel="noopener">Apprenticeship service, Non-levy incentive for hiring a young apprentice</a></li>
<li><a href="https://www.fmb.org.uk/resource/new-general-builder-apprenticeship-opens-new-route-into-construction.html" rel="noopener">Federation of Master Builders, New General Builder Apprenticeship opens new route into construction, 15 October 2026</a></li>
<li><a href="https://www.buildnews.co.uk/government-unveils-625m-construction-jobs-plan/" rel="noopener">Build News, &ldquo;Government unveils &pound;625m Construction Jobs Plan&rdquo;, 21 October 2026 (NFB comments)</a></li>
<li><a href="https://www.pbctoday.co.uk/news/hr-skills-news/construction-jobs-plan-aims-for-100000-jobs-per-year/166877/" rel="noopener">PBC Today, &ldquo;Construction jobs plan aims for 100,000 jobs per year&rdquo;, 22 October 2026</a></li>
<li><a href="https://pbctoday.co.uk/news/planning-construction-news/labour-shortages-impacting-construction-projects-report-finds/166690/" rel="noopener">PBC Today, &ldquo;Labour shortages are impacting construction projects, report finds&rdquo;, 16 October 2026 (Gleeds UK Market Report Q3 2026)</a></li>
<li><a href="https://www.ons.gov.uk/businessindustryandtrade/constructionindustry/bulletins/constructionoutputingreatbritain/august2026" rel="noopener">Office for National Statistics, Construction output in Great Britain: August 2026, 15 October 2026</a></li>
<li><a href="https://projectscot.com/2026/10/fmb-calls-for-vat-relief-to-encourage-home-improvement-work/" rel="noopener">Project Scotland, &ldquo;FMB calls for VAT relief to encourage home improvement work&rdquo;, 22 October 2026</a></li>
<li><a href="https://www.fmb.org.uk/resource/consumer-confidence-in-builders-costs-uk-economy-11-2bn-a-year.html" rel="noopener">Federation of Master Builders, Consumer confidence in builders costs UK economy &pound;11.2bn a year, 30 April 2026</a></li>
<li><a href="https://hillierhopkins.co.uk/insight-posts/vat-relief-on-energy-saving-materials/" rel="noopener">Hillier Hopkins, VAT relief on energy-saving materials</a></li>
<li><a href="https://www.icaew.com/insights/tax-news/2026/aug-2026/tax-news-in-brief-5-august-2026" rel="noopener">ICAEW, Tax news in brief, 5 August 2026 (Budget date)</a></li>
</ul>
</div></section>` + ctaBand('Want to know what your job should cost?', 'Send your drawings and every trade is priced at current rates on its own line, with a realistic programme behind the preliminaries. Homeowners and builders welcome, in 3&ndash;5 working days.')
  });
}

function budgetInsightPage() {
  const path = '/insights/autumn-budget-2026-extensions-small-builders';
  const title = 'Autumn Budget 2026: what it means for extensions and small builders';
  return pageShell({
    path: path,
    title: 'Autumn Budget 2026: What It Means for Extensions and Small Builders | TheGo2Guys',
    desc: 'The 28 October 2026 Budget explained for homeowners planning an extension and small builders: VAT, the £13.21 National Living Wage, the Building Regulations pause, fuel duty and capital allowances.',
    schema: { '@context': 'https://schema.org', '@type': 'Article', headline: title, datePublished: '2026-10-31', author: { '@type': 'Organization', name: 'TheGo2Guys' }, publisher: { '@type': 'Organization', name: 'TheGo2Guys' }, mainEntityOfPage: SITE + path },
    body: pageHero([['/', 'Home'], ['/insights', 'Insights'], [path, 'Autumn Budget 2026']], title, 'The Budget on 28 October 2026 left VAT on home improvements at 20%, raised the National Living Wage to &pound;13.21 an hour from April 2027 and promised no major changes to the Building Regulations in England before the next general election, apart from safety measures. A homeowner&rsquo;s extension price barely moves. Small builders feel more of it, through the wage rise and the pause on new regulations.') +
      `<section class="plain"><div class="container prose">
<p class="pub-date">Published 31 October 2026</p>
<div class="callout"><p><strong>In short</strong></p><ul><li>VAT on extensions stays at 20% where the builder is VAT-registered. The zero rate on installing energy-saving materials in existing homes still ends on 31 March 2027.</li><li>The National Living Wage rises 3.9% to &pound;13.21 an hour on 1 April 2027. Few skilled trades are paid at that level, so the direct effect on an extension price is a couple of hundred pounds.</li><li>No major changes to the Building Regulations in England for the rest of this Parliament, except where safety is involved. The energy-efficiency changes already made for 24 March 2027 still go ahead.</li><li>The fuel duty cut and freeze now run to 1 July 2027. Nothing has been promised after that.</li></ul></div>
<h2>What changed</h2>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Measure</th><th>From</th><th>Who it affects</th></tr></thead><tbody>
<tr><th>National Living Wage (21 and over) up 3.9% to &pound;13.21 an hour</th><td>1 April 2027</td><td>Firms with staff on or near the minimum</td></tr>
<tr><th>National Minimum Wage for 18 to 20-year-olds up to &pound;11.27 an hour</th><td>1 April 2027</td><td>Firms employing young workers</td></tr>
<tr><th>No major Building Regulations changes, except where safety-critical</th><td>Until the next general election (England)</td><td>Designers, builders, building control</td></tr>
<tr><th>5p fuel duty cut extended; planned rise in January cancelled</th><td>To 1 July 2027</td><td>Anyone running vans</td></tr>
<tr><th>First-year allowance on main-rate plant and machinery up from 40% to 50%</th><td>Spending from 1 January 2027</td><td>Firms spending more than the &pound;1 million Annual Investment Allowance</td></tr>
<tr><th>Main-rate writing-down allowance cut from 14% to 12%</th><td>April 2027</td><td>Firms with an existing plant and machinery pool</td></tr>
<tr><th>Tax on property income: basic rate 24%, higher 44%, additional 49%</th><td>6 April 2027</td><td>Landlords in England, Wales and Northern Ireland</td></tr>
<tr><th>Biodiversity net gain no longer required on residential brownfield sites up to 1.5 hectares</th><td>No date yet</td><td>Small housebuilders</td></tr>
</tbody></table></div>
<p>Sources: HM Treasury, Budget 2026; FMB, 28 October 2026; Inside Housing, 29 October 2026; Travers Smith.</p>
<h2>VAT: no cut for home improvements</h2>
<p>The Federation of Master Builders (FMB) had asked for a VAT cut on home improvement work, at least where it includes energy-efficiency measures. It did not get one. In its response on 28 October, the FMB said the relief should cover whole improvement jobs, not only the specific installations whose zero rate ends next March.</p>
<p>Five days before the Budget, the FMB published research suggesting homeowners in the North of England put off &pound;2.5 billion of building work a year because they cannot find a builder they trust. In the same release its members argued that a lower VAT rate would bring some of that work forward. Rob Clark, who runs a building firm in Blackpool, said: &ldquo;At the standard rate, a &pound;50,000 extension carries &pound;10,000 of VAT.&rdquo;</p>
<p>For the coming year the position is unchanged. A builder who is VAT-registered charges 20% on an extension. A builder whose turnover is under the &pound;90,000 registration threshold charges no VAT, so always check whether a quote includes it before comparing prices.</p>
<p>Installing qualifying energy-saving materials in an existing home, such as loft or cavity wall insulation, a heat pump, solar panels or a battery, is zero-rated until 31 March 2027 and then due to go to 5%. HMRC treats insulation and other energy-saving materials built into a new extension as part of one standard-rated job, so pricing them on a separate line does not make them zero-rated. Separate work on the existing house can qualify. If that applies to your project, ask the installer or an accountant how the timing of invoices and payments around 31 March affects the rate. The earlier insight on the <a href="/insights/construction-jobs-plan-builder-shortages-october-2026">Construction Jobs Plan</a> covers the relief in more detail.</p>
<h2>Building Regulations: no major changes, except for safety</h2>
<p>In his speech the Chancellor, John Healey, said: &ldquo;No major changes to building regulations in this Parliament, except where it is critical to safety.&rdquo; The Budget does not say what counts as a major change. Building safety work, including the Grenfell Tower Inquiry recommendations, carries on. Building regulations are devolved, so the promise covers England but not Wales or Scotland.</p>
<p>It is a policy commitment, not a change in the law, and it does not cancel rules already made. The amendment regulations bringing in the Future Homes Standard were made in March 2026, and most of them take effect on 24 March 2027. The biggest changes are for new homes, including a requirement for on-site renewable electricity such as solar panels. The updated Approved Document L, the guidance on energy efficiency, also covers work to existing homes, so an extension notified to building control on or after 24 March 2027 is assessed against the new edition. Ask your designer whether that changes the insulation or glazing specification on your drawings.</p>
<p>Work notified before 24 March 2027 can stay under the current rules if it starts before 24 March 2028. That applies to building notices, full plans applications and initial notices from approved inspectors, and on a site with several houses it applies to each house separately.</p>
<p>For a homeowner, the result is that once the drawings are approved, the rules are unlikely to change again before the extension is built. A small builder doing extensions and refurbishments has fewer changes to keep up with after March.</p>
<h2>Wages: the rise from April</h2>
<p>The National Living Wage for workers aged 21 and over goes from &pound;12.71 to &pound;13.21 an hour on 1 April 2027. The rate for 18 to 20-year-olds goes to &pound;11.27. Apprentices under 19, or in their first year, are on the separate apprentice rate. The headline rates of employer National Insurance are not changing. FMB chief executive Brian Berry said: &ldquo;For small building firms operating on tight margins, a further increase will be difficult to absorb.&rdquo;</p>
<p>Skilled trades are rarely paid at the minimum, and many labourers are self-employed or already earn more. Where a firm does employ a labourer on the minimum for 39 hours a week, the rise is &pound;19.50 a week in wages, or about &pound;25 once employer National Insurance, pension and holiday pay are added. Over a ten-week single-storey extension that is roughly &pound;250. The bigger effect may be staff just above the minimum asking to keep their gap over it.</p>
<p>Materials have moved more. Across all construction work, materials were 6.4% dearer in August than a year earlier, with fabricated structural steel up 21.2% and rigid pipes and fittings up 15.5%. The <a href="/insights/steel-prices-mortgage-rates-october-2026">steel prices insight</a> has the full figures.</p>
<h2>Fuel, vans and equipment</h2>
<p>The planned fuel duty rise in January has been cancelled, and the 5p cut and freeze now run to 1 July 2027. The red diesel cut is also extended, but construction plant has had to run on white diesel since April 2022, so that one does not help builders.</p>
<p>Most small firms claim 100% relief on vans and plant through the &pound;1 million Annual Investment Allowance, so the change to the first-year allowance (40% to 50% from 1 January 2027) matters only to firms spending more than that. The cut in the writing-down allowance from 14% to 12% from April 2027 slows the relief on what is already in a firm&rsquo;s plant and machinery pool. Double-cab pick-ups are treated as cars and get neither. If you are buying a van or plant soon, ask your accountant whether to buy before or after 1 January.</p>
<h2>Landlords</h2>
<p>Landlords in England, Wales and Northern Ireland will pay 24% on property income at the basic rate from 6 April 2027, 44% at the higher rate and 49% at the additional rate. That combines last year&rsquo;s two-point rise, which had not yet started, with another two points announced in this Budget. Repairs and improvements are treated differently for tax, so take advice before a refurbishment between tenancies.</p>
<h2>Inflation and borrowing</h2>
<p>The Office for Budget Responsibility, the official forecaster, expects inflation to peak at 3.8% in early 2027 and return to the 2% target in the third quarter of 2028. Inflation was 3.5% in September. The Bank of England&rsquo;s next interest rate decision will be announced on 5 November. For anyone borrowing to pay for an extension, the mortgage rate is likely to affect the total cost more than anything in this Budget, so speak to a broker before signing with a builder.</p>
</div></section>
<section class="plain alt"><div class="container prose">
<h2>If you are planning an extension</h2>
<ol><li>Ask whether each quote includes VAT. A VAT-registered builder will add 20%.</li><li>If the work includes insulation, a heat pump or solar panels in the existing house, ask how it will be treated for VAT, and whether invoicing before 31 March 2027 makes a difference.</li><li>If the drawings are not yet with building control, ask your designer whether the 24 March 2027 changes to Approved Document L affect your specification.</li><li>If you have a quote from the summer, ask the builder to recheck the steel and drainage prices before you sign.</li><li>Keep a contingency of 10 to 15% of the build cost, more on an older house. Hold it yourself rather than adding it to the contract price, and use it for what turns up once the ground is open or walls come down.</li></ol>
<h2>If you run a small building firm</h2>
<ol><li>Price any work running past 1 April 2027 at the new rates for staff on or near the minimum, and check how long your quotes are valid for.</li><li>If you are starting a new house, get the building notice, full plans or initial notice in before 24 March 2027 and start each plot before 24 March 2028 to stay under the current energy rules.</li><li>Talk to your accountant before buying vans or plant around 1 January.</li></ol>
<h2>An estimator&rsquo;s view</h2>
<p>A single-storey extension in Liverpool with a standard finish costs around &pound;2,000&ndash;&pound;2,650 per m&sup2; to build, before VAT (see the <a href="/guides/house-extension-cost-liverpool">Liverpool extension cost guide</a>). Nothing in this Budget shifts that range by more than a fraction of a per cent. On a 20&nbsp;m&sup2; extension at around &pound;45,000, the wage rise might add &pound;250, and materials inflation over the past year far more. The pause on new regulations matters more than either: a scheme notified before 24 March 2027 and started before March 2028 can be built to the rules it was drawn to, and nothing major is due to change after that.</p>
<h2>Getting a price</h2>
<p>TheGo2Guys is an estimating service based in Liverpool, working for homeowners and builders. Homeowners use an itemised estimate to check builders&rsquo; quotes before signing; builders use it to price a job without doing the take-off themselves. Labour and materials are priced at current rates on separate lines. A full measured estimate for a single-storey extension starts at &pound;150. Send your drawings through the <a href="/#contact">quote form</a>, and the fee and delivery date are confirmed within 24 hours.</p>
<h2>Sources</h2>
<ul>
<li><a href="https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html" rel="noopener">HM Treasury, Budget 2026, 28 October 2026</a></li>
<li><a href="https://www.fmb.org.uk/resource/autumn-budget-2026-rising-wage-costs-put-small-builders-under-pressure.html" rel="noopener">Federation of Master Builders, Autumn Budget 2026: rising wage costs put small builders under pressure, 28 October 2026</a></li>
<li><a href="https://www.fmb.org.uk/resource/2-5bn-of-building-work-on-hold-in-the-north-says-fmb.html" rel="noopener">Federation of Master Builders, &pound;2.5bn of building work on hold in the North, 23 October 2026</a></li>
<li><a href="https://theintermediary.co.uk/2026/10/autumn-budget-2026-major-building-regulation-changes-ruled-out-for-remainder-of-parliament/" rel="noopener">The Intermediary, &ldquo;Major building regulation changes ruled out for remainder of Parliament&rdquo;, 28 October 2026</a></li>
<li><a href="https://www.planninggeek.co.uk/2026/building-regulations-budget/" rel="noopener">Planning Geek, &ldquo;Budget pledges building regulations stability&rdquo;, 28 October 2026</a></li>
<li><a href="https://www.gov.uk/government/publications/the-future-homes-and-buildings-standards-building-circular-012026/the-future-homes-and-buildings-standards-building-circular-012026-letter" rel="noopener">MHCLG, The Future Homes and Buildings Standards: Building Circular 01/2026</a></li>
<li><a href="https://www.insidehousing.co.uk/insight/5-things-we-learned-from-the-autumn-budget-2026-99334" rel="noopener">Inside Housing, &ldquo;5 things we learned from the Autumn Budget 2026&rdquo;, 29 October 2026</a></li>
<li><a href="https://www.traverssmith.com/knowledge/knowledge-container/the-autumn-budget-2026-property-infrastructure/" rel="noopener">Travers Smith, The Budget 2026: Property &amp; Infrastructure</a></li>
<li><a href="https://www.gov.uk/guidance/vat-on-energy-saving-materials-and-heating-equipment-notice-7086" rel="noopener">HMRC, VAT on energy-saving materials and heating equipment (VAT Notice 708/6)</a></li>
<li><a href="https://www.gov.uk/government/statistics/building-materials-and-components-statistics-september-2026/construction-building-materials-commentary-september-2026" rel="noopener">Department for Business and Trade, Building materials and components statistics, 7 October 2026</a></li>
<li><a href="https://www.bankofengland.co.uk/monetary-policy/upcoming-mpc-dates" rel="noopener">Bank of England, Upcoming MPC dates</a></li>
</ul>
</div></section>` + ctaBand('Want to check a quote against current rates?', 'Send your drawings and every item is priced at current North West rates, with labour and materials on their own lines. From &pound;150 for a single-storey extension, in 3&ndash;5 working days.')
  });
}

// ------------------------------ 404 page -----------------------------------
function notFoundPage() {
  return pageShell({
    path: '/404',
    noindex: true,
    title: 'Page not found | TheGo2Guys',
    desc: 'This page could not be found.',
    body: pageHero([['/', 'Home']], 'Page not found', 'The page you were looking for has moved or does not exist.') +
      `<section class="plain"><div class="container prose"><p>Try one of these instead:</p><ul><li><a href="/">Home page and quote form</a></li><li><a href="/guides">Building cost guides</a></li><li><a href="/insights">Insights</a></li><li><a href="/calculators">Free calculators</a></li></ul></div></section>` + CALC_CTA
  });
}

// ------------------------------ Legal pages --------------------------------
function termsPage() {
  return pageShell({
    path: '/terms',
    title: 'Terms and Conditions | TheGo2Guys',
    desc: 'Terms and conditions for TheGo2Guys building estimating services.',
    body: pageHero([['/', 'Home'], ['/terms', 'Terms and conditions']], 'Terms and conditions', 'Please read these terms carefully before using our estimating services.') +
      `<section class="plain"><div class="container prose legal"><h2>1. Services</h2><p>TheGo2Guys provides building estimating services including material takeoffs, cost estimates, bills of quantities, and tender pricing. All estimates are prepared based on the drawings, specifications, and information provided by the client.</p><h2>2. Estimates &amp; Accuracy</h2><p>While we strive to provide accurate estimates based on the information supplied, our estimates are professional opinions and not guarantees of final project costs. Actual costs may vary due to market fluctuations, design changes, site conditions, or other factors beyond our control. We recommend clients verify all estimates before committing to contracts or purchases.</p><h2>3. Turnaround Times</h2><p>Standard turnaround is 3-5 working days from receipt of all required drawings and information. Express service is available at an additional cost. Turnaround times are estimates and may be affected by project complexity, incomplete information, or circumstances beyond our control.</p><h2>4. Client Responsibilities</h2><p>The client must provide complete and accurate drawings, specifications, and project information. We are not liable for inaccuracies in estimates caused by incomplete, incorrect, or misleading information provided by the client. Any changes to the project scope after the estimate has been prepared may incur additional charges.</p><h2>5. Payment</h2><p>Payment is due upon completion of the estimate unless otherwise agreed in writing. For larger projects, a 50% deposit may be required before work commences. Accepted payment methods will be agreed between parties. Late payments may incur additional charges.</p><h2>6. Refunds</h2><p>Due to the nature of estimating services, all work is bespoke and non-refundable once commenced. If we are unable to deliver the agreed services, a pro-rata refund may be offered at our discretion.</p><h2>7. Intellectual Property</h2><p>All estimates, reports, and documents prepared by TheGo2Guys remain our intellectual property until full payment is received. Upon payment, the client receives a licence to use the estimate for their project. Estimates may not be resold, shared, or distributed to third parties without prior written consent.</p><h2>8. Liability</h2><p>TheGo2Guys shall not be liable for any indirect, consequential, or financial losses arising from the use of our estimates. Our total liability shall not exceed the amount paid by the client for the specific estimate in question. We are not responsible for decisions made by the client based on the estimate, including but not limited to contract bids, material orders, or project commitments.</p><h2>9. Confidentiality</h2><p>We treat all client information, drawings, and project details as confidential and will not disclose them to third parties without the client's consent, except where required by law.</p><h2>10. Cancellation</h2><p>The client may cancel a request before work has commenced for a full refund. Once work has begun, cancellation is non-refundable. TheGo2Guys reserves the right to decline or cancel any project at our discretion, with a pro-rata refund for work not completed.</p><h2>11. Governing Law</h2><p>These terms shall be governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p><h2>12. Changes to Terms</h2><p>TheGo2Guys reserves the right to update these terms at any time. Continued use of our services after changes constitutes acceptance of the revised terms.</p></div></section>`
  });
}

function privacyPage() {
  return pageShell({
    path: '/privacy',
    title: 'Privacy Policy | TheGo2Guys',
    desc: 'How TheGo2Guys collects and uses your personal information.',
    body: pageHero([['/', 'Home'], ['/privacy', 'Privacy policy']], 'Privacy policy', 'Last updated 8 October 2026') +
      `<section class="plain"><div class="container prose legal"><h2>1. Who we are</h2><p>TheGo2Guys provides construction takeoff and estimating services to builders and contractors in the UK. We are the data controller for the personal information described here. Contact us at <a href="mailto:hello@thego2guys.uk">hello@thego2guys.uk</a> or on <a href="tel:01516621274">0151 662 1274</a>.</p><h2>2. What we collect</h2><p>Your name, email address, phone number and company name; details of the job you want priced; any drawings, plans, specifications or other documents you send us; and our correspondence with you. If you use a lead form on Facebook or Instagram, we receive only the information you submit in that form.</p><h2>3. How we use it</h2><p>To respond to your enquiry and contact you about your estimate, to prepare takeoffs, estimates and quotations, to provide our services, and to keep the business records the law requires. We will not send you marketing emails unless you have agreed to receive them, and you can opt out at any time.</p><h2>4. Our lawful basis</h2><p>We use your information to take steps at your request before entering into a contract (such as preparing an estimate), to perform a contract with you, for our legitimate interest in running our business, and to comply with legal obligations.</p><h2>5. Who we share it with</h2><p>We do not sell your information. We share it only with service providers that help us run the business, such as our email and file storage provider (Google Workspace), our website and form hosting providers (Cloudflare, FormSubmit), and Meta when you use a Facebook or Instagram lead form, or where the law requires it.</p><h2>6. How long we keep it</h2><p>If you request an estimate but do not go on to work with us, we keep your details for up to 12 months and then delete them. If you become a client, we keep records for up to 6 years after our last job together, for accounting and legal purposes.</p><h2>7. Your rights</h2><p>Under UK data protection law you can ask to access, correct or delete your information, object to or restrict how we use it, and ask for a copy to be transferred to you. Email <a href="mailto:hello@thego2guys.uk">hello@thego2guys.uk</a> and we will respond within one month.</p><h2>8. Complaints</h2><p>If you are unhappy with how we have handled your information, please contact us first. You can also complain to the Information Commissioner&#39;s Office at <a href="https://ico.org.uk/make-a-complaint/">ico.org.uk</a> or on 0303 123 1113.</p><h2>9. Changes to this policy</h2><p>We may update this policy from time to time. The latest version will always be on this page.</p></div></section>`
  });
}
