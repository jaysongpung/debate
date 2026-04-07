/*
  One-Card Debate
  설계 근거: RESEARCH_ARCHIVE.md

  RULE 1: 찬반 선택 → 화면 확인 → 고정 (Cialdini)
  RULE 2: 상대 논증이 첫 번째 카드 (Festinger / Trench warfare)
  RULE 3: 카드 1장씩 순차 노출 (Miller)
  RULE 4: 가명 + 입장 고정 (Suler)
  RULE 5: 반박은 마찰 없이, 강요 없이 (Fogg / Brehm)
  RULE 6: 여론 집계는 제출 후 공개 (Festinger)
  RULE 7: 시스템은 판단하지 않음 (Brehm)

  설득률 설계 원칙:
  - 주장(claim)을 크고 굵게 먼저 → 상대 주장에 정면 충돌
  - 근거(evidence)는 "더보기"로 — 읽고 싶은 사람만, 하지만 반드시 보게 됨
  - 토론 후 "이 논쟁에서 상대방 의견에 설득되었습니까?" 리뷰 유도
*/

"use strict";

const SEARCH_PARAMS = new URLSearchParams(location.search);
const DEMO_MODE = SEARCH_PARAMS.get("demo") === "true";
const DEMO_RESUME = SEARCH_PARAMS.get("resume") === "true";
const DEMO_EXAMPLE_MODE = SEARCH_PARAMS.get("example") === "true";
const DEMO_TEMPLATE_MODE = SEARCH_PARAMS.get("template") === "true" || !DEMO_EXAMPLE_MODE;
const DEMO_STORAGE_KEY = [
  "one-card-debate",
  "demo",
  location.pathname || "/",
  SEARCH_PARAMS.get("debateId") || "default"
].join(":");
const UPLOAD_SLIDE_COUNT = 3;
const UPLOAD_SLIDE_MS = 2500;

// ── 랜덤 익명 닉네임 생성 ────────────────────────────────────────
const _NICK_ADJ  = ["날카로운","냉정한","논리적인","신중한","침착한","대담한","예리한","거침없는","집요한","꼼꼼한","뜨거운","차가운","빠른","조용한"];
const _NICK_NOUN = ["독수리","여우","검객","논객","철학자","탐정","전략가","변호인","비판자","관찰자","증인","사냥꾼","투사","항해사"];
const _PROFILE_EMOJI = ["🦊","🐺","🦅","🐻","🦉","🐯","🦁","🐸","🐙","🦈","🐲","🦇","🐧","🦖","🐬"];
function getProfileEmoji(alias) {
  let hash = 0;
  for (let i = 0; i < alias.length; i++) hash = ((hash << 5) - hash) + alias.charCodeAt(i);
  return _PROFILE_EMOJI[Math.abs(hash) % _PROFILE_EMOJI.length];
}
function makeNickname() {
  const a = _NICK_ADJ [Math.floor(Math.random() * _NICK_ADJ.length)];
  const n = _NICK_NOUN[Math.floor(Math.random() * _NICK_NOUN.length)];
  return a + " " + n;
}

// ── 데모 시드: 주장(claim) + 근거(evidence) 분리 ──────────────────
const DEMO_SEEDS = [
  {
    alias: "Kai",
    side: "con",
    claim: "직업 기술은 3~5년이면 구식이 된다. 대학이 길러야 할 것은 재학습 능력이지, 특정 직무 기술이 아니다.",
    evidence: "WEF 2023 보고서에 따르면 현존 직업의 44%가 2030년까지 자동화로 대체될 전망이다. 코딩 부트캠프 시장은 연 20% 성장하는 반면, 4년제 대학 IT 커리큘럼의 평균 개편 주기는 3년이다. 특정 기술보다 메타인지(스스로 학습하는 능력)가 훨씬 긴 유효기간을 가진다.",
    responses: [],
    reactions: { "👍": 4, "😡": 6, "😢": 1, "😂": 0, "👎": 2 }
  },
  {
    alias: "Seol",
    side: "con",
    claim: "대학을 직업훈련소로 만들면 교육 기준이 기업 수요가 된다. 쓸모없어 보이던 학문이 사회를 바꿔온 역사를 반복해서 목격했다.",
    evidence: "인터넷의 기반이 된 TCP/IP는 DARPA의 기초연구에서 시작됐다. CRISPR 유전자 가위는 당장의 응용이 없던 세균 면역 연구에서 나왔다. 시장이 요구하는 기술만 가르치면, 시장이 아직 상상도 못 한 기술을 만들 인재는 사라진다.",
    responses: [],
    reactions: { "👍": 2, "😡": 3, "😢": 0, "😂": 1, "👎": 4 }
  },
  {
    alias: "Dara",
    side: "pro",
    claim: "직업 연계 없는 학위는 학생에게 4년과 수천만 원의 빚만 남긴다. 현실을 외면한 순수 학문 고집은 학생을 기만하는 것이다.",
    evidence: "한국 청년 실업률 2023년 기준 7.9%, 대졸자 전공 불일치 취업 비율 48%. 미국 학자금 대출 부채는 1.7조 달러를 넘었고 절반은 10년 내 취업에 실패한 졸업생들이다. 교육의 사회적 책임은 학생이 독립적으로 살아갈 수 있도록 돕는 것이다.",
    responses: [],
    reactions: { "👍": 7, "😡": 1, "😢": 2, "😂": 0, "👎": 1 }
  },
  {
    alias: "Hoon",
    side: "pro",
    claim: "독일 FH와 한국 의대·법학전문대학원은 명확한 직업 목표로 고품질 교육을 만든다. 목적이 분명한 교육이 더 깊은 학습을 이끈다.",
    evidence: "독일 Fachhochschule 졸업생 취업률은 93%로 전통 대학의 78%를 크게 앞선다. 직업교육 연계형 고등교육 비중이 50% 이상인 핀란드·스위스가 PISA 역량 평가 상위권을 지속 차지한다. 명확한 목표는 학생의 내적 동기를 강화하고 중도탈락률을 낮춘다.",
    responses: [],
    reactions: { "👍": 5, "😡": 2, "😢": 1, "😂": 3, "👎": 0 }
  },
  {
    alias: "Mina",
    side: "con",
    claim: "직업이 바뀌는 시대일수록 대학은 한 직무보다 사고력과 글쓰기, 협업 같은 기본기를 길러야 한다.",
    evidence: "채용 공고에 자주 등장하는 역량은 문제 해결, 문서화, 커뮤니케이션처럼 직군을 가로지르는 능력이다. 기업이 입사 후 툴을 다시 가르치는 이유도 특정 기술보다 학습 속도가 더 중요하기 때문이다.",
    responses: [],
    reactions: { "👍": 3, "😡": 4, "😢": 0, "😂": 1, "👎": 1 }
  },
  {
    alias: "Jae",
    side: "pro",
    claim: "학생은 졸업 직후 생계를 책임져야 한다. 대학이 취업과 연결되지 않으면 교육 책임을 절반만 한 셈이다.",
    evidence: "전공을 살린 첫 일자리를 빨리 얻을수록 임금 회복 속도와 경력 지속성이 높다. 대학이 산업과의 연결 고리를 외면하면 결국 학생이 별도의 사교육 비용을 다시 지불하게 된다.",
    responses: [],
    reactions: { "👍": 6, "😡": 1, "😢": 2, "😂": 0, "👎": 1 }
  },
  {
    alias: "Noah",
    side: "con",
    claim: "산업 수요를 따라가는 교육은 늘 한 박자 늦다. 대학이 그 역할까지 맡으면 결국 기업의 뒤만 따라가게 된다.",
    evidence: "신기술은 현장에서 먼저 실험되고 대학 교과과정에는 몇 학기 뒤에 반영된다. 대학이 해야 할 일은 기술을 좇는 것이 아니라 원리를 이해하고 새 프레임을 제안하는 사람을 만드는 일이다.",
    responses: [],
    reactions: { "👍": 2, "😡": 5, "😢": 0, "😂": 1, "👎": 2 }
  },
  {
    alias: "Bora",
    side: "pro",
    claim: "현장 실습과 프로젝트를 정규 교육에 넣으면 이론도 더 잘 이해된다. 직업 중심 교육이 곧 피상적 교육이라는 건 오해다.",
    evidence: "프로젝트 기반 학습은 추상 개념을 실제 문제에 연결해 기억을 오래 남긴다. 학생이 결과물을 만들며 배우면 전공지식의 효용이 명확해지고 수업 몰입도도 높아진다.",
    responses: [],
    reactions: { "👍": 5, "😡": 2, "😢": 0, "😂": 2, "👎": 1 }
  },
  {
    alias: "Yuna",
    side: "con",
    claim: "대학이 취업률 중심으로 평가받기 시작하면 인문학과 예술은 가장 먼저 밀려난다. 사회는 곧바로 시야를 잃는다.",
    evidence: "사회 문제를 해석하고 질문하는 언어는 단기 생산성 지표로 환산되지 않는다. 그러나 그런 학문이 약해질수록 기술은 빨라져도 공동체는 방향을 잃는다.",
    responses: [],
    reactions: { "👍": 4, "😡": 3, "😢": 1, "😂": 0, "👎": 2 }
  },
  {
    alias: "Ravi",
    side: "pro",
    claim: "직업 훈련이 목적이라도 대학다운 깊이는 유지할 수 있다. 중요한 건 취업 교육을 얕게 만들지 않는 설계다.",
    evidence: "캡스톤, 인턴십, 산학 세미나를 이론 수업과 묶으면 학생은 현장성과 학문성을 동시에 경험한다. 문제는 직업 교육 자체가 아니라 조악한 실행이다.",
    responses: [],
    reactions: { "👍": 4, "😡": 2, "😢": 1, "😂": 1, "👎": 0 }
  }
];

