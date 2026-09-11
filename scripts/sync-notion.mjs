/**
 * Notion → content JSON 동기화
 * NOTION_TOKEN 이 있으면 Notion 데이터베이스(Now / Dishes / Events / Journal)와
 * Site Settings 페이지를 읽어 content/lists.json 과 content/site.json 을 갱신합니다.
 * 토큰이 없으면 아무것도 바꾸지 않습니다 (저장된 JSON 그대로 빌드).
 *
 * 준비: notion.so/my-integrations 에서 내부 통합을 만들고,
 *       "Bongsu Kim — Website" 페이지의 ··· → 연결 → 그 통합을 추가.
 */
import { Client } from '@notionhq/client';
import fs from 'node:fs';
import path from 'node:path';

const TOKEN = process.env.NOTION_TOKEN;
const DB = {
  now: '8aad8e0b-180f-4cdc-8cae-33a92d72de33',
  dishes: 'ebcdba36-c9b6-4e83-a1d9-3545033f1fa1',
  events: '3768d39a-b547-4983-958c-d9514d478ebe',
  journal: 'd67324de-a38a-46f0-8546-8c159aeb03e2',
};
const SETTINGS_PAGE = '3d7875b2-28fb-815d-97b8-eef4c06543c4';
const ROOT = path.resolve(process.cwd());
const CONTENT = path.join(ROOT, 'content');
const IMG_DIR = path.join(ROOT, 'public', 'notion');

if (!TOKEN) { console.log('[sync] NOTION_TOKEN 없음 — 저장된 content JSON을 그대로 사용합니다.'); process.exit(0); }
const notion = new Client({ auth: TOKEN });

const text = (p) => (p?.title || p?.rich_text || []).map((t) => t.plain_text).join('').trim();
const sel = (p) => p?.select?.name || '';
const num = (p) => (typeof p?.number === 'number' ? p.number : 0);
const chk = (p) => !!p?.checkbox;
const url = (p) => p?.url || '';
const dateStart = (p) => p?.date?.start || '';
const dateFmt = (d) => (d ? d.slice(0, 7).replace('-', '.') : '');

async function queryAll(id, sorts) {
  const out = []; let cursor;
  do {
    const r = await notion.databases.query({ database_id: id, start_cursor: cursor, sorts });
    out.push(...r.results); cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return out;
}
async function saveFile(prop, name) {
  const f = prop?.files?.[0]; if (!f) return null;
  const src = f.file?.url || f.external?.url; if (!src) return null;
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const ext = (src.split('?')[0].match(/\.(jpe?g|png|webp|gif)$/i) || [, 'jpg'])[1].toLowerCase();
  const dest = path.join(IMG_DIR, `${name}.${ext}`);
  const res = await fetch(src); if (!res.ok) return null;
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return `/notion/${name}.${ext}`;
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item';

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
    items.push({ kr, en: text(p['Name (EN)']), origin: text(p['Origin']), image: await saveFile(p['Photo'], 'dish-' + slug(kr)), desc: { kr: text(p['One-liner (KR)']), en: text(p['One-liner (EN)']) } });
  }
  if (items.length) lists.dishes = items;
}
// Events (Upcoming → now section, Past → archive)
{
  const rows = await queryAll(DB.events, [{ property: 'Date', direction: 'descending' }]);
  const up = [], past = [];
  for (const r of rows) {
    const p = r.properties; const st = sel(p['Status']); if (st === 'Draft') continue;
    const kr = text(p['Title (KR)']);
    const base = { kr, en: text(p['Title (EN)']), type: sel(p['Type']), when: dateFmt(dateStart(p['Date'])) };
    if (st === 'Upcoming') up.push({ ...base, date: dateStart(p['Date']).replace(/-/g, '.'), desc: { kr: text(p['Description (KR)']), en: text(p['Description (EN)']) } });
    else past.push({ ...base, image: await saveFile(p['Cover'], 'ev-' + slug(kr)) });
  }
  lists.upcoming = up;
  if (past.length) lists.events = past.map((e) => ({ ...e, image: e.image || lists.events.find((x) => x.kr === e.kr)?.image || null, link: lists.events.find((x) => x.kr === e.kr)?.link }));
}
// Journal
{
  const rows = await queryAll(DB.journal, [{ property: 'Date', direction: 'descending' }]);
  const items = [];
  for (const r of rows) {
    const p = r.properties; if (sel(p['Status']) !== 'Published') continue;
    const blocks = await notion.blocks.children.list({ block_id: r.id, page_size: 100 });
    const paras = blocks.results.filter((b) => b.type === 'paragraph').map((b) => b.paragraph.rich_text.map((t) => t.plain_text).join(''));
    const divider = blocks.results.findIndex((b) => b.type === 'divider');
    const before = blocks.results.slice(0, divider < 0 ? undefined : divider).filter((b) => b.type === 'paragraph').map((b) => b.paragraph.rich_text.map((t) => t.plain_text).join('')).join('\n\n');
    const after = divider < 0 ? '' : blocks.results.slice(divider + 1).filter((b) => b.type === 'paragraph').map((b) => b.paragraph.rich_text.map((t) => t.plain_text).join('')).join('\n\n');
    items.push({ date: dateFmt(dateStart(p['Date'])), kr: text(p['Title (KR)']), en: text(p['Title (EN)']), body: { kr: before || paras.join('\n\n'), en: after || before } });
  }
  if (items.length) lists.journal = items;
}
// Site Settings page: "- KR:" / "- EN:" bullets under headings, mapped to a few fields
{
  const blocks = await notion.blocks.children.list({ block_id: SETTINGS_PAGE, page_size: 100 });
  let section = '';
  const get = (b) => (b[b.type]?.rich_text || []).map((t) => t.plain_text).join('').trim();
  const kv = {};
  for (const b of blocks.results) {
    if (b.type.startsWith('heading')) { section = get(b); continue; }
    const t = get(b); const m = t.match(/^(헤드라인 KR|헤드라인 EN|KR|EN)\s*:\s*(.*)$/);
    if (m) { kv[`${section}|${m[1]}`] = m[2]; }
  }
  if (kv['Hero|헤드라인 KR']) site.headline.kr = kv['Hero|헤드라인 KR'];
  if (kv['Hero|헤드라인 EN']) site.headline.en = kv['Hero|헤드라인 EN'];
  if (kv['About|KR']) site.about.bio.kr = kv['About|KR'];
  if (kv['About|EN']) site.about.bio.en = kv['About|EN'];
}

fs.writeFileSync(path.join(CONTENT, 'lists.json'), JSON.stringify(lists, null, 2));
fs.writeFileSync(path.join(CONTENT, 'site.json'), JSON.stringify(site, null, 2));
console.log(`[sync] 완료 — now ${lists.now.length}, dishes ${lists.dishes.length}, upcoming ${lists.upcoming.length}, events ${lists.events.length}, journal ${lists.journal.length}`);
