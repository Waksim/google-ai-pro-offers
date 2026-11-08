/* Передача применённых настроек из хранилища расширения на страницу. */
(() => {
  const CONFIG_KEY = "gapt_config";
  let config = null;
  let receivedChange = false;

  function pushConfig() {
    window.postMessage({ __gapt: 1, type: "config", config }, location.origin);
  }

  window.addEventListener("message", (event) => {
    if (event.source === window && event.origin === location.origin &&
        event.data?.__gapt === 1 && event.data.type === "ready") {
      pushConfig();
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !Object.hasOwn(changes, CONFIG_KEY)) return;
    receivedChange = true;
    config = changes[CONFIG_KEY].newValue ?? null;
    pushConfig();
  });

  chrome.storage.local.get(CONFIG_KEY).then((data) => {
    if (receivedChange) return;
    config = data[CONFIG_KEY] ?? null;
    pushConfig();
  }).catch((error) => {
    console.warn("Не удалось загрузить настройки предложений.", error);
  });
})();
