/**
 * main.js
 * Logic global yang dipakai di semua halaman:
 * navigasi (hamburger + sticky header), reveal animation, parallax hero,
 * dan tahun footer otomatis.
 */

document.addEventListener("DOMContentLoaded", () => {
  initPageTransitions();
  initScrollProgress();
  initFooterYear();
  initStickyHeader();
  initNavToggle();
  initDocsPreview();
  initRevealOnScroll();
  initHeroParallax();
  renderLeadershipCards();
  initLeaderCardDetails();
});

function initUnavailablePhotoSkeletons() {
  document.addEventListener("error", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || image.classList.contains("brand-logo")) return;

    const media = image.closest(
      ".member-card-photo, .doc-grid-media, .doc-card-media, .member-detail-image-frame, .doc-detail-media, .org-card-photo-frame"
    );
    (media || image).classList.add("photo-unavailable");
    image.removeAttribute("src");
  }, true);
}

initUnavailablePhotoSkeletons();

function renderLeadershipCards() {
  if (typeof kepengurusanInti === "undefined") return;

  const pembinaContainer = document.getElementById("pembinaCards");
  const intiContainer = document.getElementById("pengurusIntiCards");
  if (!pembinaContainer && !intiContainer) return;

  const roleIcons = {
    "Pembina": "ph-shield-check",
    "Ketua": "ph-crown",
    "Wakil Ketua 1": "ph-user-gear",
    "Wakil Ketua 2": "ph-user-gear"
  };
  const createCard = (person, extraClass = "") => {
    const photo = person.fotoPengurus || person.foto;
    const card = document.createElement("article");
    card.className = `org-card org-card-lead ${extraClass}`.trim();
    card.dataset.leader = person.id;
    card.setAttribute("aria-label", `Lihat detail ${person.jabatan}: ${person.nama}`);

    const photoFrame = document.createElement("div");
    photoFrame.className = "org-card-photo-frame";
    if (!photo) photoFrame.classList.add("photo-unavailable");

    const image = document.createElement("img");
    image.className = "org-card-photo";
    if (photo) image.src = photo;
    image.alt = `Foto ${person.nama} JURNALISTIK`;
    photoFrame.appendChild(image);

    const role = document.createElement("p");
    role.className = "org-card-role";
    const icon = document.createElement("i");
    icon.className = `ph ${roleIcons[person.jabatan] || "ph-user"}`;
    icon.setAttribute("aria-hidden", "true");
    role.append(icon, document.createTextNode(` ${person.jabatan}`));

    const name = document.createElement("h3");
    name.className = "org-card-name";
    name.textContent = person.nama;

    card.append(photoFrame, role, name);
    return card;
  };

  const pembina = kepengurusanInti.filter((person) => person.id.startsWith("pembina-"));
  const pengurusIntiOrder = ["Wakil Ketua 1", "Ketua", "Wakil Ketua 2"];
  const pengurusInti = pengurusIntiOrder
    .map((jabatan) => kepengurusanInti.find((person) => person.jabatan === jabatan))
    .filter(Boolean);

  if (pembinaContainer) {
    pembinaContainer.replaceChildren(
      ...pembina.map((person) => createCard(person, "org-pembina-card"))
    );
  }
  if (intiContainer) {
    intiContainer.replaceChildren(
      ...pengurusInti.map((person) =>
        createCard(person, person.jabatan === "Ketua" ? "org-card-ketua" : "")
      )
    );
  }
}

function initLeaderCardDetails() {
  const leaderCards = document.querySelectorAll(".org-card[data-leader]");
  if (!leaderCards.length) return;

  const overlay = ensureLeaderDetailOverlay();
  const hasMemberDetailController =
    typeof openMemberDetail === "function" &&
    typeof closeMemberDetail === "function";

  if (!hasMemberDetailController) {
    const closeButton = document.getElementById("memberDetailClose");
    closeButton?.addEventListener("click", () => closeLeaderDetail(overlay));

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeLeaderDetail(overlay);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !overlay.hidden) {
        closeLeaderDetail(overlay);
      }
    });
  }

  leaderCards.forEach((card) => {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    card.addEventListener("click", () =>
      openLeaderDetail(card, overlay, hasMemberDetailController)
    );
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });
  });
}

