(function () {
  "use strict";

  const I = window.Inventur;

  I.ready(function () {
    const page = I.$(".products-page");
    const table = I.$(".products-table");
    if (!page || !table) return;

    const search = I.$(".table-search input", page);
    const filterButtons = I.$$(".table-filters .btn", page);
    const rowSizeButton = I.$(".row-size .btn", page);
    let query = "";
    let category = "All";
    let brand = "All";
    let rowsPerPage = 10;
    let currentPage = 1;

    function cell(row, index) {
      return row.children[index] ? I.text(row.children[index]) : "";
    }

    function uniqueColumn(index) {
      const values = I.getRows(table).map(function (row) {
        return cell(row, index);
      });
      return ["All"].concat(Array.from(new Set(values)).sort());
    }

    function rowMatches(row) {
      const haystack = I.normalize(I.text(row));
      const categoryOk = category === "All" || cell(row, 3) === category;
      const brandOk = brand === "All" || cell(row, 4) === brand;
      return haystack.includes(I.normalize(query)) && categoryOk && brandOk;
    }

    function applyFilters() {
      const matched = I.getRows(table).filter(rowMatches);
      I.getRows(table).forEach(function (row) {
        row.hidden = true;
      });
      matched.forEach(function (row, index) {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        row.hidden = !(index >= start && index < end);
      });
      updateFooter(matched.length);
    }

    function updateFooter(total) {
      const rowSize = I.$(".row-size", page);
      if (rowSizeButton) {
        const icon = I.$("img", rowSizeButton);
        rowSizeButton.textContent = rowsPerPage >= 999 ? "All " : rowsPerPage + " ";
        if (icon) rowSizeButton.appendChild(icon);
      }
      if (rowSize) {
        rowSize.lastChild.textContent = " Entries (" + total + " shown)";
      }
    }

    function updateFilterButton(button, label, value) {
      const icon = I.$("img", button);
      button.textContent = label + ": " + value + " ";
      if (icon) button.appendChild(icon);
    }

    if (search) {
      search.addEventListener(
        "input",
        I.debounce(function () {
          query = search.value;
          currentPage = 1;
          applyFilters();
        }, 120)
      );
    }

    if (filterButtons[0]) {
      I.makeDropdown(filterButtons[0], uniqueColumn(3), function (value) {
        category = value;
        currentPage = 1;
        updateFilterButton(filterButtons[0], "Category", value);
        applyFilters();
      });
    }

    if (filterButtons[1]) {
      I.makeDropdown(filterButtons[1], uniqueColumn(4), function (value) {
        brand = value;
        currentPage = 1;
        updateFilterButton(filterButtons[1], "Brand", value);
        applyFilters();
      });
    }

    if (rowSizeButton) {
      I.makeDropdown(rowSizeButton, ["5", "10", "All"], function (value) {
        rowsPerPage = value === "All" ? 999 : Number(value);
        currentPage = 1;
        applyFilters();
      });
    }

    I.$$("thead th", table).forEach(function (heading, index) {
      if (![1, 5, 7].includes(index)) return;
      let direction = 1;
      heading.style.cursor = "pointer";
      heading.addEventListener("click", function () {
        const body = I.$("tbody", table);
        const rows = I.getRows(table);
        rows.sort(function (a, b) {
          const av = index === 5 || index === 7 ? I.moneyToNumber(cell(a, index)) : cell(a, index);
          const bv = index === 5 || index === 7 ? I.moneyToNumber(cell(b, index)) : cell(b, index);
          return av > bv ? direction : av < bv ? -direction : 0;
        });
        direction *= -1;
        rows.forEach(function (row) {
          body.appendChild(row);
        });
        applyFilters();
      });
    });

    table.addEventListener("click", function (event) {
      const button = event.target.closest(".action-btn");
      if (!button) return;
      const row = event.target.closest("tr");
      const sku = cell(row, 1);
      const name = cell(row, 2);
      const icon = I.$("img", button);
      const src = icon ? icon.getAttribute("src") || "" : "";

      if (src.includes("trashcan")) {
        row.remove();
        applyFilters();
        I.toast(name + " deleted");
      } else if (src.includes("edit")) {
        location.href = "./create-product.html?sku=" + encodeURIComponent(sku);
      } else {
        I.toast(name + " stock: " + cell(row, 7) + " pcs");
      }
    });

    document.addEventListener("inventur:refresh", function () {
      if (search) search.value = "";
      query = "";
      category = "All";
      brand = "All";
      currentPage = 1;
      if (filterButtons[0]) updateFilterButton(filterButtons[0], "Category", "All");
      if (filterButtons[1]) updateFilterButton(filterButtons[1], "Brand", "All");
      applyFilters();
      I.toast("Products table refreshed");
    });

    applyFilters();
  });
})();
