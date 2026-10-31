/*
 * ─────────────────────────────────────────────────────────────
 *  사이트 설정 파일
 *  사이트에 보이는 모든 글·메뉴·일정은 이 파일 하나에서 고칩니다.
 *  - 따옴표("") 안의 글자만 바꾸면 됩니다.
 *  - 항목을 추가할 때는 { ... } 블록을 복사해 쉼표(,)로 이어 붙이세요.
 *  - 저장한 뒤 index.html 을 새로고침하면 바로 반영됩니다.
 *  - [예시] 라고 적힌 값은 임시 내용이니 실제 정보로 바꿔 주세요.
 * ─────────────────────────────────────────────────────────────
 */
window.SITE_CONFIG = {
  // ── 관리자 ─────────────────────────────────────────────────
  // 비밀번호 자체는 저장하지 않고, 되돌릴 수 없게 변환한 값(PBKDF2-SHA256)만 저장합니다.
  // 비밀번호는 관리자 화면 → '비밀번호' 탭에서 바꾸세요. (직접 고치지 마세요)
  // 처음 비밀번호: sakura2026!  ← 사이트를 공개하기 전에 꼭 바꾸세요.
  admin: {
    salt: "65d7be8c368f4ebcc09ad40c975c3797",
    iterations: 150000,
    passwordHash: "c5fbeab2fb0395801c8b6200bb125ced9b19634c57bf308aa83bdd58a89dd5d0",
  },

  // ── 공지사항 (관리자 화면 → '공지' 탭에서 올리면 여기에 추가됩니다) ──
  notices: [
    {
      id: "n-2026-10-31",
      date: "2026-10-31",
      title: "11월 3일(화) 10주차 수업 안내",
      body: "10주차에는 루브릭 실습이 있습니다. 9주차 활동지 과제(11월 2일 마감)를 꼭 제출하고 노트북을 지참해 주세요.",
      pinned: true,
    },
  ],

  // ── 첫 화면 (강의 소개) ─────────────────────────────────────
  site: {
    title: "2026-2 예비교수자 과정",
    shortTitle: "예비교수자 과정", // 헤더 로고 옆에 보이는 짧은 이름
    subtitle: "AI 기반 교수 역량 강화",
    organization: "고려대학교",
    badge: "고려대학교 대학원 · 2026학년도 2학기",
    description:
      "생성형 AI 시대, 대학 강의실은 빠르게 바뀌고 있습니다. 이 과정은 대학원생이 AI 도구를 활용해 수업을 설계하고, 운영하고, 평가하는 방법을 직접 실습하며 미래의 교수자로서 필요한 역량을 갖추도록 돕습니다.",
    ctaPrimary: { label: "수강 신청", href: "#apply" },
    ctaSecondary: { label: "커리큘럼 보기", href: "#curriculum" },
  },

  // ── 첫 화면 아래 핵심 정보 4칸 ───────────────────────────────
  keyInfo: [
    { icon: "📅", label: "일정", value: "2026. 9. 1 – 12. 8", note: "15주 · 매주 화요일" },
    { icon: "⏰", label: "시간", value: "14:00 – 16:50", note: "3시간 연속 수업" },
    { icon: "💻", label: "수업 방식", value: "대면 + 실습", note: "노트북 지참 실습형" },
    { icon: "🎓", label: "수강 대상", value: "대학원생", note: "석·박사 과정 및 수료생" },
  ],

  // ── 상단 메뉴 (id 는 아래 섹션 id 와 같아야 합니다) ────────────
  nav: [
    { id: "about", label: "프로그램 소개" },
    { id: "curriculum", label: "커리큘럼" },
    { id: "schedule", label: "수업 일정" },
    { id: "enroll", label: "수강 신청" },
    { id: "student", label: "수강생 공간" },
    { id: "faq", label: "FAQ" },
    { id: "instructor", label: "교수자" },
  ],

  // ── 프로그램 소개: 숫자 통계 + 장점 슬라이드 ──────────────────
  about: {
    heading: "프로그램 소개",
    lead: "연구자에서 교수자로, AI와 함께 한 걸음 먼저 준비합니다.",
    // value 는 숫자만, suffix 는 숫자 뒤에 붙는 단위입니다.
    stats: [
      { value: 15, suffix: "주", label: "정규 과정" },
      { value: 8, suffix: "개", label: "실습 AI 도구" },        // [예시]
      { value: 6, suffix: "권", label: "교수자 저술" },          // [예시]
      { value: 20, suffix: "년+", label: "교수자 강의 경력" },   // [예시]
    ],
    benefitsHeading: "이 강의의 장점",
    benefits: [
      { icon: "🛠️", title: "실습 중심 수업", text: "매주 AI 도구로 수업 자료를 직접 만들고, 동료와 바로 공유하며 피드백을 받습니다." },
      { icon: "🤖", title: "AI 활용 수업 설계", text: "생성형 AI로 학습 목표·강의계획서·활동지를 설계하는 전 과정을 단계별로 익힙니다." },
      { icon: "🎤", title: "모의 강의 코칭", text: "15분 모의 강의를 촬영하고, 교수자와 동료의 구체적인 피드백으로 전달력을 다듬습니다." },
      { icon: "⚖️", title: "AI 윤리와 평가", text: "AI 시대의 학업 윤리, 과제 설계, 공정한 평가 기준을 사례 중심으로 다룹니다." },
      { icon: "📁", title: "티칭 포트폴리오", text: "강의계획서·수업 자료·성찰 노트를 모아 임용 지원에 활용할 포트폴리오를 완성합니다." },
      { icon: "🤝", title: "전공 간 네트워크", text: "다양한 전공의 대학원생과 함께 배우며 서로의 수업 아이디어를 나눕니다." },
    ],
  },

  // ── 커리큘럼 ────────────────────────────────────────────────
  curriculum: {
    heading: "커리큘럼",
    lead: "15주, 네 단계를 거치며 AI를 활용한 한 과목의 수업을 완성합니다.",
    modules: [
      { phase: "1단계", weeks: "1–3주", title: "가르침의 기초", topics: ["AI 시대 대학 교육과 교수자의 역할", "성인 학습자의 이해", "나의 교육 철학 정리하기"] },
      { phase: "2단계", weeks: "4–7주", title: "AI 기반 수업 설계", topics: ["학습 목표와 역설계(Backward Design)", "AI로 강의계획서·활동지 만들기", "능동 학습 활동 구성"] },
      { phase: "3단계", weeks: "8–11주", title: "수업 운영과 평가", topics: ["강의 전달 기법과 발표 코칭", "AI 시대의 과제와 루브릭 설계", "학업 윤리와 AI 사용 가이드"] },
      { phase: "4단계", weeks: "12–15주", title: "모의 강의와 성찰", topics: ["15분 모의 강의 시연", "동료·교수자 피드백", "티칭 포트폴리오 완성"] },
    ],

    weeksHeading: "주차별 강의 계획",
    weeksLead: "주차를 누르면 날짜·장소·학습 내용·참고 영상·과제를 볼 수 있습니다.",

    /*
     * 15주 강의 내용
     * - 날짜는 아래 schedule 의 시작일과 요일로 자동 계산됩니다. (휴강일은 schedule.skipDates 에)
     * - 특정 주만 날짜·시간·장소가 다르면 그 주에 date: "2026-10-20", startTime, endTime, location 을 적으세요.
     * - videos: 참고 영상 { title: "제목", url: "주소" } 목록. 없으면 [] 로 두세요.
     * - assignment: 과제가 있는 주에만 적습니다. due 는 "YYYY-MM-DD HH:MM" 형식,
     *   submitUrl 이 비어 있으면 schedule.submitUrl 을 사용합니다.
     * - [예시] 영상 링크는 유튜브 검색 결과로 연결됩니다. 실제 영상 주소로 바꿔 주세요.
     */
    weeks: [
      {
        title: "오리엔테이션: AI 시대의 대학 교육",
        topics: ["강의 소개와 15주 로드맵", "AI가 바꾸는 대학 강의실", "AI 도구 계정 만들기 실습"],
        videos: [{ title: "생성형 AI와 대학 교육의 변화", url: "https://www.youtube.com/results?search_query=생성형+AI+대학+교육" }],
      },
      {
        title: "성인 학습자의 이해",
        topics: ["대학생 학습자의 특성", "학습 동기 이론", "AI로 학습자 페르소나 만들기"],
        videos: [{ title: "성인 학습 이론(Andragogy) 개요", url: "https://www.youtube.com/results?search_query=andragogy+adult+learning+theory" }],
      },
      {
        title: "나의 교육 철학",
        topics: ["좋은 수업이란 무엇인가", "교육 철학 진술서 작성법", "동료 피드백"],
        videos: [{ title: "Teaching Philosophy Statement 작성법", url: "https://www.youtube.com/results?search_query=teaching+philosophy+statement" }],
        assignment: {
          title: "교육 철학 진술서",
          description: "나의 교육 철학을 A4 1쪽 분량으로 작성합니다. AI 도구를 활용했다면 사용한 프롬프트를 함께 첨부하세요.",
          due: "2026-09-21 23:59",
        },
      },
      {
        title: "학습 목표와 역설계",
        topics: ["Backward Design 3단계", "블룸의 교육 목표 분류", "AI로 학습 목표 다듬기"],
        videos: [{ title: "Backward Design 이해하기", url: "https://www.youtube.com/results?search_query=backward+design+understanding+by+design" }],
      },
      {
        title: "AI로 강의계획서 만들기",
        topics: ["강의계획서의 구성 요소", "Claude·ChatGPT로 초안 작성", "초안 검토와 수정 전략"],
        videos: [{ title: "AI로 강의계획서 작성하기", url: "https://www.youtube.com/results?search_query=AI+강의계획서+작성" }],
      },
      {
        title: "능동 학습 활동 설계",
        topics: ["토론·협동 학습 기법", "AI 기반 활동지 제작", "수업 활동 시연"],
        videos: [{ title: "Active Learning 전략", url: "https://www.youtube.com/results?search_query=active+learning+strategies+college" }],
        assignment: {
          title: "강의계획서 초안",
          description: "희망 과목 하나를 정해 15주 강의계획서 초안을 작성합니다. 학습 목표와 평가 계획이 연결되도록 구성하세요.",
          due: "2026-10-12 23:59",
        },
      },
      {
        title: "AI로 수업 자료 만들기",
        topics: ["NotebookLM으로 학습 가이드 만들기", "Canva AI·Gamma로 슬라이드 제작", "저작권과 출처 표기"],
        videos: [{ title: "NotebookLM 활용법", url: "https://www.youtube.com/results?search_query=NotebookLM+활용법" }],
      },
      {
        title: "강의 전달 기법",
        topics: ["목소리·시선·제스처", "설명의 구조화", "짧은 설명 시연과 코칭"],
        videos: [{ title: "효과적인 강의 전달 기법", url: "https://www.youtube.com/results?search_query=effective+lecturing+techniques" }],
      },
      {
        title: "AI 시대의 과제 설계",
        topics: ["AI를 고려한 과제 유형", "과정 중심 평가", "AI 활용 활동지 만들기"],
        videos: [{ title: "AI 시대의 과제와 평가", url: "https://www.youtube.com/results?search_query=assessment+design+generative+AI" }],
        assignment: {
          title: "AI 활용 수업 활동지",
          description: "강의계획서 중 한 차시를 골라 AI 도구를 활용한 학생 활동지를 만듭니다. 활동 목표와 진행 순서를 함께 적으세요.",
          due: "2026-11-02 23:59",
        },
      },
      {
        title: "루브릭과 피드백",
        topics: ["루브릭 설계 원리", "AI로 루브릭 초안 만들기", "효과적인 피드백 주기"],
        videos: [{ title: "루브릭 만드는 법", url: "https://www.youtube.com/results?search_query=how+to+create+a+rubric" }],
      },
      {
        title: "학업 윤리와 AI 사용 가이드",
        topics: ["AI 시대의 학업 윤리", "수업별 AI 사용 정책 만들기", "사례 토론"],
        videos: [{ title: "AI와 학업 윤리", url: "https://www.youtube.com/results?search_query=AI+academic+integrity" }],
        assignment: {
          title: "평가 루브릭과 AI 사용 정책",
          description: "앞서 만든 과제에 쓸 루브릭과, 수업에서 학생들이 지킬 AI 사용 가이드라인을 작성합니다.",
          due: "2026-11-16 23:59",
        },
      },
      {
        title: "모의 강의 준비",
        topics: ["15분 강의 설계", "리허설과 시간 관리", "촬영 방법 안내"],
        videos: [{ title: "마이크로티칭(Microteaching) 예시", url: "https://www.youtube.com/results?search_query=microteaching+example" }],
      },
      {
        title: "모의 강의 시연 ①",
        location: "교육관 마이크로티칭실 (예시)",
        topics: ["1조 모의 강의", "동료 관찰 기록", "교수자 피드백"],
        videos: [],
        assignment: {
          title: "모의 강의 영상과 성찰 노트",
          description: "자신의 15분 모의 강의 영상과, 피드백을 반영한 성찰 노트(A4 1쪽)를 제출합니다.",
          due: "2026-11-30 23:59",
        },
      },
      {
        title: "모의 강의 시연 ②",
        location: "교육관 마이크로티칭실 (예시)",
        topics: ["2조 모의 강의", "동료 관찰 기록", "교수자 피드백"],
        videos: [],
      },
      {
        title: "티칭 포트폴리오와 마무리",
        topics: ["티칭 포트폴리오 구성", "한 학기 돌아보기", "수료식"],
        videos: [{ title: "Teaching Portfolio 만들기", url: "https://www.youtube.com/results?search_query=teaching+portfolio+graduate+students" }],
        assignment: {
          title: "티칭 포트폴리오",
          description: "교육 철학, 강의계획서, 활동지, 루브릭, 성찰 노트를 하나의 포트폴리오로 묶어 제출합니다.",
          due: "2026-12-15 23:59",
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
    startTime: "14:00",
    endTime: "16:50",
    location: "교육관 000호",   // [예시] 기본 수업 장소
    skipDates: [],             // 휴강일 예: ["2026-10-06"] → 그 주는 건너뛰고 다음 주로 밀립니다
    submitUrl: "",             // [예시] 과제 제출 주소(LMS 등). 비워 두면 '제출 링크 준비 중'으로 표시됩니다
  },

  // ── 실습 AI 도구 ────────────────────────────────────────────
  tools: {
    heading: "실습에 쓰는 AI 도구",
    lead: "수업 설계부터 자료 제작, 평가까지 단계마다 알맞은 도구를 써 봅니다.",
    items: [
      { icon: "💬", name: "Claude", category: "대화형 AI", text: "강의계획서 초안, 학습 목표 다듬기, 긴 문서 요약에 활용합니다." },
      { icon: "✨", name: "ChatGPT", category: "대화형 AI", text: "수업 아이디어 발상과 퀴즈·토론 질문 생성을 실습합니다." },
      { icon: "📒", name: "NotebookLM", category: "자료 정리", text: "강의 자료를 모아 요약·학습 가이드를 만드는 방법을 익힙니다." },
      { icon: "🎨", name: "Canva AI", category: "디자인", text: "슬라이드와 수업용 시각 자료를 빠르게 디자인합니다." },
      { icon: "🔎", name: "Perplexity", category: "리서치", text: "출처가 있는 검색으로 수업 자료의 근거를 확인합니다." },
      { icon: "📝", name: "Gamma", category: "발표 자료", text: "텍스트 개요로 발표 자료 초안을 자동 생성해 봅니다." },
    ],
  },

  // ── 수강 안내 (준비물 + 신청 절차) ───────────────────────────
  enroll: {
    heading: "수강 안내",
    lead: "준비물과 신청 절차를 확인하고 함께해 주세요.",
    prepHeading: "수강 준비물",
    prep: [
      { icon: "💻", title: "노트북", text: "매 수업 실습이 있으니 충전된 노트북을 지참해 주세요." },
      { icon: "🔑", title: "AI 도구 계정", text: "첫 수업 전 Claude·ChatGPT 등 무료 계정을 만들어 두세요." },
      { icon: "📄", title: "담당(희망) 과목 자료", text: "가르치고 싶은 과목의 주제나 기존 강의 자료를 준비해 주세요." },
      { icon: "🎧", title: "이어폰", text: "모의 강의 영상 확인과 피드백 시간에 사용합니다." },
    ],
    stepsHeading: "신청 절차",
    steps: [
      { title: "지원서 제출", text: "온라인 지원서와 간단한 교육 관심 진술서를 제출합니다." },
      { title: "서류 검토", text: "전공 분포와 지원 동기를 고려해 수강생을 선발합니다." },
      { title: "결과 안내", text: "선발 결과를 개별 이메일로 안내합니다." },
      { title: "수강 신청", text: "포털에서 해당 교과목을 수강 신청하면 완료됩니다." },
    ],
    applyButton: { label: "수강 신청서 작성하기", href: "#apply", note: "아래 신청서를 작성해 제출해 주세요." },
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
    heading: "가장 먼저 배우고 싶은 주제는?",
    lead: "투표 결과는 수업 순서와 실습 비중을 정하는 데 참고합니다.",
    allowChange: true, // 투표 후 다시 고를 수 있게 할지
    options: [
      { id: "design", icon: "🧭", label: "AI로 강의계획서 설계하기" },
      { id: "materials", icon: "🎨", label: "AI로 수업 자료·슬라이드 만들기" },
      { id: "assessment", icon: "📊", label: "AI 시대의 과제와 평가" },
      { id: "ethics", icon: "⚖️", label: "학업 윤리와 AI 사용 정책" },
      { id: "delivery", icon: "🎤", label: "강의 전달력과 발표 코칭" },
    ],
  },

  // ── 수강 신청서 ─────────────────────────────────────────────
  // type: text / email / tel / select / radio / checkboxes / textarea / agree
  // required: true 면 빠졌을 때 알려 줍니다. pattern·minLength 로 형식도 검사합니다.
  applyForm: {
    heading: "수강 신청서",
    lead: "* 표시는 필수 항목입니다. 제출 후 선발 결과는 이메일로 안내드립니다.",
    submitLabel: "신청서 제출하기",
    successTitle: "신청서가 접수되었습니다",
    successText: "선발 결과는 입력하신 이메일로 안내드릴게요.",
    fields: [
      { name: "name", label: "이름", type: "text", required: true, placeholder: "홍길동" },
      { name: "studentId", label: "학번", type: "text", required: true, placeholder: "2025123456", pattern: "^\\d{10}$", patternMessage: "학번은 숫자 10자리로 입력해 주세요." },
      { name: "department", label: "소속 학과", type: "text", required: true, placeholder: "교육학과" },
      { name: "degree", label: "과정", type: "select", required: true, options: ["석사 과정", "박사 과정", "석박사 통합 과정", "수료생"] },
      { name: "email", label: "이메일", type: "email", required: true, placeholder: "name@korea.ac.kr" },
      { name: "phone", label: "연락처", type: "tel", required: true, placeholder: "010-1234-5678", pattern: "^01[0-9]-?\\d{3,4}-?\\d{4}$", patternMessage: "연락처를 010-1234-5678 형식으로 입력해 주세요." },
      { name: "experience", label: "강의·조교 경험", type: "radio", required: true, options: ["없음", "TA(조교) 경험 있음", "강의 경험 있음"] },
      { name: "tools", label: "써 본 AI 도구 (여러 개 선택)", type: "checkboxes", required: false, options: ["Claude", "ChatGPT", "NotebookLM", "Canva AI", "Perplexity", "Gamma", "아직 없음"] },
      { name: "motivation", label: "지원 동기", type: "textarea", required: true, minLength: 30, placeholder: "이 과정에서 기대하는 점을 30자 이상 적어 주세요." },
      { name: "agree", label: "개인정보 수집·이용에 동의합니다. (선발 및 안내 목적, 학기 종료 후 파기)", type: "agree", required: true },
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
    enabled: true,
    delaySeconds: 3,
    title: "2026-2 예비교수자 과정 수강생 모집",
    text: "AI로 수업을 설계하고 운영하는 15주 실습 과정입니다. 정원 30명, 지원서 검토 후 선발합니다.",
    points: ["📅 매주 화요일 14:00 – 16:50", "🎓 고려대학교 대학원생 누구나", "💸 수강료 무료"],
    button: { label: "신청서 작성하기", href: "#apply" },
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
      { q: "AI 도구를 써 본 적이 없어도 괜찮나요?", a: "네. 첫 주에 계정 만들기부터 기본 사용법까지 함께 익히므로 처음 쓰는 분도 충분히 따라올 수 있습니다." },
      { q: "유료 AI 도구 구독이 필요한가요?", a: "아니요. 모든 실습은 무료 버전으로 진행할 수 있도록 구성했습니다." },
      { q: "강의 경험이 전혀 없어도 수강할 수 있나요?", a: "네. 이 과정은 강의 경험이 없는 대학원생을 기준으로 설계되었습니다." },
      { q: "전공에 상관없이 지원할 수 있나요?", a: "인문·사회·자연·공학 등 모든 전공의 대학원생이 지원할 수 있습니다." },
      { q: "출석 기준과 수료 조건은 어떻게 되나요?", a: "전체 수업의 80% 이상 출석하고 모의 강의와 티칭 포트폴리오를 제출하면 수료증을 발급합니다." },
    ],
  },

  // ── 교수자 (페이지 맨 아래 푸터에 표시) ───────────────────────
  instructor: {
    heading: "교수자 소개",
    // 사진: images 폴더에 사진 파일을 넣고 파일 이름을 적으세요. 비워 두면 이름 첫 글자가 보입니다.
    photo: "images/instructor.jpg",
    name: "홍길동",                       // [예시]
    title: "교수",                        // [예시]
    affiliation: "고려대학교 교육학과",     // [예시]
    bio: "대학 교수법과 AI 기반 교육을 연구하며, 20년 넘게 대학과 기업에서 강의해 왔습니다. 예비 교수자들이 자신만의 수업을 자신 있게 설계하도록 돕는 일을 가장 좋아합니다.", // [예시]
    career: [                             // [예시]
      "前 교수학습개발원 원장",
      "『AI 시대의 대학 수업』 외 저서 6권",
      "우수 강의상 다수 수상",
    ],
    contacts: [
      { icon: "✉️", label: "이메일", value: "instructor@korea.ac.kr", href: "mailto:instructor@korea.ac.kr" }, // [예시]
      { icon: "🏢", label: "연구실", value: "교육관 000호", href: "" },                                          // [예시]
      { icon: "🕑", label: "면담 시간", value: "수요일 17:00 – 18:00 (사전 예약)", href: "" },                  // [예시]
    ],
  },

  // ── 맨 아래 한 줄 ───────────────────────────────────────────
  footer: {
    address: "서울특별시 성북구 안암로 145 고려대학교",
    copyright: "© 2026 고려대학교 예비교수자 과정",
  },
};
