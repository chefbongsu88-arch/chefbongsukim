'use client';
import { useEffect, useState } from 'react';

/* Language switch: body.en hides .t-kr and shows .t-en (see globals.css). */
export function LangToggle() {
  const [en, setEn] = useState(false);
  useEffect(() => {
    let initial = false;
    try { const saved = localStorage.getItem('lang'); if (saved) initial = saved === 'en'; else initial = !navigator.language.toLowerCase().startsWith('ko'); } catch (e) {}
    apply(initial);
  }, []);
  function apply(v) {
    setEn(v);
    document.body.classList.toggle('en', v);
    document.documentElement.lang = v ? 'en' : 'ko';
    try { localStorage.setItem('lang', v ? 'en' : 'kr'); } catch (e) {}
  }
  return (
    <div className="lang" role="group" aria-label="Language">
      <button type="button" aria-pressed={!en} onClick={() => apply(false)}>KR</button>
      <button type="button" aria-pressed={en} onClick={() => apply(true)}>EN</button>
    </div>
  );
}

export function NavEffects() {
  useEffect(() => {
    const nav = document.getElementById('nav');
    const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    const toggle = document.getElementById('navToggle');
    const links = Array.from(document.querySelectorAll('.links a'));
    const close = () => { if (toggle) toggle.checked = false; };
    links.forEach((a) => a.addEventListener('click', close));
    return () => { window.removeEventListener('scroll', onScroll); links.forEach((a) => a.removeEventListener('click', close)); };
  }, []);
  return null;
}
