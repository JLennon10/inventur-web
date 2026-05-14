(function () {
  "use strict";

  const doc = document;

  function ready(callback) {
    if (doc.readyState === "loading") {
      doc.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function $(selector, root) {
    return (root || doc).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || doc).querySelectorAll(selector));
  }

  function text(element) {
    return element ? element.textContent.trim() : "";
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function slugify(value) {
    return normalize(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function moneyToNumber(value) {
    const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  }

  function randomCode(prefix, length) {
    const size = length || 5;
    const number = Math.floor(Math.random() * Math.pow(10, size));
    return prefix + String(number).padStart(size, "0");
  }

  function debounce(callback, wait) {
    let timer;
    return function () {
      const args = arguments;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        callback.apply(null, args);
      }, wait || 160);
    };
  }

  function toast(message, tone) {
    let wrap = $(".js-toast-wrap");
    if (!wrap) {
      wrap = doc.createElement("div");
      wrap.className = "js-toast-wrap";
      wrap.style.cssText =
        "position:fixed;right:18px;bottom:18px;z-index:9999;display:grid;gap:10px;max-width:min(360px,calc(100vw - 36px));";
      doc.body.appendChild(wrap);
    }

    const item = doc.createElement("div");
    item.textContent = message;
    const palette = tone === "error" ? "#dc2626" : tone === "warn" ? "#d97706" : "#0f172a";
    item.style.cssText =
      "padding:12px 14px;border-radius:8px;background:" +
      palette +
      ";color:#fff;font:600 14px/1.35 'Nunito Sans',sans-serif;box-shadow:0 16px 36px rgba(15,23,42,.18);";
    wrap.appendChild(item);

    window.setTimeout(function () {
      item.style.opacity = "0";
      item.style.transform = "translateY(8px)";
      item.style.transition = "opacity .18s ease, transform .18s ease";
      window.setTimeout(function () {
        item.remove();
      }, 200);
    }, 2400);
  }

  function setActiveNav() {
    const page = location.pathname.split("/").pop();
    $$(".nav-link").forEach(function (link) {
      const href = link.getAttribute("href") || "";
      link.classList.toggle("active", href.endsWith(page));
    });
  }

  function initRefreshButtons() {
    $$("button").forEach(function (button) {
      const icon = $("img", button);
      if (!icon || !(icon.getAttribute("src") || "").includes("Refresh Icon")) return;
      button.addEventListener("click", function () {
        icon.animate(
          [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
          { duration: 420, easing: "ease" }
        );
        doc.dispatchEvent(new CustomEvent("inventur:refresh"));
      });
    });
  }

  function initCheckBoxes(root) {
    const scope = root || doc;
    $$(".check-box", scope).forEach(function (box) {
      box.setAttribute("role", "checkbox");
      box.setAttribute("tabindex", "0");
      box.style.cursor = "pointer";

      function toggle() {
        const checked = box.getAttribute("aria-checked") === "true";
        setChecked(box, !checked);
      }

      box.addEventListener("click", toggle);
      box.addEventListener("keydown", function (event) {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          toggle();
        }
      });
    });
  }

  function setChecked(box, checked) {
    box.setAttribute("aria-checked", String(checked));
    box.style.background = checked ? "#0f172a" : "";
    box.style.borderColor = checked ? "#0f172a" : "";
    box.style.boxShadow = checked ? "inset 0 0 0 3px #fff" : "";
  }

  function initPagination(root, onChange) {
    const scope = root || doc;
    $$(".pagination", scope).forEach(function (pagination) {
      const dots = $$(".page-dot", pagination);
      dots.forEach(function (dot) {
        dot.addEventListener("click", function () {
          dots.forEach(function (item) {
            item.classList.remove("active");
          });
          dot.classList.add("active");
          if (onChange) onChange(Number(dot.textContent) || 1);
        });
      });
    });
  }

  function makeDropdown(button, items, onPick) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      closeDropdowns();

      const menu = doc.createElement("div");
      menu.className = "js-dropdown";
      menu.style.cssText =
        "position:absolute;z-index:50;min-width:150px;padding:6px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 18px 40px rgba(15,23,42,.14);";

      items.forEach(function (item) {
        const option = doc.createElement("button");
        option.type = "button";
        option.textContent = item;
        option.style.cssText =
          "display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:6px;font:600 13px 'Nunito Sans',sans-serif;color:#334155;cursor:pointer;";
        option.addEventListener("mouseenter", function () {
          option.style.background = "#f8fafc";
        });
        option.addEventListener("mouseleave", function () {
          option.style.background = "transparent";
        });
        option.addEventListener("click", function () {
          onPick(item);
          closeDropdowns();
        });
        menu.appendChild(option);
      });

      doc.body.appendChild(menu);
      const rect = button.getBoundingClientRect();
      menu.style.left = rect.left + window.scrollX + "px";
      menu.style.top = rect.bottom + window.scrollY + 8 + "px";
    });
  }

  function closeDropdowns() {
    $$(".js-dropdown").forEach(function (menu) {
      menu.remove();
    });
  }

  doc.addEventListener("click", function (event) {
    if (!event.target.closest(".js-dropdown") && !event.target.closest("button")) {
      closeDropdowns();
    }
  });

  function getRows(table) {
    return $$("tbody tr", table);
  }

  function filterTable(table, predicate) {
    let visible = 0;
    getRows(table).forEach(function (row) {
      const show = predicate(row);
      row.hidden = !show;
      if (show) visible += 1;
    });
    return visible;
  }

  ready(function () {
    setActiveNav();
    initRefreshButtons();
    initCheckBoxes();
    initPagination();
  });

  window.Inventur = {
    ready: ready,
    $: $,
    $$: $$,
    text: text,
    normalize: normalize,
    slugify: slugify,
    moneyToNumber: moneyToNumber,
    formatMoney: formatMoney,
    randomCode: randomCode,
    debounce: debounce,
    toast: toast,
    initCheckBoxes: initCheckBoxes,
    initPagination: initPagination,
    makeDropdown: makeDropdown,
    closeDropdowns: closeDropdowns,
    getRows: getRows,
    filterTable: filterTable,
    setChecked: setChecked,
  };
})();
