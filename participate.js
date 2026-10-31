/*
 * 수강생 참여 기능: 투표 · 수강 신청서 · 로그인/출석/과제 제출 · 안내 팝업 · 첫 방문 폭죽
 * 내용 수정은 config.js 에서 하세요. 이 파일은 고칠 필요가 없습니다.
 */
(function () {
  "use strict";

  const C = window.SITE_CONFIG;
  const S = window.SITE;
  if (!C || !S) return;
  const { esc, $, sectionHead, reduceMotion, weeks, dateKey, fmtDate, fmtDateTime, countdownHTML } = S;

  // ── 브라우저 저장소 (로그인 상태·내 투표·팝업 숨김 등 개인 설정) ──
  const PREFIX = "ffp:";
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(PREFIX + key);
        return v == null ? fallback : JSON.parse(v);
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; }
    },
    remove(key) {
      try { localStorage.removeItem(PREFIX + key); } catch { /* 저장소를 쓸 수 없는 환경 */ }
    },
  };
  // ── 데이터 저장 방식 ─────────────────────────────────
  // mode "local" : 이 브라우저에만 저장 (체험 모드)
  // mode "sheets": Google 시트(Apps Script 웹 앱)에 저장 → 모든 수강생의 데이터가 한곳에 모입니다
  const PC = C.participation || {};
  const sheetsUrl = PC.mode === "sheets" ? String(PC.sheetsUrl || "").trim() : "";
  if (PC.mode === "sheets" && !sheetsUrl) console.warn("config.js 의 participation.sheetsUrl 이 비어 있어 체험 모드로 동작합니다.");
  const isLocal = !sheetsUrl;
  const localNote = (text) =>
    isLocal ? `<p class="local-note">💡 체험 모드: ${esc(text)}</p>` : "";

  const remote = async (action, payload = {}, method = "POST") => {
    const res = method === "GET"
      ? await fetch(`${sheetsUrl}?${new URLSearchParams({ action, ...payload })}`)
      : await fetch(sheetsUrl, { method: "POST", body: JSON.stringify({ action, ...payload }) }); // text/plain 이라 CORS 사전 요청이 없습니다
    if (!res.ok) throw new Error(`서버 응답 오류 (${res.status})`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "요청을 처리하지 못했습니다.");
    return json;
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    r.readAsDataURL(file);
  });

  let voterId = store.get("voterId", null);
  if (!voterId) {
    voterId = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    store.set("voterId", voterId);
  }

  // 체험 모드: 관리자가 이 브라우저에 명단을 등록했다면 명단에 있는 학생만 이용할 수 있습니다.
  const checkLocalRoster = (id, name) => {
    const roster = store.get("roster", []);
    if (!roster.length) return;
    const me = roster.find((s) => s.id === String(id).trim());
    if (!me) throw new Error("수강생 명단에 없는 학번입니다. 교수자에게 문의해 주세요.");
    if (name != null && me.name !== String(name).trim()) throw new Error("학번과 이름이 명단과 일치하지 않습니다.");
  };

  const columnLabel = (f) => f.sheetLabel || (f.type === "agree" ? "개인정보 동의" : f.label.replace(/\s*\(.*\)\s*$/, ""));

  // 투표·신청서·출석·과제의 읽기/쓰기는 모두 db 를 거칩니다.
  const db = isLocal ? {
    async poll() { return store.get("poll:votes", {}); },
    async vote(option, prev) {
      const v = store.get("poll:votes", {});
      if (prev) v[prev] = Math.max(0, (v[prev] || 0) - 1);
      v[option] = (v[option] || 0) + 1;
      store.set("poll:votes", v);
      return v;
    },
    async apply(data) {
      const list = store.get("applications", []).filter((a) => a.studentId !== data.studentId);
      list.push(data);
      store.set("applications", list);
      return { at: Date.now() };
    },
    async student(id, name) {
      checkLocalRoster(id, name);
      return { attendance: store.get(`attendance:${id}`, {}), submissions: store.get(`submissions:${id}`, {}) };
    },
    async checkin({ id, name, week, lateAfterMinutes }) {
      checkLocalRoster(id, name);
      const at = new Date();
      const late = at > new Date(week.start.getTime() + (lateAfterMinutes || 0) * 6e4);
      const rec = store.get(`attendance:${id}`, {});
      rec[week.no] = { at: at.getTime(), late, name };
      store.set(`attendance:${id}`, rec);
      return { at: at.getTime(), late };
    },
    async submit({ id, name, week, file }) {
      checkLocalRoster(id, name);
      const at = Date.now();
      const late = at > week.due.getTime();
      const subs = store.get(`submissions:${id}`, {});
      subs[week.no] = { fileName: file.name, size: file.size, at, late, name, title: week.assignment.title };
      store.set(`submissions:${id}`, subs);
      return { at, late };
    },
    // ── 관리자 ──
    async notices() { return []; },
    async adminData() {
      const keys = [];
      try { for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i)); } catch { /* 저장소 없음 */ }
      const byPrefix = (p) => keys.filter((k) => k && k.startsWith(PREFIX + p)).map((k) => [k.slice((PREFIX + p).length), store.get(k.slice(PREFIX.length), {})]);
      return {
        applications: store.get("applications", []),
        attendance: byPrefix("attendance:"),
        submissions: byPrefix("submissions:"),
        roster: store.get("roster", []),
      };
    },
    async saveRoster(_pw, roster) { store.set("roster", roster); return { count: roster.length }; },
    async saveNotice() { return {}; },
    async deleteNotice() { return {}; },
    async changeAdminPassword() { return {}; },
  } : {
    async poll() { return (await remote("poll", {}, "GET")).votes; },
    async vote(option) { return (await remote("vote", { voterId, option })).votes; },
    async apply(data) {
      return remote("apply", { data, columns: (C.applyForm?.fields || []).map((f) => ({ name: f.name, label: columnLabel(f) })) });
    },
    async student(id, name) {
      const r = await remote("student", { id, name }, "GET");
      return { attendance: r.attendance || {}, submissions: r.submissions || {} };
    },
    // ── 관리자 (비밀번호는 시트 '설정' 탭의 관리자비밀번호와 비교됩니다) ──
    async notices() { return (await remote("notices", {}, "GET")).notices || []; },
    async adminData(password) { return remote("adminData", { password }); },
    async saveRoster(password, roster) { return remote("saveRoster", { password, roster }); },
    async saveNotice(password, notice) { return remote("saveNotice", { password, notice }); },
    async deleteNotice(password, id) { return remote("deleteNotice", { password, id }); },
    async changeAdminPassword(password, newPassword) { return remote("changeAdminPassword", { password, newPassword }); },
    async checkin({ id, name, week, code, openBeforeMinutes, lateAfterMinutes, alwaysOpen }) {
      return remote("checkin", {
        id, name, week: week.no, code, openBeforeMinutes, lateAfterMinutes, alwaysOpen: Boolean(alwaysOpen),
        start: week.start.getTime(), end: week.end.getTime(),
      });
    },
    async submit({ id, name, week, file, allowLate }) {
      return remote("submit", {
        id, name, week: week.no, title: week.assignment.title, due: week.due.getTime(), allowLate,
        fileName: file.name, mimeType: file.type, data: await fileToBase64(file),
      });
    },
  };

  // admin.js 에서 함께 씁니다.
  window.SITE_DATA = { db, store, isLocal, PREFIX };

  // 버튼을 잠시 '처리 중' 상태로 바꿔 두고 작업을 실행합니다.
  const busy = async (btn, text, fn) => {
    const old = btn.textContent;
    btn.disabled = true;
    btn.textContent = text;
    try { return await fn(); }
    finally { if (btn.isConnected) { btn.disabled = false; btn.textContent = old; } }
  };

  // ── 공통 도우미 ─────────────────────────────────────
  const toastEl = $("#toast");
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
  };
  window.SITE_DATA.toast = toast;

  // 받침에 따라 을/를 붙이기
  const eulreul = (word) => {
    const c = word.charCodeAt(word.length - 1);
    if (c < 0xac00 || c > 0xd7a3) return `${word}을(를)`;
    return word + ((c - 0xac00) % 28 ? "을" : "를");
  };
  const shortLabel = (label) => label.replace(/\s*\(.*\)\s*$/, "");
  const pad = (n) => String(n).padStart(2, "0");
  const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(b / 1024))}KB`);

  // ════════════════════════════════════════════════════
  //  1. 실시간 투표
  // ════════════════════════════════════════════════════
  const P = C.poll;
  if (P) {
    $("#poll").innerHTML = `
      <div class="container">
        ${sectionHead(P.heading, P.lead)}
        <div class="poll-layout">
          <form class="card poll-form" novalidate>
            <fieldset>
              <legend class="card-title">하나를 골라 주세요</legend>
              <div class="poll-options">
                ${P.options.map((o) => `
                  <label class="poll-option">
                    <input type="radio" name="poll" value="${esc(o.id)}">
                    <span class="poll-icon" aria-hidden="true">${esc(o.icon)}</span>
                    <span class="poll-label">${esc(o.label)}</span>
                  </label>`).join("")}
              </div>
            </fieldset>
            <button class="btn btn-primary poll-submit" type="submit">투표하기</button>
            <p class="form-msg" role="alert"></p>
          </form>
          <div class="card poll-result">
            <div class="poll-result-head">
              <h3 class="card-title">투표 결과</h3>
              <span class="live"><i aria-hidden="true"></i>실시간</span>
            </div>
            <ul class="bars">
              ${P.options.map((o) => `
                <li data-id="${esc(o.id)}">
                  <div class="bar-label">
                    <span>${esc(o.icon)} ${esc(o.label)}<em class="mine-tag">내 선택</em></span>
                    <b class="bar-value"></b>
                  </div>
                  <div class="bar-track"><div class="bar-fill"></div></div>
                </li>`).join("")}
            </ul>
            <p class="poll-total"></p>
            ${localNote("투표는 이 브라우저에 저장되며, 같은 브라우저의 다른 탭에는 실시간으로 반영됩니다.")}
          </div>
        </div>
      </div>`;

    const form = $(".poll-form");
    const msg = $(".form-msg", form);

    let votes = {};
    const updatePoll = () => {
      const mine = store.get("poll:mine", null);
      const total = P.options.reduce((s, o) => s + (votes[o.id] || 0), 0);
      const max = Math.max(0, ...P.options.map((o) => votes[o.id] || 0));

      document.querySelectorAll(".bars li").forEach((li) => {
        const n = votes[li.dataset.id] || 0;
        const pct = total ? Math.round((n / total) * 100) : 0;
        li.classList.toggle("mine", li.dataset.id === mine);
        li.classList.toggle("top", max > 0 && n === max);
        $(".bar-value", li).textContent = `${n}표 · ${pct}%`;
        $(".bar-fill", li).style.width = `${pct}%`;
        li.setAttribute("aria-label", `${li.querySelector(".bar-label span").firstChild.textContent.trim()} ${n}표, ${pct}퍼센트`);
      });
      $(".poll-total").textContent = total ? `총 ${total}표` : "아직 투표가 없습니다. 첫 번째로 투표해 주세요!";

      form.querySelectorAll("input").forEach((inp) => {
        if (mine && inp.value === mine) inp.checked = true;
        inp.disabled = Boolean(mine) && !P.allowChange;
      });
      const btn = $(".poll-submit", form);
      btn.textContent = mine ? (P.allowChange ? "선택 바꾸기" : "투표 완료") : "투표하기";
      btn.disabled = Boolean(mine) && !P.allowChange;
    };

    const loadPoll = async () => {
      try {
        votes = await db.poll();
        updatePoll();
      } catch (err) {
        $(".poll-total").textContent = `결과를 불러오지 못했습니다. (${err.message})`;
      }
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const picked = form.querySelector("input:checked")?.value;
      const mine = store.get("poll:mine", null);
      msg.className = "form-msg";
      if (!picked) { msg.textContent = "주제를 하나 선택해 주세요."; msg.classList.add("error"); return; }
      if (picked === mine) { msg.textContent = "이미 이 주제에 투표하셨어요."; return; }

      try {
        votes = await busy($(".poll-submit", form), "저장 중…", () => db.vote(picked, mine));
        store.set("poll:mine", picked);
        msg.textContent = "";
        updatePoll();
        toast(mine ? "선택을 바꿨습니다." : "투표해 주셔서 감사합니다!");
      } catch (err) {
        msg.textContent = `투표를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요. (${err.message})`;
        msg.classList.add("error");
        updatePoll();
      }
    });

    if (isLocal) {
      // 같은 브라우저의 다른 탭에서 투표하면 바로 반영
      window.addEventListener("storage", (e) => {
        if (e.key && e.key.startsWith(PREFIX + "poll:")) loadPoll();
      });
    } else {
      // 시트 연결 시: 화면을 보고 있는 동안 주기적으로 새 결과를 가져옵니다
      $(".poll-total").textContent = "결과를 불러오는 중…";
      setInterval(() => {
        if (document.visibilityState === "visible") loadPoll();
      }, Math.max(5, PC.pollRefreshSeconds || 15) * 1000);
    }
    updatePoll();
    loadPoll();
  }

  // ════════════════════════════════════════════════════
  //  2. 수강 신청서
  // ════════════════════════════════════════════════════
  const F = C.applyForm;
  if (F) {
    const applyEl = $("#apply");
    const fid = (f) => `f-${f.name}`;
    const autocomplete = { name: "name", email: "email", phone: "tel" };

    const fieldHTML = (f) => {
      const id = fid(f);
      const req = f.required ? `<span class="req" aria-hidden="true">*</span>` : "";
      const reqAttr = f.required ? ` aria-required="true"` : "";
      const err = `<p class="field-error" id="${id}-err"></p>`;
      const desc = ` aria-describedby="${id}-err"`;
      const ac = autocomplete[f.name] ? ` autocomplete="${autocomplete[f.name]}"` : "";

      if (f.type === "radio" || f.type === "checkboxes") {
        const t = f.type === "radio" ? "radio" : "checkbox";
        return `
          <fieldset class="field field-full" id="${id}" data-field="${f.name}" tabindex="-1"${desc}>
            <legend>${esc(f.label)}${req}</legend>
            <div class="choice-row">
              ${f.options.map((o) => `
                <label class="choice"><input type="${t}" name="${f.name}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join("")}
            </div>
            ${err}
          </fieldset>`;
      }
      if (f.type === "agree") {
        return `
          <div class="field field-full" data-field="${f.name}">
            <label class="agree"><input type="checkbox" id="${id}" name="${f.name}"${reqAttr}${desc}><span>${esc(f.label)}${req}</span></label>
            ${err}
          </div>`;
      }
      if (f.type === "select") {
        return `
          <div class="field" data-field="${f.name}">
            <label for="${id}">${esc(f.label)}${req}</label>
            <select id="${id}" name="${f.name}"${reqAttr}${desc}>
              <option value="">선택해 주세요</option>
              ${f.options.map((o) => `<option>${esc(o)}</option>`).join("")}
            </select>
            ${err}
          </div>`;
      }
      if (f.type === "textarea") {
        return `
          <div class="field field-full" data-field="${f.name}">
            <label for="${id}">${esc(f.label)}${req}</label>
            <textarea id="${id}" name="${f.name}" rows="5" placeholder="${esc(f.placeholder || "")}"${reqAttr}${desc}></textarea>
            <div class="field-foot">${err}<span class="counter" data-min="${f.minLength || 0}"></span></div>
          </div>`;
      }
      return `
        <div class="field" data-field="${f.name}">
          <label for="${id}">${esc(f.label)}${req}</label>
          <input id="${id}" name="${f.name}" type="${f.type === "email" || f.type === "tel" ? f.type : "text"}"
            placeholder="${esc(f.placeholder || "")}"${ac}${reqAttr}${desc}${f.type === "text" && f.pattern ? ' inputmode="numeric"' : ""}>
          ${err}
        </div>`;
    };

    const renderForm = () => {
      applyEl.innerHTML = `
        <div class="container">
          ${sectionHead(F.heading, F.lead)}
          <form class="card apply-form" novalidate>
            <div class="error-summary" tabindex="-1" role="alert" hidden></div>
            <div class="form-grid">${F.fields.map(fieldHTML).join("")}</div>
            <div class="form-actions">
              <button class="btn btn-primary btn-lg" type="submit">${esc(F.submitLabel)}</button>
            </div>
            ${localNote("신청서는 이 브라우저에만 저장되며 교수자에게 전송되지 않습니다.")}
          </form>
        </div>`;
      bindForm($(".apply-form", applyEl));
    };

    const renderSuccess = (data) => {
      const rows = F.fields
        .filter((f) => f.type !== "agree" && data[f.name] && data[f.name].length)
        .slice(0, 6)
        .map((f) => `<div><dt>${esc(shortLabel(f.label))}</dt><dd>${esc([].concat(data[f.name]).join(", "))}</dd></div>`)
        .join("");
      applyEl.innerHTML = `
        <div class="container">
          ${sectionHead(F.heading)}
          <div class="card apply-success">
            <div class="success-icon" aria-hidden="true">✓</div>
            <h3>${esc(F.successTitle)}</h3>
            <p>${esc(F.successText)}</p>
            <dl class="success-summary">${rows}</dl>
            <p class="muted">접수 시각 ${esc(fmtDateTime(new Date(data._at)))}</p>
            <button class="btn btn-ghost" type="button" id="apply-again">신청서 다시 작성하기</button>
          </div>
        </div>`;
      $("#apply-again").addEventListener("click", () => {
        renderForm();
        $(".apply-form input, .apply-form select")?.focus();
      });
    };

    const valueOf = (form, f) => {
      if (f.type === "checkboxes") return [...form.querySelectorAll(`[name="${f.name}"]:checked`)].map((i) => i.value);
      if (f.type === "radio") return form.querySelector(`[name="${f.name}"]:checked`)?.value || "";
      if (f.type === "agree") return form.querySelector(`[name="${f.name}"]`).checked;
      return form.querySelector(`[name="${f.name}"]`).value.trim();
    };

    const checkField = (form, f) => {
      const v = valueOf(form, f);
      const name = shortLabel(f.label);
      if (f.type === "checkboxes") return f.required && !v.length ? `${eulreul(name)} 하나 이상 선택해 주세요.` : "";
      if (f.type === "agree") return f.required && !v ? "개인정보 수집·이용에 동의해 주세요." : "";
      if (!v) return f.required ? `${eulreul(name)} ${f.type === "select" || f.type === "radio" ? "선택" : "입력"}해 주세요.` : "";
      if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "이메일 형식이 올바르지 않습니다. (예: name@korea.ac.kr)";
      if (f.pattern && !new RegExp(f.pattern).test(v)) return f.patternMessage || `${name} 형식을 확인해 주세요.`;
      if (f.minLength && v.length < f.minLength) return `${eulreul(name)} ${f.minLength}자 이상 입력해 주세요. (지금 ${v.length}자)`;
      return "";
    };

    const showError = (form, f, message) => {
      const wrap = form.querySelector(`[data-field="${f.name}"]`);
      wrap.classList.toggle("invalid", Boolean(message));
      $(`#${fid(f)}-err`).textContent = message;
      form.querySelectorAll(`[name="${f.name}"]`).forEach((el) => {
        if (message) el.setAttribute("aria-invalid", "true");
        else el.removeAttribute("aria-invalid");
      });
    };

    const bindForm = (form) => {
      const summary = $(".error-summary", form);
      let tried = false;

      const validateAll = () => {
        const errors = [];
        F.fields.forEach((f) => {
          const m = checkField(form, f);
          showError(form, f, m);
          if (m) errors.push({ f, m });
        });
        return errors;
      };

      const renderSummary = (errors) => {
        if (!errors.length) { summary.hidden = true; return; }
        summary.hidden = false;
        summary.innerHTML = `
          <strong>빠지거나 잘못된 항목이 ${errors.length}개 있어요</strong>
          <ul>${errors.map(({ f, m }) => `<li><a href="#${fid(f)}" data-target="${fid(f)}">${esc(m)}</a></li>`).join("")}</ul>`;
      };

      summary.addEventListener("click", (e) => {
        const a = e.target.closest("a[data-target]");
        if (!a) return;
        e.preventDefault();
        const el = document.getElementById(a.dataset.target);
        const focusable = el.matches("fieldset") ? el.querySelector("input") : el;
        el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        focusable.focus({ preventScroll: true });
      });

      // 제출을 한 번 시도한 뒤에는 고칠 때마다 바로 다시 검사합니다.
      const recheck = (e) => {
        const name = e.target.name;
        const f = F.fields.find((x) => x.name === name);
        if (!f) return;
        if (f.type === "textarea") updateCounter(e.target, f);
        if (!tried) return;
        showError(form, f, checkField(form, f));
        renderSummary(F.fields.map((x) => ({ f: x, m: checkField(form, x) })).filter((x) => x.m));
      };
      form.addEventListener("input", recheck);
      form.addEventListener("change", recheck);

      const updateCounter = (ta, f) => {
        const c = ta.closest(".field").querySelector(".counter");
        const n = ta.value.trim().length;
        c.textContent = f.minLength ? `${n}자 / ${f.minLength}자 이상` : `${n}자`;
        c.classList.toggle("ok", n >= (f.minLength || 0));
      };
      F.fields.filter((f) => f.type === "textarea").forEach((f) => updateCounter(form.querySelector(`[name="${f.name}"]`), f));

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        tried = true;
        const errors = validateAll();
        renderSummary(errors);
        if (errors.length) {
          summary.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
          summary.focus({ preventScroll: true });
          return;
        }
        const data = { _at: Date.now() };
        F.fields.forEach((f) => { data[f.name] = valueOf(form, f); });
        try {
          await busy($('button[type="submit"]', form), "제출 중…", () => db.apply(data));
        } catch (err) {
          summary.hidden = false;
          summary.innerHTML = `<strong>신청서를 보내지 못했습니다</strong><ul><li>잠시 후 다시 시도해 주세요. (${esc(err.message)})</li></ul>`;
          summary.focus();
          return;
        }
        store.set("apply:last", data);
        renderSuccess(data);
        applyEl.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        toast("신청서가 접수되었습니다!");
      });
    };

    const last = store.get("apply:last", null);
    if (last) renderSuccess(last);
    else renderForm();
  }

  // ════════════════════════════════════════════════════
  //  3. 수강생 공간: 로그인 · 출석 · 과제 제출
  // ════════════════════════════════════════════════════
  const ST = C.student;
  if (ST) {
    const el = $("#student");
    const AT = ST.attendance || {};
    const UP = ST.upload || {};
    const assignments = weeks.filter((w) => w.assignment);
    const allowedExt = (UP.accept || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

    const user = () => store.get("user", null);
    let me = { attendance: {}, submissions: {} }; // 로그인한 수강생의 기록 (db.student 로 불러옴)
    const attendance = () => me.attendance;
    const submissions = () => me.submissions;

    // 기록을 불러온 뒤 대시보드를 그립니다.
    const loadDashboard = async () => {
      el.innerHTML = `
        <div class="container">
          ${sectionHead(ST.heading, ST.lead)}
          <div class="card loading-card" role="status">기록을 불러오는 중…</div>
        </div>`;
      try {
        me = await db.student(user().id, user().name);
        renderDashboard();
      } catch (err) {
        el.querySelector(".loading-card").innerHTML = `
          <p>기록을 불러오지 못했습니다. (${esc(err.message)})</p>
          <div class="loading-actions">
            <button class="btn btn-primary btn-sm" type="button" id="retry-btn">다시 시도</button>
            <button class="btn btn-ghost btn-sm" type="button" id="logout-btn">로그아웃</button>
          </div>`;
        $("#retry-btn").addEventListener("click", loadDashboard);
        $("#logout-btn").addEventListener("click", () => { store.remove("user"); renderLogin(); });
      }
    };

    // 지금 출석할 수 있는 주차
    const openWeek = () => {
      const now = new Date();
      if (AT.alwaysOpen) return weeks.find((w) => w.end >= now && !attendance()[w.no]) || null;
      return weeks.find((w) => now >= new Date(w.start - (AT.openBeforeMinutes || 0) * 6e4) && now <= w.end) || null;
    };
    const attStatus = (w, rec) => {
      if (rec) return rec.late ? { cls: "late", label: "지각" } : { cls: "present", label: "출석" };
      if (w.end < new Date()) return { cls: "absent", label: "미출석" };
      if (w.key === dateKey(new Date())) return { cls: "today", label: "오늘" };
      return { cls: "upcoming", label: "예정" };
    };

    const renderLogin = () => {
      el.innerHTML = `
        <div class="container">
          ${sectionHead(ST.heading, ST.lead)}
          <form class="card login-card" novalidate>
            <div class="login-icon" aria-hidden="true">🔐</div>
            <h3>수강생 로그인</h3>
            <div class="field">
              <label for="login-id">학번<span class="req" aria-hidden="true">*</span></label>
              <input id="login-id" name="id" inputmode="numeric" autocomplete="username" placeholder="2025123456" aria-describedby="login-id-err">
              <p class="field-error" id="login-id-err"></p>
            </div>
            <div class="field">
              <label for="login-name">이름<span class="req" aria-hidden="true">*</span></label>
              <input id="login-name" name="name" autocomplete="name" placeholder="홍길동" aria-describedby="login-name-err">
              <p class="field-error" id="login-name-err"></p>
            </div>
            <button class="btn btn-primary btn-lg" type="submit">로그인</button>
            ${localNote("학번·이름은 이 브라우저에만 저장되며, 비밀번호 확인 없이 이름표처럼 사용됩니다.")}
            ${isLocal ? "" : `<p class="local-note">ℹ️ 비밀번호 없이 학번·이름으로 기록을 구분합니다. 다른 사람의 학번으로 로그인하지 마세요.</p>`}
          </form>
        </div>`;

      const form = $(".login-card", el);
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = $("#login-id").value.trim();
        const name = $("#login-name").value.trim();
        const errs = {
          id: !id ? "학번을 입력해 주세요." : !/^\d{10}$/.test(id) ? "학번은 숫자 10자리로 입력해 주세요." : "",
          name: !name ? "이름을 입력해 주세요." : "",
        };
        Object.entries(errs).forEach(([k, m]) => {
          $(`#login-${k}-err`).textContent = m;
          $(`#login-${k}`).toggleAttribute("aria-invalid", Boolean(m));
          $(`#login-${k}`).closest(".field").classList.toggle("invalid", Boolean(m));
        });
        const firstBad = Object.keys(errs).find((k) => errs[k]);
        if (firstBad) { $(`#login-${firstBad}`).focus(); return; }
        try {
          me = await busy($('button[type="submit"]', form), "확인 중…", () => db.student(id, name));
        } catch (err) {
          $("#login-id-err").textContent = err.message;
          $("#login-id").closest(".field").classList.add("invalid");
          $("#login-id").focus();
          return;
        }
        store.set("user", { id, name });
        renderDashboard();
        toast(`${name}님, 환영합니다!`);
      });
    };

    const renderDashboard = () => {
      const u = user();
      const att = attendance();
      const subs = submissions();
      const ended = weeks.filter((w) => w.end < new Date() || att[w.no]);
      const attended = weeks.filter((w) => att[w.no]).length;
      const submitted = assignments.filter((w) => subs[w.no]).length;
      const target = openWeek();
      const now = new Date();
      const nextClass = weeks.find((w) => w.end >= now);
      const defaultTask = assignments.find((w) => w.due >= now && !subs[w.no]) || assignments.find((w) => w.due >= now) || assignments[assignments.length - 1];

      let checkin;
      if (target && att[target.no]) {
        checkin = `<p class="checkin-state done">✅ ${target.no}주차 ${att[target.no].late ? "지각" : "출석"} 처리됨 · ${hhmm(new Date(att[target.no].at))}</p>
                   <button class="btn btn-disabled btn-lg" type="button" disabled>출석 완료</button>`;
      } else if (target) {
        checkin = `<p class="checkin-state open">지금 <strong>${target.no}주차 · ${esc(target.title)}</strong> 출석을 체크할 수 있어요.</p>
                   ${AT.askCode ? `
                   <div class="field code-field">
                     <label for="att-code">출석 코드</label>
                     <input id="att-code" autocomplete="off" placeholder="수업 시간에 안내된 코드" aria-describedby="att-code-err">
                   </div>` : ""}
                   <p class="field-error" id="att-code-err"></p>
                   <button class="btn btn-primary btn-lg" type="button" id="checkin-btn" data-week="${target.no}">출석 체크하기</button>`;
      } else {
        const opensAt = nextClass ? new Date(nextClass.start - (AT.openBeforeMinutes || 0) * 6e4) : null;
        checkin = `<p class="checkin-state">지금은 출석 시간이 아닙니다.${opensAt ? `<br>다음 출석: <strong>${nextClass.no}주차 · ${fmtDate(opensAt)} ${hhmm(opensAt)}부터</strong>` : ""}</p>
                   <button class="btn btn-disabled btn-lg" type="button" disabled>출석 체크하기</button>`;
      }

      el.innerHTML = `
        <div class="container">
          ${sectionHead(ST.heading, ST.lead)}
          <div class="card student-top">
            <div class="student-who">
              <span class="student-avatar" aria-hidden="true">${esc(u.name.charAt(0))}</span>
              <div><strong>${esc(u.name)}님</strong><small>${esc(u.id)}</small></div>
            </div>
            <dl class="student-stats">
              <div><dt>출석</dt><dd>${attended}<small> / ${ended.length}회</small></dd></div>
              <div><dt>과제 제출</dt><dd>${submitted}<small> / ${assignments.length}개</small></dd></div>
            </dl>
            <button class="btn btn-ghost btn-sm" type="button" id="logout-btn">로그아웃</button>
          </div>

          <div class="student-grid">
            <div class="card">
              <h3 class="card-title">출석 체크</h3>
              <div class="checkin">${checkin}</div>
              <ol class="att-grid" aria-label="주차별 출석 현황">
                ${weeks.map((w) => {
                  const s = attStatus(w, att[w.no]);
                  return `<li class="att-${s.cls}" title="${w.no}주차 ${fmtDate(w.date)} · ${s.label}"><b>${w.no}</b><small>${s.label}</small></li>`;
                }).join("")}
              </ol>
              <ul class="cal-legend att-legend">
                <li><i class="att-present"></i>출석</li><li><i class="att-late"></i>지각</li>
                <li><i class="att-absent"></i>미출석</li><li><i class="att-upcoming"></i>예정</li>
              </ul>
            </div>

            <div class="card">
              <h3 class="card-title">과제 제출</h3>
              <form class="upload-form" novalidate>
                <div class="field">
                  <label for="task-select">과제 선택</label>
                  <select id="task-select" name="week">
                    ${assignments.map((w) => `<option value="${w.no}"${w === defaultTask ? " selected" : ""}>${w.no}주차 · ${esc(w.assignment.title)}${subs[w.no] ? " ✓" : ""}</option>`).join("")}
                  </select>
                </div>
                <div class="task-info"></div>
                <label class="dropzone" for="task-file">
                  <input type="file" id="task-file" name="file" accept="${esc(UP.accept || "")}" aria-describedby="file-err file-hint">
                  <span class="dz-icon" aria-hidden="true">📎</span>
                  <span class="dz-text"><strong>파일을 끌어다 놓거나 눌러서 선택</strong><small id="file-hint">${esc(allowedExt.join(", "))} · 최대 ${UP.maxSizeMB || 20}MB</small></span>
                </label>
                <p class="field-error" id="file-err"></p>
                <button class="btn btn-primary" type="submit">제출하기</button>
              </form>
              <ul class="sub-list">
                ${assignments.map((w) => {
                  const s = subs[w.no];
                  const state = s ? (s.late ? ["late", "지각 제출"] : ["done", "제출 완료"]) : w.due < now ? ["missed", "미제출 · 마감"] : ["todo", "미제출"];
                  return `
                    <li class="sub-${state[0]}">
                      <div><strong>${w.no}주차 · ${esc(w.assignment.title)}</strong>
                        <small>${s ? `${esc(s.fileName)} (${fmtSize(s.size)}) · ${fmtDate(new Date(s.at))} ${hhmm(new Date(s.at))}` : `마감 ${fmtDate(w.due)} ${hhmm(w.due)}`}</small>
                      </div>
                      <span class="sub-state">${state[1]}</span>
                    </li>`;
                }).join("")}
              </ul>
              ${localNote("파일 자체는 업로드되지 않고, 파일 이름과 제출 시각만 이 브라우저에 기록됩니다.")}
              ${isLocal ? "" : `<p class="local-note">ℹ️ 제출한 파일은 교수자의 Google 드라이브에 저장됩니다.</p>`}
            </div>
          </div>
        </div>`;

      $("#logout-btn").addEventListener("click", () => {
        store.remove("user");
        renderLogin();
        toast("로그아웃되었습니다.");
      });

      $("#checkin-btn")?.addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        const w = weeks.find((x) => x.no === Number(btn.dataset.week));
        const codeInput = $("#att-code");
        const errEl = $("#att-code-err");
        const code = codeInput ? codeInput.value.trim() : "";
        if (codeInput && !code) {
          errEl.textContent = "출석 코드를 입력해 주세요.";
          codeInput.setAttribute("aria-invalid", "true");
          codeInput.focus();
          return;
        }
        try {
          const r = await busy(btn, "기록 중…", () => db.checkin({
            id: user().id, name: user().name, week: w, code,
            openBeforeMinutes: AT.openBeforeMinutes, lateAfterMinutes: AT.lateAfterMinutes, alwaysOpen: AT.alwaysOpen,
          }));
          me.attendance[w.no] = { at: r.at, late: r.late };
          renderDashboard();
          toast(r.already ? `${w.no}주차는 이미 출석 처리되어 있습니다.` : `${w.no}주차 ${r.late ? "지각" : "출석"}이 기록되었습니다. (${hhmm(new Date(r.at))})`);
        } catch (err) {
          errEl.textContent = err.message;
          codeInput?.setAttribute("aria-invalid", "true");
        }
      });

      bindUpload($(".upload-form", el));
    };

    const bindUpload = (form) => {
      const select = form.week;
      const input = form.file;
      const zone = $(".dropzone", form);
      const err = $("#file-err");
      const info = $(".task-info", form);

      const showTask = () => {
        const w = weeks.find((x) => x.no === Number(select.value));
        const s = submissions()[w.no];
        info.innerHTML = `
          <p>${esc(w.assignment.description)}</p>
          <p class="task-due">마감 ${fmtDateTime(w.due)} ${countdownHTML(w.due)}</p>
          ${s ? `<p class="task-done">✓ ${fmtDate(new Date(s.at))} ${hhmm(new Date(s.at))}에 <strong>${esc(s.fileName)}</strong> 제출함 · 다시 내면 새 파일로 바뀝니다.</p>` : ""}`;
      };
      const showFile = () => {
        const f = input.files[0];
        zone.classList.toggle("has-file", Boolean(f));
        $(".dz-text strong", zone).textContent = f ? `${f.name} (${fmtSize(f.size)})` : "파일을 끌어다 놓거나 눌러서 선택";
        err.textContent = "";
        zone.classList.remove("invalid");
      };
      const setErr = (m) => {
        err.textContent = m;
        zone.classList.toggle("invalid", Boolean(m));
        input.toggleAttribute("aria-invalid", Boolean(m));
      };

      select.addEventListener("change", showTask);
      input.addEventListener("change", showFile);
      ["dragenter", "dragover"].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add("drag"); }));
      ["dragleave", "drop"].forEach((t) => zone.addEventListener(t, () => zone.classList.remove("drag")));
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) { input.files = e.dataTransfer.files; showFile(); }
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const w = weeks.find((x) => x.no === Number(select.value));
        const f = input.files[0];
        const now = new Date();
        const ext = f ? `.${f.name.split(".").pop().toLowerCase()}` : "";
        if (!f) return setErr("제출할 파일을 선택해 주세요.");
        if (allowedExt.length && !allowedExt.includes(ext)) return setErr(`${ext} 파일은 제출할 수 없습니다. (${allowedExt.join(", ")})`);
        if (f.size > (UP.maxSizeMB || 20) * 1048576) return setErr(`파일이 너무 큽니다. ${UP.maxSizeMB || 20}MB 이하로 올려 주세요. (지금 ${fmtSize(f.size)})`);
        const late = now > w.due;
        if (late && !UP.allowLate) return setErr("마감이 지나 제출할 수 없습니다.");

        const again = Boolean(submissions()[w.no]);
        let r;
        try {
          r = await busy($('button[type="submit"]', form), isLocal ? "제출 중…" : "업로드 중…", () =>
            db.submit({ id: user().id, name: user().name, week: w, file: f, allowLate: UP.allowLate !== false }));
        } catch (err) {
          return setErr(`제출하지 못했습니다. 잠시 후 다시 시도해 주세요. (${err.message})`);
        }
        me.submissions[w.no] = { fileName: f.name, size: f.size, at: r.at, late: r.late };
        renderDashboard();
        $("#task-select").value = String(w.no);
        $("#task-select").dispatchEvent(new Event("change"));
        toast(`${w.no}주차 과제를 ${again ? "다시 " : ""}제출했습니다${r.late ? " (지각 제출)" : ""}.`);
      });

      showTask();
    };

    if (user()) loadDashboard();
    else renderLogin();
  }

  // ════════════════════════════════════════════════════
  //  4. 첫 방문 폭죽 · 5. 수강 신청 안내 팝업
  // ════════════════════════════════════════════════════
  const firstVisit = !store.get("visited", false);
  store.set("visited", true);
  const W = C.welcome || {};
  const playFireworks = firstVisit && W.fireworks && !reduceMotion;

  if (firstVisit && W.message) setTimeout(() => toast(W.message), 400);
  if (playFireworks) launchFireworks();

  const PU = C.popup;
  const dialog = $("#welcome-popup");
  const HIDE_KEY = "popup:hideDate";
  if (PU && PU.enabled && dialog && typeof dialog.showModal === "function" && store.get(HIDE_KEY, "") !== dateKey(new Date())) {
    dialog.innerHTML = `
      <div class="popup-body">
        <button class="popup-x" type="button" data-close aria-label="닫기">×</button>
        <div class="popup-art" aria-hidden="true">🎓</div>
        <h2 id="popup-title">${esc(PU.title)}</h2>
        <p>${esc(PU.text)}</p>
        ${PU.points?.length ? `<ul>${PU.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
        <a class="btn btn-primary btn-lg" href="${esc(PU.button.href)}" data-close>${esc(PU.button.label)}</a>
      </div>
      <div class="popup-foot">
        <button type="button" data-hide-today>오늘 하루 보지 않기</button>
        <button type="button" data-close>닫기</button>
      </div>`;

    dialog.addEventListener("click", (e) => {
      if (e.target === dialog || e.target.closest("[data-close]")) dialog.close();
      if (e.target.closest("[data-hide-today]")) {
        store.set(HIDE_KEY, dateKey(new Date()));
        dialog.close();
        toast("오늘 하루 동안 안내 창을 띄우지 않습니다.");
      }
    });

    const delay = (PU.delaySeconds ?? 3) * 1000;
    setTimeout(() => { if (!dialog.open) dialog.showModal(); }, playFireworks ? Math.max(delay, 3800) : delay);
  }

  // 화면 전체에 잠깐 터지는 폭죽 (캔버스)
  function launchFireworks() {
    const canvas = document.createElement("canvas");
    canvas.className = "fireworks";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#3e4572", "#5a6190", "#848bb4", "#aeb4d2", "#c3c8de", "#9aa1c6", "#d9b46a"];
    const pick = () => colors[Math.floor(Math.random() * colors.length)];
    const G = 0.16;
    const rockets = [];
    const sparks = [];

    const fire = () => {
      const h = innerHeight * (0.45 + Math.random() * 0.25);
      rockets.push({
        x: innerWidth * (0.15 + Math.random() * 0.7),
        y: innerHeight,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -Math.sqrt(2 * G * h),
        color: pick(),
      });
    };
    const explode = (r) => {
      const n = 46 + Math.floor(Math.random() * 20);
      const power = 2.4 + Math.random() * 2.2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const sp = power * (0.6 + Math.random() * 0.5);
        sparks.push({
          x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 1, decay: 0.011 + Math.random() * 0.01,
          color: Math.random() < 0.75 ? r.color : pick(),
        });
      }
    };

    [0, 380, 760, 1150, 1500, 1900].forEach((t) => setTimeout(fire, t));
    const startAt = performance.now();
    let last = startAt;

    const frame = (now) => {
      const k = Math.min((now - last) / 16.67, 3);
      last = now;
      ctx.clearRect(0, 0, innerWidth, innerHeight);

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        const px = r.x, py = r.y;
        r.x += r.vx * k; r.y += r.vy * k; r.vy += G * k;
        ctx.strokeStyle = r.color; ctx.lineWidth = 2.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(px, py + 10); ctx.lineTo(r.x, r.y); ctx.stroke();
        if (r.vy >= -0.6) { explode(r); rockets.splice(i, 1); }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        const px = s.x, py = s.y;
        s.vx *= Math.pow(0.97, k); s.vy = s.vy * Math.pow(0.97, k) + 0.05 * k;
        s.x += s.vx * k; s.y += s.vy * k; s.life -= s.decay * k;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, s.life * 1.4);
        ctx.strokeStyle = s.color; ctx.lineWidth = 1.2 + s.life * 2.2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(s.x, s.y); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (now - startAt < 2200 || rockets.length || sparks.length) requestAnimationFrame(frame);
      else { window.removeEventListener("resize", resize); canvas.remove(); }
    };
    requestAnimationFrame(frame);
  }
})();
