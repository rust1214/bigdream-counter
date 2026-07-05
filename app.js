(() => {
  "use strict";

  const STORAGE_KEY = "bigdream-counter-state-v1";

  const defaults = {
    count: 0,
    title: "BIG DREAM",
    titleSize: 36,
    countSize: 52,
    backgroundColor: "#101114",
    textColor: "#f5f7fa"
  };

  const elements = {
    surface: document.getElementById("counterSurface"),
    count: document.getElementById("countValue"),
    title: document.getElementById("titleText"),
    minus: document.getElementById("minusButton"),
    settings: document.getElementById("settingsButton"),
    settingsOverlay: document.getElementById("settingsOverlay"),
    closeSettings: document.getElementById("closeSettingsButton"),
    titleInput: document.getElementById("titleInput"),
    titleSizeInput: document.getElementById("titleSizeInput"),
    titleSizeLabel: document.getElementById("titleSizeLabel"),
    countSizeInput: document.getElementById("countSizeInput"),
    countSizeLabel: document.getElementById("countSizeLabel"),
    backgroundColorInput: document.getElementById("backgroundColorInput"),
    textColorInput: document.getElementById("textColorInput"),
    resetButton: document.getElementById("resetButton"),
    resetOverlay: document.getElementById("resetOverlay"),
    resetCurrentValue: document.getElementById("resetCurrentValue"),
    cancelReset: document.getElementById("cancelResetButton"),
    confirmReset: document.getElementById("confirmResetButton")
  };

  let state = loadState();

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return { ...defaults, ...(saved || {}) };
    } catch {
      return { ...defaults };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage errors should not stop the counter from working.
    }
  }

  function applyCountSize() {
    const digits = String(state.count).length;
    let factor = 1;

    if (digits === 3) factor = 0.82;
    if (digits === 4) factor = 0.66;
    if (digits >= 5) factor = 0.54;

    const effectiveSize = state.countSize * factor;
    document.documentElement.style.setProperty("--count-size", `${effectiveSize}vw`);
  }

  function renderCount() {
    elements.count.textContent = String(state.count);
    applyCountSize();
  }

  function render() {
    renderCount();
    elements.title.textContent = state.title || " ";
    document.documentElement.style.setProperty("--background", state.backgroundColor);
    document.documentElement.style.setProperty("--foreground", state.textColor);
    document.documentElement.style.setProperty("--title-size", `${state.titleSize}px`);

    elements.titleInput.value = state.title;
    elements.titleSizeInput.value = String(state.titleSize);
    elements.titleSizeLabel.textContent = `${state.titleSize}px`;
    elements.countSizeInput.value = String(state.countSize);
    elements.countSizeLabel.textContent = String(state.countSize);
    elements.backgroundColorInput.value = state.backgroundColor;
    elements.textColorInput.value = state.textColor;
  }

  function changeCount(delta) {
    state.count = Math.max(0, state.count + delta);
    renderCount();
    saveState();
  }

  function openSettings() {
    elements.settingsOverlay.hidden = false;
  }

  function closeSettings() {
    elements.settingsOverlay.hidden = true;
  }

  function openResetConfirm() {
    elements.resetCurrentValue.textContent = String(state.count);
    elements.resetOverlay.hidden = false;
  }

  function closeResetConfirm() {
    elements.resetOverlay.hidden = true;
  }

  elements.surface.addEventListener("click", (event) => {
    if (event.target.closest("[data-no-increment]")) return;
    changeCount(1);
  });

  elements.minus.addEventListener("click", (event) => {
    event.stopPropagation();
    changeCount(-1);
  });

  elements.settings.addEventListener("click", (event) => {
    event.stopPropagation();
    openSettings();
  });

  elements.closeSettings.addEventListener("click", closeSettings);

  elements.settingsOverlay.addEventListener("click", (event) => {
    if (event.target === elements.settingsOverlay) closeSettings();
  });

  elements.titleInput.addEventListener("input", (event) => {
    state.title = event.target.value;
    elements.title.textContent = state.title || " ";
    saveState();
  });

  elements.titleSizeInput.addEventListener("input", (event) => {
    state.titleSize = Number(event.target.value);
    elements.titleSizeLabel.textContent = `${state.titleSize}px`;
    document.documentElement.style.setProperty("--title-size", `${state.titleSize}px`);
    saveState();
  });

  elements.countSizeInput.addEventListener("input", (event) => {
    state.countSize = Number(event.target.value);
    elements.countSizeLabel.textContent = String(state.countSize);
    applyCountSize();
    saveState();
  });

  elements.backgroundColorInput.addEventListener("input", (event) => {
    state.backgroundColor = event.target.value;
    document.documentElement.style.setProperty("--background", state.backgroundColor);
    saveState();
  });

  elements.textColorInput.addEventListener("input", (event) => {
    state.textColor = event.target.value;
    document.documentElement.style.setProperty("--foreground", state.textColor);
    saveState();
  });

  elements.resetButton.addEventListener("click", openResetConfirm);
  elements.cancelReset.addEventListener("click", closeResetConfirm);

  elements.confirmReset.addEventListener("click", () => {
    state.count = 0;
    saveState();
    renderCount();
    closeResetConfirm();
    closeSettings();
  });

  elements.resetOverlay.addEventListener("click", (event) => {
    if (event.target === elements.resetOverlay) closeResetConfirm();
  });

  render();
})();
