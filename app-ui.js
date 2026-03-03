(function () {
  const menuBtn = document.getElementById("menuBtn");
  const mainNav = document.getElementById("mainNav");
  const themeToggle = document.getElementById("theme-toggle");

  if (menuBtn && mainNav) {
    menuBtn.addEventListener("click", function () {
      mainNav.classList.toggle("open");
    });

    mainNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mainNav.classList.remove("open");
      });
    });
  }

  if (themeToggle) {
    const currentTheme = localStorage.getItem("theme");
    if (currentTheme) {
      document.body.classList.add(currentTheme);
      if (currentTheme === "dark-theme") {
        themeToggle.checked = true;
      }
    }

    themeToggle.addEventListener("change", function () {
      if (themeToggle.checked) {
        document.body.classList.add("dark-theme");
        localStorage.setItem("theme", "dark-theme");
      } else {
        document.body.classList.remove("dark-theme");
        localStorage.setItem("theme", "light-theme");
      }
    });
  }

  function ensureToastHost() {
    var host = document.getElementById("toastHost");
    if (!host) {
      host = document.createElement("div");
      host.id = "toastHost";
      host.className = "toast-host";
      document.body.appendChild(host);
    }
    return host;
  }

  function showToast(message, type) {
    var host = ensureToastHost();
    var t = document.createElement("div");
    t.className = "toast toast-" + (type || "info");
    t.textContent = message;
    host.appendChild(t);
    setTimeout(function () {
      t.classList.add("hide");
      setTimeout(function () {
        t.remove();
      }, 250);
    }, 2600);
  }

  async function requestJSON(url, options) {
    options = options || {};
    var retries = Number(options.retries || 0);
    var timeoutMs = Number(options.timeoutMs || 12000);
    var attempt = 0;

    while (attempt <= retries) {
      var controller = new AbortController();
      var timer = setTimeout(function () {
        controller.abort();
      }, timeoutMs);
      try {
        var res = await fetch(url, {
          method: options.method || "GET",
          headers: options.headers || {},
          body: options.body,
          signal: controller.signal
        });
        clearTimeout(timer);
        var data = await res.json().catch(function () { return {}; });
        if (!res.ok) {
          throw new Error(data.error || ("Request failed (" + res.status + ")"));
        }
        return data;
      } catch (err) {
        clearTimeout(timer);
        if (attempt >= retries) {
          throw err;
        }
      }
      attempt += 1;
    }
  }

  function setBusy(el, busy, busyText) {
    if (!el) return;
    if (busy) {
      if (!el.dataset.originalText) {
        el.dataset.originalText = el.innerHTML;
      }
      el.disabled = true;
      if (busyText) {
        el.textContent = busyText;
      }
    } else {
      el.disabled = false;
      if (el.dataset.originalText) {
        el.innerHTML = el.dataset.originalText;
      }
    }
  }

  window.SmartGridUI = {
    showToast: showToast,
    requestJSON: requestJSON,
    setBusy: setBusy
  };
})();
