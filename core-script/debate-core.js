/**
 * Debate Core Script
 * 학생의 토론 웹사이트에 삽입되는 외부 스크립트
 *
 * 사용법:
 * <script src="debate-core.js" data-architect-id="본인닉네임"></script>
 *
 * window.DebateCore.onReady(({ nickname, side, role, status, schedule, savePayload }) => {
 *   // ...
 * })
 */
(function () {
  "use strict";

  // ── Firebase 설정 ──
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyD04qAl8A6qrM9Sseuyi49K-Pv_diy2F8A",
    authDomain: "debate-md2-2603.firebaseapp.com",
    projectId: "debate-md2-2603",
    storageBucket: "debate-md2-2603.firebasestorage.app",
    messagingSenderId: "475801845837",
    appId: "1:475801845837:web:568ca85fedda66f2819c04",
  };

  const HEARTBEAT_INTERVAL = 30000; // 30초

  // ── 상태 ──
  let _db = null;
  let _readyCallback = null;
  let _heartbeatTimer = null;
  let _architectId = null;
  let _nickname = null;
  let _side = null;
  let _debateIdParam = null;
  let _debateDoc = null;
  let _status = null;
  let _isActive = false;

  // ── 전역 객체 ──
  window.DebateCore = {
    onReady: function (callback) {
      _readyCallback = callback;
      // 이미 초기화 완료된 경우 즉시 호출
      if (_db && _debateDoc) {
        _invokeCallback();
      }
    },
  };

  // ── URL 파라미터 파싱 ──
  function parseParams() {
    const params = new URLSearchParams(window.location.search);
    _nickname = params.get("nickname") ? params.get("nickname").toLowerCase() : null;
    _side = params.get("side") || null;
    _debateIdParam = params.get("debateId") || null;
  }

  // ── architect ID 읽기 ──
  function getArchitectId() {
    const scriptTag = document.querySelector("script[data-architect-id]");
    if (scriptTag) {
      _architectId = scriptTag.getAttribute("data-architect-id").toLowerCase();
    }
    if (!_architectId) {
      console.error("[DebateCore] data-architect-id가 설정되지 않았습니다.");
    }
    if (_architectId === "default") {
      console.error("[DebateCore] data-architect-id가 'default'입니다. 본인 닉네임으로 변경하세요.");
      _architectId = null;
    }
  }

  // ── 토론 상태 계산 ──
  function calcStatus(startTime) {
    const now = Date.now();
    const start = startTime.toMillis ? startTime.toMillis() : new Date(startTime).getTime();
    const DAY = 24 * 60 * 60 * 1000;
    if (now < start) return "pending";
    if (now < start + DAY) return "active";
    if (now < start + 2 * DAY) return "reviewing";
    return "closed";
  }

  // ── Firebase 동적 로드 ──
  async function loadFirebase() {
    // Firebase compat SDK를 CDN에서 로드
    await loadScript("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
    await loadScript("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js");

    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    _db = firebase.firestore();
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ── 토론 문서 직접 로드 (debateId 파라미터) ──
  async function loadDebateById(debateId) {
    var docRef = _db.collection("debates").doc(debateId);
    var doc = await docRef.get();
    if (!doc.exists) {
      console.error("[DebateCore] debateId '" + debateId + "'에 해당하는 토론을 찾을 수 없습니다.");
      return null;
    }
    return { id: doc.id, data: doc.data() };
  }

  // ── 토론 문서 찾기 (architectId로 조회) ──
  async function findDebate() {
    const snapshot = await _db
      .collection("debates")
      .where("architect", "==", _architectId)
      .get();

    if (snapshot.empty) {
      console.error("[DebateCore] architect ID '" + _architectId + "'에 해당하는 토론을 찾을 수 없습니다.");
      return null;
    }

    // active인 토론 우선, 없으면 가장 가까운 미래 토론, 그것도 없으면 가장 최신
    var candidates = [];
    snapshot.forEach(function (doc) {
      var data = doc.data();
      var status = calcStatus(data.startTime);
      candidates.push({ id: doc.id, data: data, status: status });
    });

    // 1순위: active
    var active = candidates.find(function (c) { return c.status === "active"; });
    if (active) return active;

    // 2순위: reviewing (가장 최근)
    var reviewing = candidates
      .filter(function (c) { return c.status === "reviewing"; })
      .sort(function (a, b) { return b.data.startTime.toMillis() - a.data.startTime.toMillis(); });
    if (reviewing.length > 0) return reviewing[0];

    // 3순위: pending (가장 가까운 미래)
    var pending = candidates
      .filter(function (c) { return c.status === "pending"; })
      .sort(function (a, b) { return a.data.startTime.toMillis() - b.data.startTime.toMillis(); });
    if (pending.length > 0) return pending[0];

    // 4순위: closed (가장 최근)
    var closed = candidates
      .sort(function (a, b) { return b.data.startTime.toMillis() - a.data.startTime.toMillis(); });
    return closed[0] || null;
  }

  // ── 역할 판별 ──
  function getRole(debateData) {
    if (!_nickname) return "participant";
    if (debateData.architect === _nickname) return "architect";
    if (debateData.agendaSetter === _nickname) return "agendasetter";
    return "participant";
  }

  // ── 스케줄 가져오기 ──
  async function getSchedule() {
    var schedule = [];
    var snapshot = await _db
      .collection("debates")
      .orderBy("startTime", "asc")
      .get();

    snapshot.forEach(function (doc) {
      var d = doc.data();
      schedule.push({
        id: doc.id,
        agendaSetter: d.agendaSetter,
        architect: d.architect,
        startTime: d.startTime.toDate(),
      });
    });
    return schedule;
  }

  // ── Heartbeat ──
  function startHeartbeat(debateId) {
    if (_heartbeatTimer) return;

    function beat() {
      if (!_isActive) return;
      var ref = _db
        .collection("debates")
        .doc(debateId)
        .collection("sessions")
        .doc(_nickname);

      ref.set(
        {
          lastHeartbeat: firebase.firestore.FieldValue.serverTimestamp(),
          isActive: true,
        },
        { merge: true }
      );

      // totalDuration 증가 (30초씩)
      ref.update({
        totalDuration: firebase.firestore.FieldValue.increment(HEARTBEAT_INTERVAL / 1000),
      }).catch(function () {
        // 문서가 아직 없으면 set으로 초기화
        ref.set(
          {
            lastHeartbeat: firebase.firestore.FieldValue.serverTimestamp(),
            totalDuration: HEARTBEAT_INTERVAL / 1000,
            isActive: true,
          },
          { merge: true }
        );
      });
    }

    // 즉시 첫 heartbeat
    beat();
    _heartbeatTimer = setInterval(beat, HEARTBEAT_INTERVAL);
  }

  function stopHeartbeat(debateId) {
    if (_heartbeatTimer) {
      clearInterval(_heartbeatTimer);
      _heartbeatTimer = null;
    }
    // 세션 비활성화
    if (_nickname && debateId) {
      _db
        .collection("debates")
        .doc(debateId)
        .collection("sessions")
        .doc(_nickname)
        .update({ isActive: false })
        .catch(function () {});
    }
  }

  // ── savePayload ──
  function createSavePayload(debateId) {
    return function (data) {
      if (!_isActive) {
        console.warn("[DebateCore] 토론이 진행중이 아니므로 저장할 수 없습니다.");
        return Promise.reject(new Error("Debate is not active"));
      }
      if (!_nickname) {
        console.warn("[DebateCore] 닉네임이 없어 저장할 수 없습니다.");
        return Promise.reject(new Error("No nickname"));
      }
      return _db
        .collection("debates")
        .doc(debateId)
        .collection("payloads")
        .doc(_nickname)
        .set(
          {
            data: data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    };
  }

  // ── 토론 상태 실시간 감시 ──
  function watchStatus(debateId) {
    _db
      .collection("debates")
      .doc(debateId)
      .onSnapshot(function (doc) {
        if (!doc.exists) return;
        var data = doc.data();
        var newStatus = calcStatus(data.startTime);

        if (newStatus !== _status) {
          _status = newStatus;
          _isActive = newStatus === "active";

          if (_isActive && _nickname && getRole(data) === "participant") {
            startHeartbeat(debateId);
          } else {
            stopHeartbeat(debateId);
          }

          // 콜백 재호출 (상태 변경 알림)
          _invokeCallback();
        }
      });
  }

  // ── 콜백 호출 ──
  function _invokeCallback() {
    if (!_readyCallback || !_debateDoc) return;
    _readyCallback({
      nickname: _nickname,
      side: _side,
      role: getRole(_debateDoc.data),
      status: _status,
      title: _debateDoc.data.title || "",
      agendaSetter: _debateDoc.data.agendaSetter || "",
      architect: _debateDoc.data.architect || "",
      schedule: window.DebateCore._schedule || [],
      savePayload: createSavePayload(_debateDoc.id),
      loadPayloads: createLoadPayloads(_debateDoc.id),
      onPayloadsChange: createOnPayloadsChange(_debateDoc.id),
    });
  }

  // ── loadPayloads (전체 payload 1회 읽기) ──
  function createLoadPayloads(debateId) {
    return function () {
      return _db
        .collection("debates")
        .doc(debateId)
        .collection("payloads")
        .get()
        .then(function (snapshot) {
          var result = {};
          snapshot.forEach(function (doc) {
            result[doc.id] = doc.data().data;
          });
          return result;
        });
    };
  }

  // ── onPayloadsChange (전체 payload 실시간 감시) ──
  function createOnPayloadsChange(debateId) {
    return function (callback) {
      return _db
        .collection("debates")
        .doc(debateId)
        .collection("payloads")
        .onSnapshot(function (snapshot) {
          var result = {};
          snapshot.forEach(function (doc) {
            result[doc.id] = doc.data().data;
          });
          callback(result);
        });
    };
  }

  // ── 페이지 떠날 때 정리 ──
  window.addEventListener("beforeunload", function () {
    if (_debateDoc) {
      stopHeartbeat(_debateDoc.id);
    }
  });

  // visibilitychange로 탭 전환 감지
  document.addEventListener("visibilitychange", function () {
    if (!_debateDoc || !_isActive || !_nickname) return;
    if (document.hidden) {
      stopHeartbeat(_debateDoc.id);
    } else {
      if (getRole(_debateDoc.data) === "participant") {
        startHeartbeat(_debateDoc.id);
      }
    }
  });

  // ── 데모 모드 ──
  // URL에 ?demo=true 를 붙이면 Firebase 없이 가짜 데이터로 동작
  // 개발/테스트용. 자기 차례가 아닐 때도 UI를 확인할 수 있음
  var _demoPayloads = {};

  function isDemo() {
    return new URLSearchParams(window.location.search).get("demo") === "true";
  }

  function initDemo() {
    parseParams();
    _nickname = _nickname || "테스트유저";
    _side = _side || "pro";
    _status = "active";
    _isActive = true;

    // 데모용 더미 의견 데이터
    _demoPayloads = {
      "alice": {
        opinions: [
          { text: "이 주제에 대해 찬성합니다. 충분한 근거가 있다고 봅니다.", side: "pro", timestamp: Date.now() - 300000 },
          { text: "추가로 말하자면, 이건 사회적 합의가 필요한 문제입니다.", side: "pro", timestamp: Date.now() - 100000 },
        ]
      },
      "nemo": {
        opinions: [
          { text: "반대합니다. 현실적으로 실현 가능성이 낮습니다.", side: "con", timestamp: Date.now() - 200000 },
        ]
      },
      "kyo": {
        opinions: [
          { text: "저도 반대 의견입니다. 부작용이 더 클 것으로 예상됩니다.", side: "con", timestamp: Date.now() - 150000 },
        ]
      },
    };

    _debateDoc = {
      id: "demo-debate",
      data: {
        title: "[데모] 토론 주제 예시입니다",
        architect: "demo",
        agendaSetter: "demo",
        startTime: { toMillis: function() { return Date.now() - 3600000; } },
      },
    };

    window.DebateCore._schedule = [];

    if (_readyCallback) {
      _readyCallback({
        nickname: _nickname,
        side: _side,
        role: "participant",
        status: "active",
        title: _debateDoc.data.title,
        agendaSetter: _debateDoc.data.agendaSetter,
        architect: _debateDoc.data.architect,
        schedule: [],
        savePayload: function(data) {
          _demoPayloads[_nickname] = data;
          localStorage.setItem("debate-demo-payloads", JSON.stringify(_demoPayloads));
          console.log("[DebateCore 데모] 저장됨:", data);
          return Promise.resolve();
        },
        loadPayloads: function() {
          var stored = localStorage.getItem("debate-demo-payloads");
          if (stored) {
            try { Object.assign(_demoPayloads, JSON.parse(stored)); } catch(e) {}
          }
          console.log("[DebateCore 데모] 불러옴:", _demoPayloads);
          return Promise.resolve(JSON.parse(JSON.stringify(_demoPayloads)));
        },
        onPayloadsChange: function(callback) {
          callback(JSON.parse(JSON.stringify(_demoPayloads)));
        },
      });
    }

    console.log("[DebateCore] 🟡 데모 모드로 실행 중 — Firebase에 연결하지 않습니다");
  }

  // ── 초기화 ──
  async function init() {
    if (isDemo()) {
      initDemo();
      return;
    }

    parseParams();
    getArchitectId();

    if (!_architectId && !_debateIdParam) return;

    try {
      await loadFirebase();

      var debate = _debateIdParam
        ? await loadDebateById(_debateIdParam)
        : await findDebate();
      if (!debate) return;

      _debateDoc = debate;
      _status = calcStatus(debate.data.startTime);
      _isActive = _status === "active";

      // 스케줄 로드
      window.DebateCore._schedule = await getSchedule();

      // 참여자이고 active이면 heartbeat 시작
      if (_isActive && _nickname && getRole(debate.data) === "participant") {
        startHeartbeat(debate.id);
      }

      // 상태 실시간 감시
      watchStatus(debate.id);

      // 콜백 호출
      _invokeCallback();

      console.log("[DebateCore] 초기화 완료 — debate: " + debate.id + ", status: " + _status);
    } catch (err) {
      console.error("[DebateCore] 초기화 실패:", err);
    }
  }

  // DOM 준비 후 초기화
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
