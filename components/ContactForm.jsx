'use client';
import { useState } from 'react';

export default function ContactForm({ email }) {
  const [state, setState] = useState('idle');
  async function onSubmit(e) {
    e.preventDefault();
    const f = e.currentTarget;
    const data = { name: f.name.value, email: f.email.value, type: f.type.value, message: f.message.value };
    setState('sending');
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json();
      if (j.ok) { setState('sent'); f.reset(); return; }
      if (j.fallback === 'mailto') {
        window.location.href = `mailto:${email}?subject=${encodeURIComponent('[' + data.type + '] ' + data.name)}&body=${encodeURIComponent(data.message + '\n\n---\n' + data.name + ' / ' + data.email)}`;
        setState('idle'); return;
      }
      setState('error');
    } catch (err) { setState('error'); }
  }
  return (
    <form id="contactForm" onSubmit={onSubmit}>
      <div className="f"><label htmlFor="f-name"><span className="t-kr">이름</span><span className="t-en">Name</span></label><input id="f-name" name="name" type="text" required /></div>
      <div className="f"><label htmlFor="f-email"><span className="t-kr">이메일</span><span className="t-en">Email</span></label><input id="f-email" name="email" type="email" required /></div>
      <div className="f"><label htmlFor="f-type"><span className="t-kr">문의 종류</span><span className="t-en">Inquiry</span></label>
        <select id="f-type" name="type"><option>Pop-up</option><option>Collaboration</option><option>Catering</option><option>Media</option><option>Consulting</option><option>Other</option></select></div>
      <div className="f"><label htmlFor="f-msg"><span className="t-kr">메시지</span><span className="t-en">Message</span></label><textarea id="f-msg" name="message" rows={5} required /></div>
      <button className="btn" type="submit" disabled={state === 'sending'}>
        <span className="t-kr">{state === 'sending' ? '보내는 중…' : '보내기'}</span><span className="t-en">{state === 'sending' ? 'Sending…' : 'Send'}</span>
      </button>
      {state === 'sent' && <p className="form-note"><span className="t-kr">보냈습니다. 곧 답장드릴게요.</span><span className="t-en">Sent. I will write back soon.</span></p>}
      {state === 'error' && <p className="form-note"><span className="t-kr">전송에 문제가 있었습니다. {email}로 직접 보내주세요.</span><span className="t-en">Something went wrong — please email {email} directly.</span></p>}
    </form>
  );
}
