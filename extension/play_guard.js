/* Подсказка в платёжном окне на основе видимого текста условий. */
(() => {
  if (window.top === window || !document.body) return;

  const CONFIG_KEY = "gapt_config";
  const offers = new Set(["12m", "6m_ss", "6m", "6m_2"]);
  const trialWords = [
    "free trial", "免费试用", "$0.00", "€0.00", "won't be charged",
    "不会向您收费", "不会收费", "бесплатный пробный период"
  ];
  const paymentWords = [
    "/mo after", "/month after", "per month after", "立即付款",
    "pay now", "今日扣款", "charged today", "оплатить сейчас", "списание сегодня"
  ];
  const body = document.body;
  let bar = null;
  let receivedChange = false;

  function showHint() {
    const visible = body.innerText;
    const terms = (bar ? visible.replace(bar.innerText, "") : visible).toLowerCase();
    const trial = trialWords.some((word) => terms.includes(word));
    const payment = paymentWords.some((word) => terms.includes(word));

    let message = "Сверь сумму сегодня, срок предложения и следующий платёж.";
    if (trial && payment) {
      message = "Указаны пробный период и платежи. Сверь суммы и даты.";
    } else if (trial) {
      message = "Есть упоминание пробного периода. Сверь сумму сегодня и условия продления.";
    } else if (payment) {
      message = "Есть упоминание оплаты. Сверь сумму и дату списания.";
    }

    if (!bar) {
      bar = document.createElement("div");
      bar.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:2147483647;" +
        "padding:10px 14px;background:#293a58;color:#fff;" +
        "font:600 13px/1.5 -apple-system,Segoe UI,sans-serif;text-align:center;pointer-events:none";
      body.appendChild(bar);
    }
    if (bar.textContent !== message) bar.textContent = message;
  }

  const observer = new MutationObserver(showHint);
  function setConfig(config) {
    observer.disconnect();
    if (offers.has(config?.layer)) {
      showHint();
      observer.observe(body, { childList: true, subtree: true, characterData: true });
    } else if (bar) {
      bar.remove();
      bar = null;
    }
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !Object.hasOwn(changes, CONFIG_KEY)) return;
    receivedChange = true;
    setConfig(changes[CONFIG_KEY].newValue);
  });

  chrome.storage.local.get(CONFIG_KEY).then((data) => {
    if (!receivedChange) setConfig(data[CONFIG_KEY]);
  }).catch((error) => {
    console.warn("Не удалось загрузить настройки подсказки Google Play.", error);
  });
})();
