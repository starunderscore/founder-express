let currentRoot = '';
let currentPath = '';

async function loadTOC() {
  const candidates = ['toc.json','../toc.json','../../toc.json'];
  for (const path of candidates) {
    try {
      const res = await fetch(path);
      if (res.ok) return await res.json();
    } catch {}
  }
  throw new Error('Failed to load toc.json');
}

function $(sel){ return document.querySelector(sel); }

function renderNav(pagesOrSections, onClick) {
  // Backward-compatible: render either a flat list of pages or a list of sections
  const nav = $('#toc');
  nav.innerHTML = '';
  if (Array.isArray(pagesOrSections) && pagesOrSections.length && pagesOrSections[0].pages) {
    for (const section of pagesOrSections) {
      const title = document.createElement('div');
      title.className = 'nav-title';
      title.textContent = section.title;
      nav.appendChild(title);
      const sec = document.createElement('div');
      sec.className = 'nav-section';
      for (const p of section.pages) {
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'nav-link';
        a.textContent = p.title;
        a.addEventListener('click', (e) => { e.preventDefault(); onClick(p.path); });
        sec.appendChild(a);
      }
      nav.appendChild(sec);
    }
  } else {
    const sec = document.createElement('div');
    sec.className = 'nav-section';
    for (const p of pagesOrSections || []) {
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'nav-link';
      a.textContent = p.title;
      a.addEventListener('click', (e) => { e.preventDefault(); onClick(p.path); });
      sec.appendChild(a);
    }
    nav.appendChild(sec);
  }
}

function renderTOC(cfg, onClick) {
  const nav = $('#toc');
  nav.innerHTML = '';
  // Render top-level pages first if present
  if (cfg.pages && Array.isArray(cfg.pages) && cfg.pages.length) {
    const sec = document.createElement('div');
    sec.className = 'nav-section';
    for (const p of cfg.pages) {
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'nav-link';
      a.textContent = p.title;
      a.addEventListener('click', (e) => { e.preventDefault(); onClick(p.path); });
      sec.appendChild(a);
    }
    nav.appendChild(sec);
  }
  // Then render sections (if present)
  if (cfg.sections && Array.isArray(cfg.sections) && cfg.sections.length) {
    for (const section of cfg.sections) {
      const title = document.createElement('div');
      title.className = 'nav-title';
      title.textContent = section.title;
      nav.appendChild(title);
      const sec = document.createElement('div');
      sec.className = 'nav-section';
      for (const p of section.pages) {
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'nav-link';
        a.textContent = p.title;
        a.addEventListener('click', (e) => { e.preventDefault(); onClick(p.path); });
        sec.appendChild(a);
      }
      nav.appendChild(sec);
    }
  }
}

async function loadMarkdown(root, path) {
  currentRoot = root;
  currentPath = path;
  // If root points to repo-level docs (e.g., "docs/manuals/..."),
  // fetch using an absolute URL so it isn't resolved under viewers/.
  const isRepoDocs = /^docs\//i.test(root);
  const base = isRepoDocs ? `/${root}` : root;
  const url = `${base}/${path}` + `?t=${Date.now()}`;
  const res = await fetch(url);
  const md = await res.text();
  $('#content').innerHTML = markdownToHtml(md);
}

