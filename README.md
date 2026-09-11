# chefbongsukim.com — 김봉수 셰프 개인 사이트

Next.js 14 · 콘텐츠는 `content/*.json` · Notion과 동기화 · Vercel 배포

## 1. 처음 한 번 — 배포

### A. 가장 빠른 길 (Claude에게 맡기기)
1. https://vercel.com 가입 (GitHub 계정으로 가입 추천)
2. Vercel → Settings → Tokens → "Create" → 토큰 복사
3. 이 프로젝트 대화에서 Claude에게 토큰을 전달하면 Claude가 배포 → `https://chefbongsukim.vercel.app` 로 바로 열림
4. 도메인 연결: Vercel → 프로젝트 → Settings → Domains → `chefbongsukim.com` 추가 → 도메인 구입처(예: 가비아·Namecheap)에서 안내된 DNS 레코드 입력

### B. 직접 하기 (GitHub 경유)
1. GitHub에 새 저장소 만들고 이 폴더 업로드 (node_modules 제외)
2. Vercel → Add New → Project → 그 저장소 Import → Deploy (설정 그대로)

## 2. 환경 변수 (Vercel → Settings → Environment Variables)
| 이름 | 용도 | 없으면 |
|---|---|---|
| `NOTION_TOKEN` | 빌드 때 Notion에서 최신 내용을 가져옴 | 저장된 JSON으로 빌드(정상 동작) |
| `RESEND_API_KEY` | 문의 폼 → 이메일 발송 (resend.com 무료) | 방문자 메일 앱이 열림 |
| `CONTACT_TO` | 받는 주소 | chefbongsu88@gmail.com |

Notion 토큰 만들기: https://www.notion.so/my-integrations → New integration (내부) → 토큰 복사 → Notion에서 `Bongsu Kim — Website` 페이지 ··· → 연결 → 그 통합 선택.

## 3. 평소 업데이트 방법 (코드 안 만짐)
- **Now / Dishes / Events / Journal** → Notion 데이터베이스에서 추가·수정. Status/체크박스만 바꾸면 노출 여부가 바뀜.
- **홈 헤드라인, 소개 문단** → Notion Site Settings 페이지의 `헤드라인 KR/EN`, `About` 아래 `KR:` `EN:` 줄.
- 반영: Vercel → Deployments → 최근 배포 → ··· → **Redeploy** (또는 Notion 변경 후 Claude에게 "다시 배포해줘"). 빌드 때 `scripts/sync-notion.mjs`가 Notion을 읽어 JSON을 갱신합니다.
- 철학 5개, 책, 이력, 인정 블록처럼 거의 안 바뀌는 문구는 `content/site.json`에 있음 — Claude에게 말하면 수정.
- 사진: Notion의 Photo/Cover 속성에 올리면 빌드 때 `public/notion/`으로 내려받아 사용. 대표 사진·철학 사진은 `public/images/`.

## 4. 로컬 실행
```
npm install
npm run dev      # http://localhost:3000
npm run build    # NOTION_TOKEN 있으면 동기화 후 빌드
```
