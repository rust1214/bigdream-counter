(() => {
  "use strict";

  const KEY = "tamaijiri-t-state-v1";

  const voices = [
    { name: "WOW!", meaning: "デフォルトA", type: "default" },
    { name: "GOOD!", meaning: "デフォルトB", type: "default" },
    { name: "FOCUS!", meaning: "デフォルトC", type: "default" },
    { name: "MARVELOUS!", meaning: "残り60・30・15pt以下示唆", type: "hint" },
    { name: "FIVE", meaning: "残り5pt濃厚", type: "concentrated" },
    { name: "FOUR", meaning: "残り4pt濃厚", type: "concentrated" },
    { name: "THREE", meaning: "残り3pt濃厚", type: "concentrated" },
    { name: "TWO", meaning: "残り2pt濃厚", type: "concentrated" },
    { name: "ONE", meaning: "残り1pt濃厚", type: "concentrated" },
    { name: "BIG DREAM", meaning: "デフォルトD", type: "default" },
    { name: "MEGA DREAM", meaning: "デフォルトE", type: "default" },
    { name: "GIGA DREAM", meaning: "デフォルトF", type: "default" },
    { name: "TERA DREAM", meaning: "チャンスボイス（詳細不明）", type: "hint" },
    { name: "SEVEN DREAM", meaning: "残り27・17・7pt以下示唆", type: "hint" },
    { name: "GOLDEN DREAM", meaning: "残り50pt以下示唆", type: "hint" },
    { name: "INFINITE DREAM", meaning: "残り30pt以下示唆", type: "hint" },
    { name: "究極DREAM", meaning: "残り20pt以下示唆", type: "hint" },
    { name: "1万DREAM", meaning: "残り10pt以下示唆", type: "hint" }
  ];

  const $ = (id) => document.getElementById(id);
  const elements = {
    count: $("countValue"),
    last: $("lastRecord"),
    undo: $("undoButton"),
    voice: $("voiceButton"),
    history: $("historyButton"),
    menu: $("menuButton"),
    voiceList: $("voiceList"),
    historyList: $("historyList"),
    voiceCount: $("voiceCurrentCount"),
    stageSummary: $("stageBallSummary"),
    stageLater: $("stageLaterButton"),
    report: $("reportButton"),
    csv: $("csvButton"),
    backup: $("backupButton"),
    reset: $("resetButton"),
    cancelReset: $("cancelResetButton"),
    confirmReset: $("confirmResetButton")
  };

  let state = load();
  let pendingIndex = null;

  function load() {
    try {
      return {
        count: 0,
        records: [],
        startedAt: new Date().toISOString(),
        ...JSON.parse(localStorage.getItem(KEY) || "{}")
      };
    } catch {
      return { count: 0, records: [], startedAt: new Date().toISOString() };
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function now() {
    return new Date().toISOString();
  }

  function makeId() {
    return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
  }

  function render() {
    elements.count.textContent = state.count;
    const last = state.records.at(-1);
    elements.last.textContent = last ? summary(last) : "まだありません";
    elements.undo.disabled = !last;
  }

  function summary(record) {
    if (record.kind === "ball") {
      return `${record.count}球 ${record.color}${record.stage ? `・${record.stage}` : ""}`;
    }
    return `${record.count}球 ${record.voice}・${record.meaning}`;
  }

  function open(id) {
    $(id).hidden = false;
  }

  function close(id) {
    $(id).hidden = true;
  }

  function toast(text) {
    const item = document.createElement("div");
    item.className = "toast";
    item.textContent = text;
    document.body.appendChild(item);
    setTimeout(() => item.remove(), 1200);
  }

  function addBall(color) {
    state.count += 1;
    state.records.push({
      id: makeId(),
      kind: "ball",
      count: state.count,
      color,
      stage: null,
      time: now()
    });
    pendingIndex = state.records.length - 1;
    save();
    render();
    elements.stageSummary.textContent = `${state.count}球目・${color}玉`;
    open("stageOverlay");
    toast(`${color}玉を記録`);
  }

  function setStage(stage) {
    if (pendingIndex !== null && state.records[pendingIndex]) {
      state.records[pendingIndex].stage = stage;
    }
    save();
    render();
    pendingIndex = null;
    close("stageOverlay");
    toast(stage);
  }

  function addVoice(voice) {
    state.records.push({
      id: makeId(),
      kind: "voice",
      count: state.count,
      voice: voice.name,
      meaning: voice.meaning,
      type: voice.type,
      time: now()
    });
    save();
    render();
    close("voiceOverlay");
    toast(`${voice.name}を記録`);
  }

  function renderVoices() {
    elements.voiceList.innerHTML = "";
    voices.forEach((voice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `voice-item ${voice.type === "concentrated" ? "concentrated" : ""}`;
      button.innerHTML = `<strong>${voice.name}</strong><span>${voice.meaning}${voice.type === "hint" ? " ※保証ではありません" : ""}</span>`;
      button.addEventListener("click", () => addVoice(voice));
      elements.voiceList.appendChild(button);
    });
  }

  function renderHistory() {
    elements.historyList.innerHTML = "";
    if (!state.records.length) {
      elements.historyList.innerHTML = '<p class="empty">まだ記録がありません</p>';
      return;
    }

    state.records.slice().reverse().forEach((record) => {
      const item = document.createElement("div");
      item.className = "history-item";
      const date = new Date(record.time);
      item.innerHTML = `<div class="row"><strong>${summary(record)}</strong><small>${date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</small></div>`;
      elements.historyList.appendChild(item);
    });
  }

  function undo() {
    const record = state.records.pop();
    if (!record) return;
    if (record.kind === "ball") state.count = Math.max(0, state.count - 1);
    save();
    render();
    toast("直前の記録を戻しました");
  }

  function countBy(records, key, value) {
    return records.filter((record) => record[key] === value).length;
  }

  function buildReport() {
    const balls = state.records.filter((record) => record.kind === "ball");
    const voiceRecords = state.records.filter((record) => record.kind === "voice");
    const stages = ["失敗", "1段階突破", "2段階突破", "最終突破"];
    const colors = ["青", "緑", "赤", "金"];
    const started = new Date(state.startedAt || state.records[0]?.time || Date.now());
    const lines = [
      "玉いじりT 実戦レポート",
      `開始: ${started.toLocaleString("ja-JP")}`,
      `現在球数: ${state.count}球`,
      `玉記録: ${balls.length}件 / ボイス記録: ${voiceRecords.length}件`,
      "",
      "【玉色】"
    ];

    colors.forEach((color) => {
      const total = countBy(balls, "color", color);
      const finalCount = balls.filter((record) => record.color === color && record.stage === "最終突破").length;
      const finalRate = total ? ((finalCount / total) * 100).toFixed(1) : "0.0";
      lines.push(`${color}: ${total}回（最終突破 ${finalCount}回 / ${finalRate}%）`);
    });

    lines.push("", "【突破結果】");
    stages.forEach((stage) => lines.push(`${stage}: ${countBy(balls, "stage", stage)}回`));
    lines.push(`未入力: ${balls.filter((record) => !record.stage).length}回`);

    lines.push("", "【ボイス】");
    if (!voiceRecords.length) {
      lines.push("記録なし");
    } else {
      const grouped = new Map();
      voiceRecords.forEach((record) => grouped.set(record.voice, (grouped.get(record.voice) || 0) + 1));
      grouped.forEach((total, voice) => {
        const record = voiceRecords.find((item) => item.voice === voice);
        lines.push(`${voice}: ${total}回（${record.meaning}）`);
      });
    }

    lines.push("", "【時系列】");
    state.records.forEach((record) => {
      const time = new Date(record.time).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
      lines.push(`${time}  ${summary(record)}`);
    });

    return lines.join("\n");
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function shareReport() {
    const report = buildReport();
    const date = new Date().toISOString().slice(0, 10);

    try {
      if (navigator.share) {
        await navigator.share({ title: "玉いじりT 実戦レポート", text: report });
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(report);
        toast("レポートをコピーしました");
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
    }

    downloadFile(report, `tamaijiri-t-report-${date}.txt`, "text/plain;charset=utf-8");
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  }

  function exportCsv() {
    const header = ["日時", "球数", "種別", "玉色", "突破結果", "ボイス", "示唆内容", "判定区分"];
    const rows = state.records.map((record) => [
      new Date(record.time).toLocaleString("ja-JP"),
      record.count,
      record.kind === "ball" ? "玉" : "ボイス",
      record.color || "",
      record.stage || "",
      record.voice || "",
      record.meaning || "",
      record.type === "concentrated" ? "濃厚" : record.type === "hint" ? "示唆" : record.type === "default" ? "デフォルト" : ""
    ]);
    const csv = "\ufeff" + [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
    downloadFile(csv, `tamaijiri-t-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
  }

  function exportBackup() {
    downloadFile(
      JSON.stringify(state, null, 2),
      `tamaijiri-t-backup-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json"
    );
  }

  document.querySelectorAll(".ball-button").forEach((button) => {
    button.addEventListener("click", () => addBall(button.dataset.color));
  });

  document.querySelectorAll("[data-stage]").forEach((button) => {
    button.addEventListener("click", () => setStage(button.dataset.stage));
  });

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => close(button.dataset.close));
  });

  elements.stageLater.addEventListener("click", () => {
    pendingIndex = null;
    close("stageOverlay");
  });

  elements.voice.addEventListener("click", () => {
    elements.voiceCount.textContent = state.count;
    open("voiceOverlay");
  });

  elements.history.addEventListener("click", () => {
    renderHistory();
    open("historyOverlay");
  });

  elements.menu.addEventListener("click", () => open("menuOverlay"));
  elements.undo.addEventListener("click", undo);
  elements.report.addEventListener("click", shareReport);
  elements.csv.addEventListener("click", exportCsv);
  elements.backup.addEventListener("click", exportBackup);
  elements.reset.addEventListener("click", () => open("confirmOverlay"));
  elements.cancelReset.addEventListener("click", () => close("confirmOverlay"));

  elements.confirmReset.addEventListener("click", () => {
    state = { count: 0, records: [], startedAt: new Date().toISOString() };
    save();
    render();
    close("confirmOverlay");
    close("menuOverlay");
    toast("リセットしました");
  });

  document.querySelectorAll(".overlay").forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) overlay.hidden = true;
    });
  });

  renderVoices();
  render();
})();
