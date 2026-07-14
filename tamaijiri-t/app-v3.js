(() => {
  "use strict";

  const STORAGE_KEY = "tamaijiri-t-state-v1";

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

  let state = loadState();
  let pendingRecordId = null;

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        count: Number.isFinite(Number(parsed.count)) ? Number(parsed.count) : 0,
        records: Array.isArray(parsed.records) ? parsed.records : []
      };
    } catch {
      return { count: 0, records: [] };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function makeId() {
    return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  }

  function now() {
    return new Date().toISOString();
  }

  function openOverlay(id) {
    const overlay = $(id);
    if (overlay) overlay.hidden = false;
  }

  function closeOverlay(id) {
    const overlay = $(id);
    if (overlay) overlay.hidden = true;
  }

  function recordSummary(record) {
    if (record.kind === "ball") {
      return `${record.count}球 ${record.color}玉${record.stage ? `・${record.stage}` : ""}`;
    }
    return `${record.count}球 ${record.voice}・${record.meaning}`;
  }

  function render() {
    elements.count.textContent = String(state.count);
    const last = state.records.at(-1);
    elements.last.textContent = last ? recordSummary(last) : "まだありません";
    elements.undo.disabled = !last;
  }

  function toast(text) {
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = text;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 1200);
  }

  function addBall(color) {
    state.count += 1;
    const record = {
      id: makeId(),
      kind: "ball",
      count: state.count,
      color,
      stage: null,
      time: now()
    };
    state.records.push(record);
    pendingRecordId = record.id;
    saveState();
    render();
    elements.stageSummary.textContent = `${state.count}球目・${color}玉`;
    openOverlay("stageOverlay");
    toast(`${color}玉を記録`);
  }

  function setStage(stage) {
    const record = state.records.find((item) => item.id === pendingRecordId);
    if (record) record.stage = stage;
    pendingRecordId = null;
    saveState();
    render();
    closeOverlay("stageOverlay");
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
    saveState();
    render();
    closeOverlay("voiceOverlay");
    toast(`${voice.name}を記録`);
  }

  function renderVoices() {
    elements.voiceList.replaceChildren();
    for (const voice of voices) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `voice-item ${voice.type === "concentrated" ? "concentrated" : ""}`;

      const title = document.createElement("strong");
      title.textContent = voice.name;
      const detail = document.createElement("span");
      detail.textContent = `${voice.meaning}${voice.type === "hint" ? " ※保証ではありません" : ""}`;

      button.append(title, detail);
      button.addEventListener("click", () => addVoice(voice));
      elements.voiceList.appendChild(button);
    }
  }

  function renderHistory() {
    elements.historyList.replaceChildren();
    if (!state.records.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "まだ記録がありません";
      elements.historyList.appendChild(empty);
      return;
    }

    for (const record of [...state.records].reverse()) {
      const item = document.createElement("div");
      item.className = "history-item";
      const row = document.createElement("div");
      row.className = "row";
      const summary = document.createElement("strong");
      summary.textContent = recordSummary(record);
      const time = document.createElement("small");
      time.textContent = new Date(record.time).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit"
      });
      row.append(summary, time);
      item.appendChild(row);
      elements.historyList.appendChild(item);
    }
  }

  function undo() {
    const removed = state.records.pop();
    if (!removed) return;
    if (removed.kind === "ball") state.count = Math.max(0, state.count - 1);
    saveState();
    render();
    toast("直前の記録を戻しました");
  }

  function countBy(items, keyGetter) {
    const map = new Map();
    for (const item of items) {
      const key = keyGetter(item);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }

  function buildReport() {
    const balls = state.records.filter((record) => record.kind === "ball");
    const voiceRecords = state.records.filter((record) => record.kind === "voice");
    const colors = countBy(balls, (record) => record.color);
    const stages = countBy(balls.filter((record) => record.stage), (record) => record.stage);
    const voiceCounts = countBy(voiceRecords, (record) => `${record.voice}\t${record.meaning}`);

    const lines = [
      "玉いじりT 実戦レポート",
      `作成日時：${new Date().toLocaleString("ja-JP")}`,
      `現在球数：${state.count}球`,
      `玉記録：${balls.length}件`,
      `ボイス記録：${voiceRecords.length}件`,
      "",
      "【玉色】"
    ];

    for (const color of ["青", "緑", "赤", "金"]) {
      lines.push(`${color}：${colors.get(color) || 0}回`);
    }

    lines.push("", "【突破結果】");
    for (const stage of ["失敗", "1段階突破", "2段階突破", "最終突破"]) {
      lines.push(`${stage}：${stages.get(stage) || 0}回`);
    }

    lines.push("", "【ボイス】");
    if (!voiceCounts.size) {
      lines.push("記録なし");
    } else {
      for (const [key, count] of voiceCounts) {
        const [voice, meaning] = key.split("\t");
        lines.push(`${voice}：${count}回`, `  ${meaning}`);
      }
    }

    lines.push("", "【時系列】");
    if (!state.records.length) {
      lines.push("記録なし");
    } else {
      for (const record of state.records) {
        const time = new Date(record.time).toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit"
        });
        lines.push(`${time}　${recordSummary(record)}`);
      }
    }

    return lines.join("\n");
  }

  function downloadText(filename, text, type) {
    const blob = new Blob([text], { type });
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
    try {
      if (navigator.share) {
        await navigator.share({ title: "玉いじりT 実戦レポート", text: report });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
        toast("レポートをコピーしました");
      } else {
        downloadText(`tamaijiri-t-report-${dateStamp()}.txt`, report, "text/plain;charset=utf-8");
      }
      closeOverlay("menuOverlay");
    } catch (error) {
      if (error?.name !== "AbortError") {
        downloadText(`tamaijiri-t-report-${dateStamp()}.txt`, report, "text/plain;charset=utf-8");
      }
    }
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  }

  function exportCsv() {
    const header = ["日時", "球数", "種別", "玉色", "突破結果", "ボイス", "示唆内容"];
    const rows = state.records.map((record) => [
      new Date(record.time).toLocaleString("ja-JP"),
      record.count,
      record.kind === "ball" ? "玉" : "ボイス",
      record.color || "",
      record.stage || "",
      record.voice || "",
      record.meaning || ""
    ]);
    const csv = "\ufeff" + [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
    downloadText(`tamaijiri-t-${dateStamp()}.csv`, csv, "text/csv;charset=utf-8");
    closeOverlay("menuOverlay");
  }

  function exportBackup() {
    downloadText(
      `tamaijiri-t-backup-${dateStamp()}.json`,
      JSON.stringify(state, null, 2),
      "application/json;charset=utf-8"
    );
    closeOverlay("menuOverlay");
  }

  function dateStamp() {
    return new Date().toISOString().slice(0, 10);
  }

  document.querySelectorAll(".ball-button").forEach((button) => {
    button.addEventListener("click", () => addBall(button.dataset.color));
  });

  document.querySelectorAll("[data-stage]").forEach((button) => {
    button.addEventListener("click", () => setStage(button.dataset.stage));
  });

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => closeOverlay(button.dataset.close));
  });

  elements.stageLater.addEventListener("click", () => {
    pendingRecordId = null;
    closeOverlay("stageOverlay");
  });

  elements.voice.addEventListener("click", () => {
    elements.voiceCount.textContent = String(state.count);
    openOverlay("voiceOverlay");
  });

  elements.history.addEventListener("click", () => {
    renderHistory();
    openOverlay("historyOverlay");
  });

  elements.menu.addEventListener("click", () => openOverlay("menuOverlay"));
  elements.undo.addEventListener("click", undo);
  elements.report.addEventListener("click", shareReport);
  elements.csv.addEventListener("click", exportCsv);
  elements.backup.addEventListener("click", exportBackup);
  elements.reset.addEventListener("click", () => openOverlay("confirmOverlay"));
  elements.cancelReset.addEventListener("click", () => closeOverlay("confirmOverlay"));
  elements.confirmReset.addEventListener("click", () => {
    state = { count: 0, records: [] };
    saveState();
    render();
    closeOverlay("confirmOverlay");
    closeOverlay("menuOverlay");
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