// ── 상태 ────────────────────────────────────────────────────────
let _info          = null;   // debate-core info 객체
let _mySide        = null;   // 'pro' | 'con'
let _myAlias       = null;
let _myRole        = "participant";
let _myClaim       = null;   // 주장 (짧은 핵심 주장)
let _myEvidence    = null;   // 근거 (사례·데이터·논리)
let _myThesis      = null;   // 하위 호환용 (= _myClaim)
let _allPosts      = [];     // { alias, side, claim, evidence, thesis, responses[] }
let _cards         = [];     // 순서: 상대편 먼저, 같은편 나중
let _cardIdx       = 0;
let _myReplies     = [];     // { targetAlias, text }
let _myReactions   = {};     // { [alias]: emoji } — 내가 누른 이모지
let _submitted     = false;
let _opponentSeen  = 0;      // 상대편 카드 본 수
let _advancePending = false; // 반박 후 자동 이동 중 여부 (double-advance 방지)
let _allDone       = false;  // 마지막 카드 이후 상태
let _myPositionExpanded = false;
let _myPositionAutoPeek = false;
let _supplementComposerOpen = false;
let _pendingSupplementContext = null;
let _debateTimers  = [];
let _debateSequenceId = 0;
let _lastResultsScrollTop = 0;

// ── 유틸 ────────────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }
function show(id) { const el = typeof id === "string" ? $(id) : id; if (el) el.hidden = false; }
function hide(id) { const el = typeof id === "string" ? $(id) : id; if (el) el.hidden = true; }

function setPhase(name) {
  ["side", "commit", "debate", "results"].forEach(p => {
    const el = $("phase-" + p);
    if (el) el.hidden = (p !== name);
  });
}

// HTML 이스케이프 (innerHTML 사용 시 XSS 방지)
function escHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatRichText(s) {
  const escaped = escHtml(s).replace(/\n/g, "<br>");
  const urlPattern = /\b((https?:\/\/|www\.)[^\s<]+)/gi;

  return escaped.replace(urlPattern, function (raw) {
    const match = raw.match(/^(.*?)([),.;!?]+)?$/);
    const visible = match && match[1] ? match[1] : raw;
    const trailing = match && match[2] ? match[2] : "";
    const href = visible.startsWith("www.") ? "https://" + visible : visible;
    return `<a class="rich-link" href="${href}" target="_blank" rel="noopener noreferrer">${visible}</a>${trailing}`;
  });
}

function trimContextText(text, maxLen) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  const limit = typeof maxLen === "number" ? maxLen : 92;
  if (clean.length <= limit) return clean;
  return clean.slice(0, limit - 1).trimEnd() + "…";
}

function makeSupplementContext(label, text) {
  const excerpt = trimContextText(text);
  if (!excerpt) return null;
  return {
    label: label || "참고한 의견",
    text: excerpt
  };
}

