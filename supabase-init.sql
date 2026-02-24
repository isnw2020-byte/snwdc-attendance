-- =====================================================
-- 성남여성인력개발센터 출결시스템 - Supabase 초기화 SQL
-- Supabase → SQL Editor 에서 순서대로 실행하세요
-- =====================================================

-- 1. 테이블 생성
-- =====================================================

create table if not exists participants (
  id text primary key,
  name text, birthDate text, phone text,
  deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists courses (
  id text primary key,
  name text, status text,
  startDate text, endDate text,
  startTime text, dailyMinutes int,
  lateGraceMinutes int default 10,
  earlyGraceMinutes int default 10,
  recognitionRate float default 0.5,
  completionRate float default 0.8,
  deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists sessions (
  id text primary key,
  courseId text, date text, sessionNo int,
  startDateTime text, endDateTime text,
  isCancelled boolean default false,
  isInactive boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists enrollments (
  id text primary key,
  participantId text, courseId text,
  status text default '수강중',
  deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists attendance_records (
  id text primary key,
  sessionId text, courseId text, participantId text,
  checkInAt text, checkOutAt text,
  statusCode text default '?',
  attendedMinutes int default 0,
  isRecognized boolean default false,
  finalized boolean default false,
  manuallyAdjusted boolean default false,
  deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists attendance_events (
  id text primary key,
  participantId text, sessionId text,
  attendanceRecordId text, eventType text,
  timestamp text, qrTokenId text,
  gpsLat float, gpsLng float, gpsAccuracy float,
  locationValid boolean default false,
  deviceInfo text,
  deleted boolean default false,
  created_at timestamptz default now()
);

create table if not exists qr_tokens (
  id text primary key,
  courseId text, sessionId text,
  token text, expiresAt text,
  used boolean default false,
  deleted boolean default false,
  created_at timestamptz default now()
);

create table if not exists admin_users (
  id text primary key,
  username text unique,
  passwordHash text,
  name text, role text default 'admin',
  active boolean default true,
  deleted boolean default false,
  lastLoginAt text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists audit_logs (
  id text primary key,
  actorId text, actorName text,
  action text, entityType text, entityId text,
  beforeJson text, afterJson text, reason text,
  createdAt text,
  deleted boolean default false,
  created_at timestamptz default now()
);

create table if not exists holidays (
  id text primary key,
  date text, name text,
  deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- 2. RLS(Row Level Security) 활성화 + 공개 접근 정책
-- =====================================================

alter table participants       enable row level security;
alter table courses            enable row level security;
alter table sessions           enable row level security;
alter table enrollments        enable row level security;
alter table attendance_records enable row level security;
alter table attendance_events  enable row level security;
alter table qr_tokens          enable row level security;
alter table admin_users        enable row level security;
alter table audit_logs         enable row level security;
alter table holidays           enable row level security;

-- anon 키로 전체 CRUD 허용 (앱 자체에서 인증 처리)
create policy "public_all" on participants       for all to anon using (true) with check (true);
create policy "public_all" on courses            for all to anon using (true) with check (true);
create policy "public_all" on sessions           for all to anon using (true) with check (true);
create policy "public_all" on enrollments        for all to anon using (true) with check (true);
create policy "public_all" on attendance_records for all to anon using (true) with check (true);
create policy "public_all" on attendance_events  for all to anon using (true) with check (true);
create policy "public_all" on qr_tokens          for all to anon using (true) with check (true);
create policy "public_all" on admin_users        for all to anon using (true) with check (true);
create policy "public_all" on audit_logs         for all to anon using (true) with check (true);
create policy "public_all" on holidays           for all to anon using (true) with check (true);

-- =====================================================
-- 3. 완료 확인
-- =====================================================
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
