'use client';
import { useEffect, useRef, useState } from 'react';

/* 대표 사진 넘기기 — 사진이 1장이면 화살표 없이 그대로, 2장 이상이면 작은 화살표 + 점 */
export default function HeroCarousel({ photos = [] }) {
  const [i, setI] = useState(0);
  const n = photos.length;
  const startX = useRef(null);
  const go = (d) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    if (n < 2) return;
    const onKey = (e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [n]);

  if (!n) return null;
  return (
    <div className="hero-photo">
      <div
        className="ph has carousel"
        onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (startX.current == null) return; const dx = e.changedTouches[0].clientX - startX.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); startX.current = null; }}
      >
        {photos.map((p, k) => (
          <img key={p.src} src={p.src} alt={p.alt?.kr || ''} className={(k === i ? 'on' : '') + (p.tall ? ' tall' : '')} loading={k === 0 ? 'eager' : 'lazy'} fetchPriority={k === 0 ? 'high' : undefined} draggable={false} />
        ))}
        {n > 1 && (
          <>
            <button type="button" className="cnav prev" aria-label="이전 사진" onClick={() => go(-1)}>‹</button>
            <button type="button" className="cnav next" aria-label="다음 사진" onClick={() => go(1)}>›</button>
            <div className="cdots" aria-hidden="true">{photos.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}</div>
          </>
        )}
      </div>
    </div>
  );
}
