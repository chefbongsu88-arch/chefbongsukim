import site from '../content/site.json';
import lists from '../content/lists.json';
import { LangToggle, NavEffects } from '../components/LangProvider';
import ContactForm from '../components/ContactForm';
import Script from 'next/script';

export const revalidate = 600;

const T = ({ kr, en, as: Tag = 'span', className = '' }) => (
  <>
    <Tag className={`t-kr ${className}`.trim()}>{kr}</Tag>
    <Tag className={`t-en ${className}`.trim()}>{en}</Tag>
  </>
);
const Lines = ({ text }) => text.split('\n').map((l, i, a) => (<span key={i}>{l}{i < a.length - 1 && <br />}</span>));
// 본문 속 주소(https://…)를 클릭할 수 있는 링크로 바꿈 — 주소 앞에 "→ " 를 붙이면 그 부분이 링크 글자가 됨
const Linkify = ({ text }) => text.split(/(https?:\/\/[^\s)]+)/g).map((part, i) =>
  /^https?:\/\//.test(part)
    ? <a key={i} className="more" href={part} target="_blank" rel="noopener">{/notion\.(so|com)/.test(part) ? 'Notion ↗' : part.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') + ' ↗'}</a>
    : <span key={i}>{part}</span>);
const TBody = ({ kr, en }) => (<><span className="t-kr"><Linkify text={kr} /></span><span className="t-en"><Linkify text={en} /></span></>);

export default function Page() {
  const s = site; const l = lists;
  const upcoming = (l.upcoming || []).filter((u) => u.status !== 'Draft');
  const igPosts = (s.instagramPosts || []).filter((u) => /instagram\.com\/(p|reel)\//.test(u));
  return (
    <>
      <NavEffects />
      <header className="nav" id="nav">
        <div className="nav-inner">
          <a className="brand" href="#top">Bongsu Kim <small>김봉수</small></a>
          <input type="checkbox" id="navToggle" className="nav-toggle" />
          <nav className="links">
            <a href="#voice"><T kr="철학" en="Philosophy" /></a>
            <a href="#now"><T kr="지금" en="Now" /></a>
            <a href="#about"><T kr="소개" en="About" /></a>
            <a href="#dishes"><T kr="요리" en="Dishes" /></a>
            <a href="#journal"><T kr="기록" en="Journal" /></a>
            <a href="#contact"><T kr="연락" en="Contact" /></a>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <LangToggle />
            <label htmlFor="navToggle" className="burger" aria-label="menu"><span></span><span></span><span></span></label>
          </div>
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero wrap center">
          <p className="eyebrow"><T {...s.eyebrow} /></p>
          <h1>{s.name.en}<span className="kr">{s.name.kr}</span></h1>
          <p className="thesis narrow"><T {...s.headline} /></p>
          <p className="role">{s.credentials.map((c) => <span key={c}>{c}</span>)}</p>
          <div className="hero-photo"><div className="ph has"><img src={s.portrait.src} alt={s.portrait.alt.kr} fetchPriority="high" /></div></div>
        </section>

        {/* VOICE */}
        <section className="voice wrap center" id="voice">
          <p className="eyebrow em"><T kr="요리 철학" en="Philosophy" /></p>
          <span className="dash"></span>
          <h2 className="title"><T {...s.voice.title} /></h2>
          <p className="lead narrow"><T {...s.voice.lead} /></p>
          <p className="quote narrow"><span className="t-kr"><Lines text={s.voice.quote.kr} /></span><span className="t-en">{s.voice.quote.en}</span></p>

          <div className="principles" style={{ textAlign: 'left' }}>
            {s.voice.principles.map((p, i) => (
              <div className="pr" key={i}>
                <div className="k">{p.kr}<small>{String(i + 1).padStart(2, '0')} · {p.en}</small>
                  {p.image && <div className="pimg"><img src={p.image} alt={p.alt?.kr || ''} loading="lazy" /></div>}
                </div>
                <div><T as="p" {...p.body} /></div>
              </div>
            ))}
          </div>

          <div className="books" style={{ textAlign: 'left' }}>
            <p className="eyebrow"><T {...s.voice.booksLabel} /></p>
            {s.voice.books.map((b, i) => (
              <div className="book" key={i}>
                {b.cover && <div className="bimg cover"><img src={b.cover} alt={b.title} loading="lazy" /></div>}
                <h4>{b.title}<i>{b.sub}</i></h4>
                {b.paragraphs.kr.map((p, j) => <p className="t-kr" key={'k' + j}>{p}</p>)}
                {b.paragraphs.en.map((p, j) => <p className="t-en" key={'e' + j}>{p}</p>)}
                {b.link && <a className="more" href={b.link.href} target="_blank" rel="noopener"><T kr={b.link.kr} en={b.link.en} /></a>}
              </div>
            ))}
          </div>
        </section>

        <section className="band"><div className="ph has"><img src={s.bands.afterVoice.src} alt={s.bands.afterVoice.alt.kr} loading="lazy" /></div></section>

        {/* NOW */}
        <section className="now wrap" id="now">
          <div className="now-grid">
            <div>
              <p className="eyebrow em"><T kr="지금" en="Now" /></p>
              <h2 className="title" style={{ marginTop: 14 }}><T {...s.now.title} /></h2>
              <p style={{ marginTop: 20, color: 'var(--ink-2)' }}><T {...s.now.statement} /></p>
            </div>
            <ul className="now-list">
              {l.now.map((n, i) => (
                <li key={i}><span className="n">{String(i + 1).padStart(2, '0')}</span>
                  <div>{n.link ? <a href={n.link} target="_blank" rel="noopener" style={{ textDecoration: 'none' }}><T kr={n.kr} en={n.en} /></a> : <T kr={n.kr} en={n.en} />}</div></li>
              ))}
            </ul>
          </div>
          {upcoming.map((u, i) => (
            <div className="upcoming" key={i}>
              <div className="up-date"><small><T kr="다가오는 일정" en="Upcoming" /></small>{u.date}</div>
              <div className="up-body"><h3><T kr={u.kr} en={u.en} /></h3><p><T kr={u.desc?.kr || ''} en={u.desc?.en || ''} /></p></div>
              <a className="btn" href="#contact"><T kr="문의" en="Inquire" /></a>
            </div>
          ))}
        </section>

        {/* ABOUT */}
        <section className="about wrap center" id="about">
          <p className="eyebrow em"><T kr="소개" en="About" /></p>
          <span className="dash"></span>
          <h2 className="title"><T {...s.about.title} /></h2>
          <p className="bio narrow"><T {...s.about.bio} /></p>
          <p style={{ marginTop: 14 }}><a className="more" href={s.about.teamLink.href} target="_blank" rel="noopener">{s.about.teamLink.label} ↗</a></p>

          <div className="press">
            <p className="eyebrow"><T kr="출연 · 인정" en="Recognition" /></p>
            <div className="press-grid">
              {s.about.recognition.map((r, i) => (
                <div className="press-item" key={i}><b>{r.title}</b><span><T kr={r.kr} en={r.en} /></span></div>
              ))}
            </div>
          </div>

          <div className="career" style={{ textAlign: 'left' }}>
            <p className="eyebrow center"><T kr="이력" en="Career" /></p>
            <div style={{ marginTop: 24 }}>
              {s.about.career.map((c, i) => (
                <div className="cr" key={i}><span className="y">{c.when}</span><div><T kr={c.kr} en={c.en} /></div></div>
              ))}
            </div>
          </div>
        </section>

        {/* DISHES */}
        <section className="dishes" id="dishes">
          <div className="wrap center">
            <p className="eyebrow em"><T kr="시그니처" en="Signature" /></p>
            <span className="dash"></span>
            <h2 className="title"><T {...s.dishesTitle} /></h2>
            <div className="menu" style={{ textAlign: 'left' }}>
              {l.dishes.map((d, i) => (
                <article className="dish" key={i}>
                  {d.image ? <div className={`ph has${d.fit ? ' fit' : ''}`}><img src={d.image} alt={d.kr} loading="lazy" /></div> : <div className="ph" data-shot="사진 준비 중 · Photo coming"></div>}
                  <p className="origin">{d.origin}{d.sample && <span className="flag">예시 · sample</span>}</p>
                  <h3><T kr={d.kr} en={d.en} /></h3>
                  <p><T {...d.desc} /></p>
                  {d.link && <p><a className="more" href={d.link.href} target="_blank" rel="noopener"><T kr={d.link.kr} en={d.link.en} /></a></p>}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* JOURNAL */}
        <section className="journal wrap" id="journal">
          <div className="center">
            <p className="eyebrow em"><T kr="기록" en="Journal" /></p>
            <span className="dash"></span>
            <h2 className="title"><T {...s.journalTitle} /></h2>
          </div>
          <div className={`journal-grid${igPosts.length ? ' single' : ''}`}>
            <div>
              {l.journal.map((j, i) => (
                <article className="entry" key={i}><p className="d">{j.date}</p><h3><T kr={j.kr} en={j.en} /></h3><p><TBody {...j.body} /></p></article>
              ))}
            </div>
            {!igPosts.length && (
              <div>
                <div className="ig-head"><p className="eyebrow">Instagram</p><a href={s.contact.instagram} target="_blank" rel="noopener">{s.contact.instagramHandle} ↗</a></div>
                <a href={s.contact.instagram} target="_blank" rel="noopener" className="ig" aria-label="Instagram"><div></div><div></div><div></div><div></div><div></div><div></div></a>
                <p className="ig-note"><T kr="최근 게시물은 Instagram에서 볼 수 있습니다." en="Recent posts live on Instagram." /></p>
              </div>
            )}
          </div>
          {igPosts.length > 0 && (
            <div className="ig-row">
              <div className="ig-head"><p className="eyebrow">Instagram</p><a href={s.contact.instagram} target="_blank" rel="noopener">{s.contact.instagramHandle} ↗</a></div>
              <div className="ig-embeds">
                {igPosts.map((u) => (
                  <blockquote key={u} className="instagram-media" data-instgrm-permalink={u} data-instgrm-version="14">
                    <a href={u} target="_blank" rel="noopener">Instagram</a>
                  </blockquote>
                ))}
              </div>
              <Script src="https://www.instagram.com/embed.js" strategy="lazyOnload" />
            </div>
          )}
        </section>

        {/* EVENTS */}
        <section className="events wrap" id="events">
          <div className="center">
            <p className="eyebrow em"><T kr="지난 자리들" en="Events" /></p>
            <span className="dash"></span>
            <h2 className="title"><T {...s.eventsTitle} /></h2>
          </div>
          <div className="list">
            {l.events.map((e, i) => (
              <div className="ev" key={i}>
                <div className="eimg">{e.image && <img src={e.image} alt="" loading="lazy" />}</div>
                <span className="y">{e.when}</span><span className="t">{e.type}</span>
                <div><T kr={e.kr} en={e.en} />{e.link && <> · <a className="more" href={e.link.href} target="_blank" rel="noopener"><T kr={e.link.kr} en={e.link.en} /></a></>}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="band"><div className="ph has"><img src={s.bands.beforeContact.src} alt={s.bands.beforeContact.alt.kr} loading="lazy" /></div></section>

        {/* CONTACT */}
        <section className="contact wrap center" id="contact">
          <p className="eyebrow em"><T kr="연락" en="Contact" /></p>
          <span className="dash"></span>
          <h2 className="title"><T {...s.contact.title} /></h2>
          <a className="mail" href={`mailto:${s.contact.email}`}>{s.contact.email}</a>
          <p className="tags">{s.contact.tags.map((t) => <span key={t}>{t}</span>)}</p>
          <ContactForm email={s.contact.email} />
        </section>
      </main>

      <footer>
        <div className="sig">김봉수</div>
        <p className="colophon"><T {...s.colophon} /></p>
        <p className="fine">© {new Date().getFullYear()} Bongsu Kim · chefbongsukim.com</p>
        <a className="ig-link" href={s.contact.instagram} target="_blank" rel="noopener">Instagram {s.contact.instagramHandle}</a>
      </footer>
    </>
  );
}