function ensureLeaderDetailOverlay() {
  let overlay = document.getElementById("memberDetailOverlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "memberDetailOverlay";
  overlay.className = "member-detail-overlay";
  overlay.hidden = true;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "memberDetailName");
  overlay.innerHTML = `
    <div class="member-detail-panel">
      <div class="member-detail-header">
        <h2 class="member-detail-name" id="memberDetailName"></h2>
        <div class="member-detail-toolbar">
          <button type="button" class="member-detail-close" id="memberDetailClose" aria-label="Tutup detail">
            <i class="ph ph-x" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <div class="member-detail-image-frame">
        <img class="member-detail-image" id="memberDetailImage" src="" alt="">
      </div>
      <div class="member-detail-body">
        <p class="member-detail-role" id="memberDetailRole"></p>
        <p class="member-detail-class" id="memberDetailClass"></p>
        <p class="member-detail-intro" id="memberDetailIntro"></p>
        <blockquote class="member-detail-quote" id="memberDetailQuote"></blockquote>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  return overlay;
}

function openLeaderDetail(card, overlay, hasMemberDetailController) {
  const key = card.dataset.leader;
  const leader = typeof kepengurusanInti === "undefined"
    ? null
    : kepengurusanInti.find((person) => person.id === key);
  if (!leader) return;

  const leaderWithPhoto = {
    ...leader,
    foto: leader.fotoPengurus || leader.foto
  };

  if (hasMemberDetailController) {
    openMemberDetail({ ...leaderWithPhoto, divisi: "kreatif" }, card);
    return;
  }

  const image = document.getElementById("memberDetailImage");
  const imageFrame = image?.closest(".member-detail-image-frame");
  const name = document.getElementById("memberDetailName");
  const role = document.getElementById("memberDetailRole");
  const memberClass = document.getElementById("memberDetailClass");
  const intro = document.getElementById("memberDetailIntro");
  const quote = document.getElementById("memberDetailQuote");

  if (!image || !name || !role || !memberClass || !intro || !quote) return;

  image.hidden = false;
  imageFrame?.classList.remove("photo-unavailable");
  if (leaderWithPhoto.foto) image.src = leaderWithPhoto.foto;
  else {
    image.removeAttribute("src");
    imageFrame?.classList.add("photo-unavailable");
  }
  image.alt = `Foto ${leader.nama}`;
  name.textContent = leader.nama;
  role.textContent = leader.jabatan;
  memberClass.textContent = leader.id.startsWith("pembina-")
    ? `Guru Mata Pelajaran: ${leader.mataPelajaran || "Belum ada data"}`
    : `Kelas: ${leader.kelas || "Belum ada data"}`;
  memberClass.hidden = false;
  intro.textContent = leader.perkenalan || "Belum ada data";
  intro.hidden = false;
  quote.textContent = leader.quote ? `“${leader.quote}”` : "";
  quote.hidden = !leader.quote;

  window.MemberPosterMotion?.open(overlay, card);
}

function closeLeaderDetail(overlay) {
  window.MemberPosterMotion?.close(overlay);
}

/* -------------------------------------------------- */
/* Tahun footer otomatis                               */
/* -------------------------------------------------- */
function initFooterYear() {
  const yearEl = document.getElementById("currentYear");
  if (!yearEl) return;
  yearEl.textContent = new Date().getFullYear();
}

/* -------------------------------------------------- */
/* Header: transparan di hero, solid saat discroll     */
/* -------------------------------------------------- */
function initStickyHeader() {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  const SCROLL_THRESHOLD = 24;

  const updateHeaderState = () => {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
}

/* -------------------------------------------------- */
/* Hamburger menu (mobile navigation)                  */
/* -------------------------------------------------- */
function initNavToggle() {
  const toggleBtn = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  if (!toggleBtn || !nav) return;

  const closeNav = () => {
    nav.classList.remove("is-open");
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.querySelector("i")?.classList.replace("ph-x", "ph-list");
  };

  const openNav = () => {
    nav.classList.add("is-open");
    toggleBtn.setAttribute("aria-expanded", "true");
    toggleBtn.querySelector("i")?.classList.replace("ph-list", "ph-x");
  };

  toggleBtn.addEventListener("click", () => {
    const isOpen = nav.classList.contains("is-open");
    isOpen ? closeNav() : openNav();
  });

  // Tutup menu saat salah satu link nav diklik (penting untuk mobile)
  nav.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  // Tutup menu saat menekan Escape
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      closeNav();
      toggleBtn.focus();
    }
  });
}

/* -------------------------------------------------- */
/* Preview dokumentasi terbaru di beranda              */
/* -------------------------------------------------- */
function initDocsPreview() {
  const grid = document.getElementById("docsScroll");
  if (!grid || typeof dokumentasiData === "undefined") return;

  const categoryLabels = {
    "event-sekolah": "Event Sekolah",
    sosialisasi: "Sosialisasi",
    organisasi: "Organisasi",
    "school-life": "School Life"
  };

  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  const featuredDocs = [...dokumentasiData]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  featuredDocs.forEach((doc) => {
    const card = document.createElement("a");
    card.href = `dokumentasi.html#${doc.id}`;
    card.className = "doc-card";
    card.setAttribute("role", "listitem");
    card.setAttribute("data-reveal", "");

    const media = document.createElement("div");
    media.className = "doc-card-media";

    const image = document.createElement("img");
    if (doc.thumbnail) image.src = doc.thumbnail;
    else media.classList.add("photo-unavailable");
    image.alt = doc.title;
    image.loading = "lazy";
    media.appendChild(image);

    const caption = document.createElement("p");
    caption.className = "doc-card-caption";
    caption.textContent = doc.title;

    const body = document.createElement("div");
    body.className = "doc-card-body";

    const categories = Array.isArray(doc.category)
      ? doc.category
      : doc.category ? [doc.category] : [];

    if (categories.length) {
      const tags = document.createElement("div");
      tags.className = "doc-card-tags";
      categories.forEach((category) => {
        const pill = document.createElement("span");
        pill.className = "doc-category-pill";
        pill.textContent = categoryLabels[category] || category;
        tags.appendChild(pill);
      });
      body.appendChild(tags);
    }

    body.appendChild(caption);

    if (doc.date) {
      const date = document.createElement("p");
      date.className = "doc-card-date";
      date.textContent = formatter.format(new Date(doc.date));
      body.appendChild(date);
    }

    card.append(media, body);
    grid.appendChild(card);
  });
}

/* -------------------------------------------------- */
/* Reveal animation saat scroll (dan saat load)        */
/* -------------------------------------------------- */
function initRevealOnScroll() {
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length === 0) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.revealDelay || 0;
          setTimeout(() => {
            entry.target.classList.add("is-visible");
          }, delay * 100);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/* -------------------------------------------------- */
