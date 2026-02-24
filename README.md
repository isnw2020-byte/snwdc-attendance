# 성남여성인력개발센터 직업교육훈련 출결관리시스템

> **버전**: v2.0.0 | **최종 업데이트**: 2026-02-24

---

## 📋 시스템 개요

QR 코드 기반 출결 관리 시스템으로, 관리자와 참여자 두 역할로 구분됩니다.

- **관리자**: 과정 등록, 참여자 관리, QR 발급, 출결 현황 조회, 리포트 다운로드
- **참여자**: 이름+생년월일 로그인 → QR 스캔 → 자동 출결 기록

---

## 🌐 URL 안내

### 관리자 로그인
```
https://[배포주소]/login.html
```
- 초기 계정: `admin` / `admin1234`
- 첫 로그인 후 비밀번호 변경 필수

### 참여자 로그인 (참여자에게 공유)
```
https://[배포주소]/participant-login.html
```
- 이름 + 생년월일(YYYY-MM-DD) 입력
- 로그인 성공 후 QR 스캔 화면으로 자동 이동
- 세션 7일 유지 (재방문 시 자동 로그인)

---

## 📁 파일 구조

```
/
├── index.html            ← 관리자 대시보드
├── login.html            ← 관리자 로그인
├── participant-login.html ← 참여자 전용 로그인 ★ 참여자에게 공유
├── qr-check.html         ← QR 스캔 출결 처리 (참여자용)
├── qr-admin.html         ← QR 코드 발급/관리 (관리자)
├── courses.html          ← 과정 관리
├── participants.html     ← 참여자 관리 (과정별 분류)
├── attendance.html       ← 출결 현황
├── report.html           ← 리포트/다운로드
├── settings.html         ← 시스템 설정
├── audit-log.html        ← 감사 로그
├── holidays.html         ← 공휴일 관리
├── js/
│   ├── utils.js          ← 공통 유틸리티 (Genspark Table API)
│   └── config.js         ← 앱 버전 설정
└── css/
    └── style.css         ← 공통 스타일
```

---

## ✅ 구현된 기능

### 관리자
- [x] 관리자 로그인 (아이디/비밀번호, 해시 검증)
- [x] 대시보드 - 과정 현황, 오늘 출결 통계
- [x] 과정 관리 - CRUD, 회차 자동 생성, 공휴일 제외
- [x] **참여자 관리 - 과정명별 분류 표시 + 과정 선택 시 직접 추가 버튼** ★신규
- [x] QR 코드 발급 - 과정 선택 → QR 생성 → 인쇄
- [x] QR 갱신 - 필요할 때만 클릭하여 새 토큰 발급
- [x] 출결 현황 - 과정/날짜/참여자별 조회
- [x] 리포트 다운로드 (Excel/CSV)
- [x] 시스템 설정 (GPS, 지각/조퇴 기준)
- [x] 공휴일 관리
- [x] 감사 로그

### 참여자
- [x] 이름 + 생년월일 로그인 (4단계 매칭 알고리즘)
- [x] QR 스캔 출결 (입실/퇴실)
- [x] 오늘 출결 현황 표시 (수강 중인 과목만)
- [x] 수동 입력 탭 제거 (QR 스캔만 사용) ★신규
- [x] localStorage 세션 유지 (7일)

---

## 🔄 업무 흐름

### 출결 운영 흐름
```
1. 관리자: 과정 등록 (courses.html)
2. 관리자: 참여자 등록 + 과정 배정 (participants.html)
   → 과정 선택 후 "이 과정에 참여자 추가" 버튼 클릭
3. 관리자: QR 발급 (qr-admin.html)
   → 과정 선택 → QR 생성 → 인쇄 → 교실에 부착
4. 관리자: 참여자에게 로그인 URL 공유
   → https://[배포주소]/participant-login.html
5. 참여자: 로그인 → QR 스캔 → 출결 완료
6. 관리자: 필요시 QR 갱신 (교육 중 서너 번만 권장)
```

### QR 갱신 주기 권장사항
- 교육 전체 기간 중 **3~4회** 갱신 권장
- 보안이 필요한 경우 매일 갱신 가능
- 갱신 후 새 QR 코드를 인쇄하여 기존 것과 교체

---

## 🗄️ 데이터 모델

| 테이블 | 설명 |
|--------|------|
| `participants` | 참여자 (이름, 생년월일, 연락처) |
| `courses` | 과정 (이름, 기간, 시간, 상태) |
| `sessions` | 회차 (날짜, 시작/종료 시간) |
| `enrollments` | 수강 정보 (참여자↔과정, 상태) |
| `attendance_records` | 출결 기록 (입실/퇴실 시간, 상태코드) |
| `attendance_events` | 출결 이벤트 로그 |
| `qr_tokens` | 발급된 QR 토큰 |
| `admin_users` | 관리자 계정 |
| `audit_logs` | 변경 이력 감사 로그 |
| `holidays` | 공휴일 목록 |

### 출결 상태코드
| 코드 | 의미 |
|------|------|
| ○ | 출석 |
| ◎ | 지각 |
| ▲ | 조퇴 |
| ◎▲ | 지각+조퇴 |
| X | 결석 |
| ? | 미완료 |

---

## 💡 자주 묻는 질문

**Q. 참여자가 "등록된 참여자 정보를 찾을 수 없습니다" 오류가 나요?**
A. participants.html에서 해당 참여자의 이름과 생년월일을 정확히 등록했는지 확인하세요. 이름에 불필요한 공백이 없는지도 확인하세요.

**Q. QR을 매일 갱신해야 하나요?**
A. 아닙니다. 교육 전체 기간 중 3~4회만 갱신해도 됩니다. qr-admin.html에서 "QR 갱신" 버튼을 클릭하면 새 토큰이 발급됩니다.

**Q. GPS 오류가 나요?**
A. 설정(settings.html)에서 GPS 검증을 비활성화할 수 있습니다. 기본값은 비활성화입니다.

**Q. 참여자가 로그인 후 QR을 스캔하려면?**
A. participant-login.html에서 로그인 → qr-check.html로 이동 → "카메라 시작" 클릭 → QR 코드 스캔

---

## 🔧 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API**: Genspark Table API (RESTful)
- **QR**: QRCode.js (생성), jsQR (스캔)
- **Chart**: Chart.js
- **Icons**: Font Awesome 6
- **Fonts**: Noto Sans KR (Google Fonts)
- **호스팅**: Genspark (현재)
