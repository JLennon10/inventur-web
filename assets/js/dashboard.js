(function () {
  "use strict";

  const I = window.Inventur;

  function initDashboard(root) {
    const page = I.$(".dashboard-page", root || document);
    if (!page) return;

    const dateButton = I.$(".dashboard-greeting .page-actions .btn", page);
    const earning = I.$(".earning-card strong", page);
    const sales = I.$(".sales-card strong", page);
    const purchases = I.$(".purchase-card strong", page);
    const ranges = ["week", "lastWeek", "month"];
    let rangeIndex = 0;

    function formatDate(date) {
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    function currentRange(mode) {
      const now = new Date();
      const start = new Date(now);
      const end = new Date(now);

      if (mode === "month") {
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
      } else {
        const day = now.getDay() || 7;
        start.setDate(now.getDate() - day + 1);
        end.setDate(start.getDate() + 6);
        if (mode === "lastWeek") {
          start.setDate(start.getDate() - 7);
          end.setDate(end.getDate() - 7);
        }
      }

      return formatDate(start) + " - " + formatDate(end);
    }

    function setDateRange() {
      if (!dateButton) return;
      const icon = I.$("img", dateButton);
      dateButton.textContent = currentRange(ranges[rangeIndex]);
      if (icon) dateButton.prepend(icon);
    }

    function refreshMetrics() {
      const base = ranges[rangeIndex] === "month" ? 285000 : ranges[rangeIndex] === "lastWeek" ? 88000 : 95000;
      const delta = Math.round(Math.random() * 7000);
      if (earning) earning.textContent = I.formatMoney(base + delta);
      if (sales) sales.textContent = (9500 + Math.round(Math.random() * 900)).toLocaleString("en-US") + "+";
      if (purchases) purchases.textContent = (760 + Math.round(Math.random() * 90)).toLocaleString("en-US") + "+";
    }

    if (dateButton) {
      dateButton.addEventListener("click", function () {
        rangeIndex = (rangeIndex + 1) % ranges.length;
        setDateRange();
        refreshMetrics();
      });
    }

    function refreshHandler() {
      refreshMetrics();
      I.toast("Dashboard data refreshed");
    }

    document.addEventListener("inventur:refresh", refreshHandler);
    page.addEventListener("inventur:dispose", function () {
      document.removeEventListener("inventur:refresh", refreshHandler);
    }, { once: true });

    setDateRange();
  }

  I.registerPage("dashboard", initDashboard);
  I.ready(initDashboard);
})();
