console.log("✅ main.js loaded");

// Utility to create accordion items
function createAccordionItem(id, headerText, parentId) {
  return `
    <div class="accordion-item">
      <h2 class="accordion-header" id="heading-${id}">
        <button class="accordion-button collapsed" type="button"
          data-bs-toggle="collapse" data-bs-target="#collapse-${id}"
          aria-expanded="false" aria-controls="collapse-${id}">
          ${headerText}
        </button>
      </h2>
      <div id="collapse-${id}" class="accordion-collapse collapse"
        aria-labelledby="heading-${id}" data-bs-parent="#${parentId}">
        <div class="accordion-body" id="body-${id}">
          Loading...
        </div>
      </div>
    </div>`;
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ---------------- Load Countries ----------------
async function loadCountries() {
  try {
    const countries = await fetchJSON("/api/countries");
    const select = document.getElementById("country");
    select.innerHTML = '<option value="">Select Country</option>';
    countries.forEach(c => {
      const opt = document.createElement("option");
      const name = c.country_name || c.name || c.code || ""; // be flexible
      const lang = c.language_name || c.language || "";
      opt.value = name;
      opt.textContent = lang ? `${name} (${lang})` : name;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error(e);
    alert("Failed to load countries");
  }
}

// ---------------- Country -> Cities ----------------
document.getElementById("country").addEventListener("change", async function () {
  const selected = this.value;
  const citySelect = document.getElementById("city");
  const cityContainer = document.getElementById("cityContainer");

  citySelect.innerHTML = '<option value="">Select City</option>';
  cityContainer.classList.add("d-none");

  if (selected) {
    try {
      const cities = await fetchJSON(`/api/cities/${encodeURIComponent(selected)}`);
      cities.forEach(city => {
        const name = typeof city === "string" ? city : (city.name || "");
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        citySelect.appendChild(opt);
      });
      cityContainer.classList.remove("d-none");
    } catch (e) {
      console.error(e);
      alert("Failed to load cities");
    }
  }
});

// ---------------- City -> App Types ----------------
document.getElementById("city").addEventListener("change", async function () {
  const appTypeSelect = document.getElementById("appType");
  const appTypeContainer = document.getElementById("appTypeContainer");

  appTypeSelect.innerHTML = '<option value="">Select App Type</option>';
  appTypeContainer.classList.add("d-none");

  try {
    const appTypes = await fetchJSON("/api/appTypes");
    appTypes.forEach(type => {
      const t = typeof type === "string" ? type : (type.name || "");
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      appTypeSelect.appendChild(opt);
    });
    appTypeContainer.classList.remove("d-none");
  } catch (e) {
    console.error(e);
    alert("Failed to load app types");
  }
});

// ---------------- App Type -> Show input + submit ----------------
document.getElementById("appType").addEventListener("change", function () {
  const userInputContainer = document.getElementById("userInputContainer");
  const submitButton = document.getElementById("submitButton");
  if (this.value) {
    userInputContainer.classList.remove("d-none");
    submitButton.classList.remove("d-none");
  } else {
    userInputContainer.classList.add("d-none");
    submitButton.classList.add("d-none");
  }
});

// ---------------- Submit -> Products + Nested Details ----------------
let entriesCounter = 0;

document.getElementById("submitButton").addEventListener("click", async function () {
  const country = document.getElementById("country").value;
  const city = document.getElementById("city").value;
  const appType = document.getElementById("appType").value;
  const userInput = document.getElementById("userInput").value.trim();

  if (!country || !city || !appType || !userInput) {
    alert("Please select all fields and enter data.");
    return;
  }

  try {
    const products = await fetchJSON(`/api/products?query=${encodeURIComponent(userInput)}`);

    const entriesAccordion = document.getElementById("entriesAccordion");
    const entriesSection = document.getElementById("entriesSection");

    entriesCounter++;
    const entryId = `entry-${entriesCounter}`;

    entriesAccordion.innerHTML += createAccordionItem(
      entryId,
      `Country: ${country}, City: ${city}, App Type: ${appType}, Input: ${userInput}`,
      "entriesAccordion"
    );

    entriesSection.classList.remove("d-none");

    const entryHeaderBtn = document.querySelector(`#heading-${entryId} button`);
    entryHeaderBtn.addEventListener("click", () => onEntryClick(entryId, products));

    // Clear input
    document.getElementById("userInput").value = "";
  } catch (e) {
    console.error(e);
    alert("Failed to load products");
  }
});

async function onEntryClick(entryId, products) {
  const prodAccId = `products-accordion-${entryId}`;
  let prodAccordion = document.getElementById(prodAccId);

  if (!prodAccordion) {
    const entryBody = document.getElementById(`body-${entryId}`);
    entryBody.innerHTML = `<div class="accordion" id="${prodAccId}">
      <div class="text-muted">Loading products...</div>
    </div>`;
    prodAccordion = document.getElementById(prodAccId);

    if (!products || !products.length) {
      prodAccordion.innerHTML = "<div>No products found.</div>";
      return;
    }

    prodAccordion.innerHTML = "";
    products.forEach((product, idx) => {
      const pid = product.id || product.productId || `p-${idx}`;
      const name = product.name || product.title || `Product ${idx + 1}`;
      const prodNodeId = `${entryId}-prod-${idx}`;

      const productHeader = document.createElement("div");
      productHeader.textContent = name;
      productHeader.style.cursor = "pointer";
      productHeader.classList.add("text-primary", "fw-bold");

      const productBody = document.createElement("div");
      productBody.id = `prod-body-${prodNodeId}`;
      productBody.className = "product-body ms-3";
      productBody.dataset.loaded = "";

      productHeader.addEventListener("click", async () => {
        if (!productBody.dataset.loaded) {
          try {
            const details = await fetchJSON(`/api/product/${encodeURIComponent(pid)}`);
            productBody.innerHTML = (details || []).map(d => {
              const label = d.detailName || d.name || "Detail";
              const val = d.value || d.val || "";
              const did = d.detailId || d.id || "";
              return `<div class="text-secondary ms-2" style="cursor:pointer"
                        onclick="showDetailModal('${String(label).replace(/'/g, "\\'")}', '${String(val).replace(/'/g, "\\'")}', '${String(did).replace(/'/g, "\\'")}')">
                        ${label}: ${val}
                      </div>`;
            }).join("") || "No details available.";
            productBody.dataset.loaded = "true";
            productBody.classList.add("expanded");
          } catch (e) {
            console.error(e);
            productBody.textContent = "Failed to load product details.";
            productBody.dataset.loaded = "true";
          }
        } else {
          productBody.classList.toggle("expanded");
        }
      });

      prodAccordion.appendChild(productHeader);
      prodAccordion.appendChild(productBody);
    });
  }
}

// Modal: show base detail and allow "More" from API
window.showDetailModal = async function (name, value, detailId) {
  const titleEl = document.getElementById("detailModalLabel");
  const bodyEl = document.getElementById("detailModalBody");

  titleEl.textContent = name || "Detail Info";
  bodyEl.innerHTML = `<p>${value || ""}</p><div id="moreInfo" class="mt-2 text-muted">Loading more…</div>`;

  const modal = new bootstrap.Modal(document.getElementById("detailModal"));
  modal.show();

  if (!detailId) {
    document.getElementById("moreInfo").textContent = "No further details.";
    return;
  }

  try {
    const more = await fetchJSON(`/api/detail/${encodeURIComponent(detailId)}`);
    const moreInfo = document.getElementById("moreInfo");
    moreInfo.innerHTML = "";

    const entries = Object.entries(more || {});
    if (!entries.length) {
      moreInfo.textContent = "No further details.";
      return;
    }
    entries.forEach(([k, v]) => {
      const p = document.createElement("p");
      p.innerHTML = `<strong>${k}:</strong> ${v}`;
      moreInfo.appendChild(p);
    });
  } catch (e) {
    console.error(e);
    document.getElementById("moreInfo").textContent = "Failed to load more details.";
  }
};

// Init
loadCountries();
