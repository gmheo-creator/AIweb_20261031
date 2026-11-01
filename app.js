/*
 * config.js 의 내용을 읽어 화면을 그립니다.
 * 내용 수정은 config.js 에서 하세요. 이 파일은 고칠 필요가 없습니다.
 */
(function () {
  "use strict";

  // 관리자 화면에서 고친 설정이 이 브라우저에 미리보기로 저장되어 있으면 그것을 씁니다.
  try {
    const saved = localStorage.getItem("ffp:configOverride");
    if (saved) {
      window.SITE_CONFIG_ORIGINAL = window.SITE_CONFIG;
      window.SITE_CONFIG = JSON.parse(saved);
    }
  } catch { /* 저장소를 쓸 수 없거나 내용이 깨진 경우 원래 설정을 씁니다 */ }

  const C = window.SITE_CONFIG;
  if (!C) {
    document.body.insertAdjacentHTML("afterbegin", "<p style='padding:16px'>config.js 를 불러오지 못했습니다.</p>");
    return;
  }

  // 설정 값에 들어간 글자를 안전하게 HTML 로 바꿉니다.
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const get = (path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), C);
  const $ = (sel, root = document) => root.querySelector(sel);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const sectionHead = (heading, lead) =>
    `<div class="section-head"><h2>${esc(heading)}</h2>${lead ? `<p>${esc(lead)}</p>` : ""}</div>`;

  // ── 단순 텍스트 바인딩 ─────────────────────────────
  document.title = `${C.site.title} | ${C.site.organization}`;
  document.querySelectorAll("[data-bind]").forEach((el) => {
    el.textContent = get(el.dataset.bind) ?? "";
  });

  // ── 메뉴 ──────────────────────────────────────────
  const nav = $("#site-nav");
  nav.innerHTML = C.nav.map((n) => `<a href="#${esc(n.id)}" data-id="${esc(n.id)}">${esc(n.label)}</a>`).join("");

  // ── 첫 화면 버튼 ───────────────────────────────────
  $("#hero-actions").innerHTML = [
    C.site.ctaPrimary && `<a class="btn btn-primary btn-lg" href="${esc(C.site.ctaPrimary.href)}">${esc(C.site.ctaPrimary.label)}</a>`,
    C.site.ctaSecondary && `<a class="btn btn-ghost btn-lg" href="${esc(C.site.ctaSecondary.href)}">${esc(C.site.ctaSecondary.label)}</a>`,
  ].filter(Boolean).join("");

  // ── 핵심 정보 4칸 ──────────────────────────────────
  $("#key-info").innerHTML = `
    <dl class="key-info-grid">
      ${C.keyInfo.map((k) => `
        <div class="key-item">
          <span class="key-icon" aria-hidden="true">${esc(k.icon)}</span>
          <div>
            <dt>${esc(k.label)}</dt>
            <dd><strong>${esc(k.value)}</strong>${k.note ? `<small>${esc(k.note)}</small>` : ""}</dd>
          </div>
        </div>`).join("")}
    </dl>`;

  // ── 프로그램 소개: 통계 + 장점 슬라이드 ─────────────────
  const A = C.about;
  $("#about").innerHTML = `
    <div class="container">
      ${sectionHead(A.heading, A.lead)}
      <div class="grid grid-4 stats">
        ${A.stats.map((s) => `
          <div class="card stat">
            <strong><span class="count" data-to="${Number(s.value) || 0}">${esc(s.value)}</span>${esc(s.suffix)}</strong>
            <span>${esc(s.label)}</span>
          </div>`).join("")}
      </div>

      ${A.objectives && A.objectives.length ? `
        <div class="objectives">
          <h3>${esc(A.objectivesHeading || "학습목표")}</h3>
          ${A.objectivesLead ? `<p class="objectives-lead">${esc(A.objectivesLead)}</p>` : ""}
          <ol class="card objectives-list">
            ${A.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}
          </ol>
        </div>` : ""}

      <div class="slider" aria-roledescription="carousel" aria-label="${esc(A.benefitsHeading)}">
        <div class="slider-head">
          <h3>${esc(A.benefitsHeading)}</h3>
          <div class="slider-controls">
            <button class="slider-btn" type="button" data-dir="-1" aria-label="이전 장점">‹</button>
            <button class="slider-btn" type="button" data-dir="1" aria-label="다음 장점">›</button>
          </div>
        </div>
        <div class="slider-track" tabindex="0">
          ${A.benefits.map((b, i) => `
            <article class="card slide" aria-roledescription="slide" aria-label="${i + 1} / ${A.benefits.length}">
              <div class="highlight-icon" aria-hidden="true">${esc(b.icon)}</div>
              <h4>${esc(b.title)}</h4>
              <p>${esc(b.text)}</p>
            </article>`).join("")}
        </div>
        <div class="slider-dots" role="group" aria-label="슬라이드 선택"></div>
      </div>
    </div>`;

  // ── 날짜 계산 도우미 ────────────────────────────────
  const DAY_NAMES = "일월화수목금토";
  const pad = (n) => String(n).padStart(2, "0");
  const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const parseDateTime = (s) => {
    const [ds, ts = "00:00"] = s.trim().split(/\s+/);
    const d = parseDate(ds);
    const [h, mi] = ts.split(":").map(Number);
    d.setHours(h, mi);
    return d;
  };
  const withTime = (d, t) => { const r = new Date(d); const [h, mi] = t.split(":").map(Number); r.setHours(h, mi, 0, 0); return r; };
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const fmtDate = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_NAMES[d.getDay()]})`;
  const fmtDateTime = (d) => `${d.getFullYear()}년 ${fmtDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const dayDiff = (a, b) => Math.round((parseDate(dateKey(b)) - parseDate(dateKey(a))) / 864e5);

  // ── 주차별 날짜 자동 계산 ──────────────────────────────
  const K = C.curriculum;
  const S = C.schedule;
  const skip = new Set(S.skipDates || []);
  let cursor = parseDate(S.startDate);
  while (cursor.getDay() !== S.weekday) cursor = addDays(cursor, 1);

  const weeks = K.weeks.map((w, i) => {
    if (w.date) cursor = parseDate(w.date);
    else while (skip.has(dateKey(cursor))) cursor = addDays(cursor, 7);
    const date = cursor;
    cursor = addDays(cursor, 7);
    const startTime = w.startTime || S.startTime;
    const endTime = w.endTime || S.endTime;
    return {
      ...w,
      no: i + 1,
      date,
      key: dateKey(date),
      time: `${startTime} – ${endTime}`,
      start: withTime(date, startTime),
      end: withTime(date, endTime),
      location: w.location || S.location,
      due: w.assignment ? parseDateTime(w.assignment.due) : null,
    };
  });

  const now = new Date();
  const nextWeek = weeks.find((w) => w.end >= now);
  const weekStatus = (w) => {
    if (w.key === dateKey(now)) return { cls: "today", label: "오늘 수업" };
    if (w.end < now) return { cls: "past", label: "지난 수업" };
    if (w === nextWeek) return { cls: "next", label: "다음 수업" };
    return null;
  };

  // 마감까지 남은 시간
  const countdown = (due) => {
    const ms = due - Date.now();
    if (ms <= 0) return { cls: "closed", dday: "마감", text: "마감되었습니다" };
    const d = Math.floor(ms / 864e5);
    const h = Math.floor((ms % 864e5) / 36e5);
    const m = Math.floor((ms % 36e5) / 6e4);
    const days = dayDiff(new Date(), due);
    return {
      cls: ms < 864e5 ? "urgent" : ms < 3 * 864e5 ? "soon" : "open",
      dday: days === 0 ? "D-DAY" : `D-${days}`,
      text: d > 0 ? `${d}일 ${h}시간 남음` : h > 0 ? `${h}시간 ${m}분 남음` : `${Math.max(m, 1)}분 남음`,
    };
  };
  const countdownHTML = (due) => {
    const c = countdown(due);
    return `<span class="countdown ${c.cls}" data-due="${due.getTime()}"><b>${c.dday}</b><span>${c.text}</span></span>`;
  };
  const updateCountdowns = () => {
    document.querySelectorAll(".countdown[data-due]").forEach((el) => {
      const due = new Date(Number(el.dataset.due));
      const c = countdown(due);
      el.className = `countdown ${c.cls}`;
      el.innerHTML = `<b>${c.dday}</b><span>${c.text}</span>`;
      const btn = el.closest(".assignment")?.querySelector(".submit-btn");
      if (btn && c.cls === "closed" && !btn.classList.contains("closed")) {
        btn.outerHTML = `<span class="btn btn-disabled submit-btn closed" aria-disabled="true">제출 마감</span>`;
      }
    });
  };

  const submitButton = (w) => {
    const url = w.assignment.submitUrl || S.submitUrl;
    if (w.due < now) return `<span class="btn btn-disabled submit-btn closed" aria-disabled="true">제출 마감</span>`;
    if (!url) return `<span class="btn btn-disabled submit-btn" aria-disabled="true">제출 링크 준비 중</span>`;
    return `<a class="btn btn-primary submit-btn" href="${esc(url)}" target="_blank" rel="noopener">과제 제출하기</a>`;
  };

  // ── 커리큘럼: 단계 요약 + 주차별 펼쳐 보기 ────────────────
  $("#curriculum").innerHTML = `
    <div class="container">
      ${sectionHead(K.heading, K.lead)}
      <div class="grid grid-4">
        ${K.modules.map((m) => `
          <article class="card">
            <div class="module-top">
              <span class="chip">${esc(m.phase)}</span>
              <span class="chip chip-soft">${esc(m.weeks)}</span>
            </div>
            <h3>${esc(m.title)}</h3>
            <ul class="topic-list">${m.topics.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          </article>`).join("")}
      </div>

      <div class="weeks-head">
        <div>
          <h3>${esc(K.weeksHeading)}</h3>
          <p>${esc(K.weeksLead)}</p>
        </div>
        <button class="btn btn-ghost btn-sm" type="button" id="toggle-all-weeks">모두 펼치기</button>
      </div>
      <div class="week-list">
        ${weeks.map((w) => {
          const st = weekStatus(w);
          return `
          <details class="card week${st ? ` is-${st.cls}` : ""}" id="week-${w.no}">
            <summary>
              <span class="week-no">${w.no}<small>주차</small></span>
              <span class="week-main">
                <span class="week-date">${fmtDate(w.date)}</span>
                <strong>${esc(w.title)}</strong>
              </span>
              <span class="week-badges">
                ${st ? `<span class="badge badge-${st.cls}">${st.label}</span>` : ""}
                ${w.assignment ? `<span class="badge badge-task">📝 과제</span>` : ""}
              </span>
            </summary>
            <div class="week-body">
              <dl class="week-meta">
                <div><dt>📅 날짜</dt><dd>${w.date.getFullYear()}년 ${fmtDate(w.date)}</dd></div>
                <div><dt>⏰ 시간</dt><dd>${esc(w.time)}</dd></div>
                <div><dt>📍 장소</dt><dd>${esc(w.location)}</dd></div>
              </dl>
              <div class="week-cols">
                <div>
                  <h4>학습 내용</h4>
                  <ul class="topic-list">${w.topics.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
                </div>
                <div>
                  <h4>참고 영상</h4>
                  ${w.videos?.length
                    ? `<ul class="video-list">${w.videos.map((v) => `
                        <li><a href="${esc(v.url)}" target="_blank" rel="noopener"><span class="play" aria-hidden="true">▶</span>${esc(v.title)}</a></li>`).join("")}</ul>`
                    : `<p class="muted">이번 주는 참고 영상이 없습니다.</p>`}
                </div>
              </div>
              ${w.assignment ? `
              <div class="assignment">
                <div class="assignment-top">
                  <h4>📝 과제 · ${esc(w.assignment.title)}</h4>
                  ${countdownHTML(w.due)}
                </div>
                <p>${esc(w.assignment.description)}</p>
                <div class="assignment-foot">
                  <span class="due">마감 <time datetime="${w.due.toISOString()}">${fmtDateTime(w.due)}</time></span>
                  ${submitButton(w)}
                </div>
              </div>` : ""}
            </div>
          </details>`;
        }).join("")}
      </div>
    </div>`;

  // 다음 수업 주차를 처음부터 펼쳐 둡니다.
  const firstOpen = weeks.find((w) => w.key === dateKey(now)) || nextWeek;
  if (firstOpen) $(`#week-${firstOpen.no}`).open = true;

  const weekEls = [...document.querySelectorAll(".week")];
  const toggleAll = $("#toggle-all-weeks");
  const syncToggleAll = () => {
    toggleAll.textContent = weekEls.every((d) => d.open) ? "모두 접기" : "모두 펼치기";
  };
  toggleAll.addEventListener("click", () => {
    const open = !weekEls.every((d) => d.open);
    weekEls.forEach((d) => { d.open = open; });
    syncToggleAll();
  });
  weekEls.forEach((d) => d.addEventListener("toggle", syncToggleAll));
  syncToggleAll();

  const openWeek = (no) => {
    const el = $(`#week-${no}`);
    el.open = true;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    el.querySelector("summary").focus({ preventScroll: true });
  };

  // ── 수업 일정: 월간 달력 ────────────────────────────
  const classByKey = new Map(weeks.map((w) => [w.key, w]));
  const dueByKey = new Map();
  weeks.filter((w) => w.due).forEach((w) => {
    const k = dateKey(w.due);
    dueByKey.set(k, [...(dueByKey.get(k) || []), w]);
  });

  $("#schedule").innerHTML = `
    <div class="container">
      ${sectionHead(S.heading, S.lead)}
      <div class="calendar-layout">
        <div class="card calendar">
          <div class="cal-head">
            <button class="cal-nav" type="button" data-move="-1" aria-label="이전 달">‹</button>
            <h3 class="cal-title" aria-live="polite"></h3>
            <button class="cal-nav" type="button" data-move="1" aria-label="다음 달">›</button>
          </div>
          <div class="cal-grid cal-weekdays" aria-hidden="true">
            ${[...DAY_NAMES].map((d) => `<span>${d}</span>`).join("")}
          </div>
          <div class="cal-grid cal-days"></div>
          <div class="cal-foot">
            <ul class="cal-legend">
              <li><i class="lg-class"></i>수업일</li>
              <li><i class="lg-due"></i>과제 마감</li>
              <li><i class="lg-today"></i>오늘</li>
            </ul>
            <button class="btn btn-ghost btn-sm" type="button" id="cal-today">오늘</button>
          </div>
        </div>
        <div class="card day-panel" aria-live="polite"></div>
      </div>
    </div>`;

  const first = weeks[0].date;
  const last = weeks[weeks.length - 1].date;
  const inTerm = now >= first && now <= addDays(last, 7);
  let selected = inTerm ? parseDate(dateKey(now)) : first;
  let view = new Date(selected.getFullYear(), selected.getMonth(), 1);

  const calDays = $(".cal-days");
  const renderCalendar = () => {
    $(".cal-title").textContent = `${view.getFullYear()}년 ${view.getMonth() + 1}월`;
    const lead = view.getDay();
    const total = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const todayKey = dateKey(now);
    let html = Array.from({ length: lead }, () => `<span class="cal-empty"></span>`).join("");
    for (let d = 1; d <= total; d++) {
      const date = new Date(view.getFullYear(), view.getMonth(), d);
      const k = dateKey(date);
      const w = classByKey.get(k);
      const dues = dueByKey.get(k);
      const cls = [
        "cal-day",
        w && "has-class",
        dues && "has-due",
        k === todayKey && "is-today",
        k === dateKey(selected) && "is-selected",
        date.getDay() === 0 && "sun",
        date.getDay() === 6 && "sat",
      ].filter(Boolean).join(" ");
      const label = [fmtDate(date), w && `${w.no}주차 수업`, dues && "과제 마감"].filter(Boolean).join(", ");
      html += `
        <button type="button" class="${cls}" data-key="${k}" aria-label="${label}" aria-pressed="${k === dateKey(selected)}">
          <span class="num">${d}</span>
          ${w ? `<span class="cal-tag">${w.no}주차</span>` : ""}
          ${dues ? `<span class="cal-dot" aria-hidden="true"></span>` : ""}
        </button>`;
    }
    calDays.innerHTML = html;
  };

  const renderDay = () => {
    const k = dateKey(selected);
    const w = classByKey.get(k);
    const dues = dueByKey.get(k) || [];
    let html = `<p class="panel-date">${selected.getFullYear()}년 ${fmtDate(selected)}</p>`;
    if (w) {
      const st = weekStatus(w);
      html += `
        <div class="panel-week">
          <div class="panel-badges">
            <span class="chip">${w.no}주차</span>
            ${st ? `<span class="badge badge-${st.cls}">${st.label}</span>` : ""}
          </div>
          <h3>${esc(w.title)}</h3>
          <dl class="panel-meta">
            <div><dt>⏰</dt><dd>${esc(w.time)}</dd></div>
            <div><dt>📍</dt><dd>${esc(w.location)}</dd></div>
          </dl>
          <ul class="topic-list">${w.topics.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          ${w.assignment ? `<p class="panel-task">📝 과제: ${esc(w.assignment.title)} · 마감 ${fmtDate(w.due)}</p>` : ""}
          <button class="btn btn-primary btn-sm" type="button" data-open-week="${w.no}">주차 내용 자세히 보기</button>
        </div>`;
    }
    dues.forEach((dw) => {
      html += `
        <div class="panel-due">
          <strong>⏳ 과제 마감 · ${esc(dw.assignment.title)}</strong>
          <p>${pad(dw.due.getHours())}:${pad(dw.due.getMinutes())}까지 · ${countdownHTML(dw.due)}</p>
          <button class="link-btn" type="button" data-open-week="${dw.no}">${dw.no}주차 과제 보기 →</button>
        </div>`;
    });
    if (!w && !dues.length) {
      const upcoming = weeks.find((x) => x.date > selected);
      html += `
        <div class="panel-empty">
          <span aria-hidden="true">📅</span>
          <p>이날은 수업이 없습니다.</p>
          ${upcoming ? `<button class="link-btn" type="button" data-jump="${upcoming.key}">다음 수업: ${upcoming.no}주차 · ${fmtDate(upcoming.date)} →</button>` : ""}
        </div>`;
    }
    $(".day-panel").innerHTML = html;
  };

  const selectDate = (d) => {
    selected = d;
    if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) {
      view = new Date(d.getFullYear(), d.getMonth(), 1);
    }
    renderCalendar();
    renderDay();
  };

  calDays.addEventListener("click", (e) => {
    const b = e.target.closest(".cal-day");
    if (b) selectDate(parseDate(b.dataset.key));
  });
  document.querySelectorAll(".cal-nav").forEach((b) =>
    b.addEventListener("click", () => {
      view = new Date(view.getFullYear(), view.getMonth() + Number(b.dataset.move), 1);
      renderCalendar();
    })
  );
  $("#cal-today").addEventListener("click", () => selectDate(parseDate(dateKey(new Date()))));
  $(".day-panel").addEventListener("click", (e) => {
    const open = e.target.closest("[data-open-week]");
    if (open) openWeek(open.dataset.openWeek);
    const jump = e.target.closest("[data-jump]");
    if (jump) selectDate(parseDate(jump.dataset.jump));
  });

  renderCalendar();
  renderDay();
  setInterval(updateCountdowns, 30000);

  // ── 실습 AI 도구 ──────────────────────────────────
  const T = C.tools;
  $("#tools").innerHTML = `
    <div class="container">
      ${sectionHead(T.heading, T.lead)}
      <div class="grid grid-3">
        ${T.items.map((t) => `
          <article class="card tool">
            <div class="tool-top">
              <span class="tool-icon" aria-hidden="true">${esc(t.icon)}</span>
              <div>
                <h3>${esc(t.name)}</h3>
                <span class="chip chip-soft">${esc(t.category)}</span>
              </div>
            </div>
            <p>${esc(t.text)}</p>
          </article>`).join("")}
      </div>
    </div>`;

  // ── 수강 안내: 준비물 + 신청 절차 ───────────────────────
  const E = C.enroll;
  $("#enroll").innerHTML = `
    <div class="container">
      ${sectionHead(E.heading, E.lead)}
      <div class="enroll-layout">
        <div class="card">
          <h3 class="card-title">${esc(E.prepHeading)}</h3>
          <ul class="prep-list">
            ${E.prep.map((p) => `
              <li>
                <span class="prep-icon" aria-hidden="true">${esc(p.icon)}</span>
                <div><strong>${esc(p.title)}</strong><p>${esc(p.text)}</p></div>
              </li>`).join("")}
          </ul>
        </div>
        <div class="card">
          <h3 class="card-title">${esc(E.stepsHeading)}</h3>
          <ol class="steps">
            ${E.steps.map((s) => `<li><strong>${esc(s.title)}</strong><p>${esc(s.text)}</p></li>`).join("")}
          </ol>
          ${E.applyButton ? `
          <div class="apply">
            <a class="btn btn-primary" href="${esc(E.applyButton.href)}">${esc(E.applyButton.label)}</a>
            ${E.applyButton.note ? `<small>${esc(E.applyButton.note)}</small>` : ""}
          </div>` : ""}
        </div>
      </div>
    </div>`;

  // ── FAQ ──────────────────────────────────────────
  const F = C.faq;
  $("#faq").innerHTML = `
    <div class="container">
      ${sectionHead(F.heading, F.lead)}
      <div class="faq-list">
        ${F.items.map((f) => `
          <details class="card faq-item">
            <summary><span>${esc(f.q)}</span></summary>
            <div class="answer">${esc(f.a)}</div>
          </details>`).join("")}
      </div>
    </div>`;

  // ── 푸터: 교수자 소개 ──────────────────────────────
  const P = C.instructor;
  const Ft = C.footer;
  $("#instructor").innerHTML = `
    <div class="container">
      <div class="footer-card">
        <div class="photo-wrap">
          ${P.photo ? `<img class="photo" src="${esc(P.photo)}" alt="${esc(P.photoAlt || `${P.name} ${P.title} 사진`)}">` : ""}
          <div class="photo photo-fallback" aria-hidden="true"${P.photo ? " hidden" : ""}>${esc(P.name.charAt(0))}</div>
        </div>
        <div class="footer-body">
          <p class="footer-kicker">${esc(P.heading)}</p>
          <h2>${esc(P.name)} <span>${esc(P.title)}</span></h2>
          <p class="affiliation">${esc(P.affiliation)}</p>
          ${P.nameEn || P.affiliationEn?.length ? `
            <p class="name-en">${P.nameEn ? `<strong>${esc(P.nameEn)}</strong>` : ""}${(P.affiliationEn || []).map((l) => `<span>${esc(l)}</span>`).join("")}</p>` : ""}
          ${P.bio ? `<p class="bio">${esc(P.bio)}</p>` : ""}
          ${P.career?.length ? `<ul class="career">${P.career.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
        </div>
        <ul class="contacts">
          ${P.contacts.map((c) => `
            <li>
              <span class="contact-icon" aria-hidden="true">${esc(c.icon)}</span>
              <div>
                <small>${esc(c.label)}</small>
                ${c.href ? `<a href="${esc(c.href)}">${esc(c.value)}</a>` : `<span>${esc(c.value)}</span>`}
              </div>
            </li>`).join("")}
        </ul>
      </div>
      <div class="footer-bottom">
        <span>${esc(Ft.address)}</span>
        <span>${esc(Ft.copyright)}</span>
      </div>
    </div>`;

  // 사진 파일이 없으면 이름 첫 글자로 대신 보여줍니다.
  const photo = $("#instructor img.photo");
  if (photo) {
    photo.addEventListener("error", () => {
      photo.remove();
      $("#instructor .photo-fallback").hidden = false;
    });
  }

  // ── 모바일 메뉴 열고 닫기 ──────────────────────────
  const toggle = $(".menu-toggle");
  const setMenu = (open) => {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  };
  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".site-header")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // ── 스크롤: 헤더 그림자, 맨 위로 버튼 ────────────────
  const header = $(".site-header");
  const toTop = $(".to-top");
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 8);
    toTop.classList.toggle("show", y > 500);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  // ── 현재 보고 있는 섹션의 메뉴 강조 ──────────────────
  const links = [...nav.querySelectorAll("a")];
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          links.forEach((a) => a.classList.toggle("active", a.dataset.id === en.target.id));
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  C.nav.forEach((n) => { const s = document.getElementById(n.id); if (s) sectionObserver.observe(s); });
  // 페이지 맨 끝(푸터)에 닿으면 마지막 메뉴를 강조합니다.
  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      links.forEach((a, i) => a.classList.toggle("active", i === links.length - 1));
    }
  }, { passive: true });

  // ── 통계 숫자 올라가는 효과 ─────────────────────────
  const counters = document.querySelectorAll(".count");
  const countUp = (el) => {
    const to = Number(el.dataset.to);
    if (reduceMotion || !to) { el.textContent = to; return; }
    const start = performance.now();
    const dur = 1200;
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { countUp(en.target); countObserver.unobserve(en.target); }
    });
  }, { threshold: 0.6 });
  counters.forEach((el) => { el.textContent = "0"; countObserver.observe(el); });

  // ── 장점 슬라이드 ──────────────────────────────────
  const track = $(".slider-track");
  const slides = [...track.children];
  const dotsWrap = $(".slider-dots");
  dotsWrap.innerHTML = slides.map((_, i) => `<button type="button" aria-label="${i + 1}번 슬라이드"></button>`).join("");
  const dots = [...dotsWrap.children];

  const step = () => slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth;
  const current = () => Math.round(track.scrollLeft / step());
  const goTo = (i) => {
    const max = track.scrollWidth - track.clientWidth;
    track.scrollTo({ left: Math.max(0, Math.min(i * step(), max)), behavior: reduceMotion ? "auto" : "smooth" });
  };
  const updateSlider = () => {
    const max = track.scrollWidth - track.clientWidth;
    const i = track.scrollLeft >= max - 4 ? slides.length - 1 : current();
    // 한 화면에 여러 장이 보일 때는 보이는 범위의 점을 모두 켭니다.
    const visible = Math.max(1, Math.round(track.clientWidth / step()));
    const first = Math.min(i, slides.length - visible);
    dots.forEach((d, k) => {
      const on = k >= first && k < first + visible;
      d.classList.toggle("active", on);
      d.setAttribute("aria-current", on ? "true" : "false");
    });
    $('.slider-btn[data-dir="-1"]').disabled = track.scrollLeft <= 4;
    $('.slider-btn[data-dir="1"]').disabled = track.scrollLeft >= max - 4;
  };

  document.querySelectorAll(".slider-btn").forEach((b) =>
    b.addEventListener("click", () => goTo(current() + Number(b.dataset.dir)))
  );
  dots.forEach((d, i) => d.addEventListener("click", () => goTo(i)));
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(current() + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current() - 1); }
  });
  let raf;
  track.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(updateSlider); }, { passive: true });
  window.addEventListener("resize", updateSlider);
  updateSlider();

  // participate.js 에서 함께 쓰는 값과 도우미
  window.SITE = { esc, $, sectionHead, reduceMotion, weeks, dateKey, parseDate, withTime, fmtDate, fmtDateTime, countdownHTML };
})();
