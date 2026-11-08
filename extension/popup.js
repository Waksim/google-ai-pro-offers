const CONFIG_KEY = "gapt_config";
const form = document.getElementById("settings");
const options = document.getElementById("options");
const offers = Array.from(form.querySelectorAll('input[name="offer"]'));
const youtubeInput = document.getElementById("youtube");
const applyButton = document.getElementById("apply");
const status = document.getElementById("status");

let savedConfig = { layer: "off", youtube: false };

function selection() {
  const layer = offers.find((input) => input.checked)?.value ?? "off";
  return { layer, youtube: layer !== "off" && youtubeInput.checked };
}

function showStatus(message, tone = "") {
  status.textContent = message;
  status.dataset.tone = tone;
}

function refreshDraft() {
  const draft = selection();
  youtubeInput.disabled = draft.layer === "off";
  if (youtubeInput.disabled) youtubeInput.checked = false;

  if (draft.layer !== savedConfig.layer || draft.youtube !== savedConfig.youtube) {
    showStatus("Выбор изменён. Нажми «Применить».", "pending");
  } else if (savedConfig.layer === "off") {
    showStatus("Подмена выключена.");
  } else {
    const label = offers.find((input) => input.value === savedConfig.layer).dataset.label;
    const addOn = savedConfig.youtube ? " + YouTube Premium" : "";
    showStatus("Сохранено · " + label + addOn, "ready");
  }
}

form.addEventListener("change", (event) => {
  const input = event.target;
  if (input.name === "offer" && input.checked) {
    for (const other of offers) {
      if (other !== input) other.checked = false;
    }
  }
  refreshDraft();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (applyButton.disabled) return;

  const draft = selection();
  options.disabled = true;
  applyButton.disabled = true;
  try {
    await chrome.storage.local.set({ [CONFIG_KEY]: draft });
    savedConfig = draft;
    if (draft.layer === "off") {
      showStatus("Подмена выключена. Обнови вкладку Google One.");
    } else {
      showStatus("Настройки сохранены. Обнови вкладку Google One.", "ready");
    }
  } catch (error) {
    console.warn("Не удалось сохранить настройки предложений.", error);
    showStatus("Ошибка сохранения. Нажми «Применить» ещё раз.", "error");
  } finally {
    options.disabled = false;
    applyButton.disabled = false;
  }
});

async function loadSelection() {
  const data = await chrome.storage.local.get([CONFIG_KEY, "gapt_layer"]);
  const stored = data[CONFIG_KEY];
  if (offers.some((input) => input.value === stored?.layer)) {
    savedConfig = { layer: stored.layer, youtube: stored.youtube === true };
  }

  // Старый выбор показываем как черновик. Он вступит в силу после «Применить».
  const draftLayer = stored === undefined ? data.gapt_layer : savedConfig.layer;
  for (const input of offers) input.checked = input.value === draftLayer;
  youtubeInput.checked = savedConfig.youtube;
  refreshDraft();
  options.disabled = false;
  applyButton.disabled = false;
}

loadSelection().catch((error) => {
  console.warn("Не удалось загрузить настройки предложений.", error);
  showStatus("Ошибка загрузки настроек. Открой меню расширения заново.", "error");
});
