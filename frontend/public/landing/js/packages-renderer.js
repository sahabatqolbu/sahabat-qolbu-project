// js/packages-renderer.js - Filter Dropdown Mobile + Tabs Desktop

(function () {
  const fallbackImg =
    "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=400&q=80";

  function normalizeApiBase(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function resolveApiBase() {
    const fromWindow = normalizeApiBase(window.SQ_API_BASE);
    if (fromWindow) return fromWindow;

    const meta = document.querySelector('meta[name="sq-api-base"]');
    const fromMeta = normalizeApiBase(meta && meta.getAttribute("content"));
    if (fromMeta) return fromMeta;

    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000/api";
    }

    return "https://api.sahabatqolbu.com/api";
  }

  const apiBase = resolveApiBase();
  const serverBase = apiBase.replace(/\/api$/, "");

  const packageTypeMap = {
    FULL_SERVICE: "reguler",
    EXTREME: "extreme",
    SEMI_MANDIRI: "semi-mandiri",
    FLEKSIBILITAS: "fleksibilitas",
    KONSORSIUM: "konsorsium",
    LA: "la",
  };

  const packageLabelMap = {
    FULL_SERVICE: { label: "REGULER", labelColor: "bg-primary text-white" },
    EXTREME: { label: "EXTREME", labelColor: "bg-gold text-primary" },
    SEMI_MANDIRI: { label: "SEMI MANDIRI", labelColor: "bg-orange-500 text-white" },
    FLEKSIBILITAS: { label: "FLEKSIBEL", labelColor: "bg-purple-600 text-white" },
    KONSORSIUM: { label: "KONSORSIUM", labelColor: "bg-blue-500 text-white" },
    LA: { label: "LAND ARRANGEMENT", labelColor: "bg-emerald-600 text-white" },
  };

  let packageData = Array.isArray(paket) ? paket : [];

  function formatDateRange(startDate, endDate) {
    if (!startDate) return "Jadwal menyusul";

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (!end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(start);
    }

    const sameMonth =
      start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

    if (sameMonth) {
      const monthYear = new Intl.DateTimeFormat("id-ID", {
        month: "short",
        year: "numeric",
      }).format(start);
      return `${String(start.getDate()).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")} ${monthYear}`;
    }

    const fmt = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
    });
    const endFmt = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return `${fmt.format(start)} - ${endFmt.format(end)}`;
  }

  function normalizeImageUrl(path) {
    if (!path) return fallbackImg;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${serverBase}${path}`;
  }

  function mapApiPackage(pkg, index) {
    const imageList = Array.isArray(pkg.images)
      ? pkg.images
          .map((img) => (typeof img === "string" ? img : img?.imageUrl))
          .filter(Boolean)
          .map(normalizeImageUrl)
      : [];

    const mappedType = packageTypeMap[pkg.type] || "reguler";
    const labelMeta = packageLabelMap[pkg.type] || packageLabelMap.FULL_SERVICE;

    return {
      id: pkg.id,
      nama: pkg.name,
      images: imageList.length > 0 ? imageList : [fallbackImg],
      tgl: formatDateRange(pkg.departureDate, pkg.returnDate),
      hari: Number(pkg.duration) || "-",
      tipe: mappedType,
      label: labelMeta.label,
      labelColor: labelMeta.labelColor,
      hot: false,
      featured: index < 6,
    };
  }

  function getCurrentWaNumber() {
    const contact = window.SQ_LANDING_CONTACT || {};
    const fromContact = contact.whatsappNumber || contact.whatsapp;
    const digits = String(fromContact || WA || "").replace(/\D/g, "");
    if (!digits) return WA;
    if (digits.startsWith("0")) return `62${digits.slice(1)}`;
    if (digits.startsWith("62")) return digits;
    if (digits.startsWith("8")) return `62${digits}`;
    return digits;
  }

  function createWhatsappLink(packageName) {
    const message = `Halo, saya lihat di website sahabatqolbu.com dan tertarik paket *${packageName}*`;
    return `https://wa.me/${getCurrentWaNumber()}?text=${encodeURIComponent(message)}`;
  }

  function createDetailLink(packageId) {
    return `/landing/paket/${encodeURIComponent(packageId)}`;
  }

  function updatePackageWhatsappLinks() {
    document.querySelectorAll(".js-package-wa-link").forEach((link) => {
      const packageName = link.getAttribute("data-package-name") || "Paket Umroh";
      link.setAttribute("href", createWhatsappLink(packageName));
    });
  }

  async function hydratePackagesFromApi() {
    try {
      const response = await fetch(`${apiBase}/packages`, {
        credentials: "include",
      });

      if (!response.ok) return;

      const payload = await response.json();
      const items = payload?.data?.packages;
      if (!Array.isArray(items) || items.length === 0) return;

      packageData = items.map(mapApiPackage);
    } catch {
      // Keep fallback static data when API is unavailable.
    }
  }

  // Create Swipe Slider
  function createSlider(images, id) {
    if (!images || images.length === 0) {
      return `<img src="${fallbackImg}" alt="Paket Umroh" class="w-full h-full object-cover">`;
    }

    if (images.length === 1) {
      return `<img src="${images[0]}" alt="Paket Umroh" class="w-full h-full object-cover" onerror="this.src='${fallbackImg}'">`;
    }

    const slides = images
      .map(
        (img, i) => `
      <div class="slide flex-shrink-0 w-full h-full">
        <img src="${img}" alt="Slide ${
          i + 1
        }" class="w-full h-full object-cover" loading="lazy" draggable="false" onerror="this.src='${fallbackImg}'">
      </div>
    `
      )
      .join("");

    const dots = images
      .map(
        (_, i) => `
      <button type="button" class="dot w-2 h-2 rounded-full transition-all ${
        i === 0 ? "bg-primary w-5" : "bg-gray-300"
      }" data-index="${i}"></button>
    `
      )
      .join("");

    return `
      <div class="swiper" data-id="${id}">
        <div class="track flex transition-transform duration-300 ease-out h-full cursor-grab active:cursor-grabbing">
          ${slides}
        </div>
        
        <button type="button" class="arrow arrow-prev absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full items-center justify-center text-gray-700 z-10 hidden group-hover:flex shadow-md transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <button type="button" class="arrow arrow-next absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full items-center justify-center text-gray-700 z-10 hidden group-hover:flex shadow-md transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        
        <div class="dots absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          ${dots}
        </div>
      </div>
    `;
  }

  // Create Card
  function createCard(p) {
    const waLink = createWhatsappLink(p.nama);
    const detailLink = createDetailLink(p.id);
    const ringClass = p.hot ? "ring-2 ring-gold" : "";
    const hari = typeof p.hari === "number" ? `${p.hari} Hari` : p.hari;
    const hasMultiple = p.images && p.images.length > 1;

    return `
      <div class="paket-card group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${ringClass}" data-tipe="${
      p.tipe
    }">
        <div class="relative overflow-hidden ${hasMultiple ? "mb-3" : ""}">
          ${createSlider(p.images, p.id)}
          
          <div class="absolute top-3 left-3 z-20 pointer-events-none">
            <span class="${
              p.labelColor
            } text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">${
      p.label
    }</span>
          </div>
          
          ${
            hasMultiple
              ? `
            <div class="absolute top-3 right-3 z-20 bg-black/50 text-white text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1 pointer-events-none">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              ${p.images.length}
            </div>
          `
              : ""
          }
        </div>
        
        <div class="p-4 pt-2">
          <h3 class="font-bold text-primary text-lg leading-tight mb-2">${
            p.nama
          }</h3>
          
          <div class="flex items-center gap-2 text-gray-500 text-sm mb-4">
            <svg class="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <span>${p.tgl}</span>
            <span class="text-gray-300">•</span>
            <span>${hari}</span>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <a href="${detailLink}"
               class="flex items-center justify-center w-full bg-primary hover:bg-secondary text-white font-semibold py-3 rounded-xl transition-colors">
              Detail
            </a>
            <a href="${waLink}" target="_blank" rel="noopener"
               class="js-package-wa-link flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
               data-package-name="${p.nama.replace(/"/g, "&quot;")}"
            >
              Tanya
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // Initialize Swipe Sliders
  function initSwipers() {
    document.querySelectorAll(".swiper").forEach((swiper) => {
      const track = swiper.querySelector(".track");
      const slides = track.querySelectorAll(".slide");
      const dots = swiper.querySelectorAll(".dot");
      const prevBtn = swiper.querySelector(".arrow-prev");
      const nextBtn = swiper.querySelector(".arrow-next");

      if (slides.length <= 1) return;

      let current = 0;
      let startX = 0;
      let currentX = 0;
      let isDragging = false;
      const total = slides.length;

      function goTo(index, animate = true) {
        if (index < 0) index = 0;
        if (index >= total) index = total - 1;

        current = index;
        track.style.transition = animate ? "transform 0.3s ease-out" : "none";
        track.style.transform = `translateX(-${current * 100}%)`;

        dots.forEach((dot, i) => {
          dot.classList.toggle("bg-primary", i === current);
          dot.classList.toggle("w-5", i === current);
          dot.classList.toggle("bg-gray-300", i !== current);
          dot.classList.toggle("w-2", i !== current);
        });
      }

      function onDragStart(e) {
        isDragging = true;
        startX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
        track.style.transition = "none";
      }

      function onDragMove(e) {
        if (!isDragging) return;
        currentX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
        const diff = currentX - startX;
        const percent = (diff / swiper.offsetWidth) * 100;
        track.style.transform = `translateX(calc(-${
          current * 100
        }% + ${percent}%))`;
      }

      function onDragEnd() {
        if (!isDragging) return;
        isDragging = false;

        const diff = currentX - startX;
        const threshold = swiper.offsetWidth * 0.2;

        if (diff > threshold && current > 0) {
          goTo(current - 1);
        } else if (diff < -threshold && current < total - 1) {
          goTo(current + 1);
        } else {
          goTo(current);
        }
      }

      track.addEventListener("touchstart", onDragStart, { passive: true });
      track.addEventListener("touchmove", onDragMove, { passive: true });
      track.addEventListener("touchend", onDragEnd);
      track.addEventListener("mousedown", onDragStart);
      track.addEventListener("mousemove", onDragMove);
      track.addEventListener("mouseup", onDragEnd);
      track.addEventListener("mouseleave", () => isDragging && onDragEnd());
      track.addEventListener("dragstart", (e) => e.preventDefault());

      prevBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        goTo(current - 1);
      });
      nextBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        goTo(current + 1);
      });

      dots.forEach((dot) => {
        dot.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          goTo(parseInt(dot.dataset.index));
        });
      });
    });
  }

  // Get count per tipe
  function getCountByTipe(tipeId) {
    if (tipeId === "all") return packageData.length;
    return packageData.filter((p) => p.tipe === tipeId).length;
  }

  // Filter cards
  function filterCards(container, filter) {
    let count = 0;
    container.querySelectorAll(".paket-card").forEach((card) => {
      if (filter === "all" || card.dataset.tipe === filter) {
        card.style.display = "";
        card.style.animation = "fadeIn 0.3s ease-out";
        count++;
      } else {
        card.style.display = "none";
      }
    });
    updateCount(count);
  }

  // Render Filter - Desktop Tabs + Mobile Dropdown
  function renderFilter(container) {
    const filterDesktop = document.getElementById("filter-desktop");
    const filterMobile = document.getElementById("filter-mobile");

    if (typeof tipeList === "undefined") return;

    // === DESKTOP TABS ===
    if (filterDesktop) {
      filterDesktop.innerHTML = tipeList
        .map((t) => {
          const count = getCountByTipe(t.id);
          const isActive = t.id === "all";

          return `
            <button type="button" 
                    class="filter-btn group/btn relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
                           ${
                             isActive
                               ? "bg-white text-primary shadow-lg"
                               : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                           }"
                    data-filter="${t.id}">
              <span class="transition-transform duration-200 group-hover/btn:scale-110">${
                t.icon
              }</span>
              <span>${t.nama}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full transition-colors
                           ${
                             isActive
                               ? "bg-primary/10 text-primary"
                               : "bg-white/10 text-white/60"
                           }">
                ${count}
              </span>
            </button>
          `;
        })
        .join("");

      // Desktop click handler
      filterDesktop.addEventListener("click", (e) => {
        const btn = e.target.closest(".filter-btn");
        if (!btn) return;

        const filter = btn.dataset.filter;

        // Update button styles
        filterDesktop.querySelectorAll(".filter-btn").forEach((b) => {
          b.classList.remove("bg-white", "text-primary", "shadow-lg");
          b.classList.add("bg-white/10", "text-white/80");
          const badge = b.querySelector("span:last-child");
          if (badge) {
            badge.classList.remove("bg-primary/10", "text-primary");
            badge.classList.add("bg-white/10", "text-white/60");
          }
        });

        btn.classList.remove("bg-white/10", "text-white/80");
        btn.classList.add("bg-white", "text-primary", "shadow-lg");
        const activeBadge = btn.querySelector("span:last-child");
        if (activeBadge) {
          activeBadge.classList.remove("bg-white/10", "text-white/60");
          activeBadge.classList.add("bg-primary/10", "text-primary");
        }

        // Sync mobile dropdown
        if (filterMobile) filterMobile.value = filter;

        filterCards(container, filter);
      });
    }

    // === MOBILE DROPDOWN ===
    if (filterMobile) {
      filterMobile.innerHTML = tipeList
        .map((t) => {
          const count = getCountByTipe(t.id);
          return `<option value="${t.id}">${t.nama} (${count})</option>`;
        })
        .join("");

      // Mobile change handler
      filterMobile.addEventListener("change", (e) => {
        const filter = e.target.value;

        // Sync desktop tabs
        if (filterDesktop) {
          filterDesktop.querySelectorAll(".filter-btn").forEach((b) => {
            const isMatch = b.dataset.filter === filter;
            b.classList.toggle("bg-white", isMatch);
            b.classList.toggle("text-primary", isMatch);
            b.classList.toggle("shadow-lg", isMatch);
            b.classList.toggle("bg-white/10", !isMatch);
            b.classList.toggle("text-white/80", !isMatch);

            const badge = b.querySelector("span:last-child");
            if (badge) {
              badge.classList.toggle("bg-primary/10", isMatch);
              badge.classList.toggle("text-primary", isMatch);
              badge.classList.toggle("bg-white/10", !isMatch);
              badge.classList.toggle("text-white/60", !isMatch);
            }
          });
        }

        filterCards(container, filter);
      });
    }
  }

  // Render Homepage
  function renderHome() {
    const el = document.getElementById("paket-home");
    if (!el) return;
    el.innerHTML = packageData
      .filter((p) => p.featured)
      .slice(0, 6)
      .map(createCard)
      .join("");
    initSwipers();
  }

  // Render All + Filter
  function renderAll() {
    const container = document.getElementById("paket-all");
    if (!container) return;

    container.innerHTML = packageData.map(createCard).join("");
    initSwipers();
    updateCount(packageData.length);

    renderFilter(container);
  }

  function updateCount(n) {
    const el = document.getElementById("paket-count");
    if (el) el.textContent = n;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await hydratePackagesFromApi();
    renderHome();
    renderAll();
    updatePackageWhatsappLinks();
  });

  document.addEventListener("sq:landing-contact-updated", updatePackageWhatsappLinks);
})();
