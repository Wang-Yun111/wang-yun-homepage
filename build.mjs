import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist');
const cfg = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));

const esc = (s = '') => String(s).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
const has = v => typeof v === 'string' && v.trim().length > 0;

function front(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    else if (k === 'tags') v = v.split('|').map(x => x.trim()).filter(Boolean);
    data[k] = v;
  }
  return { data, body: m[2].trim() };
}

function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1 ↗</a>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function md(src) {
  const lines = src.replace(/\r/g, '').split('\n');
  let html = '', list = null;
  const close = () => { if (list) { html += `</${list}>`; list = null; } };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim()) { close(); continue; }
    const im = l.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (im) {
      close();
      html += `<figure><img src="${esc(im[2])}" alt="${esc(im[1])}"><figcaption>${inline(im[1])}</figcaption></figure>`;
      continue;
    }
    const h = l.match(/^(#{1,4})\s+(.+)$/);
    if (h) {
      close();
      const n = h[1].length;
      html += `<h${n} id="${slug(h[2])}">${inline(h[2])}</h${n}>`;
      continue;
    }
    const ul = l.match(/^[-*]\s+(.+)$/);
    if (ul) {
      if (list !== 'ul') { close(); list = 'ul'; html += '<ul>'; }
      html += `<li>${inline(ul[1])}</li>`;
      continue;
    }
    close();
    let p = l;
    while (i + 1 < lines.length && lines[i + 1].trim() && !/^(#{1,4})\s|^[-*]\s|^!\[/.test(lines[i + 1])) p += ' ' + lines[++i].trim();
    html += `<p>${inline(p)}</p>`;
  }
  close();
  return html;
}

function read(kind) {
  const dir = path.join('content', kind);
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const { data, body } = front(fs.readFileSync(path.join(dir, file), 'utf8'));
      return { ...data, body, html: md(body), slug: file.replace(/\.md$/, ''), kind };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

const notes = read('notes');
const projects = read('projects');
const services = read('service');
const moments = read('moments');

const fmt = d => new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const tags = x => (x.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');

function nav(active = '') {
  const items = [['Research', '/research/'], ['Notes', '/notes/'], ['Projects', '/projects/'], ['Service', '/service/'], ['Moments', '/moments/']];
  const cvLink = has(cfg.cv) ? `<a class="nav-cta" href="${esc(cfg.cv)}">CV</a>` : '';
  return `<header class="site-header"><div class="container nav"><a class="brand" href="/"><span>${esc(cfg.name)}</span><small>${esc(cfg.nameZh)}</small></a><button class="menu-btn" aria-label="Menu">Menu</button><nav class="nav-links">${items.map(([n, u]) => `<a ${active === n ? 'class="active"' : ''} href="${u}">${n}</a>`).join('')}${cvLink}</nav></div></header>`;
}

function contactLinks(cls = 'links') {
  const links = [];
  if (has(cfg.email)) links.push(`<a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a>`);
  if (has(cfg.emailAlt)) links.push(`<a href="mailto:${esc(cfg.emailAlt)}">${esc(cfg.emailAlt)}</a>`);
  if (has(cfg.github)) links.push(`<a href="${esc(cfg.github)}" target="_blank" rel="noreferrer">GitHub</a>`);
  if (has(cfg.scholar)) links.push(`<a href="${esc(cfg.scholar)}" target="_blank" rel="noreferrer">Google Scholar</a>`);
  if (has(cfg.cv)) links.push(`<a href="${esc(cfg.cv)}">CV</a>`);
  return `<div class="${cls}">${links.join('')}</div>`;
}

function foot() {
  return `<footer class="footer"><div class="container footer-grid"><div><div class="section-kicker">Contact</div><h2>Thanks for stopping by.</h2></div><div class="footer-right">${contactLinks('footer-links')}<p>© ${new Date().getFullYear()} ${esc(cfg.name)}. Built as a personal research homepage.</p></div></div></footer>`;
}

function layout(title, body, active = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(cfg.intro)}"><title>${esc(title)} · ${esc(cfg.name)}</title><link rel="stylesheet" href="/assets/style.css"></head><body>${nav(active)}${body}${foot()}<script src="/assets/main.js"></script></body></html>`;
}

function head(title, sub, kicker = 'Archive') {
  return `<section class="page-head"><div class="container"><div class="eyebrow">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div></section>`;
}

function visual(item, label) {
  if (item?.cover) return `<div class="photo-panel"><img src="${esc(item.cover)}" alt="${esc(item.title)}"></div>`;
  return `<div class="photo-panel placeholder"><div class="placeholder-mark">${esc(label)}</div></div>`;
}

function profileVisual() {
  if (has(cfg.profileImage)) {
    return `<figure class="hero-photo-card"><img src="${esc(cfg.profileImage)}" alt="${esc(cfg.name)}"></figure>`;
  }
  return `<div class="hero-photo-card hero-photo-placeholder"><div class="placeholder-mark">Portrait</div></div>`;
}

function write(route, html) {
  const p = route.endsWith('.html') ? path.join(OUT, route) : path.join(OUT, route, 'index.html');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, html);
}

function copy(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const a = path.join(src, e.name), b = path.join(dst, e.name);
    e.isDirectory() ? copy(a, b) : fs.copyFileSync(a, b);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copy('public', OUT);

const featured = projects.filter(p => p.featured).slice(0, 2);
const home = `
<section class="hero">
  <div class="container hero-grid">
    <div class="hero-copy">
      <div class="hero-kicker">${esc(cfg.nameZh)}</div>
      <h1>${esc(cfg.name)}</h1>
      <div class="hero-meta">
        <p>${esc(cfg.role)}</p>
        <p>${esc(cfg.affiliation)}</p>
      </div>
      <p class="hero-intro">${esc(cfg.intro)}</p>
      ${contactLinks('hero-links')}
    </div>
    <div class="hero-visual">${profileVisual()}</div>
  </div>
</section>
<section class="section about-section">
  <div class="container about-grid">
    <div class="about-heading"><div class="section-kicker">About Me</div><h2>Researching how machines understand complex environments.</h2></div>
    <div class="about-copy">
      <p>Hi! I'm <strong>Yun Wang (王赟)</strong>, a Ph.D. student at the <strong>School of Astronautics, Beihang University</strong>, majoring in Control Science and Engineering.</p>
      <p>My research interests lie broadly in <strong>Computer Vision and Multimodal Learning</strong>. I am particularly interested in how machines can build robust representations of complex environments from heterogeneous sensory information.</p>
      <p>Currently, my research focuses on <strong>multimodal representation learning and multi-sensor perception</strong>, including the alignment and fusion of visual, geometric, and other sensing modalities such as RGB images, LiDAR point clouds, infrared images, radar, SAR, and event-based data.</p>
      <p>I am also interested in extending multimodal learning beyond conventional vision-language settings toward <strong>3D perception and scientific multimodal data</strong>, exploring how heterogeneous observations can be represented, aligned, and fused within a unified learning framework.</p>
      <p>My long-term goal is to develop <strong>generalizable multimodal perception systems</strong> that can understand complex physical environments through complementary sensory information.</p>
      <p>Always curious about new ideas in vision and multimodal intelligence. Feel free to reach out for discussions or collaborations!</p>
    </div>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="section-head"><div class="section-kicker">Research</div><h2>Current interests and directions.</h2></div>
    <div class="research-grid">${cfg.research.map(r => `<article class="research-card"><div class="meta">${esc(r.index)}</div><h3>${esc(r.title)}</h3><p>${esc(r.desc)}</p><div class="tag-row">${r.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></article>`).join('')}</div>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="section-head"><div class="section-kicker">Selected projects</div><h2>Research and engineering work grounded in real problems.</h2></div>
    ${featured.map((p, i) => `<article class="project-feature">${i % 2 === 0 ? visual(p, 'Project') : ''}<div class="project-copy"><div><div class="meta">${fmt(p.date)}</div><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><div class="tag-row">${tags(p)}</div></div><a class="text-link" href="/projects/${p.slug}/">View project</a></div>${i % 2 === 1 ? visual(p, 'Project') : ''}</article>`).join('')}
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="section-head"><div class="section-kicker">Recent notes</div><h2>Readings, thoughts, and research notes.</h2></div>
    <div class="split-list">${notes.slice(0, 4).map(n => `<a class="list-row" href="/notes/${n.slug}/"><div class="date">${fmt(n.date)}</div><div><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p></div><div class="tags-col"><div class="tag-row">${tags(n)}</div></div><div class="arrow">↗</div></a>`).join('')}</div>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="section-head"><div class="section-kicker">Service</div><h2>Student support and community work alongside research.</h2></div>
    <div class="service-banner"><div class="service-copy"><div class="meta">BEIHANG UNIVERSITY</div><h3>Graduate Student Counselor</h3><p>Supporting incoming graduate students through orientation, communication, coordination, and community building.</p><div class="tag-row"><span class="tag">Mentoring</span><span class="tag">Student Support</span><span class="tag">Community</span></div></div><div class="service-photo">${visual(services[0], 'Campus')}</div></div>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="section-head"><div class="section-kicker">Moments</div><h2>Photos and records from research, campus life, and beyond.</h2></div>
    <div class="moment-grid">${moments.map(m => `<a class="moment" href="/moments/${m.slug}/">${m.cover ? `<img src="${esc(m.cover)}" alt="${esc(m.title)}">` : `<div class="empty-photo">${esc(m.title)}</div>`}<div class="moment-label"><span>${esc((m.tags || [])[0] || 'Moment')}</span><span>${String(m.date).slice(0, 4)}</span></div></a>`).join('')}</div>
  </div>
</section>`;
write('', layout('Home', home));

const research = `${head('Research', 'My work centers on computer vision, multimodal representation learning, and multi-sensor perception, with growing interests in 3D and scientific multimodal data.', 'Research')}<section class="section"><div class="container"><div class="research-grid">${cfg.research.map(r => `<article class="research-card"><div class="meta">${r.index}</div><h3>${esc(r.title)}</h3><p>${esc(r.desc)}</p><div class="tag-row">${r.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></article>`).join('')}</div></div></section><section class="section"><div class="container"><div class="section-head"><div class="section-kicker">Selected work</div><h2>Projects connected to these themes.</h2></div><div class="split-list">${projects.map(p => `<a class="list-row" href="/projects/${p.slug}/"><div class="date">${fmt(p.date)}</div><div><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p></div><div class="tags-col"><div class="tag-row">${tags(p)}</div></div><div class="arrow">↗</div></a>`).join('')}</div></div></section>`;
write('research', layout('Research', research, 'Research'));

const types = [...new Set(notes.map(n => n.type))];
const notesPage = `${head('Notes', 'Paper readings, research logs, derivations, and short notes that I want to keep publicly accessible.', 'Notes')}<section class="section"><div class="container"><div class="filters"><button class="filter-btn active" data-filter="all">All / ${notes.length}</button>${types.map(t => `<button class="filter-btn" data-filter="${esc(t)}">${esc(t)}</button>`).join('')}</div><div class="split-list">${notes.map(n => `<a class="list-row" data-type="${esc(n.type)}" href="/notes/${n.slug}/"><div class="date">${fmt(n.date)}<br>${esc(n.type)}</div><div><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p></div><div class="tags-col"><div class="tag-row">${tags(n)}</div></div><div class="arrow">↗</div></a>`).join('')}</div></div></section>`;
write('notes', layout('Notes', notesPage, 'Notes'));

const projectsPage = `${head('Projects', 'Selected research and engineering projects.', 'Projects')}<section class="section"><div class="container">${projects.map((p, i) => `<article class="project-feature">${i % 2 === 0 ? visual(p, 'Project') : ''}<div class="project-copy"><div><div class="meta">${fmt(p.date)}</div><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><div class="tag-row">${tags(p)}</div></div><a class="text-link" href="/projects/${p.slug}/">Open project</a></div>${i % 2 === 1 ? visual(p, 'Project') : ''}</article>`).join('')}</div></section>`;
write('projects', layout('Projects', projectsPage, 'Projects'));

const servicePage = `${head('Service & Community', 'Mentoring, student support, community building, and the work that happens beyond the lab.', 'Service')}<section class="section"><div class="container"><div class="timeline">${services.map(s => `<article class="timeline-item"><div class="year">${esc(s.period || s.date)}</div><div class="meta">${esc(s.role || 'Service')}</div><h3><a href="/service/${s.slug}/">${esc(s.title)}</a></h3><p>${esc(s.summary)}</p><div class="tag-row">${tags(s)}</div></article>`).join('')}</div></div></section>`;
write('service', layout('Service', servicePage, 'Service'));

const momentsPage = `${head('Moments', 'A visual archive of research, campus life, and everyday moments worth keeping.', 'Moments')}<section class="section"><div class="container"><div class="moment-grid">${moments.map(m => `<a class="moment" href="/moments/${m.slug}/">${m.cover ? `<img src="${esc(m.cover)}" alt="${esc(m.title)}">` : `<div class="empty-photo">${esc(m.title)}</div>`}<div class="moment-label"><span>${esc((m.tags || [])[0] || 'Moment')}</span><span>${String(m.date).slice(0, 4)}</span></div></a>`).join('')}</div></div></section>`;
write('moments', layout('Moments', momentsPage, 'Moments'));

function detail(x, active) {
  const label = { notes: 'Note', projects: 'Project', service: 'Service', moments: 'Moment' }[x.kind];
  const cover = x.cover ? `<figure class="detail-cover"><img src="${esc(x.cover)}" alt="${esc(x.title)}"></figure>` : '';
  return layout(x.title, `<section class="page-head"><div class="container"><div class="eyebrow">${label} · ${fmt(x.date)}</div><h1>${esc(x.title)}</h1><p>${esc(x.summary || '')}</p><div class="tag-row">${tags(x)}</div></div></section><main class="container content-shell"><aside class="content-aside"><div class="sticky"><div>${label.toUpperCase()}</div><div>${fmt(x.date)}</div>${x.role ? `<div>${esc(x.role)}</div>` : ''}<div><a href="/${x.kind}/">← Back</a></div></div></aside><article class="prose">${cover}${x.html}</article></main>`, active);
}
for (const n of notes) write(`notes/${n.slug}`, detail(n, 'Notes'));
for (const p of projects) write(`projects/${p.slug}`, detail(p, 'Projects'));
for (const s of services) write(`service/${s.slug}`, detail(s, 'Service'));
for (const m of moments) write(`moments/${m.slug}`, detail(m, 'Moments'));

write('404.html', layout('404', head('404', 'This page is not part of the archive — at least not yet.', 'Not found')));

const rss = `<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title>${esc(cfg.name)} Notes</title><link>${esc(cfg.siteUrl)}/notes/</link><description>${esc(cfg.intro)}</description>${notes.map(n => `<item><title>${esc(n.title)}</title><link>${esc(cfg.siteUrl)}/notes/${esc(n.slug)}/</link><description>${esc(n.summary || '')}</description><pubDate>${new Date(`${n.date}T00:00:00`).toUTCString()}</pubDate></item>`).join('')}</channel></rss>`;
write('rss.xml', rss);
