# 🚀 GitHub Pages + Supabase 무료 배포 가이드

> 성남여성인력개발센터 출결시스템 영구 배포 방법  
> 총 소요 시간: 약 30분 | 비용: 완전 무료

---

## 전체 순서 요약

```
STEP 1. Supabase 가입 → DB 생성 → SQL 실행 → API 키 복사
STEP 2. js/config.js 에 API 키 붙여넣기
STEP 3. GitHub 가입 → 저장소 생성 → 파일 업로드
STEP 4. GitHub Pages 활성화 → URL 생성
STEP 5. (선택) Cloudflare 연결 → 커스텀 도메인
```

---

## STEP 1 — Supabase 설정 (DB)

### 1-1. 가입
1. **https://supabase.com** 접속
2. **Start your project** 클릭
3. **GitHub로 계속** 또는 이메일 가입

### 1-2. 프로젝트 생성
1. **New Project** 클릭
2. 설정값:
   - Name: `snwdc-attendance`
   - Database Password: 강력한 비밀번호 (어딘가 메모!)
   - Region: **Northeast Asia (Seoul)** ← 반드시 서울 선택
3. **Create new project** 클릭 → 약 2분 대기

### 1-3. SQL 실행 (테이블 생성)
1. 왼쪽 메뉴 **SQL Editor** 클릭
2. **New query** 클릭
3. 프로젝트 폴더의 `supabase-init.sql` 파일 내용 전체 복사
4. SQL Editor에 붙여넣기
5. **Run** (또는 Ctrl+Enter) 클릭
6. 하단에 `Success` 표시 확인 ✅

### 1-4. API 키 복사
1. 왼쪽 메뉴 **Settings** → **API** 클릭
2. 두 가지 복사해두기:
   ```
   Project URL:  https://abcdefghijk.supabase.co
   anon public:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## STEP 2 — config.js 수정

프로젝트 폴더의 `js/config.js` 파일을 열어서:

```javascript
// 수정 전
const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'YOUR_ANON_PUBLIC_KEY';

// 수정 후 (복사한 값으로 교체)
const SUPABASE_URL  = 'https://abcdefghijk.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

> ⚠️ 따옴표(' ') 안에만 붙여넣고, 따옴표는 지우지 마세요!

---

## STEP 3 — GitHub 설정

### 3-1. GitHub 가입
1. **https://github.com** 접속
2. **Sign up** → 이메일, 비밀번호, 사용자명 입력

### 3-2. 저장소(Repository) 생성
1. 로그인 후 오른쪽 상단 **+** → **New repository**
2. 설정값:
   - Repository name: `snwdc-attendance`
   - **Public** 선택 ← 반드시 Public (무료 Pages 조건)
   - 나머지 기본값 유지
3. **Create repository** 클릭

### 3-3. 파일 업로드
1. 저장소 페이지에서 **uploading an existing file** 클릭
2. 프로젝트 폴더의 **모든 파일과 폴더** 선택해서 드래그&드롭
   ```
   업로드할 파일 목록:
   ✅ index.html
   ✅ login.html
   ✅ participant-login.html
   ✅ qr-admin.html
   ✅ qr-check.html
   ✅ courses.html
   ✅ participants.html
   ✅ attendance.html
   ✅ report.html
   ✅ settings.html
   ✅ audit-log.html
   ✅ holidays.html
   ✅ manifest.json
   ✅ css/ 폴더 전체
   ✅ js/ 폴더 전체 (config.js, utils.js 포함)
   ```
3. 하단 **Commit changes** 클릭

### 3-4. css/, js/ 폴더 파일 업로드
GitHub는 폴더 업로드가 안 되므로:
1. 저장소에서 **Add file** → **Create new file**
2. 파일명에 `css/style.css` 입력 → 내용 붙여넣기 → Commit
3. `js/config.js`, `js/utils.js` 도 같은 방법으로 업로드

> 💡 **더 쉬운 방법**: GitHub Desktop 앱 사용  
> https://desktop.github.com 설치 후 폴더째로 올리기

---

## STEP 4 — GitHub Pages 활성화

1. 저장소 상단 **Settings** 탭 클릭
2. 왼쪽 메뉴 **Pages** 클릭
3. **Source** → **Deploy from a branch** 선택
4. **Branch** → `main` 선택, 폴더 `/(root)` 유지
5. **Save** 클릭
6. 약 2~3분 후 상단에 URL 표시:
   ```
   ✅ Your site is live at:
   https://깃허브계정명.github.io/snwdc-attendance/
   ```

### 참여자 전달용 URL
```
https://깃허브계정명.github.io/snwdc-attendance/participant-login.html
```

---

## STEP 5 — Cloudflare 연결 (선택 - 커스텀 도메인)

> 도메인이 없으면 이 단계는 건너뛰어도 됩니다.

### 5-1. 도메인 구매
- **가비아** (gabia.com): `.kr` 도메인 연 1~2만원
- 예: `snwdc-check.kr`

### 5-2. Cloudflare 가입 및 설정
1. **https://cloudflare.com** 가입
2. **Add a Site** → 구매한 도메인 입력 → **Free 플랜** 선택
3. Cloudflare가 제시하는 **네임서버 2개**를 가비아에 등록
   - 가비아 → 도메인 관리 → 네임서버 변경

### 5-3. DNS 레코드 추가
Cloudflare **DNS** 탭에서:
```
Type  : CNAME
Name  : @
Target: 깃허브계정명.github.io
Proxy : 🟠 Proxied (활성화)
```

### 5-4. GitHub에 커스텀 도메인 등록
1. GitHub 저장소 → Settings → Pages
2. **Custom domain**: `snwdc-check.kr` 입력 → Save
3. **Enforce HTTPS** 체크 ✅

### 5-5. Cloudflare SSL 설정
**SSL/TLS** → **Overview** → **Full** 선택

### 완성 후 URL
```
https://snwdc-check.kr/participant-login.html  ← 참여자용
https://snwdc-check.kr/login.html              ← 관리자용
```

---

## 완료 후 첫 접속 체크리스트

- [ ] `https://주소/login.html` 접속 → 관리자 로그인 (`admin` / `admin1234`)
- [ ] 시스템 설정에서 비밀번호 변경
- [ ] 참여자 등록 테스트
- [ ] QR 코드 생성 테스트
- [ ] 참여자 핸드폰으로 `participant-login.html` 접속 테스트

---

## 문제 발생 시 확인 사항

| 증상 | 원인 | 해결 |
|------|------|------|
| 화면은 뜨는데 데이터 없음 | config.js 키 오류 | Supabase URL/키 재확인 |
| 404 오류 | 파일 업로드 누락 | 해당 파일 GitHub에 업로드 |
| CORS 오류 | Supabase RLS 정책 누락 | SQL Editor에서 policy 재실행 |
| CSS 깨짐 | css/style.css 경로 오류 | css 폴더 업로드 확인 |

---

## Supabase 무료 플랜 한도

| 항목 | 무료 한도 | 예상 사용량 |
|------|----------|------------|
| DB 용량 | 500MB | 수년치 출결 데이터도 충분 |
| API 요청 | 월 200만건 | 일 수백건 수준이면 충분 |
| 동시 접속 | 무제한 | - |
| 프로젝트 | 2개 | 1개 사용 |

> ✅ 성남여성인력개발센터 규모라면 **무료 플랜으로 수년간 문제없이 사용 가능**합니다.
