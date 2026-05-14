(function () {
  "use strict";

  const I = window.Inventur;

  I.ready(function () {
    const form = I.$(".create-form");
    if (!form) return;

    const fields = I.$$(".field, .select-field, textarea", form);
    const productName = labeledInput("Product Name");
    const slug = labeledInput("Slug");
    const sku = labeledInput("SKU");
    const itemCode = labeledInput("Item Code");
    const addButton = Array.from(I.$$(".form-actions .btn", form)).find(function (button) {
      return I.text(button) === "Add Product";
    });
    const cancelButton = Array.from(I.$$(".form-actions .btn", form)).find(function (button) {
      return I.text(button) === "Cancel";
    });
    const uploadButton = I.$(".upload-box", form);
    const description = I.$(".editor textarea", form);
    const descriptionHint = I.$(".description-label small", form);

    function labeledInput(labelText) {
      const label = I.$$(".field-label", form).find(function (label) {
        return I.text(label).replace("*", "").trim() === labelText;
      });
      return label ? label.closest("label").querySelector("input, select, textarea") : null;
    }

    function populateSelect(labelText, options) {
      const select = labeledInput(labelText);
      if (!select || select.tagName !== "SELECT") return;
      select.innerHTML = "";
      options.forEach(function (option) {
        const node = document.createElement("option");
        node.value = option === "Select" ? "" : option;
        node.textContent = option;
        select.appendChild(node);
      });
    }

    [
      ["Store", ["Select", "Main Store", "Outlet A", "Outlet B"]],
      ["Warehouse", ["Select", "Central Warehouse", "North Warehouse", "Online Stock"]],
      ["Selling Type", ["Select", "Retail", "Wholesale"]],
      ["Category", ["Select", "Computers", "Electronics", "Shoe", "Furniture", "Bags", "Phone"]],
      ["Sub Category", ["Select", "Laptop", "Headphones", "Sneakers", "Chair", "Backpack"]],
      ["Brand", ["Select", "Lenovo", "Apple", "Nike", "Beats", "Amazon", "Dior"]],
      ["Unit", ["Select", "Pc", "Box", "Pack"]],
      ["Barcode Symbology", ["Select", "Code 128", "Code 39", "EAN-13"]],
      ["Tax Type", ["Select", "Exclusive", "Inclusive"]],
      ["Discount Type", ["Select", "Percentage", "Fixed"]],
      ["Warranty", ["Select", "No Warranty", "6 Months", "1 Year", "2 Years"]],
    ].forEach(function (entry) {
      populateSelect(entry[0], entry[1]);
    });

    function markInvalid(input, invalid) {
      input.style.borderColor = invalid ? "#ef4444" : "";
      input.style.boxShadow = invalid ? "0 0 0 3px rgba(239,68,68,.10)" : "";
    }

    function validate() {
      let valid = true;
      I.$$(".required", form).forEach(function (required) {
        const input = required.closest("label") ? required.closest("label").querySelector("input, select, textarea") : null;
        if (!input) return;
        const invalid = !String(input.value || "").trim();
        markInvalid(input, invalid);
        if (invalid) valid = false;
      });
      return valid;
    }

    function updateDescriptionCount() {
      if (!description || !descriptionHint) return;
      const words = I.normalize(description.value).split(" ").filter(Boolean);
      if (words.length > 60) {
        description.value = words.slice(0, 60).join(" ");
      }
      descriptionHint.textContent = Math.min(words.length, 60) + "/60 Words";
    }

    if (productName && slug) {
      productName.addEventListener("input", function () {
        if (!slug.dataset.touched) slug.value = I.slugify(productName.value);
      });
      slug.addEventListener("input", function () {
        slug.dataset.touched = "true";
        slug.value = I.slugify(slug.value);
      });
    }

    I.$$(".input-action button", form).forEach(function (button) {
      button.addEventListener("click", function () {
        const input = button.closest(".input-action").querySelector("input");
        input.value = input === sku ? I.randomCode("SKU-", 5) : I.randomCode("ITM-", 6);
        markInvalid(input, false);
      });
    });

    I.$$(".form-card > header", form).forEach(function (header) {
      header.style.cursor = "pointer";
      header.addEventListener("click", function () {
        const card = header.closest(".form-card");
        Array.from(card.children).forEach(function (child, index) {
          if (index > 0) child.hidden = !child.hidden;
        });
      });
    });

    I.$$(".custom-checks input", form).forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        const label = I.text(checkbox.closest("label"));
        const target = labeledInput(label.replace(/ies$/, "y"));
        if (target) {
          target.disabled = !checkbox.checked;
          target.closest("label").style.opacity = checkbox.checked ? "1" : ".48";
        }
      });
    });

    if (description) {
      description.addEventListener("input", updateDescriptionCount);
      updateDescriptionCount();
    }

    I.$$(".editor-toolbar > *", form).forEach(function (tool) {
      tool.addEventListener("click", function () {
        if (!description) return;
        const selected = description.value.slice(description.selectionStart, description.selectionEnd) || "text";
        const token = I.text(tool).toLowerCase();
        const wrapped = token === "b" ? "**" + selected + "**" : token === "i" ? "_" + selected + "_" : token === "u" ? "<u>" + selected + "</u>" : selected;
        description.setRangeText(wrapped, description.selectionStart, description.selectionEnd, "end");
        description.focus();
        updateDescriptionCount();
      });
    });

    if (uploadButton) {
      uploadButton.addEventListener("click", function () {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.addEventListener("change", function () {
          const file = input.files && input.files[0];
          if (!file) return;
          uploadButton.innerHTML = "";
          const label = document.createElement("span");
          label.textContent = file.name;
          uploadButton.appendChild(label);
          I.toast("Image selected: " + file.name);
        });
        input.click();
      });
    }

    if (cancelButton) {
      cancelButton.addEventListener("click", function () {
        location.href = "./products.html";
      });
    }

    if (addButton) {
      addButton.addEventListener("click", function () {
        if (!validate()) {
          I.toast("Please complete all required product fields", "error");
          return;
        }

        const payload = {};
        fields.forEach(function (field) {
          const label = field.closest("label") ? I.text(I.$(".field-label", field.closest("label"))) : field.name || "description";
          payload[label.replace("*", "").trim() || "description"] = field.value;
        });
        const products = JSON.parse(localStorage.getItem("inventur.products") || "[]");
        products.push(payload);
        localStorage.setItem("inventur.products", JSON.stringify(products));
        I.toast("Product saved locally");
      });
    }

    if (!sku || !sku.value) {
      if (sku) sku.value = I.randomCode("SKU-", 5);
      if (itemCode) itemCode.value = I.randomCode("ITM-", 6);
    }
  });
})();
