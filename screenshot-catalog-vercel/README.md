# 카탈로그 — 스크린샷 아카이브 (Vercel 배포용, Gemini 무료 티어)

## 폴더 구조
```
/public/index.html   ← 앱 화면 (정적 파일, 그대로 서빙됨)
/api/analyze.js       ← Gemini Vision 호출 서버리스 함수 (API 키는 여기서만 사용)
/package.json
```

## 배포 방법

### 1) Gemini API 키 발급 (무료, 카드 불필요)
https://aistudio.google.com/apikey 에서 구글 계정으로 로그인 → "Create API key" 클릭하면 바로 발급돼요.

### 2) GitHub에 올리기
이 폴더를 새 GitHub 저장소로 push 하세요.

### 3) Vercel에 Import
1. vercel.com 에서 "Add New Project" → 방금 만든 저장소 선택
2. Framework Preset은 **Other**로 두면 됩니다 (별도 빌드 설정 필요 없음)
3. **Environment Variables**에 아래 값을 추가:
   - Key: `GEMINI_API_KEY`
   - Value: 발급받은 API 키
4. Deploy 클릭

### 4) 로컬에서 테스트하고 싶다면
```
npm i -g vercel
vercel dev
```
프로젝트 루트에 `.env` 파일을 만들고
```
GEMINI_API_KEY=...
```
를 추가하세요. (`.env`는 절대 GitHub에 커밋하지 마세요 — `.gitignore`에 이미 포함되어 있어요)

## 알아둘 점

- **무료지만 한도가 있어요**: Gemini 2.5 Flash 무료 티어는 분당 요청 수·일일 요청 수 제한이 있어요. 포트폴리오 데모로 몇 명이 눌러보는 정도는 충분하지만, 링크가 갑자기 많이 퍼지면 429 에러(한도 초과)가 뜰 수 있어요. 코드에서 429가 뜨면 "무료 티어 요청 한도를 초과했어요" 메시지가 뜨도록 이미 처리해뒀어요.
- **데이터 저장 위치**: 브라우저 `localStorage`에 저장돼요. 같은 브라우저·같은 기기에서만 보이고, 브라우저 데이터를 지우면 함께 사라져요. 다른 사람들과 데이터를 공유하거나 여러 기기에서 동기화하려면 Vercel KV, Supabase 같은 실제 DB로 바꿔야 해요.
- **API 키 보안**: 프론트엔드(`public/index.html`)는 API 키를 직접 갖고 있지 않아요. 모든 Gemini 호출은 `/api/analyze` 서버리스 함수를 거치고, 키는 Vercel 서버 환경변수에만 존재해요.
- **모델을 나중에 바꾸고 싶다면**: `api/analyze.js` 상단의 `GEMINI_MODEL` 값만 바꾸면 돼요. (예: `gemini-2.5-flash-lite`로 바꾸면 무료 한도가 더 넉넉해요)
