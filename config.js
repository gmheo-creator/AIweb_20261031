/*
 * ─────────────────────────────────────────────────────────────
 *  사이트 설정 파일
 *  사이트에 보이는 모든 글·메뉴·일정은 이 파일 하나에서 고칩니다.
 *  - 따옴표("") 안의 글자만 바꾸면 됩니다.
 *  - 항목을 추가할 때는 { ... } 블록을 복사해 쉼표(,)로 이어 붙이세요.
 *  - 저장한 뒤 index.html 을 새로고침하면 바로 반영됩니다.
 *  - [예시] 라고 적힌 값은 임시 내용이니 실제 정보로 바꿔 주세요.
 *  - 내용 출처: CTL810 2026-2 강의계획서(수정본)
 * ─────────────────────────────────────────────────────────────
 */
window.SITE_CONFIG = {
  // ── 관리자 ─────────────────────────────────────────────────
  // 비밀번호 자체는 저장하지 않고, 되돌릴 수 없게 변환한 값(PBKDF2-SHA256)만 저장합니다.
  // 비밀번호는 관리자 화면 → '비밀번호' 탭에서 바꾸세요. (직접 고치지 마세요)
  // (이 파일은 공개되므로 비밀번호 글자를 여기에 적어 두지 마세요.)
  admin: {
    salt: "db23b36099b82ac77ab42440a460622f",
    iterations: 150000,
    passwordHash: "d47cdcc6c4c9b1848395585c5cef919a714f4a73fbcea6be552bd15ca9a3c881",
  },

  // ── 공지사항 (관리자 화면 → '공지' 탭에서 올리면 여기에 추가됩니다) ──
  notices: [
    {
      id: "n-2026-10-31",
      date: "2026-10-31",
      title: "11월 3일(화) 10주차 수업 안내",
      body: "10주차 주제는 '교수전략(동기설계전략 등)'입니다. 9주차 성찰노트(5)를 제출해 주세요. 강의 자료와 공지는 KU LMS에도 올라갑니다.",
      pinned: true,   // 맨 위에 고정
      popup: false,   // true 면 방문할 때 팝업 창으로도 띄웁니다
    },
  ],

  // ── 첫 화면 (강의 소개) ─────────────────────────────────────
  site: {
    title: "2026-2 예비교수자 과정",
    shortTitle: "예비교수자 과정", // 헤더 로고 옆에 보이는 짧은 이름
    subtitle: "교수·학습 이론부터 수업시연까지",
    organization: "고려대학교",
    badge: "CTL-810 · 2026학년도 2학기 · 3학점",
    description:
      "예비 교수자로서 갖추어야 할 핵심 역량을 기르고, 교육학 이론과 최신 교수·학습법·전략을 이해해 실제 강의에 적용하는 과정입니다. 자신의 전공 과목 강의계획서를 직접 작성하고 수업을 설계한 뒤, 그 강의안으로 수업을 시연합니다.",
    ctaPrimary: { label: "주차별 강의 계획", href: "#curriculum" },
    ctaSecondary: { label: "수업 일정 보기", href: "#schedule" },
  },

  // ── 첫 화면 아래 핵심 정보 4칸 ───────────────────────────────
  keyInfo: [
    { icon: "📅", label: "일정", value: "2026. 9. 1 – 12. 15", note: "16주 · 매주 화요일" },
    { icon: "⏰", label: "시간", value: "13:30 – 16:15", note: "화 4–5교시" },
    { icon: "🏫", label: "장소", value: "SK미래관 B140", note: "CTL-810-00 · 3학점" },
    { icon: "🎓", label: "수강 대상", value: "박사과정 예비 교수자", note: "대학 강의 예정자" },
  ],

  // ── 상단 메뉴 (id 는 아래 섹션 id 와 같아야 합니다) ────────────
  nav: [
    { id: "about", label: "과목 소개" },
    { id: "curriculum", label: "강의 계획" },
    { id: "schedule", label: "수업 일정" },
    { id: "enroll", label: "평가 안내" },
    { id: "student", label: "수강생 공간" },
    { id: "faq", label: "FAQ" },
    { id: "instructor", label: "교수자" },
  ],

  // ── 과목 소개: 숫자 통계 + 학습활동 슬라이드 ──────────────────
  about: {
    heading: "과목 소개",
    lead: "연구자에서 교수자로 — 배우고, 설계하고, 시연하며 교수 역량을 키웁니다.",
    // value 는 숫자만, suffix 는 숫자 뒤에 붙는 단위입니다.
    stats: [
      { value: 16, suffix: "주", label: "정규 수업" },
      { value: 3, suffix: "학점", label: "CTL-810-00" },
      { value: 10, suffix: "회", label: "성찰노트" },
      { value: 15, suffix: "분", label: "1차시 수업시연" },
    ],
    objectivesHeading: "학습목표",
    objectivesLead: "본 수업을 마친 학습자는 다음과 같은 목표를 달성할 수 있습니다.",
    objectives: [
      "교수자에게 필요한 기본 역량과 교육학 이론을 바탕으로 수업 설계 모형(ADDIE)을 적용하여 자신의 전공에 맞는 강의계획안을 효과적으로 개발할 수 있습니다.",
      "다양한 학습 목표와 학습자 특성에 적합한 교수법 및 전략을 선택하여 적용할 수 있습니다.",
      "생성형 AI 등 최신 에듀테크 도구를 수업 설계, 운영, 평가의 과정에 활용할 수 있습니다.",
      "강의계획안을 바탕으로 실제 수업을 시연하고, 동료 피드백을 바탕으로 재설계할 수 있습니다.",
      "매주 성찰 노트 작성과 전문학습공동체 활동을 통해 교수자에게 필요한 역량을 강화할 수 있습니다.",
    ],
    benefitsHeading: "이 수업의 학습활동",
    benefits: [
      { icon: "🎒", title: "Teachers as Learners", text: "모든 활동을 학습자의 입장에서 직접 경험하고 성찰하며, 교육에 대한 이해를 넓히고 나의 강의를 구체화합니다." },
      { icon: "📝", title: "Reflective Practice", text: "매주 성찰노트를 쓰며 자기성찰의 자세와 방법을 익힙니다. 전문가로서 계속 성장하는 힘의 바탕입니다." },
      { icon: "🤝", title: "Collaborative Learning", text: "협력학습으로 다양한 교수법과 교수전략을 이해하고, 실제 적용 아이디어를 넓힙니다." },
      { icon: "🗂️", title: "Learning Artifact with Peer Feedback", text: "강의계획서와 수업시연에 대한 동료 피드백을 반영해 완성도 높은 E-학습포트폴리오를 만듭니다." },
      { icon: "🌱", title: "Professional Learning Community", text: "같은 목표를 가진 예비 교수자들이 전문학습공동체(PLC)를 이루어 지식과 경험을 나눕니다." },
      { icon: "🤖", title: "생성형 AI·에듀테크 활용", text: "생성형 AI 등 최신 에듀테크 도구를 수업 설계·운영·평가에 활용하는 방법을 익힙니다." },
    ],
  },

  // ── 강의 계획 ───────────────────────────────────────────────
  curriculum: {
    heading: "강의 계획",
    lead: "16주, 네 단계를 거치며 나의 전공 강의계획서를 완성하고 수업을 시연합니다.",
    modules: [
      { phase: "1단계", weeks: "1–5주", title: "교수·학습의 기초", topics: ["교수·학습의 이해와 이론", "강의계획서 작성", "교수설계모형 개요: ADDIE"] },
      { phase: "2단계", weeks: "6–8주", title: "강의계획서 발표", topics: ["강의계획서 발표 (5분)", "동료 피드백 (5분)", "강의계획서 수정본 · 중간고사"] },
      { phase: "3단계", weeks: "9–12주", title: "교수법과 수업 설계", topics: ["혁신적 교수법 (PBL·TBL·FL 등)", "교수전략 (동기설계전략 등)", "ADDIE 분석·설계·개발·운영"] },
      { phase: "4단계", weeks: "13–16주", title: "수업시연과 성찰", topics: ["ADDIE 평가 단계", "1차시 수업시연 (15분)", "동료 피드백 (5분) · 기말과제"] },
    ],

    weeksHeading: "주차별 강의 내용 및 활동",
    weeksLead: "주차를 누르면 날짜·장소·학습 내용·과제를 볼 수 있습니다. 주제별 학습 자료(논문·영상 등)는 해당 주차에 KU LMS로 안내됩니다.",

    /*
     * 16주 강의 내용
     * - 날짜는 아래 schedule 의 시작일과 요일로 자동 계산됩니다. (휴강일은 schedule.skipDates 에)
     * - 특정 주만 날짜·시간·장소가 다르면 그 주에 date: "2026-10-20", startTime, endTime, location 을 적으세요.
     * - videos: 참고 영상 { title: "제목", url: "주소" } 목록. 없으면 [] 로 두세요.
     * - assignment: 과제가 있는 주에만 적습니다. due 는 "YYYY-MM-DD HH:MM" 형식,
     *   submitUrl 이 비어 있으면 schedule.submitUrl 을 사용합니다.
     * - [예시] 마감일은 강의계획서에 없어 '다음 수업 전날 23:59'로 임시로 정했습니다.
     */
    weeks: [
      {
        title: "오리엔테이션",
        topics: ["과목 소개와 16주 학습 흐름", "과제 및 평가 방법 안내", "생성형 AI 활용 가이드라인 안내"],
        videos: [],
      },
      {
        title: "교수·학습의 이해",
        topics: ["가르침과 배움의 의미", "예비 교수자에게 필요한 핵심 역량"],
        videos: [],
      },
      {
        title: "교수·학습 이론",
        topics: ["주요 교수·학습 이론", "이론을 나의 강의에 연결하기"],
        videos: [],
        assignment: {
          title: "성찰노트(1)",
          description: "이번 주 학습 내용에 대한 개인 성찰노트를 작성합니다. 생성형 AI를 활용했다면 'AI 활용 명세'를 함께 첨부하세요.",
          due: "2026-09-21 23:59",
        },
      },
      {
        title: "강의계획서",
        topics: ["강의계획서의 구성 요소", "나의 전공 과목 강의계획서 작성"],
        videos: [],
        assignment: {
          title: "성찰노트(2)",
          description: "이번 주 학습 내용에 대한 개인 성찰노트를 작성합니다. 생성형 AI를 활용했다면 'AI 활용 명세'를 함께 첨부하세요.",
          due: "2026-09-28 23:59",
        },
      },
      {
        title: "교수설계모형 개요: ADDIE 모형",
        topics: ["교수설계모형의 이해", "ADDIE: 분석·설계·개발·운영·평가"],
        videos: [],
        assignment: {
          title: "성찰노트(3)",
          description: "이번 주 학습 내용에 대한 개인 성찰노트를 작성합니다. 생성형 AI를 활용했다면 'AI 활용 명세'를 함께 첨부하세요.",
          due: "2026-10-05 23:59",
        },
      },
      {
        title: "★ 강의계획서 발표와 피드백 ①",
        topics: ["강의계획서 발표 (12명)", "발표 5분 + 동료 피드백 5분"],
        videos: [],
        assignment: {
          title: "성찰노트(4) · 강의계획서 수정본",
          description: "성찰노트(4)와, 발표 때 받은 동료 피드백을 반영한 강의계획서 수정본을 제출합니다.",
          due: "2026-10-12 23:59",
        },
      },
      {
        title: "★ 강의계획서 발표와 피드백 ②",
        topics: ["강의계획서 발표 (12명)", "발표 5분 + 동료 피드백 5분"],
        videos: [],
      },
      {
        title: "중간고사",
        topics: ["중간고사 기간"],
        videos: [],
      },
      {
        title: "혁신적 교수법 (PBL, TBL, FL 등)",
        topics: ["PBL (문제중심학습)", "TBL (팀기반학습)", "FL (플립러닝) 등"],
        videos: [],
        assignment: {
          title: "성찰노트(5)",
          description: "이번 주 학습 내용에 대한 개인 성찰노트를 작성합니다. 생성형 AI를 활용했다면 'AI 활용 명세'를 함께 첨부하세요.",
          due: "2026-11-02 23:59",
        },
      },
      {
        title: "교수전략 (동기설계전략 등)",
        topics: ["학습 동기를 높이는 동기설계전략", "학습 목표와 학습자 특성에 맞는 교수전략 선택"],
        videos: [],
        assignment: {
          title: "성찰노트(6)",
          description: "이번 주 학습 내용에 대한 개인 성찰노트를 작성합니다. 생성형 AI를 활용했다면 'AI 활용 명세'를 함께 첨부하세요.",
          due: "2026-11-09 23:59",
        },
      },
      {
        title: "ADDIE 모형의 단계 (분석/설계)",
        topics: ["분석: 학습자·환경·과제 분석", "설계: 학습 목표와 수업 구조 설계"],
        videos: [],
        assignment: {
          title: "성찰노트(7)",
          description: "이번 주 학습 내용에 대한 개인 성찰노트를 작성합니다. 생성형 AI를 활용했다면 'AI 활용 명세'를 함께 첨부하세요.",
          due: "2026-11-16 23:59",
        },
      },
      {
        title: "ADDIE 모형의 단계 (개발/운영)",
        topics: ["개발: 수업 자료와 활동 만들기", "운영: 수업 실행과 관리"],
        videos: [],
        assignment: {
          title: "성찰노트(8)",
          description: "이번 주 학습 내용에 대한 개인 성찰노트를 작성합니다. 생성형 AI를 활용했다면 'AI 활용 명세'를 함께 첨부하세요.",
          due: "2026-11-23 23:59",
        },
      },
      {
        title: "ADDIE 모형의 단계 (평가) · ★ 수업시연 ①",
        topics: ["평가: 수업 평가와 개선", "수업시연 (3명)", "발표 15분 + 동료 피드백 5분"],
        videos: [],
        assignment: {
          title: "성찰노트(9)",
          description: "이번 주 학습 내용에 대한 개인 성찰노트를 작성합니다. 생성형 AI를 활용했다면 'AI 활용 명세'를 함께 첨부하세요.",
          due: "2026-11-30 23:59",
        },
      },
      {
        title: "★ 수업시연 ②",
        topics: ["수업시연 (7명)", "발표 15분 + 동료 피드백 5분"],
        videos: [],
        assignment: {
          title: "성찰노트(10) · 수업시연 발표 자료",
          description: "성찰노트(10)와 1차시 수업시연(도입/전개/정리) 발표 자료를 제출합니다.",
          due: "2026-12-07 23:59",
        },
      },
      {
        title: "★ 수업시연 ③",
        topics: ["수업시연 (7명)", "발표 15분 + 동료 피드백 5분"],
        videos: [],
      },
      {
        title: "★ 수업시연 ④",
        topics: ["수업시연 (7명)", "발표 15분 + 동료 피드백 5분", "한 학기 돌아보기"],
        videos: [],
        assignment: {
          title: "기말과제",
          description: "한 학기 동안의 학습 내용에 대한 리포트를 작성해 제출합니다.",
          due: "2026-12-21 23:59", // [예시] 강의계획서에 마감일이 없어 임시로 정했습니다
        },
      },
    ],
  },

  // ── 수업 일정 (주차별 날짜와 월간 달력이 이 값으로 자동 계산됩니다) ──
  schedule: {
    heading: "수업 일정",
    lead: "날짜를 누르면 그날의 수업 내용을 볼 수 있습니다.",
    startDate: "2026-09-01",   // 1주차 날짜 (이 날 이후 첫 수업 요일부터 계산)
    weekday: 2,                // 수업 요일: 0=일 1=월 2=화 3=수 4=목 5=금 6=토
    startTime: "13:30",
    endTime: "16:15",
    location: "SK미래관 B140", // 기본 수업 장소
    skipDates: [],             // 휴강일 예: ["2026-10-06"] → 그 주는 건너뛰고 다음 주로 밀립니다
    submitUrl: "",             // 과제 제출 주소(KU LMS 등). 비워 두면 '제출 링크 준비 중'으로 표시됩니다
  },

  // ── 생성형 AI 활용 가이드라인 ────────────────────────────────
  tools: {
    heading: "생성형 AI 활용 가이드라인",
    lead: "에듀테크 리터러시를 기르기 위해 생성형 AI(ChatGPT, Gemini, Claude 등)의 활용을 부분적으로 허용합니다. 학문적 윤리와 교수자로서의 전문성을 지키기 위해 아래 가이드라인을 꼭 지켜 주세요.",
    items: [
      { icon: "✅", name: "허용 범위", category: "활용 목적", text: "강의 주제 브레인스토밍, 수업 구성안·교안 초안 작성 지원, 강의 자료 시각화, 에듀테크 아이디어 구상 등에 보조 도구로 활용할 수 있습니다." },
      { icon: "🏷️", name: "AI 활용 명세", category: "출처 명시 · 투명성", text: "AI를 활용한 과제·결과물 하단에 ① 사용 도구 이름 ② 주요 프롬프트 ③ 활용 목적과 반영·수정 방법을 반드시 적습니다." },
      { icon: "🔒", name: "개인정보 보호", category: "보안 유의", text: "타인의 개인정보, 비공개 대학 데이터, 미공개 연구 자료와 지적 재산에 해당하는 내용을 프롬프트로 입력하지 않습니다." },
      { icon: "©️", name: "저작권과 윤리", category: "윤리 준수", text: "AI가 만든 이미지·텍스트·코드의 저작권과 사용 권한을 확인하고, 타인의 저작권 침해나 부적절한 콘텐츠 생성을 하지 않습니다." },
      { icon: "🔍", name: "비판적 검토", category: "검증", text: "AI 결과물에는 부정확한 정보(할루시네이션)나 편향이 있을 수 있습니다. 그대로 복사해 제출하는 것은 엄격히 금지되며, 사실·학문적 정확성·교육적 적합성을 검증하고 수정해야 합니다." },
      { icon: "⚖️", name: "최종 책임", category: "책임", text: "제출한 최종 결과물에 대한 모든 학문적·윤리적·교육적 책임은 학습자 본인에게 있습니다." },
    ],
  },

  // ── 평가 안내 (교재·준비물 + 과제 및 평가) ─────────────────────
  enroll: {
    heading: "교재 및 평가 안내",
    lead: "수업 자료와 공지는 KU LMS로 안내되며, 다섯 가지 항목으로 평가합니다.",
    prepHeading: "교재 및 참고자료",
    prep: [
      { icon: "📚", title: "교재", text: "강의 자료 외에 별도의 교재는 없습니다." },
      { icon: "🖥️", title: "KU LMS", text: "강의 자료와 각종 공지사항은 KU LMS를 통해 안내됩니다." },
      { icon: "📄", title: "주차별 학습 자료", text: "주제에 따라 관련 논문·영상 등 학습 자료를 해당 주차에 안내합니다." },
      { icon: "🎯", title: "나의 전공 과목", text: "강의계획서와 수업시연에 쓸, 앞으로 가르칠 전공 과목을 하나 정해 두세요." },
    ],
    stepsHeading: "과제 및 평가",
    steps: [
      { title: "출석 및 참여도 20%", text: "출석과 수업 참여 정도" },
      { title: "성찰노트 20%", text: "매주 학습 내용에 대한 개인 성찰노트 작성" },
      { title: "강의계획서 20%", text: "강의계획서 발표 및 수정본 제출" },
      { title: "수업시연 30%", text: "1차시 수업 시연 (도입 / 전개 / 정리)" },
      { title: "기말과제 10%", text: "한 학기 동안의 학습 내용에 대한 리포트 작성" },
    ],
    applyButton: { label: "수강생 정보 작성하기", href: "#apply", note: "발표 순서와 PLC 구성을 위해 아래 정보를 작성해 주세요." },
  },

  /*
   * ─────────────────────────────────────────────────────────────
   *  수강생 참여 기능 (투표 · 신청서 · 로그인/출석/과제 제출 · 팝업 · 폭죽)
   *
   *  ※ 저장 방식
   *    mode "local" : 서버 없이 '이 브라우저'에만 저장합니다. (체험 모드)
   *    mode "sheets": Google 시트에 저장해 모든 수강생의 투표·신청서·출석·과제를 한곳에 모읍니다.
   *                   google-apps-script/설치안내.md 를 따라 웹 앱을 배포한 뒤,
   *                   받은 주소(https://script.google.com/macros/s/.../exec)를 sheetsUrl 에 붙여 넣으세요.
   *    로그인은 두 방식 모두 비밀번호 없이 학번·이름으로 구분합니다.
   * ─────────────────────────────────────────────────────────────
   */
  participation: {
    mode: "local",            // Google 시트 연결 후 "sheets" 로 바꾸세요
    sheetsUrl: "",            // Apps Script 웹 앱 주소
    pollRefreshSeconds: 15,   // 시트 연결 시 투표 결과를 새로 가져오는 간격(초)
  },

  // ── 실시간 투표 ─────────────────────────────────────────────
  poll: {
    heading: "가장 기대되는 학습 주제는?",
    lead: "투표 결과는 수업 운영과 활동 구성에 참고합니다.",
    allowChange: true, // 투표 후 다시 고를 수 있게 할지
    options: [
      { id: "theory", icon: "📖", label: "교수·학습 이론" },
      { id: "syllabus", icon: "🧭", label: "강의계획서 작성" },
      { id: "addie", icon: "🧩", label: "ADDIE 모형으로 수업 설계" },
      { id: "methods", icon: "💡", label: "혁신적 교수법 (PBL·TBL·FL)" },
      { id: "strategy", icon: "🔥", label: "동기설계 등 교수전략" },
      { id: "demo", icon: "🎤", label: "수업시연과 동료 피드백" },
    ],
  },

  // ── 수강생 정보 (신청서) ─────────────────────────────────────
  // type: text / email / tel / select / radio / checkboxes / textarea / agree
  // required: true 면 빠졌을 때 알려 줍니다. pattern·minLength 로 형식도 검사합니다.
  applyForm: {
    heading: "수강생 정보",
    lead: "* 표시는 필수 항목입니다. 발표 순서 배정과 전문학습공동체(PLC) 구성에 참고합니다.",
    submitLabel: "제출하기",
    successTitle: "제출되었습니다",
    successText: "수업 관련 안내는 KU LMS와 입력하신 이메일로 드릴게요.",
    fields: [
      { name: "name", label: "이름", type: "text", required: true, placeholder: "홍길동" },
      { name: "studentId", label: "학번", type: "text", required: true, placeholder: "2025123456", pattern: "^\\d{10}$", patternMessage: "학번은 숫자 10자리로 입력해 주세요." },
      { name: "department", label: "소속 학과", type: "text", required: true, placeholder: "교육학과" },
      { name: "degree", label: "과정", type: "select", required: true, options: ["박사 과정", "석박사 통합 과정", "박사 수료", "기타"] },
      { name: "course", label: "강의 예정(희망) 전공 과목", type: "text", required: true, placeholder: "예: 교육공학개론" },
      { name: "email", label: "이메일", type: "email", required: true, placeholder: "name@korea.ac.kr" },
      { name: "phone", label: "연락처", type: "tel", required: true, placeholder: "010-1234-5678", pattern: "^01[0-9]-?\\d{3,4}-?\\d{4}$", patternMessage: "연락처를 010-1234-5678 형식으로 입력해 주세요." },
      { name: "experience", label: "강의·조교 경험", type: "radio", required: true, options: ["없음", "TA(조교) 경험 있음", "강의 경험 있음"] },
      { name: "tools", label: "써 본 생성형 AI 도구 (여러 개 선택)", type: "checkboxes", required: false, options: ["ChatGPT", "Gemini", "Claude", "NotebookLM", "기타", "아직 없음"] },
      { name: "motivation", label: "이 수업에서 기대하는 점", type: "textarea", required: true, minLength: 30, placeholder: "이 수업에서 기대하는 점을 30자 이상 적어 주세요." },
      { name: "agree", label: "개인정보 수집·이용에 동의합니다. (수업 운영 목적, 학기 종료 후 파기)", type: "agree", required: true },
    ],
  },

  // ── 수강생 공간: 로그인 · 출석 · 과제 제출 ─────────────────────
  student: {
    heading: "수강생 공간",
    lead: "학번과 이름으로 로그인하고 출석 체크와 과제 제출을 하세요.",
    attendance: {
      openBeforeMinutes: 30,  // 수업 시작 몇 분 전부터 출석 가능
      lateAfterMinutes: 10,   // 시작 후 몇 분이 지나면 '지각'
      alwaysOpen: false,      // 테스트용: true 면 수업 시간이 아니어도 가장 가까운 주차에 출석할 수 있습니다
      askCode: false,         // true 면 출석 코드 입력칸이 나옵니다. 코드는 Google 시트의 '설정' 탭에 적습니다 (시트 연결 시에만 확인)
    },
    upload: {
      accept: ".pdf,.doc,.docx,.hwp,.hwpx,.ppt,.pptx,.zip,.mp4",
      maxSizeMB: 20,          // 시트 연결 시 Google 쪽 한도 때문에 30MB 이하를 권장합니다
      allowLate: true,        // 마감 후에도 '지각 제출'로 받을지
    },
  },

  // ── 첫 방문 안내 팝업 ────────────────────────────────────────
  popup: {
    enabled: false,                       // true 로 바꾸면 다시 나타납니다
    delaySeconds: 3,
    title: "2026-2 예비교수자 과정 (CTL810)",
    text: "교수·학습 이론을 배우고, 나의 전공 강의계획서를 작성해 수업을 시연하는 16주 과정입니다.",
    points: ["📅 매주 화요일 13:30 – 16:15", "🏫 SK미래관 B140", "🎓 대학 강의 예정인 박사과정 예비 교수자"],
    button: { label: "강의 계획 보기", href: "#curriculum" },
  },

  // ── 첫 방문 폭죽 ────────────────────────────────────────────
  welcome: {
    fireworks: true,
    message: "처음 오신 것을 환영합니다!",
  },

  // ── 자주 묻는 질문 ───────────────────────────────────────────
  faq: {
    heading: "자주 묻는 질문",
    items: [
      { q: "누가 수강하나요?", a: "대학 강의를 앞둔 박사과정 예비 교수자를 대상으로 합니다." },
      { q: "교재가 따로 있나요?", a: "강의 자료 외에 별도의 교재는 없습니다. 강의 자료와 공지사항은 KU LMS로 안내되며, 주제별 논문·영상 자료는 해당 주차에 안내합니다." },
      { q: "평가는 어떻게 하나요?", a: "출석 및 참여도 20%, 성찰노트 20%, 강의계획서 20%, 수업시연 30%, 기말과제 10%로 평가합니다." },
      { q: "강의계획서 발표는 어떻게 진행되나요?", a: "6·7주차에 주마다 12명씩, 발표 5분과 동료 피드백 5분으로 진행합니다. 피드백을 반영한 수정본도 제출합니다." },
      { q: "수업시연은 어떻게 진행되나요?", a: "13–16주차에 1차시 수업(도입/전개/정리)을 시연합니다. 발표 15분과 동료 피드백 5분으로 진행하며, 13주차 3명, 14–16주차 주마다 7명입니다." },
      { q: "과제에 생성형 AI를 써도 되나요?", a: "부분적으로 허용합니다. 브레인스토밍·초안 작성 지원·자료 시각화 등에 보조 도구로 쓸 수 있으며, 활용했다면 과제 하단에 'AI 활용 명세'(사용 도구, 주요 프롬프트, 활용 목적과 반영 방법)를 꼭 첨부해야 합니다. AI 결과물을 그대로 복사해 제출하는 것은 금지됩니다." },
    ],
  },

  // ── 교수자 (페이지 맨 아래 푸터에 표시) ───────────────────────
  instructor: {
    heading: "교수자 소개",
    // 사진: images 폴더에 사진 파일을 넣고 파일 이름을 적으세요. 비워 두면 이름 첫 글자가 보입니다.
    photo: "images/instructor.svg",
    photoAlt: "펼친 책 위로 떠오르는 아이디어 전구 — 교수학습 그림", // 실제 사진으로 바꾸면 지워도 됩니다
    name: "허경미",
    title: "연구교수",
    affiliation: "고려대학교 학부대학 교수학습지원센터",
    // 영문 이름·직함·소속 (한 줄씩). 비워 두면 표시되지 않습니다.
    nameEn: "Gyeong Mi HEO, Ph.D.",
    affiliationEn: [
      "Research Professor",
      "Center for Teaching & Learning",
      "University College, Korea University",
    ],
    bio: "",
    career: [],
    contacts: [
      { icon: "✉️", label: "E-mail", value: "gmheo@korea.ac.kr", href: "mailto:gmheo@korea.ac.kr" },
    ],
  },

  // ── 맨 아래 한 줄 ───────────────────────────────────────────
  footer: {
    address: "서울특별시 성북구 안암로 145 고려대학교",
    copyright: "Copyright 2026 ⓒ AI WEB, All Rights Reserved. | 허경미(교수학습지원센터)",
  },
};
