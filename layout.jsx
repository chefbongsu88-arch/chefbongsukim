import './globals.css';
import site from '../content/site.json';

const domain = site.domain || 'https://www.chefbongsukim.com';

export const metadata = {
  metadataBase: new URL(domain),
  title: '김봉수 Bongsu Kim — Chef',
  description: '혀를 속이는 일, 그리고 예술. 한국 음식을 만드는 셰프 김봉수 — 정식당 뉴욕, 안씨막걸리, 도마, 블그레, 넷플릭스 흑백요리사, 그리고 이비자. Bongsu Kim, Korean chef — Jungsik NY, Mr. Ahn\'s Craft Makgeolli, Doma, Blgre, Netflix, Ibiza.',
  keywords: ['김봉수', '김봉수 셰프', '봉주부', 'Bongsu Kim', 'Bongsu Kim chef', 'Korean chef Ibiza', '한식 셰프', 'Blgre', '흑백요리사 봉주부'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'profile', url: domain, title: '김봉수 Bongsu Kim — Chef',
    description: '혀를 속이는 일, 그리고 예술. The art of fooling the tongue.',
    images: [{ url: '/images/og.jpg', width: 1200, height: 630, alt: 'Chef Bongsu Kim' }],
    locale: 'ko_KR', alternateLocale: ['en_US'],
  },
  twitter: { card: 'summary_large_image', title: '김봉수 Bongsu Kim — Chef', images: ['/images/og.jpg'] },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.svg' },
  verification: {
    google: 'tMxq1bGplHkzPYmlj1OPkEeGcyCMFOVHFDPFmESOmHM',
    // 네이버 서치어드바이저 태그가 오면 아래 줄에 추가
    // other: { 'naver-site-verification': '...' },
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Bongsu Kim',
    alternateName: ['김봉수', '봉주부', 'Bongjubu'],
    jobTitle: 'Chef',
    url: domain,
    image: `${domain}/images/hero.jpg`,
    email: `mailto:${site.contact.email}`,
    sameAs: [site.contact.instagram, 'https://www.theshingon.com/'],
    address: { '@type': 'PostalAddress', addressLocality: 'Ibiza', addressCountry: 'ES' },
    knowsAbout: ['Korean cuisine', 'Fermentation', 'Wood-fire cooking', 'Jeotgal'],
  };
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Noto+Serif+KR:wght@300;400;600&family=Caveat:wght@500&family=Jost:wght@400;500&display=swap" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
