/* Подстановка выбранного предложения в запрос оформления Google One. */
(() => {
  if (window.__GAPT_HOOKED) return;
  window.__GAPT_HOOKED = true;

  const PREFIX = "subs:com.google.android.apps.subscriptions.red:";

  const TOKENS = {
    "12m": "AVbCH/cspB8VdqKJ+ax/uPxUFAVuYRPX4iSjtg4Fu0PG9zUeURSM7y//LlQva1dCd/rbKVM6EJmyiG/C9BoQ95pMl8yDCHuiwCvM5CuGJME=",
    "6m_ss": "AVbCH/cgl4zvPT2Lqw95Gn+RYAJIVwFwi783i6uVprX7u3MCa5J4CcTXH5RABa5WjBrUoQnwf8vI10TNV7ktd26myIdxqIwGmNoJ5ofYNqpQ10RKoSvHs75wsfA=",
    "6m": "AVbCH/fUON3w8hpfeutprA3BMQwrBwYIB6Y8CSWi1isDCDswKUUhGQ3dluj5WXsNKOvr8K5UULBGrRsf4KlW1rHLz0fF3SvxQhBFRbBOHCA=",
    "6m_2": "AVbCH/cJ5SeHgkVRt+bdcrapx/aLSu2kbsBgMdI413zbllDNsNQoC/zVlG/Npbu55WlMzBwWPhUedIvZFDg7fw0CmCv/8DKj04IZ21pK7mrV/hh5"
  };
  const YT_FREE_TOK = "AVbCH/eW4Nfp8KBl0zlm7x9PhaiCvpnqwUuL2D8NFPBQgmM9+HuYS1h2xH5lLWU/BsBj775LK5GqK8UHKqoSzhDDz+PqP3paNesqLU0r9i6XCrYa";
  const LABELS = {
    "12m": "12 месяцев",
    "6m_ss": "6 месяцев · SS",
    "6m": "6 месяцев",
    "6m_2": "6 месяцев · вариант 2"
  };

  let currentTest = null;
  let subId = null;

  function makeCfg(config) {
    const layer = config?.layer;
    if (typeof layer !== "string" || !Object.hasOwn(TOKENS, layer)) return null;

    const youtube = config.youtube === true;
    const fullItems = [
      [[PREFIX + "g1.2tb.ai.subs_variant", 21], null, null, null, 1, [TOKENS[layer]]]
    ];
    if (youtube) {
      fullItems.push(
        [[PREFIX + "g1.youtube_premium_individual_add_on", 21], null, null, null, 1, [YT_FREE_TOK]]
      );
    }
    return { layer, youtube, full_items: fullItems, ear8: null };
  }

  /* Статус на странице Google One. */
  let badge = null;
  function showBadge(text, color) {
    try {
      if (!document.body) return;
      if (!badge) {
        badge = document.createElement("div");
        badge.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:2147483647;" +
          "padding:8px 12px;border-radius:8px;font:12px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;" +
          "box-shadow:0 2px 10px rgba(0,0,0,.15);border:1px solid #d0d0d0;background:#fff;color:#333;max-width:260px;";
        document.body.appendChild(badge);
      }
      badge.textContent = text;
      badge.style.background = color || "#fff";
    } catch (e) {}
  }

  function refreshBadge() {
    if (!currentTest) {
      showBadge("Подмена выключена", "#f5f5f5");
    } else {
      const addOn = currentTest.youtube ? " + YouTube Premium" : "";
      showBadge("Подмена включена · " + LABELS[currentTest.layer] + addOn, "#eaf7ea");
    }
  }

  /* Обработка запросов оформления. */
  function patchNode(node) {
    if (!Array.isArray(node) || !currentTest || !Array.isArray(currentTest.full_items)) return false;
    let patched = false;
    if (node.length > 12 && Array.isArray(node[12])) {
      if (Array.isArray(node[7]) && Array.isArray(node[7][5]) && node[7][5].length > 0) subId = node[7][5][0];
      node[12] = currentTest.full_items;
      const mode = (currentTest.ear8 && currentTest.ear8[1]) || 5;
      if (currentTest.ear8) node[7] = currentTest.ear8;
      else if (Array.isArray(node[7]) && Array.isArray(node[7][5]) && node[7][5].length > 0) node[7][1] = mode;
      else if (subId) node[7] = [null, mode, null, null, null, [subId]];
      patched = true;
    }
    if (node.length > 10 && Array.isArray(node[10]) && Array.isArray(node[10][0])) {
      node[10] = [currentTest.full_items];
      if (Array.isArray(node[2]) && Array.isArray(node[2][2]) && Array.isArray(node[2][2][8])) {
        node[2][2][8] = [currentTest.full_items];
      }
      if (currentTest.ear8) node[6] = currentTest.ear8;
      patched = true;
    }
    return patched;
  }

  function rewriteFreq(bodyStr) {
    if (typeof bodyStr !== "string" || !bodyStr.includes("f.req=") || !currentTest) return bodyStr;
    try {
      const parts = bodyStr.split("&");
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith("f.req=")) {
          const raw = decodeURIComponent(parts[i].slice(6).replace(/\\+/g, " "));
          const outer = JSON.parse(raw);
          let changed = false;
          if (Array.isArray(outer)) {
            for (const group of outer) {
              if (!Array.isArray(group)) continue;
              for (const call of group) {
                if (Array.isArray(call) && call[0] === "Ngbm" && typeof call[1] === "string") {
                  const payload = JSON.parse(call[1]);
                  if (Array.isArray(payload)) {
                    if (patchNode(payload[0])) changed = true;
                    if (patchNode(payload[1])) changed = true;
                  }
                  if (changed) call[1] = JSON.stringify(payload);
                }
              }
            }
          }
          if (changed) {
            parts[i] = "f.req=" + encodeURIComponent(JSON.stringify(outer));
            return parts.join("&");
          }
        }
      }
    } catch (e) {}
    return bodyStr;
  }

  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    try {
      if (typeof body === "string" && body.includes("Ngbm")) body = rewriteFreq(body);
    } catch (e) {}
    return origSend.call(this, body);
  };

  function rewriteUrl(val) {
    const s = String(val || "");
    if (!s.includes("/eacquire/multiline") || !currentTest) return val;
    try {
      const u = new URL(s, location.origin);
      const earStr = u.searchParams.get("ear");
      if (!earStr) return val;
      const ear = JSON.parse(earStr);
      if (Array.isArray(ear[8]) && Array.isArray(ear[8][5]) && ear[8][5].length > 0) subId = ear[8][5][0];
      if (Array.isArray(ear[13]) && Array.isArray(currentTest.full_items)) ear[13][0] = currentTest.full_items;
      if (Array.isArray(ear[4]) && typeof ear[4][0] === "string" && Array.isArray(currentTest.full_items)) {
        try {
          const inner4 = JSON.parse(atob(ear[4][0]));
          if (Array.isArray(inner4) && inner4.length > 8) {
            inner4[8] = [currentTest.full_items];
            ear[4][0] = btoa(JSON.stringify(inner4));
          }
        } catch (e4) {}
      }
      const mode = (currentTest.ear8 && currentTest.ear8[1]) || 5;
      if (currentTest.ear8) ear[8] = currentTest.ear8;
      else if (Array.isArray(ear[8]) && Array.isArray(ear[8][5]) && ear[8][5].length > 0) ear[8][1] = mode;
      else if (subId) ear[8] = [null, mode, null, null, null, [subId]];
      ear[24] = null;
      u.searchParams.set("ear", JSON.stringify(ear));
      return u.toString();
    } catch (e) {
      return val;
    }
  }

  if (window.TrustedTypePolicy && TrustedTypePolicy.prototype.createScriptURL) {
    const origCreate = TrustedTypePolicy.prototype.createScriptURL;
    TrustedTypePolicy.prototype.createScriptURL = function (input, ...args) {
      return origCreate.call(this, rewriteUrl(input), ...args);
    };
  }

  const srcDesc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "src");
  if (srcDesc && srcDesc.set) {
    Object.defineProperty(HTMLIFrameElement.prototype, "src", {
      ...srcDesc,
      set(v) {
        if (typeof v === "string") v = rewriteUrl(v);
        return srcDesc.set.call(this, v);
      }
    });
  }
  const origSetAttr = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, val) {
    if (this instanceof HTMLIFrameElement && String(name).toLowerCase() === "src") val = rewriteUrl(String(val));
    return origSetAttr.call(this, name, val);
  };

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (event.source !== window || event.origin !== location.origin ||
        data?.__gapt !== 1 || data.type !== "config") return;

    const next = makeCfg(data.config);
    if (currentTest?.layer !== next?.layer || currentTest?.youtube !== next?.youtube) {
      subId = null;
    }
    currentTest = next;
    refreshBadge();
  });

  window.postMessage({ __gapt: 1, type: "ready" }, location.origin);
  document.addEventListener("DOMContentLoaded", refreshBadge, { once: true });
})();
