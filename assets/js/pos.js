(function () {
  "use strict";

  const I = window.Inventur;

  I.ready(function () {
    const screen = I.$(".pos-screen");
    if (!screen) return;

    const productsWrap = I.$(".pos-products", screen);
    const products = I.$$(".pos-product", screen);
    const categories = I.$$(".pos-category", screen);
    const search = I.$(".pos-products-head input", screen);
    const added = I.$(".pos-added", screen);
    const addedHeader = I.$(".pos-added h3 span", screen);
    const clearAll = I.$(".pos-added button", screen);
    const emptyState = I.$(".pos-empty", screen);
    const totalButton = I.$(".pos-total", screen);
    const discountInput = I.$(".pos-billing-fields input", screen);
    const shippingSelect = I.$$(".pos-billing-fields select", screen)[1];
    const taxSelect = I.$$(".pos-billing-fields select", screen)[0];
    const productSelect = I.$(".pos-customer select:last-child", screen);
    const orderId = I.$(".pos-order-head p", screen);
    const order = new Map();
    let category = "All Categories";
    let orderCount = Number(localStorage.getItem("inventur.orderCount") || "0");

    function productData(card) {
      return {
        key: I.text(I.$("strong", card)),
        name: I.text(I.$("strong", card)),
        category: I.text(I.$("span", card)),
        stock: I.text(I.$("em", card)),
        price: I.moneyToNumber(I.text(I.$("b", card))),
        image: I.$("img", card).getAttribute("src"),
      };
    }

    function applyProductFilters() {
      const q = I.normalize(search ? search.value : "");
      products.forEach(function (card) {
        const data = productData(card);
        const categoryOk = category === "All Categories" || I.normalize(data.category) === I.normalize(category);
        const queryOk = I.normalize(data.name + " " + data.category).includes(q);
        card.hidden = !(categoryOk && queryOk);
      });
    }

    function ensureList() {
      let list = I.$(".js-pos-order-list", added);
      if (!list) {
        list = document.createElement("div");
        list.className = "js-pos-order-list";
        list.style.cssText = "display:grid;gap:10px;margin-top:12px;";
        added.appendChild(list);
      }
      return list;
    }

    function renderOrder() {
      const list = ensureList();
      list.innerHTML = "";
      const items = Array.from(order.values());
      if (addedHeader) addedHeader.textContent = String(items.reduce(function (sum, item) { return sum + item.qty; }, 0));
      if (emptyState) emptyState.hidden = items.length > 0;

      items.forEach(function (item) {
        const row = document.createElement("article");
        row.style.cssText =
          "display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:10px;padding:10px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;";
        row.innerHTML =
          '<img src="' +
          item.image +
          '" alt="" style="width:44px;height:44px;object-fit:contain;border-radius:7px;background:#f8fafc">' +
          '<div style="min-width:0"><strong style="display:block;font-size:13px;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
          item.name +
          '</strong><span style="font-size:12px;color:#64748b">' +
          I.formatMoney(item.price) +
          "</span></div>" +
          '<div style="display:flex;align-items:center;gap:6px"><button type="button" data-action="minus">-</button><b>' +
          item.qty +
          '</b><button type="button" data-action="plus">+</button><button type="button" data-action="remove">x</button></div>';
        I.$$("button", row).forEach(function (button) {
          button.style.cssText = "width:26px;height:26px;border:1px solid #e5e7eb;border-radius:6px;background:#fff;cursor:pointer;";
          button.addEventListener("click", function () {
            if (button.dataset.action === "plus") item.qty += 1;
            if (button.dataset.action === "minus") item.qty -= 1;
            if (button.dataset.action === "remove" || item.qty <= 0) order.delete(item.key);
            renderOrder();
          });
        });
        list.appendChild(row);
      });

      updateTotal();
    }

    function updateTotal() {
      const subtotal = Array.from(order.values()).reduce(function (sum, item) {
        return sum + item.price * item.qty;
      }, 0);
      const discount = subtotal * ((Number(discountInput && discountInput.value) || 0) / 100);
      const shipping = Number(shippingSelect && shippingSelect.value) || 0;
      const taxRate = taxSelect && taxSelect.value === "10%" ? 0.1 : 0;
      const total = Math.max(0, subtotal - discount + shipping + subtotal * taxRate);
      if (totalButton) totalButton.textContent = "Grand Total : " + I.formatMoney(total);
    }

    function addProduct(card) {
      const data = productData(card);
      const current = order.get(data.key) || Object.assign({}, data, { qty: 0 });
      current.qty += 1;
      order.set(data.key, current);
      renderOrder();
    }

    categories.forEach(function (button) {
      button.addEventListener("click", function () {
        categories.forEach(function (item) {
          item.classList.remove("active");
        });
        button.classList.add("active");
        category = I.text(I.$("strong", button));
        applyProductFilters();
      });
    });

    products.forEach(function (card) {
      card.style.cursor = "pointer";
      card.addEventListener("click", function () {
        addProduct(card);
      });
    });

    if (search) search.addEventListener("input", I.debounce(applyProductFilters, 120));
    if (discountInput) discountInput.addEventListener("input", updateTotal);
    if (shippingSelect) shippingSelect.addEventListener("change", updateTotal);
    if (taxSelect) {
      taxSelect.innerHTML = "<option>Choose</option><option>10%</option>";
      taxSelect.addEventListener("change", updateTotal);
    }
    if (shippingSelect) shippingSelect.innerHTML = "<option>0</option><option>5</option><option>10</option><option>25</option>";

    if (productSelect) {
      productSelect.innerHTML = "<option>Search Products</option>";
      products.map(productData).forEach(function (product) {
        const option = document.createElement("option");
        option.textContent = product.name;
        option.value = product.key;
        productSelect.appendChild(option);
      });
      productSelect.addEventListener("change", function () {
        const card = products.find(function (productCard) {
          return productData(productCard).key === productSelect.value;
        });
        if (card) addProduct(card);
        productSelect.selectedIndex = 0;
      });
    }

    I.$$(".pos-payment-methods button", screen).forEach(function (button) {
      button.addEventListener("click", function () {
        I.$$(".pos-payment-methods button", screen).forEach(function (item) {
          item.classList.remove("active");
        });
        button.classList.add("active");
      });
    });

    I.$$(".pos-slide-buttons button", screen).forEach(function (button, index) {
      button.addEventListener("click", function () {
        const wrap = I.$(".pos-categories", screen);
        if (wrap) wrap.scrollBy({ left: index === 0 ? -220 : 220, behavior: "smooth" });
      });
    });

    if (clearAll) clearAll.addEventListener("click", function () {
      order.clear();
      renderOrder();
    });

    I.$(".pos-order-head button", screen).addEventListener("click", function () {
      order.clear();
      renderOrder();
      I.toast("Order cleared");
    });

    I.$$(".pos-actions .pos-action", screen).forEach(function (button) {
      button.addEventListener("click", function () {
        const label = I.text(button);
        if (label.includes("Reset")) {
          order.clear();
          if (search) search.value = "";
          category = "All Categories";
          categories.forEach(function (item, index) {
            item.classList.toggle("active", index === 0);
          });
          renderOrder();
          applyProductFilters();
          I.toast("POS reset");
        } else if (label.includes("Transaction")) {
          orderCount += 1;
          localStorage.setItem("inventur.orderCount", String(orderCount));
          if (orderId) orderId.textContent = "Id : #" + orderCount;
          I.toast("Transaction #" + orderCount + " started");
        } else {
          I.toast(order.size + " product type(s) in current order");
        }
      });
    });

    I.$$(".pos-final-actions button", screen).forEach(function (button) {
      button.addEventListener("click", function () {
        if (!order.size) {
          I.toast("Add products before continuing", "warn");
          return;
        }
        const action = I.text(button);
        if (action.includes("Payment")) {
          order.clear();
          orderCount += 1;
          localStorage.setItem("inventur.orderCount", String(orderCount));
          if (orderId) orderId.textContent = "Id : #" + orderCount;
          renderOrder();
          I.toast("Payment completed");
        } else if (action.includes("Void")) {
          order.clear();
          renderOrder();
          I.toast("Order voided");
        } else {
          I.toast("Order held");
        }
      });
    });

    if (orderId) orderId.textContent = "Id : #" + orderCount;
    applyProductFilters();
    renderOrder();
  });
})();
