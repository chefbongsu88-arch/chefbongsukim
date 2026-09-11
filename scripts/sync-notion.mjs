/**
 * Notion → content JSON 동기화
 * NOTION_TOKEN 이 있으면 Notion 데이터베이스(Now / Dishes / Events / Journal)와
 * Site Settings 페이지를 읽어 content/lists.json 과 content/site.json 을 갱신합니다.
 * 토큰이 없거나 Notion이 응답하지 않으면 아무것도 바꾸지 않습니다 (저장된 JSON 그대로 빌드).
 *
 * 준비: notion.so/profile/integrations 에서 연결(액세스 토큰)을 만들고,
 *       "Bongsu Kim — Website" 페이지의 ··· → 연결 → 그 연결을 추가.
 */
import { Client } from '@notionhq/client';
import fs from 'node:fs';
import path from 'node:path';

const TOKEN = process.env.NOTION_TOKEN;
// database id (데이터 소스 id가 아님)
const DB = {
  now: '123b9c14-ba73-46d4-a244-8ecbf1e0c261',
  dishes: 'd3e9418b-c6ef-408b-96bf-32dd377c6002',
  events: '0ccf73cc-bdda-408e-ae4d-5035cb8e78a3',
  journal: '77204fec-1519-40e2-b69f-2af56b6756d1',
};
const SETTINGS_PAGE = '3d7875b2-28fb-815d-97b8-eef4c06543c4';
const ROOT = path.resolve(process.cwd());
const CONTENT = path.join(ROOT, 'content');
const IMG_DIR = path.join(ROOT, 'public', 'notion');

if (!TOKEN) { console.log('[sync] NOTION_TOKEN 없음 — 저장된 content JSON을 그대로 사용합니다.'); process.exit(0); }
const notion = new Client({ auth: TOKEN, timeoutMs: 20000 });

const text = (p) => (p?.title || p?.rich_text || []).map((t) => t.plain_text).join('').trim();
const sel = (p) => p?.select?.name || '';
const chk = (p) => !!p?.checkbox;
const url = (p) => p?.url || '';
const dateStart = (p) => p?.date?.start || '';
const dateFmt = (d) => (d ? d.slice(0, 7).replace('-', '.') : '');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item';

