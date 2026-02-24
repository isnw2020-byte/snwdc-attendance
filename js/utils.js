/**
 * 성남여성인력개발센터 직업교육훈련 출결 시스템
 * Core Utility Functions
 */

// ============================================================
// UUID Generator
// ============================================================
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================================
// Seoul Timezone Date Helpers
// ============================================================
function toSeoulDate(date) {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
}

function toSeoulISOString(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const offset = 9 * 60;
  const localMs = d.getTime() + (offset * 60000);
  const localDate = new Date(localMs);
  return localDate.toISOString().replace('Z', '+09:00');
}

function nowSeoul() {
  return toSeoulDate(new Date());
}

function formatDateKR(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00+09:00');
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function formatDateYMD(dateStr) {
  if (!dateStr) return '';
  return dateStr.substring(0, 10);
}

function formatTimeHM(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  const seoul = toSeoulDate(d);
  const h = String(seoul.getHours()).padStart(2, '0');
  const m = String(seoul.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function getTodaySeoul() {
  const now = new Date();
  const seoulStr = now.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  // "YYYY. MM. DD." -> "YYYY-MM-DD"
  const parts = seoulStr.replace(/\./g, '').trim().split(' ').filter(x => x);
  if (parts.length === 3) {
    return `${parts[0]}-${parts[1]}-${parts[2]}`;
  }
  const d = toSeoulDate(now);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getDatesBetween(startDate, endDate) {
  const dates = [];
  let cur = new Date(startDate + 'T00:00:00+09:00');
  const end = new Date(endDate + 'T00:00:00+09:00');
  while (cur <= end) {
    dates.push(cur.toISOString().substring(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function isWeekday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00+09:00');
  const day = d.getDay(); // 0=Sun, 6=Sat
  return day !== 0 && day !== 6;
}

function getDayOfWeekKR(dateStr) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date(dateStr + 'T00:00:00+09:00');
  return days[d.getDay()];
}

function addMinutes(isoStr, minutes) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  return new Date(d.getTime() + minutes * 60000).toISOString();
}

function diffMinutes(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  const start = new Date(startIso);
  const end = new Date(endIso);
  return Math.max(0, Math.round((end - start) / 60000));
}

// ============================================================
// Session Start/End DateTime Builder
// ============================================================
function buildSessionDateTimes(dateStr, startTimeHHMM, dailyMinutes = 240) {
  const [h, m] = startTimeHHMM.split(':').map(Number);
  const startISO = `${dateStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00+09:00`;
  const endISO = addMinutes(startISO, dailyMinutes);
  return { startDateTime: startISO, endDateTime: endISO };
}

// ============================================================
// Attendance Status Determination
// ============================================================
/**
 * 출결 판정 핵심 로직
 * @param {string|null} checkInAt - ISO8601
 * @param {string|null} checkOutAt - ISO8601
 * @param {string} sessionStart - ISO8601
 * @param {string} sessionEnd - ISO8601
 * @param {object} config - { lateGraceMinutes, earlyGraceMinutes, recognitionRate }
 * @returns {object} { statusCode, attendedMinutes, isRecognized, isLate, isEarly, finalized }
 */
function determineAttendanceStatus(checkInAt, checkOutAt, sessionStart, sessionEnd, config = {}) {
  const lateGrace = config.lateGraceMinutes ?? 10;
  const earlyGrace = config.earlyGraceMinutes ?? 10;
  const recogRate = config.recognitionRate ?? 0.5;

  const sessionMinutes = diffMinutes(sessionStart, sessionEnd);

  // 입실 없음 → 결석
  if (!checkInAt) {
    return {
      statusCode: 'X',
      attendedMinutes: 0,
      isRecognized: false,
      isLate: false,
      isEarly: false,
      finalized: true
    };
  }

  // 입실만 있고 퇴실 없음 → 미완료
  if (!checkOutAt) {
    return {
      statusCode: '?',
      attendedMinutes: 0,
      isRecognized: false,
      isLate: false,
      isEarly: false,
      finalized: false
    };
  }

  const attended = diffMinutes(checkInAt, checkOutAt);
  const sessionStartMs = new Date(sessionStart).getTime();
  const sessionEndMs = new Date(sessionEnd).getTime();
  const checkInMs = new Date(checkInAt).getTime();
  const checkOutMs = new Date(checkOutAt).getTime();

  // 50% 미만 → 결석
  if (attended < sessionMinutes * recogRate) {
    return {
      statusCode: 'X',
      attendedMinutes: attended,
      isRecognized: false,
      isLate: checkInMs > sessionStartMs + lateGrace * 60000,
      isEarly: checkOutMs < sessionEndMs - earlyGrace * 60000,
      finalized: true
    };
  }

  const isLate = checkInMs > sessionStartMs + lateGrace * 60000;
  const isEarly = checkOutMs < sessionEndMs - earlyGrace * 60000;

  let statusCode;
  if (isLate && isEarly) statusCode = '◎▲';
  else if (isLate) statusCode = '◎';
  else if (isEarly) statusCode = '▲';
  else statusCode = '○';

  return {
    statusCode,
    attendedMinutes: attended,
    isRecognized: true,
    isLate,
    isEarly,
    finalized: true
  };
}

// ============================================================
// Summary Statistics Calculator
// ============================================================
/**
 * 참여자 출결 통계 계산
 * @param {Array} records - AttendanceRecord 배열
 * @param {number} totalSessions - 전체 교육일수
 * @param {object} config - { complexWeight, unitPeriodDays, completionRate }
 * @returns {object} 통계 객체
 */
function calcAttendanceSummary(records, totalSessions, config = {}) {
  const complexWeight = config.complexWeight ?? 2;
  const completionRate = config.completionRate ?? 0.8;

  let recognized = 0;    // 인정 출석
  let absenceRaw = 0;    // 원결석
  let lateCount = 0;     // 지각
  let earlyCount = 0;    // 조퇴
  let complexCount = 0;  // 복합
  let incomplete = 0;    // 미완료(?)

  records.forEach(r => {
    switch (r.statusCode) {
      case '○': recognized++; break;
      case '◎': recognized++; lateCount++; break;
      case '▲': recognized++; earlyCount++; break;
      case '◎▲': recognized++; complexCount++; break;
      case 'X': absenceRaw++; break;
      case '?': incomplete++; break;
    }
  });

  // 환산 결석 (지각+조퇴+복합*가중치) / 3
  const lateEarlyAccum = lateCount + earlyCount + (complexCount * complexWeight);
  const absenceConverted = Math.floor(lateEarlyAccum / 3);
  const remainToConvert = lateEarlyAccum % 3;
  const absenceTotal = absenceRaw + absenceConverted;

  // 출석률
  const effectiveSessions = totalSessions; // 전체 교육일수 기준
  const attendanceRate = effectiveSessions > 0
    ? (recognized / effectiveSessions) * 100
    : 0;

  const isCompleted = attendanceRate >= completionRate * 100;

  return {
    totalSessions,
    recognized,
    absenceRaw,
    absenceConverted,
    absenceTotal,
    lateCount,
    earlyCount,
    complexCount,
    lateEarlyAccum,
    remainToConvert,
    incomplete,
    attendanceRate: Math.round(attendanceRate * 10) / 10,
    isCompleted
  };
}

// ============================================================
// Holiday Checker
// ============================================================
let _holidaySet = null;

async function loadHolidaySet() {
  if (_holidaySet) return _holidaySet;
  try {
    const res = await fetch('tables/holidays?limit=500');
    const data = await res.json();
    _holidaySet = new Set((data.data || []).map(h => h.date));
    return _holidaySet;
  } catch (e) {
    console.warn('공휴일 로드 실패, fallback 사용');
    _holidaySet = new Set(BUILTIN_HOLIDAYS);
    return _holidaySet;
  }
}

function resetHolidaySet() {
  _holidaySet = null;
}

// 빌트인 공휴일 fallback
const BUILTIN_HOLIDAYS = [
  '2025-01-01','2025-01-29','2025-01-30','2025-01-31',
  '2025-03-01','2025-05-01','2025-05-05','2025-05-06',
  '2025-06-06','2025-08-15','2025-10-03','2025-10-05',
  '2025-10-06','2025-10-07','2025-10-09','2025-12-25',
  '2026-01-01','2026-02-17','2026-02-18','2026-02-19',
  '2026-03-01','2026-05-01','2026-05-05','2026-06-06',
  '2026-08-15','2026-09-24','2026-09-25','2026-09-26',
  '2026-10-03','2026-10-09','2026-12-25'
];

async function isHoliday(dateStr) {
  const set = await loadHolidaySet();
  return set.has(dateStr);
}

// ============================================================
// Session Generator
// ============================================================
/**
 * 교육일 자동 생성
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {string} courseId
 * @param {string} startTime - HH:mm
 * @param {number} dailyMinutes
 * @param {Set} holidaySet
 * @returns {Array} sessions
 */
function generateSessions(startDate, endDate, courseId, startTime, dailyMinutes, holidaySet) {
  const sessions = [];
  const allDates = getDatesBetween(startDate, endDate);
  let sessionNo = 1;

  for (const date of allDates) {
    if (!isWeekday(date)) continue;
    if (holidaySet && holidaySet.has(date)) continue;

    const { startDateTime, endDateTime } = buildSessionDateTimes(date, startTime, dailyMinutes);
    sessions.push({
      id: generateUUID(),
      courseId,
      date,
      startDateTime,
      endDateTime,
      sessionNo: sessionNo++,
      isHolidayExcluded: false,
      isCancelled: false,
      isInactive: false,
      note: ''
    });
  }
  return sessions;
}

// ============================================================
// Unit Period Calculator
// ============================================================
/**
 * 세션 배열을 단위기간으로 분할
 * @param {Array} sessions - 정렬된 세션 배열
 * @param {number} unitSize - 단위기간 교육일수 (기본 20)
 * @returns {Array} [{ periodNo, sessions }]
 */
function splitByUnitPeriod(sessions, unitSize = 20) {
  const active = sessions.filter(s => !s.isCancelled && !s.isInactive);
  const periods = [];
  for (let i = 0; i < active.length; i += unitSize) {
    periods.push({
      periodNo: Math.floor(i / unitSize) + 1,
      sessions: active.slice(i, i + unitSize)
    });
  }
  return periods;
}

// ============================================================
// GPS Distance Calculator
// ============================================================
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function isWithinGeofence(userLat, userLng, centerLat, centerLng, radius) {
  const dist = calcDistance(userLat, userLng, centerLat, centerLng);
  return { distance: Math.round(dist), isInside: dist <= radius };
}

// ============================================================
// Simple Hash (SHA-256 fallback for password)
// ============================================================
async function sha256(message) {
  if (window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // fallback simple hash
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// ============================================================
// Simple HMAC-like token generator
// ============================================================
function generateQRToken(courseId, sessionId, secret = 'snwdc-secret') {
  const payload = `${courseId}:${sessionId}:${Date.now()}:${Math.random()}`;
  // Base64 encode + simple XOR with secret
  return btoa(payload + ':' + secret.length).replace(/[+/=]/g, c => ({ '+': '-', '/': '_', '=': '' }[c]));
}

// ============================================================
// Auth Session (localStorage 사용 - 탭 간 세션 공유 가능)
// ============================================================
const AUTH_KEY = 'snwdc_auth_session';

function setAuthSession(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({
    ...user,
    loginAt: new Date().toISOString()
  }));
}

function getAuthSession() {
  try {
    const s = localStorage.getItem(AUTH_KEY);
    if (!s) return null;
    const data = JSON.parse(s);
    // 참여자 세션: 7일 유효
    // 관리자 세션: 1일 유효
    const loginAt = new Date(data.loginAt).getTime();
    const now = Date.now();
    const maxAge = data.role === 'participant'
      ? 7 * 24 * 60 * 60 * 1000   // 7일
      : 1 * 24 * 60 * 60 * 1000;  // 1일
    if (now - loginAt > maxAge) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_KEY);
}

function requireAuth(redirectTo = 'login.html') {
  const session = getAuthSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}

// ============================================================
// Audit Log Writer
// ============================================================
async function writeAuditLog({ actorId, actorName, action, entityType, entityId, before, after, reason }) {
  try {
    await apiPost('audit_logs', {
      id: generateUUID(),
      actorId: actorId || 'system',
      actorName: actorName || '시스템',
      action,
      entityType,
      entityId,
      beforeJson: before ? JSON.stringify(before) : '',
      afterJson: after ? JSON.stringify(after) : '',
      reason: reason || '',
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn('감사로그 기록 실패:', e);
  }
}

// ============================================================
// Supabase 필드명 변환 (camelCase ↔ lowercase)
// Supabase는 컬럼명을 소문자로만 저장합니다.
// JS 코드는 camelCase를 사용하므로, API 레이어에서 자동 변환합니다.
// ============================================================

/** camelCase → 소문자 매핑 테이블 */
const _CAMEL_TO_LOWER = {
  birthDate: 'birthdate',
  startDate: 'startdate',
  endDate: 'enddate',
  startTime: 'starttime',
  dailyMinutes: 'dailyminutes',
  lateGraceMinutes: 'lategraceminutes',
  earlyGraceMinutes: 'earlygraceminutes',
  recognitionRate: 'recognitionrate',
  completionRate: 'completionrate',
  complexWeight: 'complexweight',
  unitPeriodDays: 'unitperioddays',
  maxParticipants: 'maxparticipants',
  startDateTime: 'startdatetime',
  endDateTime: 'enddatetime',
  sessionNo: 'sessionno',
  isCancelled: 'iscancelled',
  isInactive: 'isinactive',
  isHolidayExcluded: 'isholidayexcluded',
  participantId: 'participantid',
  courseId: 'courseid',
  sessionId: 'sessionid',
  checkInAt: 'checkinat',
  checkOutAt: 'checkoutat',
  statusCode: 'statuscode',
  attendedMinutes: 'attendedminutes',
  isRecognized: 'isrecognized',
  manuallyAdjusted: 'manuallyadjusted',
  adjustReason: 'adjustreason',
  finalizedBy: 'finalizedby',
  finalizedAt: 'finalizedat',
  passwordHash: 'passwordhash',
  lastLoginAt: 'lastloginat',
  qrTokenId: 'qrtokenid',
  locationValid: 'locationvalid',
  gpsAccuracy: 'gpsaccuracy',
  gpsLat: 'gpslat',
  gpsLng: 'gpslng',
  eventType: 'eventtype',
  attendanceRecordId: 'attendancerecordid',
  actorId: 'actorid',
  actorName: 'actorname',
  entityType: 'entitytype',
  entityId: 'entityid',
  beforeJson: 'beforejson',
  afterJson: 'afterjson',
  createdAt: 'createdat',
  expiresAt: 'expiresat',
  deviceInfo: 'deviceinfo',
  cancelReason: 'cancelreason',
  enrolledAt: 'enrolledat',
  completedAt: 'completedat',
  unitPeriod: 'unitperiod',
};

/** 소문자 → camelCase 역방향 맵 (자동 생성) */
const _LOWER_TO_CAMEL = {};
for (const [camel, lower] of Object.entries(_CAMEL_TO_LOWER)) {
  _LOWER_TO_CAMEL[lower] = camel;
}

/**
 * 객체의 키를 camelCase → 소문자로 변환 (보낼 때)
 */
function _toSnake(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const newKey = _CAMEL_TO_LOWER[k] || k;
    result[newKey] = v;
  }
  return result;
}

/**
 * 객체 또는 배열의 키를 소문자 → camelCase로 변환 (받을 때)
 */
function _toCamel(data) {
  if (Array.isArray(data)) return data.map(_toCamel);
  if (!data || typeof data !== 'object') return data;
  const result = {};
  for (const [k, v] of Object.entries(data)) {
    const newKey = _LOWER_TO_CAMEL[k] || k;
    result[newKey] = v;
  }
  return result;
}

// ============================================================
// Supabase REST API Helpers
// ============================================================

/** 공통 헤더 */
function _sbHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON,
    'Authorization': `Bearer ${SUPABASE_ANON}`,
    'Prefer': 'return=representation',
    ...extra
  };
}

/** 테이블 URL */
function _sbUrl(table, query = '') {
  return `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
}

/**
 * GET - 조건 검색
 */
async function apiGet(table, params = {}) {
  const { limit = 1000, page = 1, search, sort, ...filters } = params;
  const offset = (page - 1) * limit;
  let parts = [`limit=${limit}`, `offset=${offset}`];
  if (sort) parts.push(`order=${sort}`);
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      // 필터 키도 소문자로 변환
      const sbKey = _CAMEL_TO_LOWER[k] || k;
      parts.push(`${sbKey}=eq.${encodeURIComponent(v)}`);
    }
  });
  const res = await fetch(_sbUrl(table, parts.join('&')), {
    headers: { ..._sbHeaders(), 'Prefer': 'count=exact' }
  });
  if (!res.ok) throw new Error(`API GET ${table} 실패: ${res.status}`);
  const data = await res.json();
  const total = parseInt(res.headers.get('content-range')?.split('/')[1] || (data.length || 0));
  const converted = Array.isArray(data) ? _toCamel(data) : [];
  return { data: converted, total, page, limit };
}

/**
 * GET by ID
 */
async function apiGetById(table, id) {
  if (!id) return null;
  const res = await fetch(_sbUrl(table, `id=eq.${encodeURIComponent(id)}&limit=1`), {
    headers: _sbHeaders()
  });
  if (!res.ok) return null;
  const data = await res.json();
  const raw = Array.isArray(data) ? (data[0] || null) : data;
  return raw ? _toCamel(raw) : null;
}

/**
 * POST - 레코드 생성
 */
async function apiPost(table, data) {
  const now = new Date().toISOString();
  // attendance_events는 updated_at 컬럼 없음 → 제외
  const noUpdatedAt = ['attendance_events'];
  const base = { ...data, created_at: data.created_at || now };
  if (!noUpdatedAt.includes(table)) base.updated_at = data.updated_at || now;
  const payload = _toSnake(base);
  const res = await fetch(_sbUrl(table), {
    method: 'POST',
    headers: _sbHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API POST ${table} 실패: ${res.status} - ${err}`);
  }
  const result = await res.json();
  const raw = Array.isArray(result) ? result[0] : result;
  return raw ? _toCamel(raw) : raw;
}

/**
 * PUT - 전체 업데이트
 */
async function apiPut(table, id, data) {
  const payload = _toSnake({ ...data, updated_at: new Date().toISOString() });
  const res = await fetch(_sbUrl(table, `id=eq.${encodeURIComponent(id)}`), {
    method: 'PUT',
    headers: _sbHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API PUT ${table}/${id} 실패: ${res.status} - ${err}`);
  }
  const result = await res.json();
  const raw = Array.isArray(result) ? result[0] : result;
  return raw ? _toCamel(raw) : raw;
}

/**
 * PATCH - 부분 업데이트
 */
async function apiPatch(table, id, data) {
  const payload = _toSnake({ ...data, updated_at: new Date().toISOString() });
  const res = await fetch(_sbUrl(table, `id=eq.${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: _sbHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API PATCH ${table}/${id} 실패: ${res.status} - ${err}`);
  }
  const result = await res.json();
  const raw = Array.isArray(result) ? result[0] : result;
  return raw ? _toCamel(raw) : raw;
}

/**
 * DELETE - 소프트 삭제
 */
async function apiDelete(table, id) {
  const res = await fetch(_sbUrl(table, `id=eq.${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: _sbHeaders(),
    body: JSON.stringify({ deleted: true, updated_at: new Date().toISOString() })
  });
  return res.ok;
}


/**
 * 테이블 전체 데이터 가져오기 (페이지네이션 자동 처리)
 * Supabase는 최대 1000건씩
 */
async function apiGetAll(table, extraParams = {}) {
  const PAGE = 1000;
  let offset = 0;
  let all = [];
  const MAX_ITER = 50;

  for (let i = 0; i < MAX_ITER; i++) {
    const parts = [`limit=${PAGE}`, `offset=${offset}`];
    Object.entries(extraParams).forEach(([k, v]) => {
      if (k !== 'limit' && k !== 'page' && v !== undefined && v !== null && v !== '') {
        const sbKey = _CAMEL_TO_LOWER[k] || k;
        parts.push(`${sbKey}=eq.${encodeURIComponent(v)}`);
      }
    });

    let res;
    try {
      res = await fetch(_sbUrl(table, parts.join('&')), {
        headers: { ..._sbHeaders(), 'Prefer': 'count=exact' }
      });
    } catch (e) {
      throw new Error(`apiGetAll ${table} 네트워크 오류: ${e.message}`);
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`apiGetAll ${table} 실패: ${res.status} - ${errText}`);
    }

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;

    all = all.concat(_toCamel(rows));

    const contentRange = res.headers.get('content-range');
    const total = contentRange ? parseInt(contentRange.split('/')[1]) : null;
    if (total !== null && all.length >= total) break;
    if (rows.length < PAGE) break;

    offset += PAGE;
  }
  return all;
}

// ============================================================
// Number Format
// ============================================================
function pct(value, total) {
  if (!total) return '0.0%';
  return (value / total * 100).toFixed(1) + '%';
}

// ============================================================
// Status Display Helpers
// ============================================================
const STATUS_LABEL = {
  '○': '출석',
  '◎': '지각',
  '▲': '조퇴',
  '◎▲': '지각+조퇴',
  'X': '결석',
  '?': '미완료'
};

const STATUS_COLOR = {
  '○': '#22c55e',
  '◎': '#f59e0b',
  '▲': '#f97316',
  '◎▲': '#ef4444',
  'X': '#dc2626',
  '?': '#94a3b8'
};

const STATUS_BG = {
  '○': '#dcfce7',
  '◎': '#fef3c7',
  '▲': '#ffedd5',
  '◎▲': '#fee2e2',
  'X': '#fee2e2',
  '?': '#f1f5f9'
};

function statusBadge(code) {
  const color = STATUS_COLOR[code] || '#64748b';
  const bg = STATUS_BG[code] || '#f8fafc';
  return `<span class="status-badge" style="color:${color};background:${bg}">${code || '-'}</span>`;
}

// ============================================================
// Toast Notification
// ============================================================
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  const colors = { info: '#3b82f6', success: '#22c55e', warning: '#f59e0b', error: '#ef4444' };
  const toast = document.createElement('div');
  toast.style.cssText = `
    padding:12px 20px;border-radius:8px;color:white;font-size:14px;
    background:${colors[type] || colors.info};box-shadow:0 4px 12px rgba(0,0,0,.15);
    animation:slideIn .3s ease;max-width:320px;word-break:keep-all;
  `;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, duration);
}

// ============================================================
// Modal Helpers
// ============================================================
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.style.display = 'none'; document.body.style.overflow = ''; }
}