/* Parallax tipis untuk gambar hero                    */
/* -------------------------------------------------- */
function initHeroParallax() {
  const parallaxEl = document.querySelector("[data-parallax]");
  if (!parallaxEl) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion) return;

  let ticking = false;

  const updateParallax = () => {
    const scrollY = window.scrollY;
    const offset = Math.min(scrollY * 0.08, 24); // cap biar tetap subtle
    parallaxEl.style.transform = `translateY(${offset}px)`;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    },
    { passive: true }
  );
}
/* -------------------------------------------------- */
/* Editorial Camera Shutter & Viewfinder Page Transition */
/* -------------------------------------------------- */
function initPageTransitions() {
  const STORAGE_KEY = "jurnalistik_shutter";
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Pastikan kelas anti-kedip selalu dibersihkan jika animasi dimatikan
  if (prefersReducedMotion) {
    document.documentElement.classList.remove("is-page-entering");
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  // Buat elemen overlay rana kamera sekali di setiap halaman
  const overlay = document.createElement("div");
  overlay.className = "shutter-transition";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="shutter-blade shutter-blade--top"></div>
    <div class="shutter-blade shutter-blade--bottom"></div>
    <div class="shutter-seam"></div>
    <div class="shutter-hud">
      <span class="shutter-corner shutter-corner--tl"></span>
      <span class="shutter-corner shutter-corner--tr"></span>
      <span class="shutter-corner shutter-corner--bl"></span>
      <span class="shutter-corner shutter-corner--br"></span>
      <div class="shutter-meta-top">
        <span class="shutter-rec-dot"></span>
        <span>JURNALISTIK // SMANTIGA</span>
      </div>
      <div class="shutter-center">
        <span class="shutter-kicker">MEMBUKA HALAMAN</span>
        <span class="shutter-label" id="shutterPageLabel">JURNALISTIK</span>
      </div>
      <div class="shutter-meta-bottom" id="shutterFrameCode">ISO 400 &bull; F/2.8</div>
    </div>
  `;
  document.body.appendChild(overlay);

  const labelEl = overlay.querySelector("#shutterPageLabel");
  const frameCodeEl = overlay.querySelector("#shutterFrameCode");

  // Peta nama halaman & kode lensa tematik
  const getPageMeta = (urlObj) => {
    const file = (urlObj.pathname.split("/").pop() || "index.html").toLowerCase();
    const divisiParam = urlObj.searchParams.get("divisi");

    if (file === "" || file === "index.html") {
      return { label: "BERANDA", code: "FRAME 01 // HOME" };
    }
    if (file === "profil.html") {
      return { label: "PROFIL", code: "FRAME 02 // REDAKSI" };
    }
    if (file === "dokumentasi.html") {
      return { label: "DOKUMENTASI", code: "FRAME 03 // ARSIP" };
    }
    if (file === "anggota.html") {
      if (divisiParam) {
        return {
          label: divisiParam.replace(/-/g, " ").toUpperCase(),
          code: "FRAME 04 // DIVISI"
        };
      }
      return { label: "ANGGOTA", code: "FRAME 04 // TIM" };
    }
    return { label: "JURNALISTIK", code: "REC // SMANTIGA" };
  };

  // 1. Animasi MASUK (buka rana) saat datang dari halaman internal lain
  const playEnterTransition = () => {
    let payload = null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) payload = JSON.parse(raw);
    } catch (e) {}

    sessionStorage.removeItem(STORAGE_KEY);

    if (!payload || Date.now() - payload.ts > 5000) {
      document.documentElement.classList.remove("is-page-entering");
      return;
    }

    if (labelEl) labelEl.textContent = payload.label || "JURNALISTIK";
    if (frameCodeEl) frameCodeEl.textContent = payload.code || "REC // SMANTIGA";

    // Posisikan tirai dalam keadaan tertutup rapat, lalu lepas curtain HTML
    overlay.classList.add("is-covered");
    document.body.classList.add("is-shutter-opening");
    document.documentElement.classList.remove("is-page-entering");

    // Buka rana di frame berikutnya setelah layout siap
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          overlay.classList.remove("is-covered");
          overlay.classList.add("is-revealing");
          document.body.classList.remove("is-shutter-opening");

          window.setTimeout(() => {
            overlay.classList.remove("is-revealing");
          }, 660);
        }, 70);
      });
    });
  };

  playEnterTransition();

  // 2. Pengaman tombol Back / Forward browser (bfcache)
  window.addEventListener("pageshow", (event) => {
    document.documentElement.classList.remove("is-page-entering");
    document.body.classList.remove("is-shutter-opening");
    if (event.persisted) {
      overlay.classList.remove("is-leaving", "is-covered", "is-revealing");
    }
  });

  // 3. Animasi KELUAR (tutup rana) saat klik link internal
  let isNavigating = false;

  document.addEventListener("click", (event) => {
    if (
      isNavigating ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link = event.target.closest("a[href]");
    if (!link) return;

    const rawHref = link.getAttribute("href");
    if (
      !rawHref ||
      rawHref.startsWith("#") ||
      rawHref.startsWith("mailto:") ||
      rawHref.startsWith("tel:") ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    ) {
      return;
    }

    let targetUrl;
    try {
      targetUrl = new URL(link.href, window.location.href);
    } catch (e) {
      return;
    }

    // Abaikan link eksternal (Instagram, Google Form, Google Drive, dll)
    if (targetUrl.origin !== window.location.origin) return;

    // Abaikan jika link menuju halaman dan query yang persis sama
    const isSamePage =
      targetUrl.pathname === window.location.pathname &&
      targetUrl.search === window.location.search;
    if (isSamePage) return;

    event.preventDefault();
    isNavigating = true;

    const meta = getPageMeta(targetUrl);
    if (labelEl) labelEl.textContent = meta.label;
    if (frameCodeEl) frameCodeEl.textContent = meta.code;

    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          label: meta.label,
          code: meta.code,
          ts: Date.now()
        })
      );
    } catch (e) {}

    overlay.classList.remove("is-covered", "is-revealing");
    // Paksa reflow agar animasi tutup selalu jalan mulus
    void overlay.offsetWidth;
    overlay.classList.add("is-leaving");

    window.setTimeout(() => {
      window.location.href = targetUrl.href;
    }, 480);
  });
}

/* -------------------------------------------------- */
/* Filmstrip Scroll Progress Bar di bawah Header       */
/* -------------------------------------------------- */
function initScrollProgress() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion) return;

  const bar = document.createElement("div");
  bar.className = "scroll-progress-bar";
  bar.setAttribute("aria-hidden", "true");

  const fill = document.createElement("div");
  fill.className = "scroll-progress-fill";
  bar.appendChild(fill);
  document.body.appendChild(bar);

  let ticking = false;
  const update = () => {
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(window.scrollY / docHeight, 1) : 0;
    fill.style.transform = `scaleX(${progress})`;
    ticking = false;
  };

  update();
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
}
/* -------------------------------------------------- */
/* 3D Flying Poster & Editorial Lightbox Controller    */
/* Dipakai oleh anggota.js & profil.html (leader card) */
/* -------------------------------------------------- */
window.MemberPosterMotion = (() => {
  let state = "closed"; // "closed" | "opening" | "open" | "closing"
  let activeTrigger = null;
  let activeSourcePhoto = null;
  let activeClone = null;
  let activeAnimation = null;
  let closeFallbackTimer = null;
  let tiltBound = false;

  const prefersReduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const lockBodyScroll = () => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      const header = document.getElementById("siteHeader");
      if (header) header.style.paddingRight = `${scrollbarWidth}px`;
    }
  };

  const unlockBodyScroll = () => {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    const header = document.getElementById("siteHeader");
    if (header) header.style.paddingRight = "";
  };

  const ensurePosterEnhancements = (imageFrame) => {
    if (!imageFrame) return;

    if (!imageFrame.querySelector(".member-poster-glare")) {
      const glare = document.createElement("div");
      glare.className = "member-poster-glare";
      glare.setAttribute("aria-hidden", "true");
      imageFrame.appendChild(glare);
    }

    if (!imageFrame.querySelector(".member-poster-reticle")) {
      const reticle = document.createElement("div");
      reticle.className = "member-poster-reticle";
      reticle.setAttribute("aria-hidden", "true");
      reticle.innerHTML = "<span></span><span></span><span></span><span></span>";
      imageFrame.appendChild(reticle);
    }

    if (tiltBound) return;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover || prefersReduced()) return;

    tiltBound = true;
    imageFrame.addEventListener("pointermove", (e) => {
      if (state !== "open") return;
      const rect = imageFrame.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const xRatio = (e.clientX - rect.left) / rect.width;
      const yRatio = (e.clientY - rect.top) / rect.height;
      const rotateY = (xRatio - 0.5) * 14;
      const rotateX = (0.5 - yRatio) * 14;

      imageFrame.classList.add("is-tilting");
      imageFrame.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
      imageFrame.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
      imageFrame.style.setProperty("--glare-x", `${(xRatio * 100).toFixed(1)}%`);
      imageFrame.style.setProperty("--glare-y", `${(yRatio * 100).toFixed(1)}%`);
    });

    imageFrame.addEventListener("pointerleave", () => {
      imageFrame.classList.remove("is-tilting");
      imageFrame.style.setProperty("--tilt-x", "0deg");
      imageFrame.style.setProperty("--tilt-y", "0deg");
    });
  };

  const triggerFocusLock = (imageFrame) => {
    if (!imageFrame) return;
    imageFrame.classList.remove("is-focus-locked");
    void imageFrame.offsetWidth;
    imageFrame.classList.add("is-focus-locked");
  };

  const createFlightClone = (sourceEl, targetRect, startRadius, fallbackImg) => {
    const clone = document.createElement("div");
    clone.className = "poster-flight-clone";
    clone.style.left = `${targetRect.left}px`;
    clone.style.top = `${targetRect.top}px`;
    clone.style.width = `${targetRect.width}px`;
    clone.style.height = `${targetRect.height}px`;
    clone.style.borderRadius = startRadius;

    const imgEl = sourceEl?.querySelector("img") || fallbackImg;
    const isUnavailable =
      sourceEl?.classList.contains("photo-unavailable") ||
      !imgEl ||
      !imgEl.getAttribute("src");

    if (isUnavailable) {
      clone.classList.add("photo-unavailable");
    } else {
      const clonedImg = document.createElement("img");
      clonedImg.src = imgEl.currentSrc || imgEl.src;
      clonedImg.alt = "";
      clone.appendChild(clonedImg);
    }

    document.body.appendChild(clone);
    return clone;
  };

  const clearFlightArtifacts = () => {
    if (activeAnimation) {
      try { activeAnimation.cancel(); } catch (e) {}
      activeAnimation = null;
    }
    if (activeClone) {
      activeClone.remove();
      activeClone = null;
    }
    window.clearTimeout(closeFallbackTimer);
    closeFallbackTimer = null;
  };

  const open = (overlay, trigger) => {
    if (!overlay || state === "opening" || state === "closing") return;

    clearFlightArtifacts();
    const panel = overlay.querySelector(".member-detail-panel");
    const imageFrame = overlay.querySelector(".member-detail-image-frame");
    const detailImg = overlay.querySelector("#memberDetailImage");

    ensurePosterEnhancements(imageFrame);
    activeTrigger = trigger || null;
    activeSourcePhoto =
      trigger?.querySelector(".member-card-photo, .org-card-photo-frame") ||
      null;

    overlay.classList.remove("is-closing");
    overlay.inert = false;
    overlay.removeAttribute("aria-hidden");
    if (panel) panel.scrollTop = 0;

    // Fallback cepat jika user mematikan animasi di OS
    if (prefersReduced() || !activeSourcePhoto || !imageFrame) {
      overlay.hidden = false;
      lockBodyScroll();
      state = "open";
      window.requestAnimationFrame(() => {
        overlay.classList.add("is-open");
        document.getElementById("memberDetailClose")?.focus();
      });
      return;
    }

    state = "opening";

    // 1. Ukur posisi poster asal di grid
    const sourceRect = activeSourcePhoto.getBoundingClientRect();
    const sourceRadius = window.getComputedStyle(activeSourcePhoto).borderRadius || "16px";

    // 2. Ukur posisi target poster di dalam modal secara presisi
    overlay.hidden = false;
    overlay.classList.add("is-measuring");
    const targetRect = imageFrame.getBoundingClientRect();
    const targetRadius = window.getComputedStyle(imageFrame).borderRadius || "14px";
    overlay.classList.remove("is-measuring");

    lockBodyScroll();

    const canFly =
      sourceRect.width > 10 &&
      sourceRect.height > 10 &&
      targetRect.width > 10 &&
      targetRect.height > 10 &&
      typeof Element.prototype.animate === "function";

    if (!canFly) {
      window.requestAnimationFrame(() => {
        overlay.classList.add("is-open");
        state = "open";
        document.getElementById("memberDetailClose")?.focus();
      });
      return;
    }

    // 3. Hitung vektor terbang FLIP (pusat-ke-pusat)
    const dx =
      sourceRect.left + sourceRect.width / 2 - (targetRect.left + targetRect.width / 2);
    const dy =
      sourceRect.top + sourceRect.height / 2 - (targetRect.top + targetRect.height / 2);
    const sx = sourceRect.width / targetRect.width;
    const sy = sourceRect.height / targetRect.height;
    const bankDir = dx >= 0 ? -1 : 1;

    // Angkat kartu asal & sembunyikan frame target selama clone terbang
    activeSourcePhoto.classList.remove("is-poster-landed");
    activeSourcePhoto.classList.add("is-poster-lifted");
    imageFrame.classList.add("is-poster-hidden");
    imageFrame.style.setProperty("--tilt-x", "0deg");
    imageFrame.style.setProperty("--tilt-y", "0deg");

    activeClone = createFlightClone(
      activeSourcePhoto,
      targetRect,
      sourceRadius,
      detailImg
    );

    // 4. Jalankan animasi terbang 3D + bukaan panel bersamaan
    window.requestAnimationFrame(() => {
      overlay.classList.add("is-open");
      document.getElementById("memberDetailClose")?.focus({ preventScroll: true });

      const midX = dx * 0.42;
      const midY = dy * 0.42 - 26;
      const midScaleX = sx + (1 - sx) * 0.68;
      const midScaleY = sy + (1 - sy) * 0.68;

      activeAnimation = activeClone.animate(
        [
          {
            transform: `perspective(1200px) translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy}) rotateY(0deg) rotateX(0deg) rotateZ(0deg)`,
            borderRadius: sourceRadius,
            boxShadow: "0 8px 20px rgba(15, 44, 82, 0.14)"
          },
          {
            offset: 0.48,
            transform: `perspective(1200px) translate3d(${midX}px, ${midY}px, 90px) scale(${midScaleX}, ${midScaleY}) rotateY(${bankDir * 16}deg) rotateX(7deg) rotateZ(${bankDir * -2.8}deg)`,
            borderRadius: "18px",
            boxShadow: "0 38px 80px rgba(10, 26, 51, 0.45)"
          },
          {
            transform: "perspective(1200px) translate3d(0px, 0px, 0px) scale(1, 1) rotateY(0deg) rotateX(0deg) rotateZ(0deg)",
            borderRadius: targetRadius,
            boxShadow: "0 12px 30px rgba(15, 44, 82, 0.18)"
          }
        ],
        {
          duration: 500,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards"
        }
      );

      activeAnimation.onfinish = () => {
        imageFrame.classList.remove("is-poster-hidden");
        triggerFocusLock(imageFrame);
        clearFlightArtifacts();
        state = "open";
      };
    });
  };

  const close = (overlay) => {
    if (!overlay || overlay.hidden || state === "closed" || state === "closing") return;

    clearFlightArtifacts();
    state = "closing";

    const imageFrame = overlay.querySelector(".member-detail-image-frame");
    const detailImg = overlay.querySelector("#memberDetailImage");

    imageFrame?.classList.remove("is-tilting", "is-focus-locked");
    imageFrame?.style.setProperty("--tilt-x", "0deg");
    imageFrame?.style.setProperty("--tilt-y", "0deg");

    const finishClose = (withLandBounce = false) => {
      clearFlightArtifacts();
      imageFrame?.classList.remove("is-poster-hidden");
      overlay.classList.remove("is-open", "is-closing");
      overlay.hidden = true;
      overlay.inert = false;
      overlay.removeAttribute("aria-hidden");
      unlockBodyScroll();

      if (activeSourcePhoto) {
        activeSourcePhoto.classList.remove("is-poster-lifted");
        if (withLandBounce) {
          activeSourcePhoto.classList.add("is-poster-landed");
          const landedEl = activeSourcePhoto;
          window.setTimeout(() => landedEl.classList.remove("is-poster-landed"), 380);
        }
      }

      activeTrigger?.focus({ preventScroll: true });
      activeTrigger = null;
      activeSourcePhoto = null;
      state = "closed";
    };

    if (prefersReduced()) {
      finishClose(false);
      return;
    }

    overlay.setAttribute("aria-hidden", "true");
    overlay.inert = true;

    const targetRect = imageFrame?.getBoundingClientRect();
    const sourceRect = activeSourcePhoto?.isConnected
      ? activeSourcePhoto.getBoundingClientRect()
      : null;

    // Pastikan poster modal & kartu asal masih terlihat di layar untuk terbang pulang
    const posterVisible =
      targetRect &&
      targetRect.width > 10 &&
      targetRect.bottom > 0 &&
      targetRect.top < window.innerHeight;
    const sourceVisible =
      sourceRect &&
      sourceRect.width > 10 &&
      sourceRect.bottom > -80 &&
      sourceRect.top < window.innerHeight + 80;

    if (
      posterVisible &&
      sourceVisible &&
      typeof Element.prototype.animate === "function"
    ) {
      overlay.classList.remove("is-open");
      overlay.classList.add("is-closing");
      closeFallbackTimer = window.setTimeout(() => {
        closeFallbackTimer = null;
        const freshTargetRect = imageFrame.getBoundingClientRect();
        const freshSourceRect = activeSourcePhoto.getBoundingClientRect();
        const targetRadius = window.getComputedStyle(imageFrame).borderRadius || "14px";
        const sourceRadius = window.getComputedStyle(activeSourcePhoto).borderRadius || "16px";
        const dx =
          freshSourceRect.left + freshSourceRect.width / 2 -
          (freshTargetRect.left + freshTargetRect.width / 2);
        const dy =
          freshSourceRect.top + freshSourceRect.height / 2 -
          (freshTargetRect.top + freshTargetRect.height / 2);
        const sx = freshSourceRect.width / freshTargetRect.width;
        const sy = freshSourceRect.height / freshTargetRect.height;
        const bankDir = dx >= 0 ? 1 : -1;
        const midX = dx * 0.48;
        const midY = dy * 0.48 - 22;
        const midScaleX = 1 + (sx - 1) * 0.48;
        const midScaleY = 1 + (sy - 1) * 0.48;

        activeClone = createFlightClone(
          imageFrame,
          freshTargetRect,
          targetRadius,
          detailImg
        );
        imageFrame.classList.add("is-poster-hidden");
        activeAnimation = activeClone.animate(
          [
            {
              transform: "perspective(1200px) translate3d(0px, 0px, 0px) scale(1, 1) rotateY(0deg) rotateX(0deg) rotateZ(0deg)",
              borderRadius: targetRadius,
              boxShadow: "0 20px 45px rgba(15, 44, 82, 0.28)"
            },
            {
              offset: 0.46,
              transform: `perspective(1200px) translate3d(${midX}px, ${midY}px, 75px) scale(${midScaleX}, ${midScaleY}) rotateY(${bankDir * 15}deg) rotateX(-6deg) rotateZ(${bankDir * 2.5}deg)`,
              borderRadius: "18px",
              boxShadow: "0 30px 65px rgba(10, 26, 51, 0.35)"
            },
            {
              transform: `perspective(1200px) translate3d(${dx}px, ${dy}px, 0px) scale(${sx}, ${sy}) rotateY(0deg) rotateX(0deg) rotateZ(0deg)`,
              borderRadius: sourceRadius,
              boxShadow: "0 4px 12px rgba(15, 44, 82, 0.1)"
            }
          ],
          {
            duration: 430,
            easing: "cubic-bezier(0.32, 0.72, 0, 1)",
            fill: "forwards"
          }
        );
        activeAnimation.onfinish = () => finishClose(true);
      }, 65);
      return;
    }

    // Fallback animasi tutup 3D jika posisi poster sedang tidak terlihat
    overlay.classList.remove("is-open");
    overlay.classList.add("is-closing");
    closeFallbackTimer = window.setTimeout(() => finishClose(false), 320);
  };

  return { open, close };
})();

/* -------------------------------------------------- */
/* Dokumentasi 16:9 shared-element lightbox motion    */
/* -------------------------------------------------- */
window.DocFrameMotion = (() => {
  let state = "closed";
  let activeTrigger = null;
  let activeSourceMedia = null;
  let activeClone = null;
  let activeAnimation = null;
  let closeTimer = null;
  let liftDelayTimer = null;
  let tiltBound = false;

  const prefersReduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const lockBodyScroll = () => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      const header = document.getElementById("siteHeader");
      if (header) header.style.paddingRight = `${scrollbarWidth}px`;
    }
  };

  const unlockBodyScroll = () => {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    const header = document.getElementById("siteHeader");
    if (header) header.style.paddingRight = "";
  };

  const ensureFrameEnhancements = (frame) => {
    if (!frame) return;

    if (!frame.querySelector(".editorial-frame-glare")) {
      const glare = document.createElement("div");
      glare.className = "editorial-frame-glare";
      glare.setAttribute("aria-hidden", "true");
      frame.appendChild(glare);
    }

    if (!frame.querySelector(".editorial-frame-reticle")) {
      const reticle = document.createElement("div");
      reticle.className = "editorial-frame-reticle";
      reticle.setAttribute("aria-hidden", "true");
      reticle.innerHTML = "<span></span><span></span><span></span><span></span>";
      frame.appendChild(reticle);
    }

    if (!frame.querySelector(".editorial-frame-scan")) {
      const scan = document.createElement("div");
      scan.className = "editorial-frame-scan";
      scan.setAttribute("aria-hidden", "true");
      frame.appendChild(scan);
    }

    if (tiltBound || prefersReduced()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    tiltBound = true;
    frame.addEventListener("pointermove", (event) => {
      if (state !== "open") return;
      const rect = frame.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const xRatio = (event.clientX - rect.left) / rect.width;
      const yRatio = (event.clientY - rect.top) / rect.height;
      frame.classList.add("is-tilting");
      frame.style.setProperty("--tilt-x", `${((0.5 - yRatio) * 6).toFixed(2)}deg`);
      frame.style.setProperty("--tilt-y", `${((xRatio - 0.5) * 6).toFixed(2)}deg`);
      frame.style.setProperty("--glare-x", `${(xRatio * 100).toFixed(1)}%`);
      frame.style.setProperty("--glare-y", `${(yRatio * 100).toFixed(1)}%`);
    });

    frame.addEventListener("pointerleave", () => {
      frame.classList.remove("is-tilting");
      frame.style.setProperty("--tilt-x", "0deg");
      frame.style.setProperty("--tilt-y", "0deg");
    });
  };

  const pulseReticle = (frame, releasing) => {
    if (!frame) return;
    frame.classList.remove("is-focus-locked", "is-focus-releasing");
    void frame.offsetWidth;
    frame.classList.add(releasing ? "is-focus-releasing" : "is-focus-locked");
  };

  const clearFlight = () => {
    if (activeAnimation) {
      activeAnimation.cancel();
      activeAnimation = null;
    }
    activeClone?.remove();
    activeClone = null;
    window.clearTimeout(closeTimer);
    window.clearTimeout(liftDelayTimer);
    closeTimer = null;
    liftDelayTimer = null;
  };

  const createFlightClone = (source, rect, radius, fallbackImage, isReturning) => {
    const clone = document.createElement("div");
    clone.className = `editorial-flight-clone editorial-flight-clone--doc${
      isReturning ? " is-returning" : ""
    }`;
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.borderRadius = radius;

    const image = source?.querySelector("img") || fallbackImage;
    if (!image?.getAttribute("src") || source?.classList.contains("photo-unavailable")) {
      clone.classList.add("photo-unavailable");
    } else {
      const cloneImage = document.createElement("img");
      cloneImage.src = image.currentSrc || image.src;
      cloneImage.alt = "";
      clone.appendChild(cloneImage);
    }

    document.body.appendChild(clone);
    return clone;
  };

  const finishClose = (overlay, frame, shouldDock) => {
    clearFlight();
    frame?.classList.remove("is-media-hidden", "is-focus-releasing");
    overlay.classList.remove("is-open", "is-closing", "is-aperture-open");
    overlay.hidden = true;
    overlay.inert = false;
    overlay.removeAttribute("aria-hidden");
    unlockBodyScroll();

    if (activeSourceMedia) {
      activeSourceMedia.classList.remove("is-media-lifted");
      if (shouldDock) {
        activeSourceMedia.classList.remove("is-media-landed");
        void activeSourceMedia.offsetWidth;
        activeSourceMedia.classList.add("is-media-landed");
        const landedMedia = activeSourceMedia;
        window.setTimeout(() => landedMedia.classList.remove("is-media-landed"), 520);
      }
    }

    activeTrigger?.focus({ preventScroll: true });
    activeTrigger = null;
    activeSourceMedia = null;
    state = "closed";
  };

  const open = (overlay, trigger = null) => {
    if (!overlay || state === "opening" || state === "closing") return;
    clearFlight();

    const panel = overlay.querySelector(".doc-detail-panel");
    const frame = overlay.querySelector(".doc-detail-media");
    const image = overlay.querySelector("#docDetailImage");
    const closeButton = overlay.querySelector("#docDetailClose");

    ensureFrameEnhancements(frame);
    activeTrigger = trigger;
    activeSourceMedia = trigger?.querySelector(".doc-grid-media") || null;
    overlay.classList.remove("is-closing", "is-aperture-open");
    overlay.inert = false;
    overlay.removeAttribute("aria-hidden");
    if (panel) panel.scrollTop = 0;

    overlay.hidden = false;
    lockBodyScroll();

    if (prefersReduced()) {
      state = "open";
      window.requestAnimationFrame(() => {
        overlay.classList.add("is-open");
        closeButton?.focus({ preventScroll: true });
      });
      return;
    }

    if (!activeSourceMedia || !frame) {
      state = "opening";
      overlay.classList.add("is-aperture-open");
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          overlay.classList.add("is-open");
          closeButton?.focus({ preventScroll: true });
          pulseReticle(frame, false);
          liftDelayTimer = window.setTimeout(() => {
            state = "open";
          }, 640);
        });
      });
      return;
    }

    state = "opening";
    const sourceRect = activeSourceMedia.getBoundingClientRect();
    const sourceRadius = getComputedStyle(activeSourceMedia).borderRadius || "14px";

    overlay.classList.add("is-measuring");
    const targetRect = frame.getBoundingClientRect();
    const targetRadius = getComputedStyle(frame).borderRadius || "14px";
    overlay.classList.remove("is-measuring");

    const canFly =
      sourceRect.width > 10 &&
      sourceRect.height > 10 &&
      targetRect.width > 10 &&
      targetRect.height > 10 &&
      typeof Element.prototype.animate === "function";

    if (!canFly) {
      state = "opening";
      overlay.classList.add("is-aperture-open");
      window.requestAnimationFrame(() => {
        overlay.classList.add("is-open");
        closeButton?.focus({ preventScroll: true });
        state = "open";
      });
      return;
    }

    const dx =
      sourceRect.left + sourceRect.width / 2 - (targetRect.left + targetRect.width / 2);
    const dy =
      sourceRect.top + sourceRect.height / 2 - (targetRect.top + targetRect.height / 2);
    const scaleX = sourceRect.width / targetRect.width;
    const scaleY = sourceRect.height / targetRect.height;
    const direction = dx >= 0 ? -1 : 1;

    activeSourceMedia.classList.remove("is-media-landed");
    activeSourceMedia.classList.add("is-media-lifted");
    frame.classList.add("is-media-hidden");
    activeClone = createFlightClone(activeSourceMedia, targetRect, sourceRadius, image, false);

    window.requestAnimationFrame(() => {
      overlay.classList.add("is-open");
      closeButton?.focus({ preventScroll: true });
      activeAnimation = activeClone.animate(
        [
          {
            transform: `perspective(1300px) translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})`,
            borderRadius: sourceRadius,
            boxShadow: "0 8px 20px rgba(15, 44, 82, 0.14)"
          },
          {
            offset: 0.48,
            transform: `perspective(1300px) translate3d(${dx * 0.44}px, ${dy * 0.44 - 18}px, 60px) scale(${scaleX + (1 - scaleX) * 0.66}, ${scaleY + (1 - scaleY) * 0.66}) rotateY(${direction * 8}deg) rotateX(4deg)`,
            borderRadius: "16px",
            boxShadow: "0 34px 72px rgba(15, 44, 82, 0.32)"
          },
          {
            transform: "perspective(1300px) translate3d(0, 0, 0) scale(1, 1)",
            borderRadius: targetRadius,
            boxShadow: "0 12px 28px rgba(15, 44, 82, 0.16)"
          }
        ],
        {
          duration: 540,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards"
        }
      );
      activeAnimation.onfinish = () => {
        frame.classList.remove("is-media-hidden");
        pulseReticle(frame, false);
        clearFlight();
        state = "open";
      };
    });
  };

  const close = (overlay, fallbackTrigger = null) => {
    if (!overlay || overlay.hidden || state === "closed" || state === "closing") return;
    clearFlight();
    state = "closing";

    const frame = overlay.querySelector(".doc-detail-media");
    const image = overlay.querySelector("#docDetailImage");
    if (!activeSourceMedia && fallbackTrigger) {
      activeTrigger = fallbackTrigger;
      activeSourceMedia = fallbackTrigger.querySelector(".doc-grid-media");
    }

    frame?.classList.remove("is-tilting", "is-focus-locked");
    frame?.style.setProperty("--tilt-x", "0deg");
    frame?.style.setProperty("--tilt-y", "0deg");
    overlay.setAttribute("aria-hidden", "true");
    overlay.inert = true;

    if (prefersReduced()) {
      finishClose(overlay, frame, false);
      return;
    }

    pulseReticle(frame, true);
    overlay.classList.remove("is-open");
    overlay.classList.add("is-closing");

    const targetRect = frame?.getBoundingClientRect();
    const sourceRect = activeSourceMedia?.isConnected
      ? activeSourceMedia.getBoundingClientRect()
      : null;
    const canFly =
      targetRect &&
      targetRect.width > 10 &&
      targetRect.bottom > 0 &&
      targetRect.top < window.innerHeight &&
      sourceRect &&
      sourceRect.width > 10 &&
      sourceRect.bottom > -100 &&
      sourceRect.top < window.innerHeight + 100 &&
      typeof Element.prototype.animate === "function";

    if (!canFly) {
      closeTimer = window.setTimeout(() => finishClose(overlay, frame, false), 390);
      return;
    }

    liftDelayTimer = window.setTimeout(() => {
      const fromRect = frame.getBoundingClientRect();
      const toRect = activeSourceMedia.getBoundingClientRect();
      const fromRadius = getComputedStyle(frame).borderRadius || "14px";
      const toRadius = getComputedStyle(activeSourceMedia).borderRadius || "14px";
      const dx =
        toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
      const dy =
        toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2);
      const scaleX = toRect.width / fromRect.width;
      const scaleY = toRect.height / fromRect.height;
      const direction = dx >= 0 ? 1 : -1;

      activeSourceMedia.classList.add("is-media-lifted");
      activeClone = createFlightClone(frame, fromRect, fromRadius, image, true);
      frame.classList.add("is-media-hidden");
      activeAnimation = activeClone.animate(
        [
          {
            transform: "perspective(1300px) translate3d(0, 0, 0) scale(1, 1)",
            borderRadius: fromRadius,
            boxShadow: "0 18px 42px rgba(15, 44, 82, 0.24)"
          },
          {
            offset: 0.46,
            transform: `perspective(1300px) translate3d(${dx * 0.48}px, ${dy * 0.48 - 18}px, 60px) scale(${1 + (scaleX - 1) * 0.46}, ${1 + (scaleY - 1) * 0.46}) rotateY(${direction * 8}deg) rotateX(-4deg)`,
            borderRadius: "16px",
            boxShadow: "0 30px 64px rgba(15, 44, 82, 0.32)"
          },
          {
            transform: `perspective(1300px) translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})`,
            borderRadius: toRadius,
            boxShadow: "0 4px 12px rgba(15, 44, 82, 0.1)"
          }
        ],
        {
          duration: 470,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards"
        }
      );
      activeAnimation.onfinish = () => finishClose(overlay, frame, true);
    }, 65);
  };

  return { open, close };
})();