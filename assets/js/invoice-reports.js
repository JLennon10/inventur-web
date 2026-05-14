(function () {
  "use strict";

  const I = window.Inventur;

  I.ready(function () {
    const page = I.$(".report-page");
    const table = I.$(".report-table");
    if (!page || !table) return;

    const customerSelect = I.$(".report-filter label:nth-child(2) select", page);
    const statusSelect = I.$(".report-filter label:nth-child(3) select", page);
    const generateButton = I.$(".report-filter .btn-primary", page);
    const exportButtons = I.$$(".table-toolbar .action-btn", page);
    const stats = I.$$(".report-stat strong", page);
    let customer = "All";
    let status = "All";

    function cell(row, index) {
      return row.children[index] ? I.text(row.children[index]) : "";
    }

    function statusOf(row) {
      const value = I.normalize(cell(row, 6));
      if (value.includes("unpaid")) return "Unpaid";
      if (value.includes("overdue")) return "Overdue";
      return value.includes("paid") ? "Paid" : "All";
    }

    function populate(select, values) {
      if (!select) return;
      select.innerHTML = "";
      ["All"].concat(values).forEach(function (value) {
        const option = document.createElement("option");
        option.textContent = value;
        option.value = value;
        select.appendChild(option);
      });
    }

    function unique(index) {
      return Array.from(new Set(I.getRows(table).map(function (row) {
        return cell(row, index);
      }))).sort();
    }

    function applyFilters() {
      const visible = I.getRows(table).filter(function (row) {
        return (customer === "All" || cell(row, 1) === customer) && (status === "All" || statusOf(row) === status);
      });
      I.getRows(table).forEach(function (row) {
        row.hidden = !visible.includes(row);
      });
      updateStats(visible);
      return visible;
    }

    function updateStats(rows) {
      const totals = rows.reduce(
        function (sum, row) {
          const amount = I.moneyToNumber(cell(row, 3));
          const paid = I.moneyToNumber(cell(row, 4));
          const due = I.moneyToNumber(cell(row, 5));
          sum.amount += amount;
          sum.paid += paid;
          sum.due += due;
          if (statusOf(row) !== "Paid") sum.overdue += due;
          return sum;
        },
        { amount: 0, paid: 0, due: 0, overdue: 0 }
      );
      [totals.amount, totals.paid, totals.due, totals.overdue].forEach(function (value, index) {
        if (stats[index]) stats[index].textContent = I.formatMoney(value);
      });
    }

    function exportCsv() {
      const rows = applyFilters();
      const headers = I.$$("thead th", table).map(I.text);
      const body = rows.map(function (row) {
        return Array.from(row.children).map(function (cellNode) {
          return '"' + I.text(cellNode).replace(/"/g, '""') + '"';
        }).join(",");
      });
      const csv = [headers.join(","), body.join("\n")].join("\n");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      link.download = "invoice-report.csv";
      link.click();
      URL.revokeObjectURL(link.href);
    }

    populate(customerSelect, unique(1));
    populate(statusSelect, ["Paid", "Unpaid", "Overdue"]);

    if (customerSelect) customerSelect.addEventListener("change", function () {
      customer = customerSelect.value;
    });
    if (statusSelect) statusSelect.addEventListener("change", function () {
      status = statusSelect.value;
    });
    if (generateButton) generateButton.addEventListener("click", function () {
      const count = applyFilters().length;
      I.toast(count + " invoice row(s) matched");
    });

    exportButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const icon = I.$("img", button);
        const src = icon ? icon.getAttribute("src") || "" : "";
        if (src.includes("printer")) {
          window.print();
        } else {
          exportCsv();
          I.toast(src.includes("PDF") ? "Report prepared for PDF workflow" : "Excel CSV exported");
        }
      });
    });

    document.addEventListener("inventur:refresh", function () {
      customer = "All";
      status = "All";
      if (customerSelect) customerSelect.value = "All";
      if (statusSelect) statusSelect.value = "All";
      applyFilters();
      I.toast("Invoice report refreshed");
    });

    applyFilters();
  });
})();
