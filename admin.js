/*
 * 공지사항 표시 + 관리자 화면
 * - 자물쇠 버튼 → 비밀번호 확인(PBKDF2 해시 비교) → 관리자 화면
 * - 사이트 편집 · 공지 · 수강생 명단 · 출석/과제/신청 내역(CSV 내려받기) · 설정 파일 저장/불러오기 · 비밀번호 변경
 * 내용 수정은 config.js 에서 하세요. 이 파일은 고칠 필요가 없습니다.
 */
(function () {
  "use strict";

  const C = window.SITE_CONFIG;
  const S = window.SITE;
  const D = window.SITE_DATA;
  if (!C || !S || !D) return;
  const { esc, $, weeks, fmtDate } = S;
  const { db, store, isLocal } = D;
  const toast = D.toast || (() => {});

  // build.ps1 로 만든 '한 파일짜리' index.html 이면 설정을 담은 새 index.html 을 내려받게 합니다.
  const bundleShell = document.getElementById("bundle-shell");
  const DEPLOY = bundleShell ? "index.html" : "config.js";

  const OVERRIDE_KEY = "ffp:configOverride";
  const SESSION_KEY = "ffp-admin";
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const pad = (n) => String(n).padStart(2, "0");
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const fmtTime = (ms) => {
    if (!ms) return "";
    const d = new Date(Number(ms));
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const session = {
    get() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } },
    set(v) { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(v)); } catch { /* 무시 */ } },
    clear() { try { sessionStorage.removeItem(SESSION_KEY); } catch { /* 무시 */ } },
  };
  const saveOverride = (cfg) => {
    try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify(cfg)); return true; } catch { return false; }
  };

  // ════════════════════════════════════════════════════
  //  공지사항 (모든 방문자)
  // ════════════════════════════════════════════════════
  let serverNotices = [];
  const allNotices = () => {
    const map = new Map();
    [...(C.notices || []), ...serverNotices].forEach((n) => { if (n && n.id) map.set(n.id, n); });
    return [...map.values()].sort((a, b) => (b.pinned - a.pinned) || String(b.date).localeCompare(String(a.date)));
  };
  const renderNotices = () => {
    const box = $("#notice");
    const list = allNotices();
    if (!list.length) { box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = false;
    const item = (n, i) => `
      <li class="${n.pinned ? "pinned" : ""}"${i >= 3 ? " hidden" : ""}>
        <details>
          <summary>
            <span class="notice-tag">${n.pinned ? "📌 고정" : "공지"}</span>
            <strong>${esc(n.title)}</strong>
            <time>${esc(n.date)}</time>
          </summary>
          <p>${esc(n.body)}</p>
        </details>
      </li>`;
    box.innerHTML = `
      <div class="card notice-card">
        <div class="notice-head">
          <h2>📢 공지사항</h2>
          <span>${list.length}건</span>
        </div>
        <ul class="notice-list">${list.map(item).join("")}</ul>
        ${list.length > 3 ? `<button class="link-btn notice-more" type="button">공지 ${list.length - 3}건 더 보기</button>` : ""}
      </div>`;
    const first = box.querySelector(".notice-list details");
    if (first && list[0].pinned) first.open = true;
    box.querySelector(".notice-more")?.addEventListener("click", (e) => {
      box.querySelectorAll(".notice-list li[hidden]").forEach((li) => { li.hidden = false; });
      e.currentTarget.remove();
    });
  };
  renderNotices();
  if (!isLocal) db.notices().then((n) => { serverNotices = n; renderNotices(); }).catch(() => { /* 공지 서버 오류는 조용히 넘깁니다 */ });

  // 관리자 미리보기가 적용된 상태면 화면 아래에 알려 줍니다.
  if (window.SITE_CONFIG_ORIGINAL) {
    const chip = document.createElement("div");
    chip.className = "preview-chip";
    chip.innerHTML = `<span>👀 관리자 미리보기 적용 중 · 이 브라우저에서만 보입니다</span><button type="button">원래대로</button>`;
    chip.querySelector("button").addEventListener("click", () => {
      if (!confirm("이 브라우저에 저장된 편집 내용을 지우고 원래 설정으로 돌아갈까요?")) return;
      try { localStorage.removeItem(OVERRIDE_KEY); } catch { /* 무시 */ }
      location.reload();
    });
    document.body.appendChild(chip);
  }

  // ════════════════════════════════════════════════════
  //  비밀번호 확인
  // ════════════════════════════════════════════════════
  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const derive = async (password, salt, iterations) => {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations }, key, 256);
    return hex(bits);
  };
  const makeHash = async (password) => {
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const iterations = 150000;
    return { salt, iterations, passwordHash: await derive(password, salt, iterations) };
  };
  const verify = async (password, admin = C.admin) => {
    if (!admin?.passwordHash) return false;
    return (await derive(password, admin.salt, admin.iterations || 150000)) === admin.passwordHash;
  };

  const loginDlg = $("#admin-login");
  const panel = $("#admin-panel");
  let fails = 0;
  let lockedUntil = 0;

  const openLogin = () => {
    if (session.get()) { openPanel(); return; }
    loginDlg.innerHTML = `
      <form class="admin-login-form" novalidate>
        <div class="popup-art" aria-hidden="true">🔐</div>
        <h2 id="admin-login-title">관리자 로그인</h2>
        <div class="field">
          <label for="admin-pw">비밀번호</label>
          <div class="pw-row">
            <input id="admin-pw" type="password" autocomplete="current-password" aria-describedby="admin-pw-err">
            <button class="pw-toggle" type="button" aria-label="비밀번호 보기" aria-pressed="false">보기</button>
          </div>
          <p class="field-error" id="admin-pw-err" role="alert"></p>
        </div>
        <div class="admin-login-actions">
          <button class="btn btn-ghost" type="button" data-close>취소</button>
          <button class="btn btn-primary" type="submit">열기</button>
        </div>
      </form>`;
    const form = $(".admin-login-form", loginDlg);
    const input = $("#admin-pw");
    const err = $("#admin-pw-err");
    $(".pw-toggle", loginDlg).addEventListener("click", (e) => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      e.currentTarget.textContent = show ? "숨기기" : "보기";
      e.currentTarget.setAttribute("aria-pressed", String(show));
    });
    $("[data-close]", loginDlg).addEventListener("click", () => loginDlg.close());
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!window.crypto?.subtle) { err.textContent = "이 브라우저 환경에서는 비밀번호를 확인할 수 없습니다. (https 주소나 파일로 열어 주세요)"; return; }
      const wait = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (wait > 0) { err.textContent = `잠시 후 다시 시도해 주세요. (${wait}초)`; return; }
      if (!input.value) { err.textContent = "비밀번호를 입력해 주세요."; input.focus(); return; }
      const btn = $('button[type="submit"]', form);
      btn.disabled = true;
      btn.textContent = "확인 중…";
      const ok = await verify(input.value);
      btn.disabled = false;
      btn.textContent = "열기";
      if (!ok) {
        fails += 1;
        if (fails >= 5) { lockedUntil = Date.now() + 30000; fails = 0; err.textContent = "5번 틀렸습니다. 30초 뒤에 다시 시도해 주세요."; }
        else err.textContent = "비밀번호가 맞지 않습니다.";
        input.select();
        input.setAttribute("aria-invalid", "true");
        return;
      }
      fails = 0;
      session.set({ pw: input.value, tab: "edit" });
      loginDlg.close();
      openPanel();
    });
    loginDlg.showModal();
    input.focus();
  };

  $("#admin-lock").addEventListener("click", openLogin);

  // ════════════════════════════════════════════════════
  //  관리자 화면
  // ════════════════════════════════════════════════════
  const TABS = [
    ["edit", "✏️ 사이트 편집"],
    ["notices", "📢 공지"],
    ["roster", "👥 수강생 명단"],
    ["attendance", "✅ 출석"],
    ["submissions", "📝 과제"],
    ["applications", "📋 수강 신청"],
    ["file", "💾 설정 파일"],
    ["password", "🔑 비밀번호"],
  ];
  let draft = clone(C);
  let dirty = false;
  let current = "edit";
  let cache = null; // 관리자 데이터 (명단·출석·과제·신청)
  const pw = () => session.get()?.pw || "";

  const openPanel = () => {
    const s = session.get();
    if (s?.tab) current = s.tab;
    cache = null; // 열 때마다 최신 내역을 다시 불러옵니다
    panel.innerHTML = `
      <div class="ap-shell">
        <header class="ap-head">
          <div>
            <h2 id="admin-title">관리자 화면</h2>
            <span class="ap-mode ${isLocal ? "" : "on"}">${isLocal ? "체험 모드 · 이 브라우저의 데이터" : "Google 시트 연결됨"}</span>
          </div>
          <div class="ap-head-actions">
            <button class="btn btn-ghost btn-sm" type="button" id="ap-lock">잠그기</button>
            <button class="ap-x" type="button" id="ap-close" aria-label="관리자 화면 닫기">×</button>
          </div>
        </header>
        <div class="ap-dirty" hidden>
          <span>저장하지 않은 편집 내용이 있습니다.</span>
          <button class="btn btn-ghost btn-sm" type="button" data-act="discard">되돌리기</button>
          <button class="btn btn-primary btn-sm" type="button" data-act="apply">미리보기 적용</button>
        </div>
        <nav class="ap-tabs" role="tablist" aria-label="관리 메뉴">
          ${TABS.map(([id, label]) => `<button type="button" role="tab" id="tab-${id}" data-tab="${id}" aria-controls="ap-body">${label}</button>`).join("")}
        </nav>
        <div class="ap-body" id="ap-body" role="tabpanel" tabindex="-1"></div>
      </div>`;

    $("#ap-close").addEventListener("click", closePanel);
    $("#ap-lock").addEventListener("click", () => {
      session.clear();
      panel.close();
      toast("관리자 화면을 잠갔습니다.");
    });
    panel.querySelector(".ap-tabs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-tab]");
      if (b) showTab(b.dataset.tab);
    });
    panel.querySelector(".ap-dirty").addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "apply") applyDraft();
      if (act === "discard" && confirm("편집한 내용을 모두 되돌릴까요?")) { draft = clone(C); setDirty(false); showTab(current); }
    });
    panel.oncancel = (e) => { e.preventDefault(); closePanel(); };
    if (!panel.open) panel.showModal();
    showTab(current);
  };

  const closePanel = () => {
    if (dirty && !confirm("적용하지 않은 편집 내용이 있습니다. 그래도 닫을까요? (다시 열면 이어서 편집할 수 있습니다)")) return;
    panel.close();
  };

  const setDirty = (v) => {
    dirty = v;
    const bar = panel.querySelector(".ap-dirty");
    if (bar) bar.hidden = !v;
  };

  // 편집 내용을 이 브라우저에 저장하고 새로고침해서 바로 확인합니다.
  const applyDraft = () => {
    if (!saveOverride(draft)) { alert("브라우저 저장 공간에 저장하지 못했습니다."); return; }
    session.set({ ...session.get(), tab: current, reopen: true });
    location.reload();
  };

  const showTab = (id) => {
    current = id;
    session.set({ ...session.get(), tab: id });
    panel.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === id)));
    // 탭마다 새 영역을 만들어 이전 탭의 이벤트가 남지 않게 합니다.
    const old = $("#ap-body");
    const body = old.cloneNode(false);
    old.replaceWith(body);
    ({ edit: tabEdit, notices: tabNotices, roster: tabRoster, attendance: tabAttendance, submissions: tabSubmissions, applications: tabApplications, file: tabFile, password: tabPassword })[id](body);
  };

  // ── 공통: CSV 내려받기 ─────────────────────────────
  const csvCell = (v) => {
    let s = v == null ? "" : String(v);
    if (/^0\d+$/.test(s)) return `="${s}"`; // 010… 같은 번호의 맨 앞 0이 엑셀에서 사라지지 않도록
    if (/^[=+\-@]/.test(s)) s = `'${s}`; // 엑셀에서 수식으로 실행되지 않도록
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const toCSV = (rows) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const download = (name, text, type) => {
    const isCsv = /\.csv$/.test(name);
    const blob = new Blob([isCsv ? "﻿" : "", text], { type: type || (isCsv ? "text/csv;charset=utf-8" : "text/javascript;charset=utf-8") });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const tableHTML = (head, rows, opts = {}) => `
    <div class="ap-table-wrap">
      <table class="ap-table${opts.cls ? ` ${opts.cls}` : ""}">
        <thead><tr>${head.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead>
        <tbody>${rows.length ? rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${head.length}" class="empty">아직 내역이 없습니다.</td></tr>`}</tbody>
      </table>
    </div>`;

  // ── 공통: 관리자 데이터 불러오기 ─────────────────────
  const loadData = async (body, force) => {
    if (cache && !force) return cache;
    body.innerHTML = `<p class="ap-loading" role="status">내역을 불러오는 중…</p>`;
    try {
      const raw = await db.adminData(pw());
      cache = normalize(raw);
      return cache;
    } catch (err) {
      cache = null;
      body.innerHTML = `
        <div class="ap-error">
          <p><strong>내역을 불러오지 못했습니다.</strong><br>${esc(err.message)}</p>
          ${isLocal ? "" : `<p class="muted">시트 '설정' 탭의 관리자비밀번호가 이 사이트의 관리자 비밀번호와 같은지 확인해 주세요.</p>`}
          <button class="btn btn-primary btn-sm" type="button" data-retry>다시 시도</button>
        </div>`;
      body.querySelector("[data-retry]").addEventListener("click", () => showTab(current));
      return null;
    }
  };

  // 체험 모드와 시트 모드의 데이터 모양을 하나로 맞춥니다.
  const normalize = (raw) => {
    const roster = (raw.roster || []).map((s) => ({ id: String(s.id), name: s.name || "", email: s.email || "", memo: s.memo || "" }));
    let attendance = [];
    let submissions = [];
    let appHead = [];
    let applications = [];
    if (isLocal) {
      raw.attendance.forEach(([id, rec]) => Object.entries(rec).forEach(([week, r]) => attendance.push({ id, name: r.name || "", week: Number(week), at: r.at, late: r.late })));
      raw.submissions.forEach(([id, rec]) => Object.entries(rec).forEach(([week, r]) => submissions.push({
        id, name: r.name || "", week: Number(week), title: r.title || weeks[week - 1]?.assignment?.title || "",
        fileName: r.fileName, size: r.size, at: r.at, late: r.late, link: "",
      })));
      const fields = (C.applyForm?.fields || []);
      appHead = ["제출 시각", ...fields.map((f) => (f.type === "agree" ? "개인정보 동의" : f.label.replace(/\s*\(.*\)\s*$/, "")))];
      applications = raw.applications.map((a) => [fmtTime(a._at), ...fields.map((f) => {
        const v = a[f.name];
        return Array.isArray(v) ? v.join(", ") : v === true ? "동의" : v === false ? "" : v ?? "";
      })]);
    } else {
      attendance = raw.attendance.slice(1).map((r) => ({ at: r[0], id: String(r[1]), name: r[2], week: Number(r[3]), late: r[4] === "지각" }));
      submissions = raw.submissions.slice(1).map((r) => ({
        at: r[0], id: String(r[1]), name: r[2], week: Number(r[3]), title: r[4], fileName: r[5], size: Number(r[6]) * 1024, late: r[7] === "지각", link: r[8],
      }));
      appHead = (raw.applications[0] || ["제출 시각"]).map(String);
      applications = raw.applications.slice(1).map((r) => r.map((v, i) => (i === 0 ? fmtTime(v) : v)));
    }
    return { roster, attendance, submissions, appHead, applications };
  };

  const toolbar = (title, buttons) => `
    <div class="ap-toolbar">
      <h3>${title}</h3>
      <div class="ap-toolbar-actions">${buttons}</div>
    </div>`;

  // ════════════════════════════════════════════════════
  //  탭 1. 사이트 편집 (config 를 화면에서 바로 고치기)
  // ════════════════════════════════════════════════════
  const SECTIONS = [
    ["site", "기본 정보"], ["keyInfo", "핵심 정보 4칸"], ["nav", "상단 메뉴"], ["about", "프로그램 소개"],
    ["curriculum", "커리큘럼·주차"], ["schedule", "수업 일정"], ["poll", "투표"], ["tools", "AI 도구"],
    ["enroll", "수강 안내"], ["applyForm", "수강 신청서"], ["faq", "FAQ"], ["instructor", "교수자"],
    ["footer", "하단"], ["popup", "안내 팝업"], ["welcome", "첫 방문 환영"], ["student", "수강생 공간"],
    ["participation", "저장 방식"],
  ];
  const LABELS = {
    title: "제목", subtitle: "부제", shortTitle: "짧은 이름(헤더)", organization: "기관", badge: "배지 문구",
    description: "설명", ctaPrimary: "첫 번째 버튼", ctaSecondary: "두 번째 버튼", label: "이름", href: "링크",
    icon: "아이콘(이모지)", value: "값", note: "보조 문구", id: "ID (연결용, 바꾸지 마세요)", heading: "섹션 제목",
    lead: "안내 문구", stats: "숫자 카드", suffix: "단위", benefitsHeading: "장점 제목", benefits: "장점 슬라이드",
    text: "내용", modules: "단계 카드", phase: "단계", weeks: "주차", topics: "학습 내용", weeksHeading: "주차별 제목",
    weeksLead: "주차별 안내", videos: "참고 영상", url: "주소", assignment: "과제", due: "마감 (YYYY-MM-DD HH:MM)",
    submitUrl: "과제 제출 주소", startDate: "1주차 날짜 (YYYY-MM-DD)", weekday: "수업 요일 (0=일 … 2=화 … 6=토)",
    startTime: "시작 시각", endTime: "종료 시각", location: "장소", skipDates: "휴강일 (YYYY-MM-DD)",
    items: "항목", name: "이름", category: "분류", prepHeading: "준비물 제목", prep: "준비물", stepsHeading: "절차 제목",
    steps: "신청 절차", applyButton: "신청 버튼", q: "질문", a: "답변", photo: "사진 파일 경로", role: "역할",
    affiliation: "소속", bio: "소개", career: "경력", contacts: "연락처", address: "주소", copyright: "저작권 문구",
    enabled: "사용", delaySeconds: "뜨기까지 (초)", points: "요점", button: "버튼", fireworks: "폭죽 효과",
    message: "환영 메시지", mode: "저장 방식 (local 또는 sheets)", sheetsUrl: "Google 시트 웹 앱 주소",
    pollRefreshSeconds: "투표 새로고침 간격 (초)", allowChange: "투표 바꾸기 허용", options: "선택지", fields: "입력 항목",
    type: "유형 (text·email·tel·select·radio·checkboxes·textarea·agree)", required: "필수", placeholder: "입력 예시",
    pattern: "형식 (정규식)", patternMessage: "형식 오류 문구", minLength: "최소 글자 수", submitLabel: "제출 버튼 문구",
    successTitle: "완료 제목", successText: "완료 문구", attendance: "출석", openBeforeMinutes: "수업 몇 분 전부터 출석",
    lateAfterMinutes: "몇 분 뒤부터 지각", alwaysOpen: "언제나 출석 가능 (테스트용)", askCode: "출석 코드 사용",
    upload: "과제 업로드", accept: "허용 파일 형식", maxSizeMB: "최대 크기 (MB)", allowLate: "지각 제출 허용",
    date: "날짜", sheetLabel: "시트 열 이름", keyInfo: "핵심 정보", nav: "메뉴",
  };
  const LONG = new Set(["description", "text", "bio", "a", "body", "lead", "note", "successText", "message", "patternMessage"]);
  // 배열에 새 항목을 넣을 때 쓸 모양
  const TEMPLATES = {
    videos: { title: "", url: "" },
    contacts: { icon: "", label: "", value: "", href: "" },
    stats: { value: 0, suffix: "", label: "" },
    skipDates: "", topics: "", career: "", points: "", accept: "",
  };
  // 있어도 되고 없어도 되는 항목 (부모 배열 이름 → 항목 → 기본값)
  const OPTIONAL = {
    weeks: {
      assignment: { title: "", description: "", due: "2026-12-01 23:59" },
      location: "", date: "", startTime: "", endTime: "",
    },
  };

  const getAt = (obj, path) => path.reduce((o, k) => (o == null ? o : o[k]), obj);
  const setAt = (obj, path, v) => { getAt(obj, path.slice(0, -1))[path[path.length - 1]] = v; };
  const blankLike = (v) => {
    if (Array.isArray(v)) return [];
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blankLike(x)]));
    if (typeof v === "number") return 0;
    if (typeof v === "boolean") return false;
    return "";
  };
  const preview = (v) => {
    if (v == null) return "";
    if (typeof v !== "object") return String(v);
    return String(v.title || v.label || v.name || v.q || v.phase || v.value || v.id || "");
  };
  const label = (k) => LABELS[k] || k;
  const P = (path) => esc(JSON.stringify(path));

  const renderValue = (value, path, key, parentArrayKey) => {
    if (Array.isArray(value)) {
      const items = value.map((item, i) => {
        const ipath = [...path, i];
        const btns = `
          <span class="ed-btns">
            <button type="button" data-act="up" data-path='${P(path)}' data-i="${i}" aria-label="위로" ${i === 0 ? "disabled" : ""}>↑</button>
            <button type="button" data-act="down" data-path='${P(path)}' data-i="${i}" aria-label="아래로" ${i === value.length - 1 ? "disabled" : ""}>↓</button>
            <button type="button" data-act="del" data-path='${P(path)}' data-i="${i}" aria-label="삭제">✕</button>
          </span>`;
        if (item && typeof item === "object") {
          return `
            <details class="ed-item" data-ipath='${P(ipath)}'>
              <summary><span class="ed-item-title">${i + 1}. ${esc(preview(item)) || "(새 항목)"}</span>${btns}</summary>
              <div class="ed-item-body">${renderValue(item, ipath, null, key)}</div>
            </details>`;
        }
        return `<div class="ed-row">${scalarInput(item, ipath, key)}${btns}</div>`;
      }).join("");
      return `
        <div class="ed-array">
          ${items || `<p class="muted">비어 있습니다.</p>`}
          <button class="btn btn-ghost btn-sm ed-add" type="button" data-act="add" data-path='${P(path)}' data-key="${esc(key || "")}">+ ${esc(label(key || "항목"))} 추가</button>
        </div>`;
    }
    if (value && typeof value === "object") {
      const opt = OPTIONAL[parentArrayKey] || {};
      const rows = Object.entries(value).map(([k, v]) => {
        const kpath = [...path, k];
        const removable = k in opt
          ? `<button class="link-btn ed-delkey" type="button" data-act="delkey" data-path='${P(kpath)}'>${esc(label(k))} 빼기</button>` : "";
        if (v && typeof v === "object") {
          return `<fieldset class="ed-group"><legend>${esc(label(k))} ${removable}</legend>${renderValue(v, kpath, k, null)}</fieldset>`;
        }
        const id = `ed-${kpath.join("-")}`;
        if (typeof v === "boolean") {
          return `<label class="ed-check"><input type="checkbox" id="${id}" data-path='${P(kpath)}' ${v ? "checked" : ""}> ${esc(label(k))} ${removable}</label>`;
        }
        return `<div class="ed-field"><label for="${id}">${esc(label(k))} ${removable}</label>${scalarInput(v, kpath, k, id)}</div>`;
      }).join("");
      const missing = Object.keys(opt).filter((k) => !(k in value))
        .map((k) => `<button class="btn btn-ghost btn-sm" type="button" data-act="addkey" data-path='${P([...path, k])}' data-key="${esc(k)}">+ ${esc(label(k))}</button>`).join("");
      return rows + (missing ? `<div class="ed-optional">${missing}</div>` : "");
    }
    return scalarInput(value, path, key);
  };

  const scalarInput = (v, path, key, id) => {
    const idAttr = id ? ` id="${id}"` : ` aria-label="${esc(label(key || ""))}"`;
    if (typeof v === "number") return `<input type="number" step="any"${idAttr} data-path='${P(path)}' data-num value="${v}">`;
    if (typeof v === "boolean") return `<input type="checkbox"${idAttr} data-path='${P(path)}' ${v ? "checked" : ""}>`;
    const s = v == null ? "" : String(v);
    if (key === "photo") {
      // 사진은 경로를 적거나, 파일을 골라 사이트 파일 안에 바로 넣을 수 있습니다.
      const embedded = s.startsWith("data:");
      return `
        <div class="ed-photo">
          ${embedded ? `<img src="${esc(s)}" alt="" class="ed-photo-thumb">` : ""}
          <input type="text"${idAttr} data-path='${P(path)}' value="${embedded ? "" : esc(s)}" placeholder="${embedded ? "(사이트 파일 안에 들어 있는 사진)" : "images/instructor.jpg"}">
          <label class="btn btn-ghost btn-sm file-btn">사진 파일 넣기<input type="file" accept="image/jpeg,image/png,image/webp" data-photo='${P(path)}' hidden></label>
        </div>`;
    }
    if (LONG.has(key) || s.length > 70) return `<textarea rows="3"${idAttr} data-path='${P(path)}'>${esc(s)}</textarea>`;
    return `<input type="text"${idAttr} data-path='${P(path)}' value="${esc(s)}">`;
  };

  let editSection = "site";
  const tabEdit = (body) => {
    body.innerHTML = `
      ${toolbar("사이트 편집", `<button class="btn btn-primary btn-sm" type="button" data-act="apply-top">미리보기 적용</button>`)}
      <p class="ap-help">고친 내용은 <b>미리보기 적용</b>을 누르면 이 브라우저에서 바로 확인할 수 있습니다.
        모든 방문자에게 반영하려면 <b>💾 설정 파일</b> 탭에서 ${DEPLOY} 를 내려받아 사이트의 ${DEPLOY} 와 바꿔 주세요.</p>
      <div class="ed-layout">
        <div class="ed-sections" role="list">
          ${SECTIONS.filter(([k]) => k in draft).map(([k, name]) => `<button type="button" role="listitem" data-sec="${k}" class="${k === editSection ? "active" : ""}">${name}</button>`).join("")}
        </div>
        <select class="ed-sections-select" aria-label="편집할 부분">
          ${SECTIONS.filter(([k]) => k in draft).map(([k, name]) => `<option value="${k}"${k === editSection ? " selected" : ""}>${name}</option>`).join("")}
        </select>
        <div class="ed-form"></div>
      </div>`;
    const form = $(".ed-form", body);
    const renderForm = () => {
      const open = [...form.querySelectorAll("details.ed-item")].map((d) => d.open);
      form.innerHTML = `<h4>${esc(SECTIONS.find(([k]) => k === editSection)[1])}</h4>${renderValue(draft[editSection], [editSection], editSection, null)}`;
      form.querySelectorAll("details.ed-item").forEach((d, i) => { if (open[i]) d.open = true; });
    };
    const pick = (k) => {
      editSection = k;
      body.querySelectorAll("[data-sec]").forEach((b) => b.classList.toggle("active", b.dataset.sec === k));
      $(".ed-sections-select", body).value = k;
      renderForm();
    };
    body.querySelector(".ed-sections").addEventListener("click", (e) => { const b = e.target.closest("[data-sec]"); if (b) pick(b.dataset.sec); });
    $(".ed-sections-select", body).addEventListener("change", (e) => pick(e.target.value));
    body.querySelector('[data-act="apply-top"]').addEventListener("click", applyDraft);

    const onInput = (e) => {
      const t = e.target;
      if (t.dataset.photo && e.type === "change" && t.files[0]) {
        const f = t.files[0];
        if (f.size > 1.5 * 1048576) { alert("사진은 1.5MB 이하로 줄여서 넣어 주세요. (사이트 파일이 너무 커집니다)"); t.value = ""; return; }
        const r = new FileReader();
        r.onload = () => { setAt(draft, JSON.parse(t.dataset.photo), r.result); setDirty(true); renderForm(); toast("사진을 넣었습니다. '미리보기 적용'을 눌러 확인하세요."); };
        r.readAsDataURL(f);
        return;
      }
      if (!t.dataset.path) return;
      const path = JSON.parse(t.dataset.path);
      const v = t.type === "checkbox" ? t.checked : t.dataset.num != null ? Number(t.value) : t.value;
      setAt(draft, path, v);
      setDirty(true);
      // 항목 제목 줄도 바로 바꿔 줍니다.
      const item = t.closest("details.ed-item");
      if (item) {
        const title = item.querySelector(":scope > summary .ed-item-title");
        title.textContent = title.textContent.replace(/^(\d+\.\s).*/, `$1${preview(getAt(draft, JSON.parse(item.dataset.ipath))) || "(새 항목)"}`);
      }
    };
    form.addEventListener("input", onInput);
    form.addEventListener("change", onInput);
    form.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-act]");
      if (!b) return;
      e.preventDefault();
      const path = JSON.parse(b.dataset.path);
      const act = b.dataset.act;
      if (act === "addkey") {
        setAt(draft, path, clone(OPTIONAL.weeks[b.dataset.key] ?? ""));
      } else if (act === "delkey") {
        if (!confirm(`${label(path[path.length - 1])} 항목을 뺄까요?`)) return;
        delete getAt(draft, path.slice(0, -1))[path[path.length - 1]];
      } else {
        const arr = getAt(draft, path);
        const i = Number(b.dataset.i);
        if (act === "add") {
          const key = b.dataset.key;
          arr.push(key in TEMPLATES ? clone(TEMPLATES[key]) : arr.length ? blankLike(arr[arr.length - 1]) : "");
        }
        if (act === "del") { if (!confirm(`${i + 1}번째 항목을 삭제할까요?`)) return; arr.splice(i, 1); }
        if (act === "up" && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
        if (act === "down" && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
      }
      setDirty(true);
      renderForm();
      if (act === "add") {
        // 방금 추가한 항목을 펼치고 첫 칸에 커서를 둡니다.
        const newPath = JSON.stringify([...path, getAt(draft, path).length - 1]);
        const added = [...form.querySelectorAll("details.ed-item")].find((d) => d.dataset.ipath === newPath);
        const target = added || [...form.querySelectorAll("[data-path]")].find((x) => x.dataset.path === newPath);
        if (added) added.open = true;
        target?.scrollIntoView({ block: "nearest" });
        (added ? added.querySelector("input, textarea") : target)?.focus();
      }
    });
    renderForm();
  };

  // ════════════════════════════════════════════════════
  //  탭 2. 공지
  // ════════════════════════════════════════════════════
  // 공지는 바로 저장합니다 (다른 편집 내용과 상관없이).
  const persistNotices = (list) => {
    draft.notices = clone(list);
    C.notices = clone(list);
    saveOverride(clone(C));
    renderNotices();
  };
  const tabNotices = (body) => {
    const list = allNotices();
    body.innerHTML = `
      ${toolbar("공지 올리기", "")}
      <form class="ap-card notice-form" novalidate>
        <div class="field"><label for="nt-title">제목</label><input id="nt-title" maxlength="80"></div>
        <div class="field"><label for="nt-body">내용</label><textarea id="nt-body" rows="4"></textarea></div>
        <div class="notice-form-row">
          <div class="field"><label for="nt-date">날짜</label><input id="nt-date" type="date" value="${today()}"></div>
          <label class="ed-check"><input type="checkbox" id="nt-pin"> 맨 위에 고정</label>
          <button class="btn btn-primary" type="submit">공지 올리기</button>
        </div>
        <p class="field-error" id="nt-err" role="alert"></p>
        <p class="ap-help">${isLocal
          ? `체험 모드에서는 이 브라우저에만 보입니다. 모든 방문자에게 보이게 하려면 💾 설정 파일 탭에서 ${DEPLOY} 를 내려받아 교체해 주세요.`
          : "Google 시트의 '공지' 탭에 저장되어 모든 방문자에게 바로 보입니다."}</p>
      </form>
      ${toolbar(`게시된 공지 (${list.length})`, "")}
      <ul class="ap-notice-list">
        ${list.length ? list.map((n) => `
          <li>
            <div><span class="notice-tag">${n.pinned ? "📌 고정" : "공지"}</span> <strong>${esc(n.title)}</strong> <time>${esc(n.date)}</time>
              <p>${esc(n.body)}</p></div>
            <div class="ap-row-actions">
              <button class="btn btn-ghost btn-sm" type="button" data-pin="${esc(n.id)}">${n.pinned ? "고정 해제" : "고정"}</button>
              <button class="btn btn-ghost btn-sm danger" type="button" data-del="${esc(n.id)}">삭제</button>
            </div>
          </li>`).join("") : `<li class="empty">게시된 공지가 없습니다.</li>`}
      </ul>`;

    body.querySelector(".notice-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = $("#nt-title").value.trim();
      const text = $("#nt-body").value.trim();
      if (!title || !text) { $("#nt-err").textContent = !title ? "제목을 입력해 주세요." : "내용을 입력해 주세요."; return; }
      const notice = { id: `n-${Date.now()}`, date: $("#nt-date").value || today(), title, body: text, pinned: $("#nt-pin").checked };
      if (isLocal) {
        persistNotices([...(C.notices || []), notice]);
      } else {
        // 시트 연결 시: 공지는 시트에 저장되어 모든 방문자에게 바로 보입니다.
        try { serverNotices = (await db.saveNotice(pw(), notice)).notices || serverNotices; }
        catch (err) { $("#nt-err").textContent = `시트에 저장하지 못했습니다: ${err.message}`; return; }
        renderNotices();
      }
      toast("공지를 올렸습니다.");
      showTab("notices");
    });
    body.querySelector(".ap-notice-list").addEventListener("click", async (e) => {
      const pinId = e.target.closest("[data-pin]")?.dataset.pin;
      const delId = e.target.closest("[data-del]")?.dataset.del;
      if (!pinId && !delId) return;
      const id = pinId || delId;
      if (delId && !confirm("이 공지를 삭제할까요?")) return;
      const onServer = serverNotices.find((n) => n.id === id);
      try {
        if (onServer && !isLocal) {
          serverNotices = delId
            ? (await db.deleteNotice(pw(), id)).notices
            : (await db.saveNotice(pw(), { ...onServer, pinned: !onServer.pinned })).notices;
        }
      } catch (err) { alert(`시트에 반영하지 못했습니다: ${err.message}`); return; }
      const local = (C.notices || []).filter((n) => !(delId && n.id === delId)).map((n) => (n.id === pinId ? { ...n, pinned: !n.pinned } : n));
      persistNotices(local);
      toast(delId ? "공지를 삭제했습니다." : "고정 상태를 바꿨습니다.");
      showTab("notices");
    });
  };

  // ════════════════════════════════════════════════════
  //  탭 3. 수강생 명단
  // ════════════════════════════════════════════════════
  const parseRoster = (text) => text.split(/\r?\n/).map((line) => line.split(/\t|,/).map((s) => s.trim().replace(/^"|"$/g, "")))
    .filter((c) => c[0] && /\d/.test(c[0]) && !/학번/.test(c[0]))
    .map((c) => ({ id: c[0], name: c[1] || "", email: c[2] || "", memo: c[3] || "" }));

  const tabRoster = async (body) => {
    const data = await loadData(body);
    if (!data) return;
    let roster = clone(data.roster);
    const render = () => {
      body.innerHTML = `
        ${toolbar(`수강생 명단 (${roster.length}명)`, `
          <button class="btn btn-ghost btn-sm" type="button" data-act="csv">CSV 내려받기</button>
          <button class="btn btn-primary btn-sm" type="button" data-act="save">명단 저장</button>`)}
        <p class="ap-help">명단을 저장하면 <b>명단에 있는 학번·이름으로만</b> 로그인·출석·과제 제출을 할 수 있습니다. 명단이 비어 있으면 누구나 이용할 수 있습니다.
          ${isLocal ? "<br>체험 모드에서는 명단이 이 브라우저에만 저장됩니다." : `<br>명단은 Google 시트의 '명단' 탭에 저장되며, 공개되는 ${DEPLOY} 에는 들어가지 않습니다.`}</p>
        <div class="ap-card">
          <div class="field">
            <label for="roster-paste">엑셀에서 복사해 붙여 넣기 (학번, 이름, 이메일, 메모 순서 · 한 줄에 한 명)</label>
            <textarea id="roster-paste" rows="4" placeholder="2025123456	홍길동	hong@korea.ac.kr"></textarea>
          </div>
          <div class="ap-row-actions">
            <button class="btn btn-ghost btn-sm" type="button" data-act="paste">명단에 추가</button>
            <label class="btn btn-ghost btn-sm file-btn">CSV 파일 불러오기<input type="file" accept=".csv,.txt" data-act="file" hidden></label>
          </div>
          <p class="field-error" id="roster-err" role="alert"></p>
        </div>
        ${tableHTML(["학번", "이름", "이메일", "메모", ""], roster.map((s, i) => [
          esc(s.id), esc(s.name), esc(s.email), esc(s.memo),
          `<button class="link-btn danger" type="button" data-remove="${i}" aria-label="${esc(s.name)} 삭제">삭제</button>`,
        ]))}`;
    };
    const addMany = (list) => {
      if (!list.length) { $("#roster-err").textContent = "읽을 수 있는 줄이 없습니다. 첫 칸에 학번이 있어야 합니다."; return; }
      list.forEach((s) => {
        const i = roster.findIndex((r) => r.id === s.id);
        if (i >= 0) roster[i] = s; else roster.push(s);
      });
      render();
      toast(`${list.length}명을 명단에 넣었습니다. '명단 저장'을 눌러 주세요.`);
    };
    body.addEventListener("click", async (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      const rm = e.target.closest("[data-remove]")?.dataset.remove;
      if (rm != null) { roster.splice(Number(rm), 1); render(); return; }
      if (act === "paste") addMany(parseRoster($("#roster-paste").value));
      if (act === "csv") download("수강생명단.csv", toCSV([["학번", "이름", "이메일", "메모"], ...roster.map((s) => [s.id, s.name, s.email, s.memo])]));
      if (act === "save") {
        const btn = e.target.closest("button");
        btn.disabled = true;
        btn.textContent = "저장 중…";
        try {
          await db.saveRoster(pw(), roster);
          cache.roster = clone(roster);
          toast(`명단 ${roster.length}명을 저장했습니다.`);
        } catch (err) { alert(`명단을 저장하지 못했습니다: ${err.message}`); }
        btn.disabled = false;
        btn.textContent = "명단 저장";
      }
    });
    body.addEventListener("change", async (e) => {
      if (e.target.dataset.act !== "file" || !e.target.files[0]) return;
      addMany(parseRoster(await e.target.files[0].text()));
    });
    render();
  };

  // ════════════════════════════════════════════════════
  //  탭 4. 출석
  // ════════════════════════════════════════════════════
  const studentsOf = (data, records) => {
    const map = new Map(data.roster.map((s) => [s.id, { id: s.id, name: s.name }]));
    records.forEach((r) => { if (!map.has(r.id)) map.set(r.id, { id: r.id, name: r.name || "" }); });
    return [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
  };
  const refreshBtn = `<button class="btn btn-ghost btn-sm" type="button" data-act="refresh">새로고침</button>`;
  const bindRefresh = (body) => body.querySelector('[data-act="refresh"]')?.addEventListener("click", async () => {
    if (await loadData(body, true)) showTab(current);
  });

  const tabAttendance = async (body) => {
    const data = await loadData(body);
    if (!data) return;
    const now = new Date();
    const students = studentsOf(data, data.attendance);
    const rec = new Map(data.attendance.map((a) => [`${a.id}:${a.week}`, a]));
    const ended = weeks.filter((w) => w.end < now);
    const cell = (s, w) => {
      const a = rec.get(`${s.id}:${w.no}`);
      if (a) return a.late ? ["지각", "late"] : ["출석", "ok"];
      return w.end < now ? ["결석", "no"] : ["", "future"];
    };
    const rate = (s) => {
      if (!ended.length) return "-";
      const n = ended.filter((w) => rec.has(`${s.id}:${w.no}`)).length;
      return `${Math.round((n / ended.length) * 100)}%`;
    };
    const head = ["학번", "이름", ...weeks.map((w) => `${w.no}주`), "출석률"];
    const rows = students.map((s) => [
      esc(s.id), esc(s.name),
      ...weeks.map((w) => { const [t, c] = cell(s, w); return `<span class="att-cell ${c}" title="${w.no}주차 ${fmtDate(w.date)}">${t ? t.charAt(0) : "·"}</span>`; }),
      `<b>${rate(s)}</b>`,
    ]);
    const perWeek = weeks.map((w) => data.attendance.filter((a) => a.week === w.no).length);
    body.innerHTML = `
      ${toolbar(`출석부 (${students.length}명)`, `
        ${refreshBtn}
        <button class="btn btn-ghost btn-sm" type="button" data-act="log">출석 기록 CSV</button>
        <button class="btn btn-primary btn-sm" type="button" data-act="sheet">출석부 내려받기</button>`)}
      <p class="ap-help">출 = 출석 · 지 = 지각 · 결 = 결석 · 점(·) = 아직 수업 전. 출석률은 지난 수업 ${ended.length}회 기준(지각 포함)입니다.</p>
      ${tableHTML(head, rows, { cls: "att-table" })}
      <p class="ap-help">주차별 출석 인원: ${weeks.map((w, i) => `${w.no}주 ${perWeek[i]}`).join(" · ")}</p>`;
    bindRefresh(body);
    body.querySelector('[data-act="sheet"]').addEventListener("click", () => download(`출석부_${today()}.csv`, toCSV([
      ["학번", "이름", ...weeks.map((w) => `${w.no}주차(${w.date.getMonth() + 1}/${w.date.getDate()})`), "출석률"],
      ...students.map((s) => [s.id, s.name, ...weeks.map((w) => cell(s, w)[0]), rate(s)]),
    ])));
    body.querySelector('[data-act="log"]').addEventListener("click", () => download(`출석기록_${today()}.csv`, toCSV([
      ["시각", "학번", "이름", "주차", "상태"],
      ...data.attendance.sort((a, b) => a.at - b.at).map((a) => [fmtTime(a.at), a.id, a.name, a.week, a.late ? "지각" : "출석"]),
    ])));
  };

  // ════════════════════════════════════════════════════
  //  탭 5. 과제
  // ════════════════════════════════════════════════════
  const tabSubmissions = async (body) => {
    const data = await loadData(body);
    if (!data) return;
    const tasks = weeks.filter((w) => w.assignment);
    const students = studentsOf(data, data.submissions);
    const subs = [...data.submissions].sort((a, b) => b.at - a.at);
    const summary = tasks.map((w) => {
      const got = new Set(data.submissions.filter((s) => s.week === w.no).map((s) => s.id));
      const missing = data.roster.filter((s) => !got.has(s.id));
      return `
        <div class="ap-task">
          <strong>${w.no}주차 · ${esc(w.assignment.title)}</strong>
          <span>제출 ${got.size}${data.roster.length ? ` / ${data.roster.length}명` : "명"} · 마감 ${fmtTime(w.due.getTime())}</span>
          ${data.roster.length && missing.length ? `<small>미제출: ${missing.map((s) => esc(s.name || s.id)).join(", ")}</small>` : ""}
        </div>`;
    }).join("");
    body.innerHTML = `
      ${toolbar(`과제 제출 (${subs.length}건)`, `
        ${refreshBtn}
        <button class="btn btn-ghost btn-sm" type="button" data-act="matrix">제출 현황표</button>
        <button class="btn btn-primary btn-sm" type="button" data-act="csv">제출 내역 내려받기</button>`)}
      <div class="ap-tasks">${summary}</div>
      ${tableHTML(["제출 시각", "학번", "이름", "주차", "과제", "파일", "상태"], subs.map((s) => [
        fmtTime(s.at), esc(s.id), esc(s.name), `${s.week}주`, esc(s.title),
        s.link ? `<a href="${esc(s.link)}" target="_blank" rel="noopener">${esc(s.fileName)}</a>` : esc(s.fileName),
        `<span class="badge ${s.late ? "badge-task" : "badge-ok"}">${s.late ? "지각" : "정상"}</span>`,
      ]))}
      ${isLocal ? `<p class="ap-help">체험 모드에서는 파일 이름만 기록되고 파일 자체는 저장되지 않습니다.</p>` : `<p class="ap-help">파일 이름을 누르면 Google 드라이브에서 열립니다.</p>`}`;
    bindRefresh(body);
    body.querySelector('[data-act="csv"]').addEventListener("click", () => download(`과제제출_${today()}.csv`, toCSV([
      ["제출 시각", "학번", "이름", "주차", "과제", "파일 이름", "크기(KB)", "상태", "파일 링크"],
      ...subs.map((s) => [fmtTime(s.at), s.id, s.name, s.week, s.title, s.fileName, Math.round((s.size || 0) / 1024), s.late ? "지각" : "정상", s.link]),
    ])));
    body.querySelector('[data-act="matrix"]').addEventListener("click", () => {
      const got = new Map(data.submissions.map((s) => [`${s.id}:${s.week}`, s]));
      download(`과제현황_${today()}.csv`, toCSV([
        ["학번", "이름", ...tasks.map((w) => `${w.no}주차 ${w.assignment.title}`), "제출 수"],
        ...students.map((st) => {
          const cells = tasks.map((w) => { const s = got.get(`${st.id}:${w.no}`); return s ? (s.late ? "지각" : "제출") : "미제출"; });
          return [st.id, st.name, ...cells, cells.filter((c) => c !== "미제출").length];
        }),
      ]));
    });
  };

  // ════════════════════════════════════════════════════
  //  탭 6. 수강 신청
  // ════════════════════════════════════════════════════
  const tabApplications = async (body) => {
    const data = await loadData(body);
    if (!data) return;
    const { appHead, applications } = data;
    const idCol = appHead.indexOf("학번");
    const nameCol = appHead.indexOf("이름");
    const emailCol = appHead.indexOf("이메일");
    body.innerHTML = `
      ${toolbar(`수강 신청 (${applications.length}건)`, `
        ${refreshBtn}
        ${idCol >= 0 ? `<button class="btn btn-ghost btn-sm" type="button" data-act="to-roster">신청자 전원을 명단에 추가</button>` : ""}
        <button class="btn btn-primary btn-sm" type="button" data-act="csv">신청 내역 내려받기</button>`)}
      ${tableHTML(appHead, applications.map((r) => r.map((v) => esc(v))), { cls: "app-table" })}`;
    bindRefresh(body);
    body.querySelector('[data-act="csv"]').addEventListener("click", () => download(`수강신청_${today()}.csv`, toCSV([appHead, ...applications])));
    body.querySelector('[data-act="to-roster"]')?.addEventListener("click", async () => {
      if (!applications.length) return;
      if (!confirm(`신청자 ${applications.length}명을 수강생 명단에 넣고 저장할까요? (같은 학번은 새 정보로 바뀝니다)`)) return;
      const roster = clone(data.roster);
      applications.forEach((r) => {
        const s = { id: String(r[idCol]).replace(/^'/, ""), name: nameCol >= 0 ? r[nameCol] : "", email: emailCol >= 0 ? r[emailCol] : "", memo: "신청서" };
        const i = roster.findIndex((x) => x.id === s.id);
        if (i >= 0) roster[i] = { ...roster[i], ...s }; else roster.push(s);
      });
      try {
        await db.saveRoster(pw(), roster);
        cache.roster = roster;
        toast(`명단이 ${roster.length}명이 되었습니다.`);
      } catch (err) { alert(`명단을 저장하지 못했습니다: ${err.message}`); }
    });
  };

  // ════════════════════════════════════════════════════
  //  탭 7. 설정 파일 저장 · 불러오기
  // ════════════════════════════════════════════════════
  // < 를 < 로 바꿔 두면 HTML 의 <script> 안에 그대로 넣어도 안전합니다.
  const configFileText = (cfg) => `/*
 * 사이트 설정 — 관리자 화면에서 ${new Date().toLocaleString("ko-KR")} 에 저장
 * 각 항목 설명은 README.md 를 참고하세요.
 */
window.SITE_CONFIG = ${JSON.stringify(cfg, null, 2).replace(/</g, "\\u003c")};
`;
  // 지금 페이지(한 파일 버전)의 뼈대에 새 설정을 넣어 index.html 전체를 다시 만듭니다.
  const buildBundle = (cfg) => {
    const shellText = bundleShell.textContent;
    const parts = {
      CSS: document.head.querySelector("style").textContent,
      CONFIG: configFileText(cfg),
      SHELL: shellText,
    };
    // 한 번에 바꿔야 끼워 넣은 내용 속 글자가 다시 바뀌지 않습니다.
    return JSON.parse(shellText).replace(/%%(CSS|CONFIG|SHELL|JS:[\w.-]+)%%/g, (_, key) =>
      key.startsWith("JS:") ? document.querySelector(`script[data-file="${key.slice(3)}"]`).textContent : parts[key]);
  };
  const parseConfigFile = (text) => {
    // 한 파일 버전(index.html)이면 설정이 든 <script id="site-config"> 부분만 꺼냅니다.
    const inHtml = text.match(/<script id="site-config">([\s\S]*?)<\/script>/);
    if (inHtml) text = inHtml[1];
    const body = text.replace(/^[\s\S]*?window\.SITE_CONFIG\s*=\s*/, "").replace(/;\s*$/, "").trim();
    let cfg;
    try { cfg = JSON.parse(body); } catch { throw new Error("설정 내용을 읽을 수 없습니다."); }
    if (!cfg || typeof cfg !== "object" || !cfg.site || !cfg.nav) throw new Error("사이트 설정 파일이 아닙니다.");
    return cfg;
  };

  const tabFile = (body) => {
    const overridden = Boolean(window.SITE_CONFIG_ORIGINAL);
    body.innerHTML = `
      ${toolbar("설정 파일", "")}
      <div class="ap-card">
        <h4>💾 내려받기</h4>
        ${bundleShell ? `
        <p>지금 편집 중인 내용까지 담은 <b>새 index.html</b> 을 내려받습니다.${dirty ? " <b>(적용하지 않은 편집 내용 포함)</b>" : ""}</p>
        <ul class="ap-steps">
          <li>사이트에 올려 둔 index.html 을 이 파일로 바꾸면 모든 방문자에게 반영됩니다.</li>
          <li>이 파일 하나에 사이트 전체가 들어 있으므로 그 자체로 백업이 됩니다.</li>
        </ul>
        <div class="ap-row-actions">
          <button class="btn btn-primary" type="button" data-act="download-html">index.html 내려받기</button>
          <button class="btn btn-ghost" type="button" data-act="download">설정만 내려받기 (config.js)</button>
        </div>` : `
        <p>지금 편집 중인 내용까지 포함한 <b>config.js</b> 를 내려받습니다.${dirty ? " <b>(적용하지 않은 편집 내용 포함)</b>" : ""}</p>
        <ul class="ap-steps">
          <li>백업용으로 보관했다가 아래 <b>불러오기</b>로 되살릴 수 있습니다.</li>
          <li>모든 방문자에게 반영하려면 사이트 폴더의 <code>config.js</code> 를 이 파일로 바꾸세요. (원래 파일의 설명 주석은 빠집니다)</li>
        </ul>
        <button class="btn btn-primary" type="button" data-act="download">config.js 내려받기</button>`}
      </div>
      <div class="ap-card">
        <h4>📂 불러오기</h4>
        <p>관리자 화면에서 저장한 ${bundleShell ? "index.html 또는 " : ""}config.js 파일을 불러와 편집 내용으로 가져옵니다.</p>
        <label class="btn btn-ghost file-btn">파일 선택<input type="file" accept=".js,.json,.html" data-act="load" hidden></label>
        <p class="field-error" id="file-load-err" role="alert"></p>
      </div>
      <div class="ap-card">
        <h4>👀 이 브라우저의 미리보기</h4>
        <p>${overridden ? "지금 이 브라우저는 관리자 화면에서 고친 설정으로 보이고 있습니다." : "지금은 사이트의 원래 설정이 그대로 보이고 있습니다."}</p>
        ${overridden ? `<button class="btn btn-ghost" type="button" data-act="reset">원래 설정으로 되돌리기</button>` : ""}
      </div>`;
    body.querySelector('[data-act="download"]').addEventListener("click", () => {
      download("config.js", configFileText(draft));
      toast("config.js 를 내려받았습니다.");
    });
    body.querySelector('[data-act="download-html"]')?.addEventListener("click", () => {
      download("index.html", buildBundle(draft), "text/html;charset=utf-8");
      toast("index.html 을 내려받았습니다.");
    });
    body.querySelector('[data-act="load"]').addEventListener("change", async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        draft = parseConfigFile(await f.text());
        setDirty(true);
        toast("설정을 불러왔습니다. '미리보기 적용'을 누르면 반영됩니다.");
        $("#file-load-err").textContent = "";
      } catch (err) {
        $("#file-load-err").textContent = `불러오지 못했습니다: ${err.message} 관리자 화면에서 내려받은 파일인지 확인해 주세요.`;
      }
      e.target.value = "";
    });
    body.querySelector('[data-act="reset"]')?.addEventListener("click", () => {
      if (!confirm("이 브라우저에 저장된 편집 내용을 지우고 원래 설정으로 돌아갈까요?")) return;
      try { localStorage.removeItem(OVERRIDE_KEY); } catch { /* 무시 */ }
      session.set({ ...session.get(), tab: "file", reopen: true });
      location.reload();
    });
  };

  // ════════════════════════════════════════════════════
  //  탭 8. 비밀번호
  // ════════════════════════════════════════════════════
  const tabPassword = (body) => {
    body.innerHTML = `
      ${toolbar("관리자 비밀번호 바꾸기", "")}
      <form class="ap-card pw-form" novalidate>
        <div class="field"><label for="pw-old">지금 비밀번호</label><input id="pw-old" type="password" autocomplete="current-password"></div>
        <div class="field"><label for="pw-new">새 비밀번호 (8자 이상)</label><input id="pw-new" type="password" autocomplete="new-password"></div>
        <div class="field"><label for="pw-new2">새 비밀번호 확인</label><input id="pw-new2" type="password" autocomplete="new-password"></div>
        ${isLocal ? "" : `<label class="ed-check"><input type="checkbox" id="pw-sheet" checked> Google 시트의 관리자비밀번호도 함께 바꾸기</label>`}
        <p class="field-error" id="pw-err" role="alert"></p>
        <button class="btn btn-primary" type="submit">비밀번호 바꾸기</button>
      </form>
      <p class="ap-help">비밀번호는 그대로 저장되지 않고 되돌릴 수 없는 값으로 바뀌어 ${DEPLOY} 에 들어갑니다.
        바꾼 뒤 <b>💾 설정 파일</b>에서 ${DEPLOY} 를 내려받아 사이트에 올려야 다른 기기에서도 새 비밀번호가 적용됩니다.</p>`;
    body.querySelector(".pw-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = $("#pw-err");
      const oldPw = $("#pw-old").value;
      const n1 = $("#pw-new").value;
      const n2 = $("#pw-new2").value;
      if (!(await verify(oldPw))) { err.textContent = "지금 비밀번호가 맞지 않습니다."; return; }
      if (n1.length < 8) { err.textContent = "새 비밀번호는 8자 이상으로 정해 주세요."; return; }
      if (n1 !== n2) { err.textContent = "새 비밀번호 두 칸이 서로 다릅니다."; return; }
      if (!isLocal && $("#pw-sheet").checked) {
        try { await db.changeAdminPassword(oldPw, n1); }
        catch (x) { err.textContent = `시트 비밀번호를 바꾸지 못했습니다: ${x.message}`; return; }
      }
      const admin = await makeHash(n1);
      draft.admin = admin;
      C.admin = admin;
      const base = clone(C);
      saveOverride(base);
      session.set({ ...session.get(), pw: n1 });
      err.textContent = "";
      e.target.reset();
      toast(`비밀번호를 바꿨습니다. ${DEPLOY} 를 내려받아 사이트에 올려 주세요.`);
    });
  };

  // 미리보기 적용 뒤 새로고침되면 관리자 화면을 다시 엽니다.
  const s = session.get();
  if (s?.reopen) {
    session.set({ ...s, reopen: false });
    openPanel();
  }
})();
