/**
 * dokumentasi.js
 * Hanya jalan di dokumentasi.html.
 * Bergantung pada: dokumentasiData (data/dokumentasi.js)
 */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof dokumentasiData === "undefined") return;

  const state = {
    category: "semua"
  };

  const grid = document.getElementById("docsGrid");
  const emptyState = document.getElementById("docsEmptyState");
  const categoryFilter = document.getElementById("docsCategoryFilter");
  let categorySwapTimer = null;

  renderGrid(state, grid, emptyState);

  categoryFilter?.addEventListener("click", (event) => {
    const chip = event.target.closest(".filter-chip");
    if (!chip || chip.dataset.category === state.category) return;

    categoryFilter.querySelectorAll(".filter-chip").forEach((c) => {
      c.classList.remove("is-active");
      c.setAttribute("aria-pressed", "false");
    });

    chip.classList.add("is-active");
    chip.setAttribute("aria-pressed", "true");
    state.category = chip.dataset.category;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      renderGrid(state, grid, emptyState);
      return;
    }

    window.clearTimeout(categorySwapTimer);
    grid?.classList.add("is-swapping");

    categorySwapTimer = window.setTimeout(() => {
      renderGrid(state, grid, emptyState);
      window.requestAnimationFrame(() => {
        grid?.classList.remove("is-swapping");
      });
    }, 170);
  });

  grid?.addEventListener("click", (event) => {
    const trigger = event.target.closest(".doc-grid-trigger");
    if (!trigger) return;
    const card = trigger.closest("[data-id]");
    if (card) openDocDetail(card.dataset.id, trigger);
  });

  initDetailOverlay();

  // Buka langsung kalau URL punya hash, misalnya dokumentasi.html#upacara-bendera
  if (window.location.hash) {
    const idFromHash = window.location.hash.replace("#", "");
    if (dokumentasiData.some((d) => d.id === idFromHash)) {
      const isPageTransitioning =
        document.documentElement.classList.contains("is-page-entering") &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(
        () => openDocDetail(idFromHash),
        isPageTransitioning ? 760 : 0
      );
    }
  }
});

/* -------------------------------------------------- */
/* Render grid berdasarkan kategori                   */
/* -------------------------------------------------- */
function formatDocCategory(category) {
  const labels = {
    "event-sekolah": "Event Sekolah",
    sosialisasi: "Sosialisasi",
    organisasi: "Organisasi",
    "school-life": "School Life"
  };
  return labels[category] || category;
}

function renderGrid(state, grid, emptyState) {
  if (!grid) return;

  const filtered = dokumentasiData.filter((doc) => {
    const categories = Array.isArray(doc.category)
      ? doc.category
      : [doc.category];
    return state.category === "semua" || categories.includes(state.category);
  });

  grid.setAttribute("aria-busy", "false");
  grid.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  filtered.forEach((doc, index) => {
    const li = document.createElement("li");
    li.className = "doc-grid-card";
    li.dataset.id = doc.id;
    const categories = Array.isArray(doc.category)
      ? doc.category
      : doc.category ? [doc.category] : [];

    li.dataset.category = categories.join(" ");
    li.setAttribute("data-reveal", "");
    li.setAttribute("data-reveal-delay", String(index % 4));

    const formattedDate = formatter.format(new Date(doc.date));
    const categoryPills = categories
      .map((category) => `<span class="doc-category-pill">${formatDocCategory(category)}</span>`)
      .join("");

    li.innerHTML = `
      <button type="button" class="doc-grid-trigger" aria-haspopup="dialog">
        <div class="doc-grid-media${doc.thumbnail ? "" : " photo-unavailable"}">
          ${doc.thumbnail ? `<img src="${doc.thumbnail}" alt="Dokumentasi ${doc.title}" loading="lazy">` : ""}
        </div>
        <div class="doc-grid-info">
          ${categoryPills ? `<div class="doc-card-tags">${categoryPills}</div>` : ""}
          <h3 class="doc-grid-title">${doc.title}</h3>
          <p class="doc-grid-date">${formattedDate}</p>
        </div>
      </button>
    `;

    grid.appendChild(li);
  });

  attachRevealToDocCards(grid);
}

function attachRevealToDocCards(grid) {
  const cards = grid.querySelectorAll("[data-reveal]");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    cards.forEach((card) => card.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const delay = Number(entry.target.dataset.revealDelay || 0);
        window.setTimeout(() => entry.target.classList.add("is-visible"), delay * 80);
        currentObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  cards.forEach((card) => observer.observe(card));
}

/* -------------------------------------------------- */
/* Panel detail dokumentasi                           */
/* -------------------------------------------------- */
function initDetailOverlay() {
  const overlay = document.getElementById("docDetailOverlay");
  const closeBtn = document.getElementById("docDetailClose");
  if (!overlay) return;

  closeBtn?.addEventListener("click", closeDocDetail);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeDocDetail();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeDocDetail();
  });
}

function openDocDetail(id, trigger = null) {
  if (!id) return;
  const doc = dokumentasiData.find((d) => d.id === id);
  if (!doc) return;

  const overlay = document.getElementById("docDetailOverlay");
  const image = document.getElementById("docDetailImage");
  const title = document.getElementById("docDetailTitle");
  const date = document.getElementById("docDetailDate");
  const description = document.getElementById("docDetailDescription");
  const driveLink = document.getElementById("docDetailDriveLink");

  if (!overlay) return;

  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  if (image) {
    const media = image.closest(".doc-detail-media");
    media?.classList.remove("photo-unavailable");
    if (doc.thumbnail) image.src = doc.thumbnail;
    else {
      image.removeAttribute("src");
      media?.classList.add("photo-unavailable");
    }
    image.alt = `Dokumentasi ${doc.title}`;
  }
  if (title) title.textContent = doc.title;
  if (date) date.textContent = formatter.format(new Date(doc.date));
  if (description) description.textContent = doc.description;
  if (driveLink) driveLink.href = doc.driveUrl || "#";

  overlay.dataset.activeDocId = doc.id;
  history.replaceState(null, "", `#${doc.id}`);
  window.DocFrameMotion?.open(overlay, trigger);
}

function closeDocDetail() {
  const overlay = document.getElementById("docDetailOverlay");
  if (!overlay) return;

  const activeId = overlay.dataset.activeDocId;
  const fallbackTrigger = activeId
    ? [...document.querySelectorAll(".doc-grid-card[data-id]")].find(
        (card) => card.dataset.id === activeId
      )?.querySelector(".doc-grid-trigger")
    : null;

  history.replaceState(null, "", window.location.pathname + window.location.search);
  window.DocFrameMotion?.close(overlay, fallbackTrigger);
}