function markdownToHtml(md){
  const lines = md.split(/\r?\n/);
  let html = '';
  let inList = false;
  let inTree = false; let treeLines = [];
  let inCode = false; let codeLang = ''; let codeLines = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const ltrim = line.replace(/^\s+/, '');
    if (!inCode && /^```\s*tree\s*$/.test(ltrim)) { inTree = true; treeLines = []; continue; }
    if (inTree) { if (/^```\s*$/.test(ltrim)) { html += renderTree(treeLines.join('\n')); inTree = false; } else { treeLines.push(line); } continue; }
    const start = ltrim.match(/^```\s*([a-z0-9+_-]*)\s*$/i);
    if (start && !inCode) { inCode = true; codeLang = start[1] || ''; codeLines = []; continue; }
    if (inCode) { if (/^```\s*$/.test(ltrim)) { html += renderCode(codeLines.join('\n'), codeLang); inCode = false; codeLang=''; codeLines=[]; } else { codeLines.push(line); } continue; }
    // Markdown image: ![alt](src)
    const mImgMd = ltrim.match(/^!\[(.*?)\]\((.*?)\)\s*$/);
    if (mImgMd) {
      if (inList) { html += '</ul>'; inList = false; }
      const alt = mImgMd[1] || '';
      const src = resolveAssetSrc(mImgMd[2] || '');
      html += `<div class="doc-image"><img src="${src}" alt="${esc(alt)}"/></div>`;
      continue;
    }
    if (/^\s*\|/.test(line) && i+1 < lines.length && /^\s*\|\s*[-:]/.test(lines[i+1])) {
      const header = splitTableRow(line);
      i++;
      const rows = [];
      while (i+1 < lines.length && /^\s*\|/.test(lines[i+1])) { rows.push(splitTableRow(lines[i+1])); i++; }
      html += renderTable(header, rows);
      continue;
    }
    if (/^\s*>\s?/.test(ltrim)) {
      if (inList) { html += '</ul>'; inList = false; }
      const raw = ltrim.replace(/^\s*>\s?/, '');
      const m = raw.match(/^(Tip|Remember|Warning|Technical Stuff):\s*(.*)$/i);
      if (m) {
        const kind = m[1].toLowerCase();
        const body = m[2] || '';
        html += renderCallout(kind, body);
      } else {
        html += `<blockquote><p>${linkify(esc(raw))}</p></blockquote>`;
      }
      continue;
    }
    const mImg = ltrim.match(/^\[Image:\s*(.*?)\]\s*$/i);
    if (mImg) {
      if (inList) { html += '</ul>'; inList = false; }
      const desc = mImg[1] || '';
      html += renderImageCard(desc);
      continue;
    }
    if (/^###\s+/.test(ltrim)) { html += `<h3>${linkify(esc(ltrim.replace(/^###\s+/,'')))}</h3>`; continue; }
    if (/^##\s+/.test(ltrim)) { html += `<h2>${linkify(esc(ltrim.replace(/^##\s+/,'')))}</h2>`; continue; }
    if (/^#\s+/.test(ltrim)) { html += `<h1>${linkify(esc(ltrim.replace(/^#\s+/,'')))}</h1>`; continue; }
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${linkify(esc(line.replace(/^\s*[-*]\s+/,'')))}</li>`; continue;
    } else if (inList) { html += '</ul>'; inList = false; }
    if (ltrim.trim() === '') { html += '<p></p>'; continue; }
    html += `<p>${linkify(esc(line))}</p>`;
  }
  if (inList) html += '</ul>';
  return html;
}

function splitTableRow(line){
  return line.trim().replace(/^\||\|$/g,'').split('|').map(c => c.trim());
}

function renderTable(header, rows){
  let h = '<table class="md-table"><thead><tr>' + header.map(h=>`<th>${esc(h)}</th>`).join('') + '</tr></thead><tbody>';
  for (const r of rows) { h += '<tr>' + r.map(c=>`<td>${linkify(esc(c))}</td>`).join('') + '</tr>'; }
  h += '</tbody></table>';
  return h;
}

function renderTree(text){
  return `<pre class="tree">${esc(text)}</pre>`;
}

function renderCode(text, lang){
  const cls = lang ? `code lang-${lang}` : 'code';
  return `<pre class="${cls}"><code>${esc(text)}</code></pre>`;
}

function resolveAssetSrc(path){
  if (/^https?:/i.test(path) || path.startsWith('/')) return path;
  const isRepoDocs = /^docs\//i.test(currentRoot);
  const base = isRepoDocs ? `/${currentRoot}` : currentRoot;
  return `${base}/${path}`;
}

function renderImageCard(desc){
  const out = { view: '', arrows: [], squares: [] };
  const parts = desc.split(/\s*;\s*/).filter(Boolean);
  for (const p of parts) {
    const mView = p.match(/^view:\s*(.+)$/i);
    const mArrow = p.match(/^arrow:\s*(.+)$/i);
    const mSquare = p.match(/^squares?:\s*(.+)$/i);
    if (mView) { out.view = mView[1]; continue; }
    if (mArrow) {
      const items = mArrow[1].split(/\s*;\s*/).filter(Boolean);
      out.arrows.push(...items);
      continue;
    }
    if (mSquare) {
      const items = mSquare[1].split(/\s*;\s*/).filter(Boolean);
      out.squares.push(...items);
      continue;
    }
  }
  let body = '';
  if (out.view) {
    body += `<div class="img-meta"><span class="img-label">View:</span> ${esc(out.view)}</div>`;
  }
  if (out.arrows.length) {
    body += `<div class="img-meta"><span class="img-label">Arrows:</span></div><ul class="img-arrows">`;
    out.arrows.forEach((it) => { body += `<li>${esc(it)}</li>`; });
    body += `</ul>`;
  }
  if (out.squares.length) {
    body += `<div class="img-meta"><span class="img-label">Red Squares:</span></div><ul class="img-arrows">`;
    out.squares.forEach((it) => { body += `<li>${esc(it)}</li>`; });
    body += `</ul>`;
  }
  if (!body) {
    body = `<div class="img-card-desc">${esc(desc)}</div>`;
  }
  return `<div class="img-card"><div class="img-card-title"><span class="img-icon">📷</span>Image</div>${body}</div>`;
}

function esc(s){
  return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}

function linkify(s){
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\[(.*?)\]\((.*?)\)/g, (m, text, href) => {
    const isExternal = /^https?:/i.test(href);
    const target = isExternal ? ' target="_blank"' : '';
    return `<a href="${href}" class="nav-link"${target}>${text}</a>`;
  });
  return s;
}

function renderCallout(kind, content){
  const map = {
    'tip': { icon: '💡', label: 'Tip', cls: 'callout-tip' },
    'remember': { icon: '🔑', label: 'Remember', cls: 'callout-remember' },
    'warning': { icon: '⚠️', label: 'Warning', cls: 'callout-warning' },
    'technical stuff': { icon: '🧩', label: 'Technical Stuff', cls: 'callout-technical' },
  };
  const meta = map[kind] || { icon: '💬', label: kind, cls: 'callout-generic' };
  const title = `<div class=\"callout-title\"><span class=\"callout-icon\">${meta.icon}</span>${meta.label}</div>`;
  const body = content ? `<div class=\"callout-body\">${linkify(esc(content))}</div>` : '';
  return `<div class=\"callout ${meta.cls}\">${title}${body}</div>`;
}

(async function init(){
  const toc = await loadTOC();
  const select = $('#version');
  const all = Object.keys(toc.versions);
  const filter = (window).VERSIONS_FILTER || null;
  const versions = filter ? all.filter(v => filter.includes(v)) : all;
  const defaultVersion = versions.includes(toc.default) ? toc.default : versions[0];
  function displayLabel(v){
    try {
      if (/^\d+\.\d+\.\d+$/.test(v)) {
        return `svg2icon-user-v${v}`;
      }
      if (/^tech-\d+\.\d+\.\d+$/.test(v)) {
        const ver = v.replace(/^tech-/, '');
        return `svg2icon-tech-v${ver}`;
      }
    } catch {}
    return v;
  }

  versions.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = displayLabel(v);
    if (v === defaultVersion) opt.selected = true;
    select.appendChild(opt);
  });

  function mount(version){
    const cfg = toc.versions[version];
    renderTOC(cfg, (path) => loadMarkdown(cfg.root, path));
    if (cfg.pages && cfg.pages[0]) {
      loadMarkdown(cfg.root, cfg.pages[0].path);
    } else if (cfg.sections && cfg.sections[0] && cfg.sections[0].pages[0]) {
      loadMarkdown(cfg.root, cfg.sections[0].pages[0].path);
    }
  }

  // Allow version override via query param ?v=
  const params = new URLSearchParams(location.search);
  const vParam = params.get('v');
  if (vParam && versions.includes(vParam)) {
    Array.from(select.options).forEach(function(opt){ opt.selected = opt.value === vParam; });
  }

  select.addEventListener('change', () => mount(select.value));
  // If nothing selected (edge-case), select first filtered version
  if (!select.value) {
    select.value = versions[0];
  }
  mount(select.value);
  $('#content').addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || /^https?:/i.test(href)) return;
    if (!href.endsWith('.md')) return;
    e.preventDefault();
    const resolved = resolveRelative(currentPath, href);
    loadMarkdown(currentRoot, resolved);
  });
})();

function resolveRelative(base, link){
  try {
    const u = new URL(link, 'https://example/' + base);
    return u.pathname.replace(/^\//,'');
  } catch {
    return link;
  }
}