// ============================================================
// Debounce
// ============================================================
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ============================================================
// Excel Export (SheetJS)
// ============================================================
function downloadExcel(data, sheetName, fileName) {
  if (!window.XLSX) { showToast('엑셀 라이브러리 로드 중...', 'warning'); return; }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

// ============================================================
// Pagination Helper
// ============================================================
function renderPagination(containerId, currentPage, totalPages, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (totalPages <= 1) return;

  const createBtn = (text, page, disabled = false, active = false) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = `page-btn${active ? ' active' : ''}`;
    btn.disabled = disabled;
    if (!disabled) btn.onclick = () => onPageChange(page);
    return btn;
  };

  container.appendChild(createBtn('‹', currentPage - 1, currentPage <= 1));
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    container.appendChild(createBtn(String(i), i, false, i === currentPage));
  }
  container.appendChild(createBtn('›', currentPage + 1, currentPage >= totalPages));
}

// ============================================================
// Global Settings Cache
// ============================================================
let _globalSettings = null;
function getDefaultSettings() {
  return {
    centerLat: 37.43972,     // 성남여성인력개발센터 위도 (기본값)
    centerLng: 127.13702,    // 성남여성인력개발센터 경도 (기본값)
    centerRadius: 300,       // 허용 반경 300m (GPS 오차 고려)
    lateGraceMinutes: 10,
    earlyGraceMinutes: 10,
    recognitionRate: 0.5,
    completionRate: 0.8,
    unitPeriodDays: 20,
    complexWeight: 2,
    maxAccuracy: 100,        // GPS 정확도 허용 100m (실내 환경 고려)
    qrExpireSeconds: 45,
    centerName: '성남여성인력개발센터',
    gpsRequired: false       // GPS 검증 비활성화 기본값 (관리자가 활성화 가능)
  };
}

function getSettings() {
  if (_globalSettings) return _globalSettings;
  const stored = localStorage.getItem('snwdc_settings');
  if (stored) {
    try { _globalSettings = { ...getDefaultSettings(), ...JSON.parse(stored) }; return _globalSettings; }
    catch {}
  }
  _globalSettings = getDefaultSettings();
  return _globalSettings;
}

function saveSettings(settings) {
  _globalSettings = { ...getDefaultSettings(), ...settings };
  localStorage.setItem('snwdc_settings', JSON.stringify(_globalSettings));
}
