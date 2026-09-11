import site from '../content/site.json';
export default function robots(){ const d = site.domain || 'https://www.chefbongsukim.com'; return { rules: [{ userAgent: '*', allow: '/' }], sitemap: `${d}/sitemap.xml`, host: d }; }