// 제목이 조금 달라도 같은 항목으로 찾기 (공통 단어가 가장 많은 항목; 없으면 null)
const tokens = (s) => (s || '').toLowerCase().replace(/[「」『』"'“”‘’(),.:—–\-·]/g, ' ').split(/\s+/).filter((w) => w.length >= 2);
function findPrev(list, kr, en) {
  const exact = list.find((x) => x.kr === kr); if (exact) return exact;
  const t = new Set([...tokens(kr), ...tokens(en)]);
  let best = null, bestScore = 0;
  for (const x of list) {
    const score = [...new Set([...tokens(x.kr), ...tokens(x.en)])].filter((w) => t.has(w)).length;
    if (score > bestScore) { best = x; bestScore = score; }
  }
  return bestScore >= 2 ? best : null;
}
// 날짜: 2020.06 / 기간이면 2020.06–07 / 1월 1일이면 연도만
function whenFmt(p) {
  const s = p?.date?.start || '', e = p?.date?.end || '';
  if (!s) return '';
  if (s.endsWith('-01-01') && !e) return s.slice(0, 4);
  const a = s.slice(0, 7).replace('-', '.');
  if (!e || e.slice(0, 7) === s.slice(0, 7)) return a;
  return s.slice(0, 4) === e.slice(0, 4) ? `${a}–${e.slice(5, 7)}` : `${a}–${e.slice(0, 7).replace('-', '.')}`;
}

// Notion이 잠시 응답하지 않아도 빌드가 실패하지 않도록: 최대 3회 재시도
async function retry(fn, label) {
  let last;
  for (let i = 1; i <= 3; i++) {
    try { return await fn(); }
    catch (e) { last = e; console.warn(`[sync] ${label} 실패 (${i}/3): ${e.code || e.message}`); await new Promise((r) => setTimeout(r, 2000 * i)); }
  }
  throw last;
}
async function queryAll(id, sorts) {
  const out = []; let cursor;
  do {
    const r = await retry(() => notion.databases.query({ database_id: id, start_cursor: cursor, sorts }), 'DB 조회');
    out.push(...r.results); cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return out;
}
async function saveFile(prop, name) {
  const f = prop?.files?.[0]; if (!f) return null;
  const src = f.file?.url || f.external?.url; if (!src) return null;
  try {
    fs.mkdirSync(IMG_DIR, { recursive: true });
    const ext = (src.split('?')[0].match(/\.(jpe?g|png|webp|gif)$/i) || [, 'jpg'])[1].toLowerCase();
    const dest = path.join(IMG_DIR, `${name}.${ext}`);
    const res = await fetch(src, { signal: AbortSignal.timeout(20000) }); if (!res.ok) return null;
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    return `/notion/${name}.${ext}`;
  } catch (e) { console.warn(`[sync] 이미지 내려받기 실패 (${name}):`, e.message); return null; }
}

async function main() {
  const lists = JSON.parse(fs.readFileSync(path.join(CONTENT, 'lists.json'), 'utf8'));
  const site = JSON.parse(fs.readFileSync(path.join(CONTENT, 'site.json'), 'utf8'));

  // Now
  {
    const rows = await queryAll(DB.now, [{ property: 'Order', direction: 'ascending' }]);
    const items = rows.filter((r) => chk(r.properties['Active'])).map((r) => ({ kr: text(r.properties['What (KR)']), en: text(r.properties['What (EN)']), link: url(r.properties['Link']) || undefined }));
    if (items.length) lists.now = items;
  }
  // Dishes
  {
    const rows = await queryAll(DB.dishes, [{ property: 'Order', direction: 'ascending' }]);
    const items = [];
    for (const r of rows) {
      const p = r.properties; if (!chk(p['Show on site'])) continue;
      const kr = text(p['Name (KR)']);
      const prev = findPrev(lists.dishes, kr, text(p['Name (EN)']));
      items.push({ kr, en: text(p['Name (EN)']), origin: text(p['Origin']), image: (await saveFile(p['Photo'], 'dish-' + slug(kr))) || prev?.image || null, fit: prev?.fit, sample: prev?.sample, link: prev?.link, desc: { kr: text(p['One-liner (KR)']), en: text(p['One-liner (EN)']) } });
    }
    if (items.length) lists.dishes = items;
  }
  // Events (Upcoming → now section, Past → archive)
  {
    const rows = await queryAll(DB.events, [{ property: 'Date', direction: 'descending' }]);
    const up = [], past = [];
    for (const r of rows) {
      const p = r.properties; const st = sel(p['Status']); if (st === 'Draft') continue;
      const kr = text(p['Title (KR)']), en = text(p['Title (EN)']);
      if (st === 'Upcoming') { up.push({ kr, en, type: sel(p['Type']), when: whenFmt(p['Date']), date: dateStart(p['Date']).replace(/-/g, '.'), desc: { kr: text(p['Description (KR)']), en: text(p['Description (EN)']) } }); continue; }
      const notionType = sel(p['Type']);
      const prev = notionType === '기사' ? null : findPrev(lists.events, kr, en); // 기사는 예전 항목과 섞지 않음
      // 링크: Notion 'Description (KR)'에 주소(https://…)가 있으면 그 주소로 (유튜브 → "영상 보기", 그 외 → "기사 보기"), 없으면 기존 링크 유지
      const rtKR = p['Description (KR)']?.rich_text || [];
      const urlInDesc = [text(p['Description (KR)']), ...rtKR.map((x) => x.href || '')].join(' ').match(/https?:\/\/[^\s)]+/);
      let link = prev?.link;
      if (urlInDesc) {
        const href = urlInDesc[0];
        const isVideo = /youtube\.com|youtu\.be|vimeo\.com/.test(href);
        link = prev?.link?.href === href ? prev.link : { href, kr: isVideo ? '영상 보기 ↗' : '기사 보기 ↗', en: isVideo ? 'Watch ↗' : 'Read the article ↗' };
      }
      // 유형 표기: 기존 표기(Netflix/TV…)가 있으면 유지, 없으면 Notion 유형을 영문 태그로
      const TYPE_EN = { '기사': 'Press', '대회': 'Competition', '콜라보': 'Project', '출연·강연': 'TV', '팝업': 'Pop-up', '케이터링': 'Catering', '워크숍': 'Workshop' };
      // 기사 유형은 설명(주소 제외)을 한 줄 요약으로 함께 표시
      const stripUrl = (t) => t.replace(/https?:\/\/[^\s)]+/g, '').replace(/\s+$/, '').trim();
      const desc = notionType === '기사' ? { kr: stripUrl(text(p['Description (KR)'])), en: stripUrl(text(p['Description (EN)'])) } : undefined;
      // 사진: Notion Cover가 있으면 그것, 없으면 기존 사진 유지
      past.push({ kr, en, type: prev?.type || TYPE_EN[notionType] || notionType, when: whenFmt(p['Date']), image: (await saveFile(p['Cover'], 'ev-' + slug(kr))) || prev?.image || null, link, desc });
    }
    lists.upcoming = up;
    if (past.length) lists.events = past;
  }
  // Journal
  {
    const rows = await queryAll(DB.journal, [{ property: 'Date', direction: 'descending' }]);
    const items = [];
    for (const r of rows) {
      const p = r.properties; if (sel(p['Status']) !== 'Published') continue;
      const blocks = await retry(() => notion.blocks.children.list({ block_id: r.id, page_size: 100 }), 'Journal 본문');
      // 링크·페이지 멘션은 주소를 함께 남김 (사이트에서 클릭 가능한 링크로 바뀜)
      const para = (b) => b.paragraph.rich_text.map((t) => {
        if (t.type === 'mention') return t.href || t.plain_text;
        if (t.href && t.href !== t.plain_text && !/^https?:\/\//.test(t.plain_text)) return `${t.plain_text} ${t.href}`;
        return t.plain_text;
      }).join('');
      const divider = blocks.results.findIndex((b) => b.type === 'divider');
      const before = blocks.results.slice(0, divider < 0 ? undefined : divider).filter((b) => b.type === 'paragraph').map(para).join('\n\n');
      const after = divider < 0 ? '' : blocks.results.slice(divider + 1).filter((b) => b.type === 'paragraph').map(para).join('\n\n');
      items.push({ date: dateFmt(dateStart(p['Date'])), kr: text(p['Title (KR)']), en: text(p['Title (EN)']), body: { kr: before, en: after || before } });
    }
    if (items.length) lists.journal = items;
  }
  // Site Settings page: "- 헤드라인 KR:" / "- KR:" 줄을 몇 개 필드에 반영
  {
    const blocks = await retry(() => notion.blocks.children.list({ block_id: SETTINGS_PAGE, page_size: 100 }), 'Site Settings');
    let section = '';
    const get = (b) => (b[b.type]?.rich_text || []).map((t) => t.plain_text).join('').trim();
    const kv = {}; const ig = [];
    for (const b of blocks.results) {
      if (b.type.startsWith('heading')) { section = get(b); continue; }
      const t = get(b); const m = t.match(/^(헤드라인 KR|헤드라인 EN|KR|EN)\s*:\s*(.*)$/);
      if (m) { kv[`${section}|${m[1]}`] = m[2]; }
      // "Instagram" 제목 아래에 있는 게시물 링크(본문 또는 링크 속성) 수집
      if (/instagram/i.test(section)) {
        // 한 줄에 링크 하나만: 보이는 글자의 링크를 우선, 없으면 숨은 링크(href)
        const rt = b[b.type]?.rich_text || [];
        const re = /https?:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+/;
        const m = t.match(re) || rt.map((x) => x.href || '').join(' ').match(re);
        if (m) { const clean = m[0].replace(/^https?:\/\/instagram\.com/, 'https://www.instagram.com') + '/'; if (!ig.includes(clean)) ig.push(clean); }
      }
    }
    site.instagramPosts = ig;
    if (kv['Hero|헤드라인 KR']) site.headline.kr = kv['Hero|헤드라인 KR'];
    if (kv['Hero|헤드라인 EN']) site.headline.en = kv['Hero|헤드라인 EN'];
    if (kv['About|KR']) site.about.bio.kr = kv['About|KR'];
    if (kv['About|EN']) site.about.bio.en = kv['About|EN'];
  }

  fs.writeFileSync(path.join(CONTENT, 'lists.json'), JSON.stringify(lists, null, 2));
  fs.writeFileSync(path.join(CONTENT, 'site.json'), JSON.stringify(site, null, 2));
  console.log(`[sync] 완료 — now ${lists.now.length}, dishes ${lists.dishes.length}, upcoming ${lists.upcoming.length}, events ${lists.events.length}, journal ${lists.journal.length}, instagram ${(site.instagramPosts || []).length}`);
}

try {
  await main();
} catch (e) {
  console.warn('[sync] Notion 동기화 실패 — 저장된 content JSON으로 빌드합니다.', e?.code || e?.message || e);
  process.exit(0);
}
