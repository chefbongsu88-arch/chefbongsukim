import site from '../content/site.json';
export default function sitemap(){ return [{ url: site.domain || 'https://www.chefbongsukim.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 }]; }
