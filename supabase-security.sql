-- =====================================================
-- 성남여성인력개발센터 출결시스템
-- Supabase 보안 정책 재설정 SQL
-- 기존 public_all 정책 삭제 후 역할별 제한 정책 적용
-- =====================================================

-- ① 기존 정책 삭제 (이미 있으면 중복 오류 방지)
drop policy if exists "public_all" on participants;
drop policy if exists "public_all" on courses;
drop policy if exists "public_all" on sessions;
drop policy if exists "public_all" on enrollments;
drop policy if exists "public_all" on attendance_records;
drop policy if exists "public_all" on attendance_events;
drop policy if exists "public_all" on qr_tokens;
drop policy if exists "public_all" on admin_users;
drop policy if exists "public_all" on audit_logs;
drop policy if exists "public_all" on holidays;

-- ② 보안 강화 정책 적용
-- ▶ 참여자 테이블: anon은 SELECT(조회)만 허용 (로그인 검증용)
create policy "participants_select" on participants for select to anon using (deleted = false);
-- ▶ 수강 테이블: anon은 SELECT만 허용 (QR 출결 검증용)
create policy "enrollments_select"  on enrollments  for select to anon using (deleted = false);
-- ▶ 과정 테이블: anon은 SELECT만 허용 (QR 과정 확인용)
create policy "courses_select"      on courses      for select to anon using (deleted = false);
-- ▶ 회차 테이블: anon은 SELECT만 허용 (출결 처리용)
create policy "sessions_select"     on sessions     for select to anon using (true);
-- ▶ QR 토큰: anon은 SELECT + INSERT만 허용 (토큰 발급·검증)
create policy "qr_tokens_select"    on qr_tokens    for select to anon using (deleted = false);
create policy "qr_tokens_insert"    on qr_tokens    for insert to anon with check (true);
-- ▶ 출결 기록: anon은 SELECT + INSERT + UPDATE 허용 (출결 처리)
create policy "att_rec_select"      on attendance_records for select to anon using (deleted = false);
create policy "att_rec_insert"      on attendance_records for insert to anon with check (true);
create policy "att_rec_update"      on attendance_records for update to anon using (true) with check (true);
-- ▶ 출결 이벤트: anon은 INSERT만 허용 (로그 기록)
create policy "att_evt_insert"      on attendance_events  for insert to anon with check (true);
create policy "att_evt_select"      on attendance_events  for select to anon using (deleted = false);
-- ▶ 공휴일: anon은 SELECT만 허용
create policy "holidays_select"     on holidays     for select to anon using (deleted = false);
-- ▶ 관리자 계정: anon은 SELECT만 허용 (로그인 검증), 쓰기는 authenticated만
create policy "admin_users_select"  on admin_users  for select to anon using (deleted = false and active = true);
-- ▶ 감사로그: anon은 INSERT만 허용 (로그 기록)
create policy "audit_insert"        on audit_logs   for insert to anon with check (true);

-- ③ 관리자 전용 쓰기 권한 (authenticated 사용자 = 서비스 롤)
-- 참여자/과정/수강/회차/관리자계정 수정은 authenticated만
create policy "participants_all_auth" on participants       for all to authenticated using (true) with check (true);
create policy "courses_all_auth"      on courses            for all to authenticated using (true) with check (true);
create policy "sessions_all_auth"     on sessions           for all to authenticated using (true) with check (true);
create policy "enrollments_all_auth"  on enrollments        for all to authenticated using (true) with check (true);
create policy "admin_users_all_auth"  on admin_users        for all to authenticated using (true) with check (true);
create policy "holidays_all_auth"     on holidays           for all to authenticated using (true) with check (true);
create policy "audit_all_auth"        on audit_logs         for all to authenticated using (true) with check (true);
create policy "qr_all_auth"           on qr_tokens          for all to authenticated using (true) with check (true);
create policy "att_rec_all_auth"      on attendance_records for all to authenticated using (true) with check (true);
create policy "att_evt_all_auth"      on attendance_events  for all to authenticated using (true) with check (true);

-- ④ 적용 확인
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
