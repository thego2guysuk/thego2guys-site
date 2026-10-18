export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname; if (path === '/favicon.ico' || path === '/favicon.png' || path === '/apple-touch-icon.png') { return new Response(Uint8Array.from(atob(FAVICON_B64), function (c) { return c.charCodeAt(0); }), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' } }); }
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
    phone: String(form.get('phone') || ''), service: String(form.get('service') || ''),
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
const HTML = `<!DOCTYPE html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0"><title>Building Estimating Services UK | TheGo2Guys</title><meta name="description" content="Building estimates for UK builders: extensions, loft conversions and new homes. Measured from your drawings, priced at current UK rates. From £120, 3–5 working days."><link rel="canonical" href="https://thego2guys.uk/"><meta name="theme-color" content="#18211D"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..800&family=Public+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="icon" type="image/png" sizes="96x96" href="/favicon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/styles.css"></head><body><a class="skip" href="#main">Skip to content</a><header><div class="container nav-bar"><a href="#top" class="logo"><div class="logo-icon">G2G</div>TheGo2Guys</a><ul class="nav-links" id="navLinks"><li><a href="#services">Services</a></li><li><a href="/calculators">Free tools</a></li><li><a href="/guides">Cost guides</a></li><li><a href="#pricing">Pricing</a></li><li><a href="tel:01516621274" class="nav-phone">0151 662 1274</a></li><li><a href="#contact" class="nav-cta">Request a quote</a></li></ul><button class="mobile-menu-btn" aria-label="Menu" aria-controls="navLinks" onclick="document.getElementById('navLinks').classList.toggle('open')">&#9776;</button></div></header><main id="main"><section class="hero" id="top"><div class="container"><div class="hero-copy"><h1>Building estimates for extensions and new homes</h1><p class="lede">Send us your drawings. We measure every item, price it at current UK rates and return a clear, itemised estimate within 3&ndash;5 working days.</p><div class="hero-cta"><a href="#contact" class="btn-primary">Request a quote</a><a href="#sample" class="btn-ghost">See an example estimate</a></div><dl class="facts"><div><dt>Prices from</dt><dd>£120</dd></div><div><dt>Turnaround</dt><dd>3&ndash;5 days</dd></div><div><dt>Express</dt><dd>48 hours</dd></div><div><dt>Coverage</dt><dd>UK-wide</dd></div></dl></div></div></section><section class="services" id="services"><div class="container split"><div class="split-head"><h2>What we prepare</h2><p>Estimates for builders and contractors working on residential projects, from single-storey extensions to new-build houses.</p><div class="includes"><h3>Every estimate includes</h3><ul><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>An elemental summary with cost per m²</li><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>Every item measured, with quantities and rates</li><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>Assumptions and exclusions set out clearly</li><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>A PDF with revision control, ready to share</li></ul></div></div><dl class="service-list"><div><dt>Material takeoffs</dt><dd>Quantities for every item on your drawings, so you can order from your merchant with confidence.</dd></div><div><dt>Cost estimates</dt><dd>Labour, materials and plant priced at current UK rates, with an elemental summary and cost per m².</dd></div><div><dt>Bills of quantities</dt><dd>Itemised and measured generally to RICS NRM2, ready to send to subcontractors or your client.</dd></div><div><dt>Tender pricing</dt><dd>Priced schedules for tender returns, set out so every figure is easy to check.</dd></div></dl></div></section><section class="process" id="process"><div class="container"><h2>How it works</h2><ol class="steps"><li><span class="step-n">1</span><h3>Send your drawings and specification</h3><p>Upload plans, sections, elevations and any specification through the form below, or email them. We confirm the scope and price within 24 hours.</p></li><li><span class="step-n">2</span><h3>We measure and price</h3><p>We do a full takeoff from your drawings and price every item at current rates for your region.</p></li><li><span class="step-n">3</span><h3>You receive your estimate</h3><p>An itemised PDF in 3&ndash;5 working days, or 48 hours with express. If you have any questions about it, we'll go through them with you directly.</p></li></ol></div></section><section class="sample" id="sample"><div class="container sample-grid"><div class="sample-copy"><h2>See an example</h2><p>A sample estimate for a single-storey rear extension, in the same format your project would be issued in.</p><p>It runs to seven pages: an elemental summary, every measured item with quantities and rates, and the assumptions and exclusions behind the figures.</p><a href="/sample-estimate.pdf" target="_blank" rel="noopener" class="btn-ghost">Open the sample estimate (PDF)</a></div><div class="sample-doc"><a href="/sample-estimate.pdf" target="_blank" rel="noopener" class="doc" aria-label="Open the full sample estimate (PDF)"><span class="doc-stamp">Sample</span><div class="doc-head"><span class="logo-icon sm">G2G</span><span>Cost estimate</span><span class="doc-ref">G2G-EST-0001 Rev P02</span></div><p class="doc-title">Single-storey rear extension</p><p class="doc-sub">Estimate summary, Merseyside, Q4 2026 prices</p><dl class="doc-kpis"><div><dt>Total excl. VAT</dt><dd>£46,451</dd></div><div><dt>Cost per m²</dt><dd>£2,853</dd></div><div><dt>Floor area</dt><dd>16.28 m²</dd></div><div><dt>Programme</dt><dd>10 weeks</dd></div></dl><table class="doc-table"><thead><tr><th>Ref</th><th>Element</th><th>£</th></tr></thead><tbody><tr><td>1</td><td>Preliminaries</td><td>6,210</td></tr><tr><td>2</td><td>Demolitions and alterations</td><td>3,888</td></tr><tr><td>3</td><td>Substructure</td><td>4,545</td></tr><tr><td>4</td><td>Ground floor</td><td>1,743</td></tr><tr><td>5</td><td>External walls</td><td>6,370</td></tr><tr><td>6</td><td>Roof</td><td>6,347</td></tr><tr><td>7</td><td>Windows and external doors</td><td>5,820</td></tr><tr><td>8</td><td>Internal finishes</td><td>1,781</td></tr><tr><td>9</td><td>Services</td><td>2,200</td></tr><tr><td>10</td><td>Drainage</td><td>1,038</td></tr><tr><td>11</td><td>External works</td><td>450</td></tr></tbody><tfoot><tr><td></td><td>Construction cost</td><td>40,393</td></tr><tr><td></td><td>Overheads, profit and contingency</td><td>6,059</td></tr><tr class="doc-total"><td></td><td>Estimate total excl. VAT</td><td>46,451</td></tr></tfoot></table><span class="doc-open">Open the full 7-page PDF</span></a></div></div></section><section class="pricing" id="pricing"><div class="container split"><div class="split-head"><h2>Pricing</h2><p>Typical starting prices. Send your drawings and we confirm the exact price before any work starts. Larger or unusual projects are quoted individually.</p></div><div><table class="price-table"><thead><tr><th scope="col">Work</th><th scope="col">Scope</th><th scope="col" class="num">From</th></tr></thead><tbody><tr><th scope="row">Material takeoff</th><td>Quantities only, for jobs you price yourself</td><td class="num">£120</td></tr><tr><th scope="row">Single-storey extension</th><td>Full measured estimate</td><td class="num">£150</td></tr><tr><th scope="row">Double-storey extension</th><td>Full measured estimate</td><td class="num">£250</td></tr><tr><th scope="row">New-build house</th><td>Full measured estimate, single dwelling</td><td class="num">£450</td></tr></tbody></table><div class="price-notes"><p><strong>Standard turnaround:</strong> 3&ndash;5 working days from receipt of full drawings.</p><p><strong>Express:</strong> 48 hours, at an extra 50%.</p></div><a href="#contact" class="btn-primary">Request a quote</a></div></div></section><section class="contact" id="contact"><div class="container contact-grid"><div class="contact-info"><h2>Request a quote</h2><p>Send your drawings and a few details. We reply within 24 hours with a price and a delivery date.</p><dl class="contact-list"><div><dt>Email</dt><dd><a href="mailto:hello@thego2guys.uk">hello@thego2guys.uk</a></dd></div><div><dt>Phone</dt><dd><a href="tel:01516621274">0151 662 1274</a></dd></div><div><dt>Coverage</dt><dd>UK-wide</dd></div></dl></div><form class="contact-form" id="quoteForm" novalidate><div class="form-row"><div class="form-group"><label for="name">Full name *</label><input type="text" id="name" name="name" required autocomplete="name"></div><div class="form-group"><label for="company">Company</label><input type="text" id="company" name="company" autocomplete="organization"></div></div><div class="form-row"><div class="form-group"><label for="email">Email *</label><input type="email" id="email" name="email" required autocomplete="email"></div><div class="form-group"><label for="phone">Phone</label><input type="tel" id="phone" name="phone" autocomplete="tel"></div></div><div class="form-group"><label for="service">Service *</label><select id="service" name="service" required><option value="">Select a service</option><option value="Material Takeoffs">Material takeoff</option><option value="Cost Estimates">Cost estimate</option><option value="Bills of Quantities">Bill of quantities</option><option value="Tender Pricing">Tender pricing</option><option value="Multiple Services">Not sure / more than one</option></select></div><div class="form-group"><label for="message">Project details *</label><textarea id="message" name="message" required placeholder="Type of project, approximate size, location and when you need the estimate"></textarea></div><div class="form-group"><label for="file">Drawings</label><input type="file" id="file" name="file" accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.zip" multiple><p class="form-hint">PDF, DWG, DXF, JPG, PNG or ZIP. Up to 10 files, 25MB each.</p></div><div style="position:absolute;left:-9999px;" aria-hidden="true"><label for="hp">Leave this empty</label><input type="text" id="hp" name="_honey" tabindex="-1" autocomplete="off"></div><button type="submit" class="form-submit" id="quoteSubmit">Send request</button><div class="form-status" id="formStatus" role="status" aria-live="polite"></div><p class="form-note">Files too large? Email them to <a href="mailto:hello@thego2guys.uk">hello@thego2guys.uk</a> or send a WeTransfer link.</p></form></div></section></main><footer><div class="container"><div class="footer-top"><div class="footer-brand"><a href="#top" class="logo"><div class="logo-icon">G2G</div>TheGo2Guys</a><p>Building estimates for UK builders and contractors.</p></div><div class="footer-col"><h4>Services</h4><ul><li><a href="#services">Material takeoffs</a></li><li><a href="#services">Cost estimates</a></li><li><a href="#services">Bills of quantities</a></li><li><a href="#services">Tender pricing</a></li></ul></div><div class="footer-col"><h4>Company</h4><ul><li><a href="#process">How it works</a></li><li><a href="#pricing">Pricing</a></li><li><a href="/calculators">Free calculators</a></li><li><a href="/guides">Cost guides</a></li><li><a href="/sample-estimate.pdf" target="_blank" rel="noopener">Sample estimate</a></li><li><a href="/terms">Terms and conditions</a></li><li><a href="/privacy">Privacy policy</a></li></ul></div><div class="footer-col"><h4>Contact</h4><ul><li><a href="mailto:hello@thego2guys.uk">hello@thego2guys.uk</a></li><li><a href="tel:01516621274">0151 662 1274</a></li><li>UK-wide</li></ul></div></div><div class="footer-bottom"><p>&copy; 2026 TheGo2Guys. Building estimating services, UK.</p></div></div></footer><script src="/script.js"></script></body></html>`;
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
.callout{background:var(--green-tint);border-left:4px solid var(--green);padding:18px 20px;border-radius:0 6px 6px 0;margin:8px 0 24px}.callout p{margin:0;color:var(--ink)}
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
    '/guides/extension-preliminaries': prelimsGuidePage
  };
  if (pages[path]) { return new Response(pages[path](), { headers: PAGE_HEADERS }); }
  if (path === '/sitemap.xml') { return new Response(sitemapXml(), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }); }
  if (path === '/robots.txt') { return new Response('User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /files/\n\nSitemap: ' + SITE + '/sitemap.xml\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
  return null;
}

function sitemapXml() {
  const paths = ['/', '/calculators', '/calculators/bricks-and-blocks', '/calculators/concrete', '/calculators/plaster', '/guides', '/guides/house-extension-cost', '/guides/loft-conversion-cost', '/guides/extension-preliminaries', '/terms', '/privacy'];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map(function (p) { return '  <url><loc>' + SITE + (p === '/' ? '/' : p) + '</loc></url>'; }).join('\n') + '\n</urlset>\n';
}

// Runs a client-side function on the page once it has loaded
function inlineScript(fn) { return '<script>(' + fn.toString() + ')();</script>'; }

function pageShell(o) {
  return `<!DOCTYPE html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0"><title>${o.title}</title><meta name="description" content="${o.desc}"><link rel="canonical" href="${SITE}${o.path}"><meta property="og:title" content="${o.title}"><meta property="og:description" content="${o.desc}"><meta property="og:url" content="${SITE}${o.path}"><meta property="og:type" content="website"><meta name="theme-color" content="#18211D"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..800&family=Public+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="icon" type="image/png" sizes="96x96" href="/favicon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/styles.css">${o.schema ? '<script type="application/ld+json">' + JSON.stringify(o.schema) + '</script>' : ''}</head><body><a class="skip" href="#main">Skip to content</a><header><div class="container nav-bar"><a href="/" class="logo"><div class="logo-icon">G2G</div>TheGo2Guys</a><ul class="nav-links" id="navLinks"><li><a href="/#services">Services</a></li><li><a href="/calculators">Free tools</a></li><li><a href="/guides">Cost guides</a></li><li><a href="/#pricing">Pricing</a></li><li><a href="tel:01516621274" class="nav-phone">0151 662 1274</a></li><li><a href="/#contact" class="nav-cta">Request a quote</a></li></ul><button class="mobile-menu-btn" aria-label="Menu" aria-controls="navLinks" onclick="document.getElementById('navLinks').classList.toggle('open')">&#9776;</button></div></header><main id="main">${o.body}</main><footer><div class="container"><div class="footer-top"><div class="footer-brand"><a href="/" class="logo"><div class="logo-icon">G2G</div>TheGo2Guys</a><p>Building estimates for UK builders and contractors.</p></div><div class="footer-col"><h4>Free tools</h4><ul><li><a href="/calculators/bricks-and-blocks">Brick and block calculator</a></li><li><a href="/calculators/concrete">Concrete calculator</a></li><li><a href="/calculators/plaster">Plaster calculator</a></li><li><a href="/guides/house-extension-cost">Extension cost guide</a></li><li><a href="/guides/loft-conversion-cost">Loft conversion cost guide</a></li></ul></div><div class="footer-col"><h4>Company</h4><ul><li><a href="/#services">Services</a></li><li><a href="/#pricing">Pricing</a></li><li><a href="/sample-estimate.pdf" target="_blank" rel="noopener">Sample estimate</a></li><li><a href="/terms">Terms and conditions</a></li><li><a href="/privacy">Privacy policy</a></li></ul></div><div class="footer-col"><h4>Contact</h4><ul><li><a href="mailto:hello@thego2guys.uk">hello@thego2guys.uk</a></li><li><a href="tel:01516621274">0151 662 1274</a></li><li>UK-wide</li></ul></div></div><div class="footer-bottom"><p>&copy; 2026 TheGo2Guys. Building estimating services, UK.</p></div></div></footer><script src="/script.js"></script>${o.script || ''}</body></html>`;
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
<a class="card" href="/calculators/concrete"><h3>Concrete</h3><p>Volume for slabs and trench-fill footings, as a ready-mix order or bags to mix yourself.</p><span class="card-go">Open calculator &rarr;</span></a>
<a class="card" href="/calculators/plaster"><h3>Plaster and plasterboard</h3><p>Bags of skim and undercoat, and sheets of board, for a room or a set area.</p><span class="card-go">Open calculator &rarr;</span></a>
<a class="card" href="/guides/house-extension-cost"><h3>Extension budget</h3><p>A rough cost range for a single or double-storey extension by size, specification and region.</p><span class="card-go">Open calculator &rarr;</span></a>
<a class="card" href="/guides/loft-conversion-cost"><h3>Loft conversion budget</h3><p>A rough cost range for a Velux, dormer, hip-to-gable or mansard conversion.</p><span class="card-go">Open calculator &rarr;</span></a>
</div></div></section>` + CALC_CTA
  });
}

// ------------------------ Bricks, blocks and mortar ------------------------
function brickCalcPage() {
  return pageShell({
    path: '/calculators/bricks-and-blocks',
    title: 'Brick and Block Calculator UK (with Mortar) | TheGo2Guys',
    desc: 'Work out how many bricks or blocks you need for a wall, plus cement and building sand for the mortar. Free UK calculator using standard sizes.',
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
function concreteCalcPage() {
  return pageShell({
    path: '/calculators/concrete',
    title: 'Concrete Calculator UK: Slabs and Footings | TheGo2Guys',
    desc: 'Work out how much concrete you need for a slab or trench-fill footing, as a ready-mix order or as cement, sand and gravel to mix yourself.',
    body: pageHero([['/', 'Home'], ['/calculators', 'Free tools'], ['/calculators/concrete', 'Concrete']], 'Concrete calculator', 'The volume for a slab or trench-fill footing, as a ready-mix order or as bags to mix on site.') +
      `<section class="plain"><div class="container tool-grid"><form class="calc" id="calc" onsubmit="return false"><h2>Your pour</h2>
<div class="form-group"><label for="shape">What are you pouring?</label><select id="shape"><option value="slab">Slab or base</option><option value="trench">Trench-fill footing</option></select></div>
<div class="form-row"><div class="form-group"><label for="len">Length (m)</label><input id="len" type="number" inputmode="decimal" min="0" step="0.01" value="4"><p class="form-hint" id="len-hint">Length of the slab.</p></div><div class="form-group"><label for="wid" id="wid-label">Width (m)</label><input id="wid" type="number" inputmode="decimal" min="0" step="0.01" value="4"></div></div>
<div class="form-row"><div class="form-group"><label for="dep">Depth (mm)</label><input id="dep" type="number" inputmode="decimal" min="0" step="5" value="150"></div><div class="form-group"><label for="waste">Wastage (%)</label><input id="waste" type="number" inputmode="decimal" min="0" max="50" step="1" value="5"></div></div>
</form>
<div class="calc-out" aria-live="polite"><h2>You'll need about</h2><dl class="out-list">
<div class="big"><dt>Concrete volume</dt><dd id="o-vol">&ndash;</dd></div>
<div><dt>Ready-mix to order</dt><dd id="o-order">&ndash;</dd></div>
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
<tr><th>Trench-fill footing (extension)</th><td class="num">Often 1&ndash;1.5m deep, 600mm wide</td></tr>
</tbody></table></div>
<p>These are only rules of thumb. Footing depth depends on the ground, nearby trees and drains, and is set by your engineer or building control.</p>
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
        set('o-cement', fmt(Math.ceil(vol * 13 - 1e-9)));
        set('o-sand', fmt(vol * 0.7, 2) + ' t');
        set('o-gravel', fmt(vol * 1.3, 2) + ' t');
      }
      shape.addEventListener('change', function () {
        if (shape.value === 'trench') { document.getElementById('wid').value = 0.6; document.getElementById('dep').value = 1000; document.getElementById('len').value = 12; }
        else { document.getElementById('wid').value = 4; document.getElementById('dep').value = 150; document.getElementById('len').value = 4; }
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
  ['Are the figures with or without VAT?', 'The figures on this page are before VAT. A VAT-registered builder will add 20%.']
];

function extensionGuidePage() {
  const total = 40393; // construction cost as issued in the sample estimate (element figures are rounded)
  const rows = SAMPLE_ELEMENTS.map(function (e) { return '<tr><th>' + e[0] + '</th><td class="num">£' + e[1].toLocaleString('en-GB') + '</td><td class="num">' + (e[1] / total * 100).toFixed(1) + '%</td></tr>'; }).join('');
  return pageShell({
    path: '/guides/house-extension-cost',
    title: 'House Extension Cost UK 2026: Cost per m² Guide | TheGo2Guys',
    desc: 'What a house extension costs in the UK in 2026: cost per m² for single and double-storey extensions, a real elemental breakdown, and a free budget calculator.',
    schema: faqSchema(EXTENSION_FAQ),
    body: pageHero([['/', 'Home'], ['/guides', 'Cost guides'], ['/guides/house-extension-cost', 'House extension cost']], 'How much does a house extension cost in the UK?', 'Most single-storey extensions cost £1,800&ndash;£3,200 per m² to build in 2026. Here is where that range comes from, where the money goes, and a quick calculator for your own budget.') +
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
<h2>Extension cost per m² in 2026</h2>
<p>These are typical build costs per m² of new internal floor area, before VAT, for a finished shell with standard finishes.</p>
<div class="table-wrap"><table class="data-table"><thead><tr><th>Extension</th><th class="num">Cost per m²</th><th class="num">20 m² example</th></tr></thead><tbody>
<tr><th>Single-storey, basic finish</th><td class="num">£1,800&ndash;£2,200</td><td class="num">£36,000&ndash;£44,000</td></tr>
<tr><th>Single-storey, standard finish</th><td class="num">£2,200&ndash;£2,900</td><td class="num">£44,000&ndash;£58,000</td></tr>
<tr><th>Single-storey, high finish</th><td class="num">£2,900&ndash;£3,500</td><td class="num">£58,000&ndash;£70,000</td></tr>
<tr><th>Double-storey, standard finish</th><td class="num">£1,800&ndash;£2,700</td><td class="num">Per m² of both floors</td></tr>
</tbody></table></div>
<p>Small extensions cost more per m² because things like scaffolding, foundations, steelwork and the connection to the house cost much the same whatever the size. London is typically 20&ndash;40% above these figures, and the North of England a little below.</p>
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
<p>Typical 2026 costs outside London, before VAT, for a finished conversion with a new staircase.</p>
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