function hashString(s) {
  let hash = 0;
  const text = String(s || "");
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function createReply(text, options) {
  const opts = options || {};
  const targetAlias = opts.targetAlias || null;
  const targetKind = opts.targetKind || (
    targetAlias === "_self_" ? "self" :
    opts.targetId ? "reply" : "post"
  );

  return {
    id: opts.id || `reply_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    text,
    targetAlias,
    targetId: opts.targetId || null,
    targetKind,
    createdAt: typeof opts.createdAt === "number" ? opts.createdAt : Date.now(),
    authorAlias: opts.authorAlias || _myAlias,
    authorSide: opts.authorSide || _mySide,
    contextLabel: opts.contextLabel || null,
    contextText: opts.contextText || null
  };
}

function serializeReply(reply) {
  return {
    id: reply.id,
    text: reply.text,
    targetAlias: reply.targetAlias,
    targetId: reply.targetId || null,
    targetKind: reply.targetKind || (reply.targetAlias === "_self_" ? "self" : reply.targetId ? "reply" : "post"),
    createdAt: reply.createdAt || Date.now(),
    contextLabel: reply.contextLabel || null,
    contextText: reply.contextText || null
  };
}

function normalizeReply(reply, authorAlias, authorSide, idx) {
  if (!reply || typeof reply.text !== "string") return null;

  const targetAlias = typeof reply.targetAlias === "string" ? reply.targetAlias : null;
  const targetKind = reply.targetKind || (
    targetAlias === "_self_" ? "self" :
    reply.targetId ? "reply" :
    targetAlias ? "post" : null
  );

  if (!targetKind) return null;

  const stableSeed = [
    authorAlias,
    authorSide,
    targetAlias || "",
    reply.targetId || "",
    reply.text,
    reply.contextLabel || "",
    reply.contextText || "",
    reply.createdAt || "",
    idx
  ].join("|");

  return {
    id: typeof reply.id === "string" && reply.id ? reply.id : `reply_${hashString(stableSeed)}`,
    text: reply.text,
    targetAlias: targetKind === "self" ? "_self_" : targetAlias,
    targetId: typeof reply.targetId === "string" && reply.targetId ? reply.targetId : null,
    targetKind,
    createdAt: typeof reply.createdAt === "number" ? reply.createdAt : idx,
    authorAlias,
    authorSide,
    contextLabel: typeof reply.contextLabel === "string" && reply.contextLabel ? reply.contextLabel : null,
    contextText: typeof reply.contextText === "string" && reply.contextText ? reply.contextText : null
  };
}

function normalizeRepliesForAuthor(replies, authorAlias, authorSide) {
  return (Array.isArray(replies) ? replies : [])
    .map((reply, idx) => normalizeReply(reply, authorAlias, authorSide, idx))
    .filter(Boolean);
}

function isSelfReply(reply) {
  return !!reply && (reply.targetKind === "self" || reply.targetAlias === "_self_");
}

function isDirectReplyToPost(reply, alias) {
  return !!reply &&
    !isSelfReply(reply) &&
    reply.targetAlias === alias &&
    (reply.targetKind === "post" || (!reply.targetKind && !reply.targetId));
}

function countThreadReplies(replies) {
  return (Array.isArray(replies) ? replies : []).filter(reply => !isSelfReply(reply)).length;
}

function sortReplies(replies) {
  return replies.slice().sort((a, b) => {
    const timeDiff = (a.createdAt || 0) - (b.createdAt || 0);
    if (timeDiff !== 0) return timeDiff;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}

function getAllConversationReplies() {
  const collected = [];

  _allPosts.forEach(post => {
    normalizeRepliesForAuthor(post.responses, post.alias, post.side).forEach(reply => {
      if (!isSelfReply(reply)) collected.push(reply);
    });
  });

  normalizeRepliesForAuthor(_myReplies, _myAlias, _mySide).forEach(reply => {
    if (!isSelfReply(reply)) collected.push(reply);
  });

  return sortReplies(collected);
}

function buildReplyTree(postAlias) {
  const replies = getAllConversationReplies().filter(reply => reply.targetAlias === postAlias);
  const byId = new Map();
  replies.forEach(reply => byId.set(reply.id, reply));

  const buckets = new Map();
  replies.forEach(reply => {
    const key = reply.targetKind === "reply" && reply.targetId && byId.has(reply.targetId)
      ? reply.targetId
      : "__root__";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(reply);
  });

  function attach(parentKey, depth) {
    return sortReplies(buckets.get(parentKey) || []).map(reply => ({
      reply,
      depth,
      children: attach(reply.id, depth + 1)
    }));
  }

  return attach("__root__", 0);
}

function getReplyModeLabel(replySide, postSide) {
  return "답글";
}

function loadDemoPayloadStore() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || "{}");
  } catch (e) {
    console.warn("[DebateApp] demo localStorage 파싱 실패:", e);
    return {};
  }
}

function saveDemoPayloadStore(payloads) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(payloads));
  } catch (e) {
    console.warn("[DebateApp] demo localStorage 저장 실패:", e);
  }
}

function payloadToPost(alias, payload) {
  const side = payload.profile?.side || payload.side || "pro";
  return {
    alias,
    side,
    claim:     payload.claim || payload.thesis,
    evidence:  payload.evidence || "",
    thesis:    payload.claim || payload.thesis,
    responses: normalizeRepliesForAuthor(payload.responses, alias, side)
  };
}

function getCurrentPayload() {
  return {
    profile:   { alias: _myAlias, side: _mySide },
    thesis:    _myClaim,
    claim:     _myClaim,
    evidence:  _myEvidence,
    responses: _myReplies.map(serializeReply)
  };
}

function hydrateMyPayload(payload) {
  const claim = payload?.claim || payload?.thesis || "";
  if (!claim) return false;

  _myClaim    = claim;
  _myEvidence = payload.evidence || "";
  _myThesis   = claim;
  _myReplies  = normalizeRepliesForAuthor(payload.responses, _myAlias, _mySide);
  _submitted  = true;
  return true;
}

function buildDemoPosts(payloads) {
  const byAlias = {};

  if (DEMO_EXAMPLE_MODE) {
    DEMO_SEEDS.forEach(seed => {
      byAlias[seed.alias] = Object.assign({}, seed, {
        responses: Array.isArray(seed.responses) ? seed.responses.slice() : []
      });
    });
  }

  Object.keys(payloads || {}).forEach(alias => {
    const post = payloadToPost(alias, payloads[alias]);
    if (post.claim) byAlias[alias] = post;
  });

  return Object.values(byAlias).filter(post => post.alias !== _myAlias && post.claim);
}

function persistDemoPayload() {
  if (!_myAlias || !_myClaim) return;
  const payloads = loadDemoPayloadStore();
  payloads[_myAlias] = getCurrentPayload();
  saveDemoPayloadStore(payloads);
  _allPosts = buildDemoPosts(payloads);
}

function sortCardsByActivity(posts) {
  return posts.slice().sort((a, b) => {
    const diff = (b.responses?.length || 0) - (a.responses?.length || 0);
    if (diff !== 0) return diff;
    return String(a.alias || "").localeCompare(String(b.alias || ""));
  });
}

function clearDebateSequence() {
  _debateTimers.forEach(timerId => clearTimeout(timerId));
  _debateTimers = [];
  _debateSequenceId++;
}

function queueDebateStep(fn, delay) {
  const sequenceId = _debateSequenceId;
  const timerId = window.setTimeout(function () {
    _debateTimers = _debateTimers.filter(id => id !== timerId);
    if (sequenceId !== _debateSequenceId) return;
    fn();
  }, delay);
  _debateTimers.push(timerId);
}

function buildUploadSlides(cards) {
  const slides = cards.slice(0, UPLOAD_SLIDE_COUNT).map(card => ({ kind: "card", card }));
  while (slides.length < UPLOAD_SLIDE_COUNT) {
    slides.push({ kind: "loading" });
  }
  return slides;
}

function buildUploadQueueCard(slide, depth) {
  const queueClass = `upload-queue-card queue-depth-${depth}`;
  if (!slide || slide.kind !== "card") {
    return `
      <div class="${queueClass} is-loading" aria-hidden="true">
        <div class="upload-queue-shell">
          <span class="upload-queue-kicker">정리 중</span>
          <span class="upload-queue-line upload-queue-line-short"></span>
          <span class="upload-queue-line"></span>
        </div>
      </div>`;
  }

  const card = slide.card;
  const isOpponent = card.side !== _mySide;
  const label = isOpponent ? "다른 의견" : "같은 편";
  const preview = trimContextText(card.claim || card.thesis || "", 54);

  return `
    <div class="${queueClass} ${isOpponent ? "from-opponent" : "from-ally"} side-${card.side}" aria-hidden="true">
      <div class="upload-queue-shell">
        <span class="upload-queue-kicker">${label}</span>
        <span class="upload-queue-claim">${escHtml(preview)}</span>
      </div>
    </div>`;
}

function renderUploadSlide(slides, step, totalSteps) {
  const zone = $("card-zone");
  const countEl = $("rebuttal-count");
  const progressEl = $("card-progress");
  const currentStep = Math.min(step + 1, totalSteps);
  const slide = slides[step];
  const queueHtml = slides
    .slice(step + 1, step + 3)
    .map((queuedSlide, idx) => buildUploadQueueCard(queuedSlide, idx + 1))
    .reverse()
    .join("");

  if (countEl) countEl.textContent = "의견 업로드 중입니다...";
  if (progressEl) progressEl.textContent = `${currentStep} / ${totalSteps}`;

  if (slide.kind !== "card") {
    zone.innerHTML = `
      <div class="upload-stage is-loading-only">
        <div class="upload-status">
          <span class="upload-chip">의견 업로드 중입니다...</span>
          <span class="upload-status-copy">다른 참여자의 의견을 정리하고 있어요</span>
        </div>
        <div class="upload-loader" aria-hidden="true">
          <span class="upload-loader-dot"></span>
          <span class="upload-loader-dot"></span>
          <span class="upload-loader-dot"></span>
        </div>
        <div class="upload-deck">
          ${queueHtml}
          <div class="upload-skeleton-card" aria-hidden="true">
            <div class="upload-skeleton">
              <span class="upload-line upload-line-short"></span>
              <span class="upload-line"></span>
              <span class="upload-line"></span>
              <span class="upload-line upload-line-mid"></span>
            </div>
          </div>
        </div>
      </div>`;
    return;
  }

  const card = slide.card;
  const isOpponent = card.side !== _mySide;
  const emoji = getProfileEmoji(card.alias);
  const framingLabel = isOpponent ? "다른 참여자 의견" : "같은 편 의견";
  const claimText = card.claim || card.thesis || "";
  const evidenceText = card.evidence || "";

  zone.innerHTML = `
    <div class="upload-stage">
      <div class="upload-status">
        <span class="upload-chip">의견 업로드 중입니다...</span>
        <span class="upload-status-copy">화면을 정리한 뒤 바로 전체 토론으로 넘어갑니다</span>
      </div>
      <div class="upload-loader" aria-hidden="true">
        <span class="upload-loader-dot"></span>
        <span class="upload-loader-dot"></span>
        <span class="upload-loader-dot"></span>
      </div>
      <div class="upload-deck">
        ${queueHtml}
        <div class="debate-card upload-card ${isOpponent ? "from-opponent" : "from-ally"} side-${card.side}">
          <p class="card-framing ${isOpponent ? "opponent" : "ally"}">
            <span class="card-avatar">${emoji}</span>${framingLabel}
          </p>
          <div class="card-body">
            <span class="card-claim">${formatRichText(claimText)}</span>
            ${evidenceText ? `<div class="card-evidence-text">${formatRichText(evidenceText)}</div>` : ""}
          </div>
          <p class="card-from">${escHtml(card.alias)}</p>
        </div>
      </div>
    </div>`;
}

// ── 카드 순서: 상대편 먼저, 같은 편은 뒤에 보조로 노출 ─────
function buildCards(posts, mySide) {
  const opp = sortCardsByActivity(posts.filter(p => p.side !== mySide));
  const allies = sortCardsByActivity(posts.filter(p => p.side === mySide));
  return opp.concat(allies);
}

// ── PHASE 1: 찬반 선택 ──────────────────────────────────────────
function startSidePhase() {
  const title = (_info.title || "").trim();
  const topicBar = document.querySelector("#phase-side .topic-bar");
  $("topic-title").textContent = title || (DEMO_TEMPLATE_MODE ? "" : "오늘의 논제");
  if (topicBar) topicBar.hidden = !title;
  setPhase("side");

  document.querySelectorAll(".side-btn").forEach(btn => {
    btn.onclick = function () {
      _mySide = this.dataset.side;
      startCommitPhase();
    };
  });
}

// ── PHASE 2: 주장 + 근거 입력 (commitment act) ──────────────────
function startCommitPhase() {
  const badge = $("commit-badge");
  badge.textContent = _mySide === "pro" ? "찬성" : "반대";
  badge.className   = "commit-badge " + _mySide;

  // 논제 표시
  const topicEl = $("commit-topic");
  const title = (_info.title || "").trim();
  if (topicEl) {
    topicEl.textContent = title;
    topicEl.hidden = !title;
  }

  setPhase("commit");

  const claimTa  = $("claim-input");
  const evidTa   = $("evidence-input");
  const btn      = $("commit-btn");
  const claimNum = $("claim-char-num");
  const evidNum  = $("evidence-char-num");

  // HTML 캐시 문제로 요소가 없으면 강제 새로고침
  if (!claimTa || !evidTa || !btn) {
    location.reload(true);
    return;
  }

  claimTa.value = "";
  evidTa.value  = "";
  claimNum.textContent = "0";
  evidNum.textContent  = "0";
  btn.disabled = true;
  claimTa.focus();

  function onInput() {
    claimNum.textContent = claimTa.value.length;
    evidNum.textContent  = evidTa.value.length;
    // 주장 + 근거 모두 필수
    btn.disabled = claimTa.value.trim().length < 4 || evidTa.value.trim().length < 6;
  }

  claimTa.oninput = onInput;
  evidTa.oninput  = onInput;
  btn.onclick     = function () {
    _myClaim    = claimTa.value.trim();
    _myEvidence = evidTa.value.trim();
    _myThesis   = _myClaim;  // 하위 호환
    if (!_myClaim) return;
    populateThesisBar();
    startDebatePhase();
  };
}

// thesis bar 세팅 — debate 진입 전에 호출
function populateThesisBar() {
  const bar   = $("my-thesis-bar");
  const badge = $("my-thesis-side-badge");
  const text  = $("my-thesis-preview");

  bar.className    = "my-thesis-bar " + _mySide;
  badge.className  = "thesis-bar-badge " + _mySide;
  badge.textContent = _mySide === "pro" ? "찬성" : "반대";
  text.textContent  = _myClaim;
  show(bar);
}

// ── PHASE 3: 토론 ───────────────────────────────────────────────
function startDebatePhase() {
  clearDebateSequence();

  // 상단 배지: 찬성/반대만 표시
  const badge = $("my-badge");
  badge.className = "my-badge " + _mySide;
  badge.innerHTML = `<span class="value">나의 입장 · ${_mySide === "pro" ? "찬성" : "반대"}</span>`;

  // 논제 바 세팅
  const topicBarText = $("topic-bar-text");
  if (topicBarText) topicBarText.textContent = _info.title || "";

  _cards         = buildCards(_allPosts, _mySide);
  _cardIdx       = 0;
  _opponentSeen  = 0;
  _advancePending = false;

  setPhase("debate");
  $("phase-debate").classList.add("auto-sequence");
  hide("reply-zone");
  hide("card-actions");

  const slides = buildUploadSlides(_cards);
  slides.forEach(function (slide, idx) {
    queueDebateStep(function () {
      renderUploadSlide(slides, idx, slides.length);
    }, idx * UPLOAD_SLIDE_MS);
  });
  queueDebateStep(function () {
    submitAndShowResults();
  }, slides.length * UPLOAD_SLIDE_MS);
}

function renderCard() {
  if (_cardIdx >= _cards.length) {
    showAllDone();
    return;
  }

  const card       = _cards[_cardIdx];
  const isOpponent = card.side !== _mySide;
  const el         = $("debate-card");

  // 카드 CSS 클래스
  el.className = [
    "debate-card",
    isOpponent ? "from-opponent" : "from-ally",
    "side-" + card.side
  ].join(" ");

  // ── 프레이밍 라벨 + 프로필 아바타
  const framing = $("card-framing");
  const emoji = getProfileEmoji(card.alias);
  if (isOpponent) {
    framing.innerHTML = `<span class="card-avatar">${emoji}</span> 상대측 의견`;
    framing.className = "card-framing opponent";
  } else {
    framing.innerHTML = `<span class="card-avatar">${emoji}</span> 같은 편 의견`;
    framing.className = "card-framing ally";
  }

  // 카드 본문: 주장(claim) 크게 + 근거(evidence) 더보기
  const claimText    = card.claim || card.thesis || "";
  const evidenceText = card.evidence || "";
  const bodyEl       = $("card-body");

  bodyEl.innerHTML =
    `<span class="card-claim">${formatRichText(claimText)}</span>` +
    (evidenceText
      ? `<div class="card-evidence-text">${formatRichText(evidenceText)}</div>`
      : "");

  // 발신자 + 기존 반박 인라인 표시
  const fromEl = $("card-from");
  const existingReply = _myReplies.find(r => isDirectReplyToPost(r, card.alias));
  if (existingReply) {
    fromEl.className = "card-from has-reply";
    fromEl.innerHTML = `<span class="my-rebuttal-inline">↳ 나의 반박: ${formatRichText(existingReply.text)}</span>`;
  } else {
    fromEl.className = "card-from";
    fromEl.textContent = "";
  }

  // 반박 버튼 상태 — 항상 같은 크기, 숨기지 않음
  const rebutBtn = $("btn-reply");
  if (isOpponent) {
    rebutBtn.style.display = "";
    if (existingReply) {
      rebutBtn.disabled    = true;
      rebutBtn.textContent = "반박 완료 ✓";
      rebutBtn.className   = "btn-rebut-main done";
    } else {
      rebutBtn.disabled    = false;
      rebutBtn.textContent = "반박하기";
      rebutBtn.className   = "btn-rebut-main";
    }
  } else {
    rebutBtn.style.display = "none";
  }

  // 이전/다음 버튼: 항상 표시, disabled로 표현
  $("btn-prev").disabled = (_cardIdx === 0);
  $("btn-next").disabled = false;

  // 반박 영역 닫기
  hide("reply-zone");
  $("reply-input").value = "";

  // 상대편 카드 카운트
  if (isOpponent) {
    _opponentSeen++;
  }

  // 상대편 카드 1장 이상 본 후 제출 버튼 표시 (RULE 6)
  if (_opponentSeen >= 1) {
    show("btn-submit");
  }

  // 진행 표시 업데이트
  updateTopbar();

  // 카드 등장 애니메이션 재실행
  el.style.animation = "none";
  void el.offsetHeight;
  el.style.animation = "";
}

function updateTopbar() {
  $("card-progress").textContent = (_cardIdx + 1) + " / " + _cards.length;
  const n = countThreadReplies(_myReplies);
  $("rebuttal-count").textContent = n > 0 ? `반박 ${n}건` : "";
}

function showAllDone() {
  _allDone = true;
  const n = countThreadReplies(_myReplies);
  const unrebutted = _cards.filter(c => c.side !== _mySide && !_myReplies.find(r => isDirectReplyToPost(r, c.alias))).length;
  const sub = unrebutted > 0
    ? `반박하지 않은 상대 논증이 <strong>${unrebutted}개</strong> 있습니다. 돌아가서 반박할 수 있습니다.`
    : n > 0
      ? `${n}건의 반박을 남겼습니다.`
      : "반박 없이 모든 의견을 확인했습니다.";

  $("card-zone").innerHTML = `
    <div class="all-done">
      <p class="all-done-title">모든 카드를 확인했습니다</p>
      <p class="all-done-sub">${sub}</p>
    </div>`;

  // all-done: 반박 버튼 숨김, 이전/다음 상태 업데이트
  hide("reply-zone");
  $("btn-reply").style.display = "none";
  $("btn-next").disabled = true;
  $("btn-prev").disabled = false;
  show("btn-submit");
}

// ── 이벤트 바인딩 (once) ──────────────────────────────────────
function bindDebateEvents() {
  // 이전 카드
  $("btn-prev").onclick = function () {
    if (_advancePending) return;
    hide("reply-zone");

    if (_allDone) {
      // all-done → 마지막 카드로 복귀: card-zone 재구성
      _allDone = false;
      $("card-zone").innerHTML = `
        <div id="debate-card" class="debate-card">
          <p id="card-framing" class="card-framing"></p>
          <p id="card-body" class="card-body"></p>
          <p id="card-from" class="card-from"></p>
        </div>`;
      _cardIdx = _cards.length - 1;
      $("btn-next").disabled = false;
    } else {
      if (_cardIdx <= 0) return;
      _cardIdx--;
    }
    renderCard();
  };

  // 다음 카드 (double-advance 방지)
  $("btn-next").onclick = function () {
    if (_advancePending) return;
    _cardIdx++;
    renderCard();
  };

  // 반박 열기 (RULE 5: 선택적, 마찰 없음)
  $("btn-reply").onclick = function () {
    if (this.disabled) return;
    hide("card-actions");
    show("reply-zone");
    $("reply-input").focus();
  };

  // 반박 취소
  $("reply-cancel").onclick = function () {
    hide("reply-zone");
    show("card-actions");
  };

  // 반박 전송: 카드에 인라인 표시 → 1200ms 후 자동 이동
  $("reply-send").onclick = function () {
    const text = $("reply-input").value.trim();
    if (!text) return;

    const card = _cards[_cardIdx];

    // 반박 저장
    _myReplies.push(createReply(text, { targetAlias: card.alias, targetKind: "post" }));

    // 카드 하단에 즉시 반박 표시
    const fromEl = $("card-from");
    fromEl.className = "card-from has-reply";
    fromEl.innerHTML = `<span class="my-rebuttal-inline">↳ 나의 반박: ${formatRichText(text)}</span>`;

    // 반박 버튼 → 완료 상태
    const rebutBtn = $("btn-reply");
    rebutBtn.disabled    = true;
    rebutBtn.textContent = "반박 완료 ✓";

    // reply-zone 닫기, card-actions 표시
    hide("reply-zone");
    show("card-actions");

    // 다음 버튼 비활성 + 자동 이동 예약 (double-advance 방지)
    _advancePending = true;
    $("btn-next").disabled = true;

    // 반박 카운트 즉시 업데이트
    updateTopbar();

    // 1200ms 후 다음 카드로
    setTimeout(function () {
      _advancePending = false;
      _cardIdx++;
      renderCard();
    }, 1200);
  };

  // 제출
  $("btn-submit").onclick = submitAndShowResults;
}

// ── 제출 ────────────────────────────────────────────────────────
async function submitAndShowResults() {
  if (_submitted) return;
  clearDebateSequence();
  _submitted = true;
  $("btn-submit").disabled = true;

  const payload = getCurrentPayload();

  if (!DEMO_MODE) {
    try {
      await _info.savePayload(payload);
    } catch (e) {
      console.warn("[DebateApp] savePayload 실패:", e);
    }
  } else {
    persistDemoPayload();
  }

  showResults();
}

// ── 결과 화면에서 추가 반박/보충/댓글 후 저장 (실제 모드) ────────
async function savePayloadSilent() {
  if (DEMO_MODE) {
    persistDemoPayload();
    return;
  }
  try {
    await _info.savePayload(getCurrentPayload());
  } catch (e) { console.warn("[DebateApp] savePayload 추가:", e); }
}

// ── 내 입장 섹션 빌더 ─────────────────────────────────────────────
function buildMyPositionSection() {
  const section     = $("my-position-section");
  const supplements = _myReplies.filter(isSelfReply);

  const evidenceHtml = _myEvidence
    ? `<div class="my-evidence-block">
        <p class="my-evidence-text">${formatRichText(_myEvidence)}</p>
       </div>`
    : "";

  const pendingContextHtml = _pendingSupplementContext
    ? `<div class="supplement-context">
        <span class="supplement-context-label">${escHtml(_pendingSupplementContext.label)}</span>
        <p class="supplement-context-text">${formatRichText(_pendingSupplementContext.text)}</p>
       </div>`
    : "";

  const supplementsHtml = supplements.length > 0
    ? `<div class="mypos-supplements">${
        supplements.map(s => `
          <div class="annotation-reply side-${_mySide}">
            ${s.contextText ? `
              <div class="annotation-context">
                <span class="annotation-context-label">${escHtml(s.contextLabel || "보완한 의견")}</span>
                <span class="annotation-context-text">${formatRichText(s.contextText)}</span>
              </div>` : ""}
            <span class="annotation-label">보충</span>
            <span class="annotation-text">${formatRichText(s.text)}</span>
          </div>`).join("")
      }</div>` : "";

  section.className = _myPositionExpanded ? "is-expanded" : "";
  section.innerHTML = `
    <div class="mypos-drawer side-${_mySide}${_myPositionExpanded ? " is-expanded" : ""}">
      <div id="mypos-shell" class="mypos-shell side-${_mySide}">
        <div id="mypos-body" class="mypos-body">
          <div class="mypos-content">
            <p class="bubble-claim mypos-claim">${formatRichText(_myClaim)}</p>
            ${evidenceHtml}
            ${supplementsHtml}
            <button class="btn-add-supplement" type="button">+ 논거 보충하기</button>
            <div class="supplement-form"${_supplementComposerOpen ? "" : " hidden"}>
              ${pendingContextHtml}
              <textarea class="supplement-input" maxlength="300"
                placeholder="${_pendingSupplementContext ? "이 의견을 바탕으로 내 논거를 보충해보세요 (300자 이내)" : "내 주장을 뒷받침할 논거 (300자 이내)"}"></textarea>
              <div class="post-reply-row">
                <button class="btn-supplement-cancel" type="button">취소</button>
                <button class="btn-supplement-send" type="button">추가</button>
              </div>
            </div>
          </div>
        </div>
        <button class="mypos-toggle side-${_mySide}" type="button" aria-controls="mypos-body" aria-expanded="${_myPositionExpanded}">
          <span class="mypos-toggle-badge ${_mySide}">내 의견</span>
          <span class="mypos-toggle-preview">${escHtml(_myClaim)}</span>
          <span class="mypos-toggle-icon">${_myPositionExpanded ? "↑" : "↓"}</span>
        </button>
      </div>
    </div>`;

  const drawer = section.querySelector(".mypos-drawer");
  const toggle = section.querySelector(".mypos-toggle");

  toggle.onclick = function () {
    _myPositionExpanded = !_myPositionExpanded;
    _myPositionAutoPeek = false;
    syncMyPositionDrawerState();
  };

  syncMyPositionDrawerState();

  // 논거 추가
  section.querySelector(".btn-add-supplement").addEventListener("click", function () {
    openSupplementComposer(null);
  });
  section.querySelector(".btn-supplement-cancel").addEventListener("click", function () {
    _supplementComposerOpen = false;
    _pendingSupplementContext = null;
    buildMyPositionSection();
  });
  section.querySelector(".btn-supplement-send").addEventListener("click", function () {
    const input = section.querySelector(".supplement-input");
    const text  = input.value.trim();
    if (!text) return;
    _myReplies.push(createReply(text, {
      targetAlias: "_self_",
      targetKind: "self",
      contextLabel: _pendingSupplementContext?.label || null,
      contextText: _pendingSupplementContext?.text || null
    }));
    _supplementComposerOpen = false;
    _pendingSupplementContext = null;
    buildMyPositionSection();
    savePayloadSilent();
  });
}

function openSupplementComposer(context) {
  _pendingSupplementContext = context || null;
  _supplementComposerOpen = true;
  _myPositionExpanded = true;
  _myPositionAutoPeek = false;
  buildMyPositionSection();

  const section = $("my-position-section");
  if (!section) return;
  section.scrollIntoView({ block: "start", behavior: "smooth" });
  window.requestAnimationFrame(function () {
    const input = section.querySelector(".supplement-input");
    if (input) input.focus();
  });
}

function syncMyPositionDrawerState() {
  const section = $("my-position-section");
  if (!section) return;

  const drawer = section.querySelector(".mypos-drawer");
  const shell  = section.querySelector("#mypos-shell");
  const body   = section.querySelector("#mypos-body");
  const toggle = section.querySelector(".mypos-toggle");
  if (!drawer || !shell || !body || !toggle) return;

  const isAutoPeek = _myPositionAutoPeek && !_myPositionExpanded;
  section.classList.toggle("is-expanded", _myPositionExpanded);
  section.classList.toggle("is-auto-peek", isAutoPeek);
  drawer.classList.toggle("is-expanded", _myPositionExpanded);
  drawer.classList.toggle("is-auto-peek", isAutoPeek);
  shell.setAttribute("aria-expanded", _myPositionExpanded ? "true" : "false");
  toggle.setAttribute("aria-expanded", _myPositionExpanded ? "true" : "false");
  toggle.querySelector(".mypos-toggle-icon").textContent = _myPositionExpanded ? "↑" : "↓";
  body.inert = !_myPositionExpanded;
  body.setAttribute("aria-hidden", _myPositionExpanded ? "false" : "true");
}

function bindResultsScrollBehavior() {
  const scroller = document.querySelector(".results-scroll");
  if (!scroller) return;

  _lastResultsScrollTop = scroller.scrollTop || 0;
  scroller.onscroll = function () {
    const currentTop = scroller.scrollTop || 0;
    const isScrollingDown = currentTop > _lastResultsScrollTop + 10;
    const isNearTop = currentTop <= 8;

    if (isNearTop && (!_myPositionExpanded || _myPositionAutoPeek)) {
      _myPositionExpanded = true;
      _myPositionAutoPeek = false;
      syncMyPositionDrawerState();
      _lastResultsScrollTop = currentTop;
      return;
    }

    if (isScrollingDown && _myPositionExpanded) {
      _myPositionExpanded = false;
      _myPositionAutoPeek = true;
      syncMyPositionDrawerState();
    }

    _lastResultsScrollTop = currentTop;
  };
}

// ── 결과 화면 post 아이템 빌더 (채팅 형태) ───────────────────────
// 반응: 엄지 이모지
const REACTIONS = [
  { id: "like",    label: "👍", color: "like"    },
  { id: "dislike", label: "👎", color: "dislike" }
];

function bindQuickReplyTarget(targetEl, options) {
  targetEl.tabIndex = 0;
  targetEl.setAttribute("role", "button");
  targetEl.dataset.focusLabel = options.focusLabel;
  targetEl.classList.add("focus-hint-cursor");

  function triggerOpen(event) {
    if (event.target.closest("a, button, textarea, input")) return;
    event.preventDefault();
    options.onOpen();
  }

  function updateHintPosition(event) {
    const rect = targetEl.getBoundingClientRect();
    const x = Math.max(10, Math.min(rect.width - 16, event.clientX - rect.left + 14));
    const y = Math.max(10, Math.min(rect.height - 14, event.clientY - rect.top - 12));
    targetEl.style.setProperty("--focus-tip-x", `${x}px`);
    targetEl.style.setProperty("--focus-tip-y", `${y}px`);
  }

  targetEl.addEventListener("click", triggerOpen);
  targetEl.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    triggerOpen(event);
  });
  targetEl.addEventListener("mousemove", updateHintPosition);
  targetEl.addEventListener("mouseenter", updateHintPosition);
}

function buildThreadReplyNode(node, post, closeForms) {
  const reply = node.reply;
  const isRebuttal = reply.authorSide !== post.side;
  const isPostAuthor = reply.authorAlias === post.alias;
  const wrapper = document.createElement("div");
  wrapper.className = [
    "thread-reply",
    isRebuttal ? "is-rebuttal" : "is-comment",
    "side-" + reply.authorSide,
    reply.authorAlias === _myAlias ? "is-mine" : "is-other"
  ].join(" ");
  wrapper.style.setProperty("--reply-depth", String(Math.min(node.depth, 4)));

  const body = document.createElement("div");
  body.className = `thread-reply-body reply-focus-target${isRebuttal ? " is-rebuttal" : ""}`;
  body.innerHTML = `
    <div class="thread-reply-head">
      <span class="thread-reply-avatar">${getProfileEmoji(reply.authorAlias)}</span>
      <span class="thread-reply-alias">${escHtml(reply.authorAlias)}</span>
      ${isPostAuthor ? '<span class="thread-author-badge">작성자</span>' : ""}
      <span class="thread-reply-kind${isRebuttal ? " is-rebuttal" : ""}">${getReplyModeLabel(reply.authorSide, post.side)}</span>
      <span class="thread-reply-side">${reply.authorSide === "pro" ? "찬성" : "반대"}</span>
    </div>
    <div class="thread-reply-text">${formatRichText(reply.text)}</div>`;
  wrapper.appendChild(body);

  const actions = document.createElement("div");
  actions.className = "thread-reply-actions";
  actions.innerHTML = `<button class="btn-thread-supplement" type="button">논거 보충</button>`;
  wrapper.appendChild(actions);

  const form = document.createElement("div");
  form.className = "thread-reply-form post-reply-form";
  form.hidden = true;
  form.innerHTML = `
    <textarea class="post-reply-input" maxlength="200"
      placeholder="이 답글에 이어서 답글 달기 (200자 이내)"></textarea>
    <div class="post-reply-row">
      <button class="btn-post-cancel" type="button">취소</button>
      <button class="btn-post-send" type="button">전송</button>
    </div>`;
  wrapper.appendChild(form);

  const input = form.querySelector(".post-reply-input");
  bindQuickReplyTarget(body, {
    focusLabel: "클릭해 답글 달기",
    onOpen: function () {
      closeForms();
      form.hidden = false;
      input.value = "";
      input.focus();
    }
  });

  form.querySelector(".btn-post-cancel").onclick = function () {
    form.hidden = true;
  };
  actions.querySelector(".btn-thread-supplement").onclick = function () {
    closeForms();
    openSupplementComposer(makeSupplementContext(`${reply.authorAlias}의 답글`, reply.text));
  };
  form.querySelector(".btn-post-send").onclick = function () {
    const text = input.value.trim();
    if (!text) return;
    _myReplies.push(createReply(text, {
      targetAlias: post.alias,
      targetId: reply.id,
      targetKind: "reply"
    }));
    closeForms();
    savePayloadSilent();
    wrapper.closest(".post-bubble").replaceWith(buildPostItem(post));
  };

  if (node.children.length > 0) {
    const children = document.createElement("div");
    children.className = "thread-children";
    node.children.forEach(child => {
      children.appendChild(buildThreadReplyNode(child, post, closeForms));
    });
    wrapper.appendChild(children);
  }

  return wrapper;
}

function buildPostItem(post) {
  const isOpponent   = post.side !== _mySide;
  const myReaction   = _myReactions[post.alias] || null;
  const baseCounts   = post.reactions || {};
  const claimText    = post.claim || post.thesis || "";
  const evidenceText = post.evidence || "";
  const sideLabel    = post.side === "pro" ? "찬성" : "반대";

  const div = document.createElement("div");
  div.className = [
    "post-bubble",
    isOpponent ? "opponent-bubble" : "ally-bubble",
    "side-" + post.side
  ].join(" ");

  // 근거 더보기 블록
  const evidenceBlock = evidenceText
    ? `<div class="post-evidence-text">${formatRichText(evidenceText)}</div>`
    : "";

  // 반응 버튼 (오호~ / 화나요)
  const reactHtml = REACTIONS.map(r => {
    const oldMap = {
      like: ["👍", "😮", "😢", "😂", "oho"],
      dislike: ["😡", "👎", "angry"]
    };
    const base = oldMap[r.id]
      ? oldMap[r.id].reduce((s, e) => s + (baseCounts[e] || 0), 0) + (baseCounts[r.label] || 0)
      : (baseCounts[r.label] || 0);
    const isActive = (r.id === "like" && (myReaction === "like" || myReaction === "oho"))
      || (r.id === "dislike" && (myReaction === "dislike" || myReaction === "angry"));
    const count = base + (isActive ? 1 : 0);
    const active = isActive ? " active" : "";
    return `<button class="react-btn react-${r.color}${active}" data-rid="${r.id}">` +
      `${r.label}${count > 0 ? ` <span class="react-count">${count}</span>` : ""}` +
      `</button>`;
  }).join("");

  const postEmoji = getProfileEmoji(post.alias);
  div.innerHTML = `
    <div class="bubble-content">
      <span class="bubble-avatar">${postEmoji}</span>
      <p class="bubble-claim">${formatRichText(claimText)}</p>
      ${evidenceBlock}
      <div class="bubble-footer">
        <span class="post-meta">${sideLabel}</span>
        <div class="reaction-row">${reactHtml}</div>
      </div>
    </div>
    <div class="bubble-action-row">
      <button class="btn-annotate" type="button">답글</button>
      <button class="btn-supplement-link" type="button">논거 보충</button>
    </div>
    <div class="thread-stack"></div>
    <div class="thread-reply-form post-reply-form" hidden>
      <textarea class="post-reply-input" maxlength="200"
        placeholder="이 의견에 답글 달기 (200자 이내)"></textarea>
      <div class="post-reply-row">
        <button class="btn-post-cancel" type="button">취소</button>
        <button class="btn-post-send" type="button">전송</button>
      </div>
    </div>`;

  const threadStack  = div.querySelector(".thread-stack");
  const annotateBtn  = div.querySelector(".btn-annotate");
  const supplementBtn = div.querySelector(".btn-supplement-link");
  const form         = div.querySelector(".thread-reply-form");
  const input        = div.querySelector(".post-reply-input");

  function closeForms() {
    div.querySelectorAll(".thread-reply-form").forEach(node => { node.hidden = true; });
  }

  annotateBtn.addEventListener("click", function () {
    closeForms();
    form.hidden = false;
    input.value = "";
    input.focus();
  });
  supplementBtn.addEventListener("click", function () {
    closeForms();
    openSupplementComposer(makeSupplementContext(`${post.alias}의 의견`, claimText || evidenceText));
  });

  buildReplyTree(post.alias).forEach(node => {
    threadStack.appendChild(buildThreadReplyNode(node, post, closeForms));
  });

  // 반응 클릭
  div.querySelectorAll(".react-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      const rid = this.dataset.rid;
      _myReactions[post.alias] = (_myReactions[post.alias] === rid) ? null : rid;
      if (!_myReactions[post.alias]) delete _myReactions[post.alias];
      div.replaceWith(buildPostItem(post));
    });
  });

  // 원글에 직접 반박/댓글 폼
  form.querySelector(".btn-post-cancel").addEventListener("click", () => { form.hidden = true; });
  form.querySelector(".btn-post-send").addEventListener("click", function () {
    const text = input.value.trim();
    if (!text) return;
    _myReplies.push(createReply(text, {
      targetAlias: post.alias,
      targetKind: "post"
    }));
    div.replaceWith(buildPostItem(post));
    savePayloadSilent();
  });

  return div;
}

// ── PHASE 4: 결과 (여론은 제출 후 공개 — RULE 6) ────────────────
function showResults() {
  clearDebateSequence();
  setPhase("results");

  _myPositionExpanded = true;
  _myPositionAutoPeek = false;
  buildMyPositionSection();
  bindResultsScrollBehavior();

  const others = _allPosts.filter(p => p.alias !== _myAlias);
  const voteStripe = $("vote-stripe");
  const voteLabels = $("vote-labels");
  const hasOthers = others.length > 0;

  if (!hasOthers) {
    voteStripe.hidden = true;
    voteLabels.classList.add("is-empty");
    voteLabels.innerHTML = `<span class="vote-label-empty">아직 다른 참여자 의견이 없습니다</span>`;
  } else {
    const proN   = others.filter(p => p.side === "pro").length;
    const conN   = others.filter(p => p.side === "con").length;
    const total  = proN + conN;
    const proPct = Math.round(proN / total * 100);

    voteStripe.hidden = false;
    voteStripe.innerHTML =
      `<div class="stripe-seg stripe-pro" style="width:0%" data-w="${proPct}"></div>` +
      `<div class="stripe-seg stripe-con" style="width:0%" data-w="${100 - proPct}"></div>`;
    voteLabels.classList.remove("is-empty");
    voteLabels.innerHTML =
      `<span class="vote-label-pro">찬성 ${proPct}%</span>` +
      `<span class="vote-label-con">반대 ${100 - proPct}%</span>`;
  }

  // 채팅 형태 포스트: 상대편 먼저, 같은 편 나중 (인터리빙해도 자연스럽지만 그룹이 명확)
  const chatEl = $("posts-chat");
  chatEl.innerHTML = "";

  if (!hasOthers) {
    chatEl.innerHTML = `<div class="posts-empty">아직 제출된 다른 의견이 없습니다. 첫 번째 참여 흐름만 점검할 때는 이 상태가 정상입니다.</div>`;
    return;
  }

  const opponents = others.filter(p => p.side !== _mySide);
  const allies    = others.filter(p => p.side === _mySide);

  // 상대 - 같은편 - 상대 - 같은편 순으로 인터리빙 (채팅처럼 느껴지도록)
  const maxLen = Math.max(opponents.length, allies.length);
  for (let i = 0; i < maxLen; i++) {
    if (opponents[i]) chatEl.appendChild(buildPostItem(opponents[i]));
    if (allies[i])    chatEl.appendChild(buildPostItem(allies[i]));
  }

  // 바 애니메이션
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll(".stripe-seg").forEach(el => {
        el.style.width = el.dataset.w + "%";
      });
    });
  });
}

// ── 공통: side가 정해졌을 때 어느 phase로 진입할지 결정 ──────────
function enterAfterLoad() {
  if (_submitted && _myClaim) {
    showResults();
    return;
  }

  if (_mySide) {
    startCommitPhase();
  } else {
    startSidePhase();
  }
}

// ── 데모 모드: debate-core 우회, 즉시 실행 ──────────────────────
// 기본은 빈 템플릿, example=true로 예시 토론 시드 사용
if (DEMO_MODE) {
  _myAlias   = SEARCH_PARAMS.get("nickname") || makeNickname();
  _mySide    = SEARCH_PARAMS.get("side") === "con" ? "con" : SEARCH_PARAMS.get("side") === "pro" ? "pro" : null;
  _info      = {
    nickname: _myAlias,
    side:     _mySide,
    role:     "participant",
    status:   "active",
    title:    DEMO_EXAMPLE_MODE ? "대학에서는 직업을 위한 지식을 가르쳐야 한다" : ""
  };
  console.info("[DebateApp] demo 모드로 실행 중");
  const demoPayloads = loadDemoPayloadStore();
  const myDemoPayload = demoPayloads[_myAlias];
  const savedSide = myDemoPayload?.profile?.side || myDemoPayload?.side || null;
  if (DEMO_RESUME && !_mySide && savedSide) _mySide = savedSide;
  if (DEMO_RESUME && (!_mySide || !savedSide || savedSide === _mySide)) {
    hydrateMyPayload(myDemoPayload);
  }
  _allPosts = buildDemoPosts(demoPayloads);
  hide("msg-screen");
  show("app");
  enterAfterLoad();
}

// ── 진입점: 실제 모드 — debate-core.js 콜백 ─────────────────────
if (!DEMO_MODE && (!window.DebateCore || typeof window.DebateCore.onReady !== "function")) {
  show("msg-screen");
  $("msg-text").innerHTML = "debate-core.js를 불러오지 못했습니다.<br>localhost 또는 배포 URL에서 실행하고 data-architect-id를 확인하세요.";
}

if (!DEMO_MODE && window.DebateCore && typeof window.DebateCore.onReady === "function") {
window.DebateCore.onReady(function (info) {

  if (!info.nickname) {
    show("msg-screen");
    $("msg-text").innerHTML = "토론 플랫폼을 통해 접속하세요.<br>기본 템플릿 점검은 <code>?demo=true&amp;nickname=test&amp;debateId=sandbox</code> 를 사용하세요.";
    return;
  }

  if (info.status !== "active") {
    show("msg-screen");
    $("msg-text").innerHTML = "토론이 진행 중이 아닙니다.<br>UI 점검은 데모 모드로 확인할 수 있습니다.";
    return;
  }

  _info    = info;
  _myAlias = info.nickname;
  _mySide  = info.side || null;
  _myRole  = info.role || "participant";

  if (_myRole !== "participant") {
    show("msg-screen");
    $("msg-text").innerHTML = "이 계정은 읽기 전용입니다.<br>참여 흐름 점검은 <code>?demo=true&amp;nickname=test&amp;debateId=sandbox</code> 로 확인하세요.";
    return;
  }

  hide("msg-screen");
  show("app");

  info.loadPayloads().then(function (payloads) {
    hydrateMyPayload(payloads[_myAlias]);
    _allPosts = Object.keys(payloads)
      .filter(k => k !== _myAlias && payloads[k] && (payloads[k].claim || payloads[k].thesis))
      .map(alias => payloadToPost(alias, payloads[alias]));
    enterAfterLoad();
  }).catch(function (e) {
    console.warn("[DebateApp] loadPayloads 실패:", e);
    enterAfterLoad();
  });
});
}

if (!DEMO_MODE) {
  window.setTimeout(function () {
    const appVisible = $("app") && !$("app").hidden;
    const msgVisible = $("msg-screen") && !$("msg-screen").hidden;
    if (appVisible || msgVisible) return;

    show("msg-screen");
    $("msg-text").innerHTML = "실제 참여는 토론 플랫폼을 통해 접속하세요.<br>기본 템플릿 점검은 <code>?demo=true&amp;nickname=test&amp;debateId=sandbox</code> 를 사용하세요.";
  }, 1500);
}
