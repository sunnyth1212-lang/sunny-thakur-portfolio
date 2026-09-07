/**
 * =========================================================================
 * SUNNY THAKUR // CINEMATIC PORTFOLIO JAVASCRIPT
 * Dynamic rendering, interactive modules, modals, and smooth animations
 * =========================================================================
 */

/**
 * Convert a full-quality video path to its lightweight 480p thumbnail version.
 * Thumbnail videos are ~1-3MB vs 10-20MB originals — used for card previews only.
 */
function getThumbUrl(videoUrl) {
  if (!videoUrl || !videoUrl.startsWith('public/videos/')) return videoUrl;
  const filename = videoUrl.replace('public/videos/', '');
  return 'public/videos/thumb/' + filename;
}

document.addEventListener("DOMContentLoaded", () => {
  // Sync client-side cached data if available
  try {
    const cachedOverride = localStorage.getItem("SUNNY_PORTFOLIO_DATA_OVERRIDE");
    if (cachedOverride && typeof PORTFOLIO_DATA !== "undefined") {
      const parsed = JSON.parse(cachedOverride);
      Object.assign(PORTFOLIO_DATA, parsed);
    }
  } catch (e) { }

  initApp();
  initAdminShortcuts();
});

function initAdminShortcuts() {
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
      e.preventDefault();
      window.location.href = "admin.html";
    }
  });
}

function initApp() {
  initThemeToggle();
  renderBrandInfo();
  renderStats();
  renderShowreelSection();
  renderCategories();
  renderProjects("all");
  renderServices();
  renderTestimonials();
  renderFaq();
  renderContactSocials();

  initNavbarScroll();
  initMobileMenu();
  initTestimonialCarousel();
  initContactForm();
  initProjectModals();
}

/**
 * 1. RENDER BRAND INFORMATION ACROSS THE DOM
 */
function renderBrandInfo() {
  const { brand } = PORTFOLIO_DATA;
  if (!brand) return;

  // Direct brand text elements
  document.querySelectorAll("[data-brand-name]").forEach(el => el.textContent = brand.name);
  document.querySelectorAll("[data-brand-title]").forEach(el => el.textContent = brand.title);
  document.querySelectorAll("[data-brand-tagline]").forEach(el => el.textContent = brand.tagline);
  document.querySelectorAll("[data-brand-email]").forEach(el => {
    el.textContent = brand.email;
    if (el.tagName === "A") el.href = `mailto:${brand.email}`;
  });
  document.querySelectorAll("[data-brand-phone]").forEach(el => {
    el.textContent = brand.phone || brand.phoneRaw || "9234536469";
    if (el.tagName === "A") el.href = `tel:+91${brand.phoneRaw || '9234536469'}`;
  });
  document.querySelectorAll("[data-brand-whatsapp]").forEach(el => {
    if (el.tagName === "A") el.href = `https://wa.me/91${brand.phoneRaw || '9234536469'}`;
  });

  const bioEl = document.getElementById("about-bio-text");
  if (bioEl && brand.aboutBio) bioEl.innerHTML = brand.aboutBio;

  const specialtyEl = document.getElementById("about-bio-specialty");
  if (specialtyEl && brand.aboutSpecialty) specialtyEl.innerHTML = brand.aboutSpecialty;

  const expEl = document.getElementById("about-bio-experience");
  if (expEl && brand.aboutExperience) expEl.innerHTML = brand.aboutExperience;

  const philEl = document.getElementById("about-bio-philosophy");
  if (philEl && brand.aboutPhilosophy) philEl.innerHTML = brand.aboutPhilosophy;

  const ctaEl = document.getElementById("about-bio-cta");
  if (ctaEl && brand.aboutCta) ctaEl.innerHTML = brand.aboutCta;
}

/**
 * 2. RENDER STATS COUNTER GRID
 */
function renderStats() {
  const statsContainer = document.getElementById("stats-counter-grid");
  if (!statsContainer || !PORTFOLIO_DATA.stats) return;

  statsContainer.innerHTML = PORTFOLIO_DATA.stats.map(stat => `
    <div class="stat-item" data-target="${stat.value}" data-suffix="${stat.suffix}">
      <div class="stat-number">
        <span class="counter-val">0</span><span class="stat-suffix">${stat.suffix}</span>
      </div>
      <div class="stat-label">${stat.label}</div>
    </div>
  `).join("");

  initStatsCounterAnimation();
}

/**
 * Re-triggerable smooth 60+ FPS count-up animation on every scroll into view
 */
function initStatsCounterAnimation() {
  const statItems = document.querySelectorAll(".stat-item");
  if (!statItems.length) return;

  let animRafId = null;

  const startCountUp = () => {
    if (animRafId) cancelAnimationFrame(animRafId);

    const counters = Array.from(statItems).map(item => ({
      el: item.querySelector(".counter-val"),
      target: parseInt(item.getAttribute("data-target"), 10) || 0
    })).filter(c => c.el);

    const duration = 750; // ms - snappy & smooth
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);

      counters.forEach(c => {
        const currentVal = Math.round(ease * c.target);
        c.el.textContent = currentVal;
      });

      if (progress < 1) {
        animRafId = requestAnimationFrame(step);
      } else {
        counters.forEach(c => {
          c.el.textContent = c.target;
        });
        animRafId = null;
      }
    }

    animRafId = requestAnimationFrame(step);
  };

  const resetCount = () => {
    if (animRafId) {
      cancelAnimationFrame(animRafId);
      animRafId = null;
    }
    statItems.forEach(item => {
      const counterEl = item.querySelector(".counter-val");
      if (counterEl) counterEl.textContent = "0";
    });
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startCountUp();
        } else {
          resetCount();
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: "0px"
    });

    const grid = document.getElementById("stats-counter-grid");
    if (grid) {
      observer.observe(grid);
    } else {
      startCountUp();
    }
  } else {
    startCountUp();
  }
}

/**
 * 3. RENDER SHOWREEL PREVIEW
 */
function renderShowreelSection() {
  const showreelContainer = document.getElementById("showreel-content-box");
  const { showreel } = PORTFOLIO_DATA;
  if (!showreelContainer || !showreel) return;

  showreelContainer.innerHTML = `
    <div class="showreel-card-inner">
      <div class="showreel-player-container" id="open-showreel-modal" role="button" tabindex="0" aria-label="Play 2026 Showreel">
        <video class="showreel-video-preview" loop muted playsinline preload="metadata">
          <source src="${getThumbUrl(showreel.videoUrl)}" type="video/mp4">
        </video>
      </div>
      <div class="showreel-info-bar">
        <div>
          <h3 class="showreel-title">${showreel.title}</h3>
          <p class="section-subtitle" style="font-size: 0.95rem; margin: 0;">${showreel.subtitle}</p>
        </div>
        <div class="showreel-meta">
          <span>${showreel.resolution}</span>
          <span>•</span>
          <span>${showreel.year}</span>
        </div>
      </div>
    </div>
  `;

  const showreelVid = showreelContainer.querySelector(".showreel-video-preview");
  if (showreelVid) {
    showreelVid.muted = true;
    showreelVid.loop = true;
    showreelVid.addEventListener("ended", () => {
      showreelVid.currentTime = 0;
      showreelVid.play().catch(() => { });
    });
    showreelVid.addEventListener("canplay", () => {
      showreelVid.classList.add("video-ready");
    }, { once: true });
  }

  document.getElementById("open-showreel-modal")?.addEventListener("click", () => {
    openVideoModal({
      title: `${showreel.title} — Sunny Thakur`,
      videoUrl: showreel.videoUrl,
      embedType: showreel.embedType,
      aspectRatio: "9:16",
      client: "Short-Form Creator Montage",
      services: ["Viral Hook Engineering", "Attractive Captions", "Sound FX Pops", "Retention Pacing"],
      techniques: "Fast-paced jump cuts, animated emoji overlays, punchy sound risers, color grading.",
      story: "A curated 60-second montage of high-retention short-form clips, attractive captions, viral hooks, and dynamic sound design engineered for Instagram Reels, YouTube Shorts, and TikTok."
    });
  });
}

/**
 * 4. RENDER FILTER BUTTONS
 */
function renderCategories() {
  const filterContainer = document.getElementById("portfolio-filters");
  if (!filterContainer || !PORTFOLIO_DATA.categories) return;

  filterContainer.innerHTML = PORTFOLIO_DATA.categories.map(cat => `
    <button class="filter-btn ${cat.id === 'all' ? 'active' : ''}" data-category="${cat.id}">
      ${cat.label}
    </button>
  `).join("");

  filterContainer.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      filterContainer.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const categoryId = btn.getAttribute("data-category");
      renderProjects(categoryId);
    });
  });
}

/**
 * 5. RENDER PORTFOLIO PROJECT CARDS
 */
function renderProjects(category = "all") {
  const grid = document.getElementById("portfolio-grid");
  if (!grid || !PORTFOLIO_DATA.projects) return;

  const filtered = category === "all"
    ? PORTFOLIO_DATA.projects
    : PORTFOLIO_DATA.projects.filter(p => p.category === category);

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No projects found in this category.</div>`;
  } else {
    grid.innerHTML = filtered.map(project => {
      const isReel = project.aspectRatio === "9:16";
      return `
        <div class="project-card ${isReel ? 'aspect-reels' : ''}" data-project-id="${project.id}">
          <div class="project-media-wrapper">
            <video class="project-thumbnail" loop muted playsinline preload="metadata">
              <source src="${getThumbUrl(project.videoUrl)}" type="video/mp4">
            </video>
            <span class="project-category-tag">${project.categoryLabel}</span>
            <div class="project-play-hover">
              <div class="play-hover-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Setup seamless loop on thumbnails without eager network bombardment
    const vids = grid.querySelectorAll(".project-thumbnail");
    vids.forEach(v => {
      v.muted = true;
      v.loop = true;
      v.addEventListener("ended", () => {
        v.currentTime = 0;
        v.play().catch(() => { });
      });
      // Smooth fade-in when video is ready to play (hides shimmer skeleton)
      v.addEventListener("canplay", () => {
        v.classList.add("video-ready");
      }, { once: true });
    });

    // Add click event for modal popup
    grid.querySelectorAll(".project-card").forEach(card => {
      card.addEventListener("click", () => {
        const pId = card.getAttribute("data-project-id");
        const projectData = PORTFOLIO_DATA.projects.find(p => p.id === pId);
        if (projectData) openVideoModal(projectData);
      });
    });

    // Connect viewport intersection observer
    updateVideoObservers();
  }

  grid.style.opacity = "1";
  grid.style.transform = "none";
}

/**
 * 6. RENDER SERVICES SECTION
 */
function renderServices() {
  const servicesGrid = document.getElementById("services-grid");
  if (!servicesGrid || !PORTFOLIO_DATA.services) return;

  const iconMap = {
    film: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>`,
    smartphone: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`,
    layers: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
    "trending-up": `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`,
    aperture: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="14.31" y1="8" x2="20.05" y2="17.94"></line><line x1="9.69" y1="8" x2="21.17" y2="8"></line><line x1="7.38" y1="12" x2="13.12" y2="2.06"></line><line x1="9.69" y1="16" x2="3.95" y2="6.06"></line><line x1="14.31" y1="16" x2="2.83" y2="16"></line><line x1="16.62" y1="12" x2="10.88" y2="21.94"></line></svg>`,
    sparkles: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"></path></svg>`
  };

  servicesGrid.innerHTML = PORTFOLIO_DATA.services.map(s => `
    <div class="service-card">
      <div class="service-card-header">
        <div class="service-icon-box">
          ${iconMap[s.icon] || iconMap.film}
        </div>
        <span class="service-number">${s.number}</span>
      </div>
      <h3 class="service-title">${s.title}</h3>
      <div class="service-headline">${s.headline}</div>
      <p class="service-desc">${s.description}</p>
      <ul class="service-deliverables">
        ${s.deliverables.map(d => `<li class="deliverable-tag">${d}</li>`).join("")}
      </ul>
    </div>
  `).join("");
}

/**
 * 7. RENDER SOFTWARE & SKILLS BADGES
 */
function renderSkills() {
  const skillsGrid = document.getElementById("skills-grid");
  if (!skillsGrid || !PORTFOLIO_DATA.tools) return;

  skillsGrid.innerHTML = PORTFOLIO_DATA.tools.map(tool => `
    <div class="skill-badge-card">
      <div class="skill-software-icon" style="color: ${tool.color}; border-color: ${tool.color}40;">
        ${tool.icon}
      </div>
      <div>
        <div class="skill-name">${tool.name}</div>
        <div class="skill-level">${tool.level} • ${tool.category}</div>
      </div>
    </div>
  `).join("");
}

/**
 * 9. RENDER TESTIMONIALS
 */
function renderTestimonials() {
  const track = document.getElementById("testimonial-track");
  const dotsContainer = document.getElementById("testimonial-dots");
  if (!track || !PORTFOLIO_DATA.testimonials) return;

  const getStars = (r) => {
    const full = Math.floor(r);
    const hasHalf = (r % 1) >= 0.4 && (r % 1) <= 0.7;
    let s = "★".repeat(full);
    if (hasHalf) {
      s += "★";
    }
    const empty = 5 - full - (hasHalf ? 1 : 0);
    if (empty > 0) s += "☆".repeat(empty);
    return s;
  };

  track.innerHTML = PORTFOLIO_DATA.testimonials.map((t, idx) => {
    const ratingVal = Number(t.rating) || 5.0;
    return `
    <div class="testimonial-slide" data-slide-index="${idx}">
      <div class="testimonial-box">
        <div class="testimonial-top-meta">
          <div class="testimonial-rating">
            <span class="stars">${getStars(ratingVal)}</span>
            <span class="rating-score">${ratingVal.toFixed(1)} / 5.0</span>
          </div>
          <div class="verified-client-badge">
            <span class="pulse-dot"></span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Verified Client</span>
          </div>
        </div>
        <p class="testimonial-quote">“${t.review}”</p>
        <div class="testimonial-author-row">
          <div class="author-info">
            <div class="author-avatar">
              <img src="${t.avatar}" alt="Verified Client" class="author-avatar-img" loading="lazy">
            </div>
            <div>
              <div class="author-role">${t.role} • <span class="author-company">${t.company}</span></div>
            </div>
          </div>
          <span class="author-project-tag">${t.projectType}</span>
        </div>
      </div>
    </div>
  `;
  }).join("");

  if (dotsContainer) {
    dotsContainer.innerHTML = PORTFOLIO_DATA.testimonials.map((_, idx) => `
      <div class="carousel-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></div>
    `).join("");
  }
}

/**
 * 10. RENDER SOCIAL CONTACT LINKS
 */
function renderContactSocials() {
  const container = document.getElementById("contact-socials-row");
  if (!container || !PORTFOLIO_DATA.socials) return;

  container.innerHTML = PORTFOLIO_DATA.socials.map(s => `
    <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="social-pill">
      <span>${s.name}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
    </a>
  `).join("");
}

/**
 * 11. RENDER FAQ SECTION & ACCORDION
 */
function renderFaq() {
  const faqList = document.getElementById("faq-list");
  if (!faqList || !PORTFOLIO_DATA.faq) return;

  faqList.innerHTML = PORTFOLIO_DATA.faq.map((item, index) => `
    <div class="faq-item ${index === 0 ? 'open' : ''}">
      <button class="faq-question" aria-expanded="${index === 0 ? 'true' : 'false'}" id="faq-btn-${index}">
        <span>${item.q}</span>
        <div class="faq-icon-wrap">
          <svg class="faq-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
      </button>
      <div class="faq-answer">
        <div class="faq-answer-inner">
          <p>${item.a}</p>
        </div>
      </div>
    </div>
  `).join("");

  initFaqAccordion();
}

function initFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const btn = item.querySelector(".faq-question");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      // Close other items for single-open accordion feel
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove("open");
          const otherBtn = otherItem.querySelector(".faq-question");
          if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
        }
      });

      // Toggle current
      item.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
    });
  });
}

/**
 * 12. TESTIMONIAL CAROUSEL ENGINE
 */
let currentSlide = 0;
let carouselTimer = null;

function initTestimonialCarousel() {
  const track = document.getElementById("testimonial-track");
  const prevBtn = document.getElementById("prev-testimonial-btn");
  const nextBtn = document.getElementById("next-testimonial-btn");
  const dots = document.querySelectorAll(".carousel-dot");
  const totalSlides = PORTFOLIO_DATA.testimonials ? PORTFOLIO_DATA.testimonials.length : 0;
  if (!track || totalSlides === 0) return;

  const goToSlide = (index) => {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    currentSlide = index;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;

    dots.forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentSlide);
    });
  };

  prevBtn?.addEventListener("click", () => {
    goToSlide(currentSlide - 1);
    restartAutoPlay();
  });

  nextBtn?.addEventListener("click", () => {
    goToSlide(currentSlide + 1);
    restartAutoPlay();
  });

  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      const idx = parseInt(dot.getAttribute("data-index"), 10);
      goToSlide(idx);
      restartAutoPlay();
    });
  });

  const startAutoPlay = () => {
    carouselTimer = setInterval(() => {
      goToSlide(currentSlide + 1);
    }, 6000);
  };

  const restartAutoPlay = () => {
    clearInterval(carouselTimer);
    startAutoPlay();
  };

  startAutoPlay();
}

/**
 * SMART VIDEO OBSERVER (ZERO-LAG ENGINE)
 * Automatically plays preview videos ONLY when scrolled into the active viewport,
 * and pauses off-screen videos to preserve 100% CPU, GPU, and network bandwidth.
 */
let previewVideoObserver = null;

function updateVideoObservers() {
  if (previewVideoObserver) {
    previewVideoObserver.disconnect();
  }

  const isModalOpen = document.getElementById("project-modal-backdrop")?.classList.contains("open");
  if (isModalOpen) return;

  if (!('IntersectionObserver' in window)) {
    // Fallback: only play first video on mobile/old browsers
    return;
  }

  previewVideoObserver = new IntersectionObserver((entries) => {
    const modalActive = document.getElementById("project-modal-backdrop")?.classList.contains("open");
    if (modalActive) return;

    entries.forEach(entry => {
      const vid = entry.target;
      if (entry.isIntersecting) {
        const playPromise = vid.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } else {
        vid.pause();
      }
    });
  }, {
    rootMargin: "80px 0px 80px 0px",
    threshold: 0.2
  });

  document.querySelectorAll(".project-thumbnail, .showreel-video-preview").forEach(v => {
    previewVideoObserver.observe(v);
  });
}

/**
 * 13. PROJECT CASE STUDY & SHOWREEL MODAL
 */
function initProjectModals() {
  const modalBackdrop = document.getElementById("project-modal-backdrop");
  const closeBtn = document.getElementById("modal-close-btn");

  if (!modalBackdrop) return;

  const closeModal = () => {
    modalBackdrop.classList.remove("open");
    const videoWrap = document.getElementById("modal-video-container");
    if (videoWrap) {
      const mVid = videoWrap.querySelector("video");
      if (mVid) {
        try {
          mVid.pause();
          mVid.removeAttribute("src");
          mVid.load();
        } catch (e) {}
      }
      videoWrap.innerHTML = ""; // Stop video playback
    }
    document.body.style.overflow = "auto";

    // Resume only visible preview videos on screen
    setTimeout(() => {
      updateVideoObservers();
    }, 150);
  };

  closeBtn?.addEventListener("click", closeModal);

  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBackdrop.classList.contains("open")) {
      closeModal();
    }
  });
}

function openVideoModal(project) {
  const modalBackdrop = document.getElementById("project-modal-backdrop");
  const videoWrap = document.getElementById("modal-video-container");
  const titleEl = document.getElementById("modal-title");
  const categoryEl = document.getElementById("modal-category-badge");
  const clientEl = document.getElementById("modal-client-val");
  const servicesEl = document.getElementById("modal-services-val");
  const techEl = document.getElementById("modal-tech-val");
  const storyEl = document.getElementById("modal-story-val");
  const metricsEl = document.getElementById("modal-metrics-val");

  if (!modalBackdrop || !videoWrap) return;

  // 1. Instantly pause ALL background preview videos so 100% bandwidth & hardware decoding are reserved for the modal video
  document.querySelectorAll(".project-thumbnail, .showreel-video-preview").forEach(v => {
    try { v.pause(); } catch (e) { }
  });
  if (previewVideoObserver) {
    previewVideoObserver.disconnect();
  }

  // Insert responsive video player or embed
  const isVertical = project.aspectRatio === "9:16";
  videoWrap.className = `modal-video-wrap ${isVertical ? 'aspect-reels' : ''}`;

  if (project.embedType === "youtube") {
    videoWrap.innerHTML = `<iframe src="${project.videoUrl}?autoplay=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  } else {
    videoWrap.innerHTML = `
      <video controls autoplay loop playsinline preload="auto" style="width: 100%; height: 100%; object-fit: contain; background: #000;">
        <source src="${project.videoUrl}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    `;

    const mVid = videoWrap.querySelector("video");
    if (mVid) {
      mVid.loop = true;
      mVid.addEventListener("ended", () => {
        mVid.currentTime = 0;
        mVid.play().catch(() => { });
      });
      mVid.play().catch(() => { });
    }
  }

  if (titleEl) titleEl.textContent = project.title;
  if (categoryEl) categoryEl.textContent = project.categoryLabel || "Video Project";
  if (clientEl) clientEl.textContent = project.client || "Confidential Client";
  if (servicesEl) servicesEl.textContent = Array.isArray(project.services) ? project.services.join(", ") : (project.services || "Video Editing");
  if (techEl) techEl.textContent = project.techniques || "Precision cutting, sound design, color grade.";
  if (storyEl) storyEl.textContent = project.story || project.shortDesc;
  if (metricsEl) metricsEl.textContent = project.metrics || "High viewer retention & organic engagement";

  document.body.style.overflow = "hidden";
  modalBackdrop.classList.add("open");
}

/**
 * 14. CONTACT FORM VALIDATION & BUDGET PICKER
 */
function initContactForm() {
  const form = document.getElementById("project-inquiry-form");
  const budgetPills = document.querySelectorAll(".budget-pill");
  const budgetInput = document.getElementById("selected-budget-input");
  const copyEmailBtn = document.getElementById("copy-email-btn");
  const copyPhoneBtn = document.getElementById("copy-phone-btn");

  // Custom Category Glassmorphism Dropdown
  const dropdown = document.getElementById("custom-category-dropdown");
  const dropdownTrigger = document.getElementById("category-dropdown-trigger");
  const dropdownMenu = document.getElementById("category-dropdown-menu");
  const categoryInput = document.getElementById("form-project-type");
  const triggerBadge = document.getElementById("category-trigger-badge");
  const triggerTitle = document.getElementById("category-trigger-title");
  const triggerSub = document.getElementById("category-trigger-sub");
  const options = dropdownMenu ? dropdownMenu.querySelectorAll(".dropdown-option") : [];

  if (dropdownTrigger && dropdown) {
    dropdownTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = dropdown.classList.contains("open");
      dropdown.classList.toggle("open", !isOpen);
      dropdownTrigger.setAttribute("aria-expanded", !isOpen);
    });

    options.forEach(opt => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const val = opt.getAttribute("data-value");
        const title = opt.getAttribute("data-title");
        const sub = opt.getAttribute("data-sub");
        const iconSvg = opt.querySelector(".option-icon-wrap svg")?.outerHTML;

        options.forEach(o => o.classList.remove("active"));
        opt.classList.add("active");

        if (dropdownTrigger) dropdownTrigger.classList.remove("is-placeholder");
        if (triggerBadge) triggerBadge.classList.remove("badge-sparkle");
        if (categoryInput) categoryInput.value = val;
        if (triggerTitle) triggerTitle.textContent = title;
        if (triggerSub) triggerSub.textContent = sub;
        if (triggerBadge && iconSvg) triggerBadge.innerHTML = iconSvg;

        dropdown.classList.remove("open");
        dropdownTrigger.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("open");
        dropdownTrigger.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && dropdown.classList.contains("open")) {
        dropdown.classList.remove("open");
        dropdownTrigger.setAttribute("aria-expanded", "false");
        dropdownTrigger.focus();
      }
    });
  }

  budgetPills.forEach(pill => {
    pill.addEventListener("click", () => {
      budgetPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      if (budgetInput) budgetInput.value = pill.getAttribute("data-budget");
    });
  });

  copyEmailBtn?.addEventListener("click", () => {
    const email = PORTFOLIO_DATA.brand.email;
    navigator.clipboard.writeText(email).then(() => {
      showToast(`✓ Email "${email}" copied to clipboard!`);
    }).catch(() => {
      showToast(`Email: ${email}`);
    });
  });

  copyPhoneBtn?.addEventListener("click", () => {
    const phone = PORTFOLIO_DATA.brand.phoneRaw || PORTFOLIO_DATA.brand.phone || "9234536469";
    navigator.clipboard.writeText(phone).then(() => {
      showToast(`✓ Phone "${phone}" copied to clipboard!`);
    }).catch(() => {
      showToast(`Phone: ${phone}`);
    });
  });

  function getApiBase() {
    if (window.location.protocol === "file:") {
      return "http://localhost:8080";
    }
    return "";
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("form-name")?.value.trim() || "";
    const email = document.getElementById("form-email")?.value.trim() || "";
    const phone = document.getElementById("form-phone")?.value.trim() || "";
    const message = document.getElementById("form-message")?.value.trim() || "";
    const budget = budgetInput?.value || "$5 - $10";
    const projectType = (categoryInput && categoryInput.value) ? categoryInput.value : "short-form-reels";
    const projectTypeLabel = (categoryInput && categoryInput.value && triggerTitle?.textContent)
      ? triggerTitle.textContent
      : "Short-Form Reels (Instagram / Shorts)";

    if (!name) {
      showToast("👉 Please enter your Name");
      document.getElementById("form-name")?.focus();
      return;
    }

    if (!email) {
      showToast("👉 Please enter your Email Address");
      document.getElementById("form-email")?.focus();
      return;
    }

    const submitBtn = form.querySelector("button[type='submit']");
    const originalText = submitBtn.innerHTML;

    submitBtn.innerHTML = `<span>Delivering Inquiry...</span>`;
    submitBtn.disabled = true;

    const now = new Date();
    const inquiry = {
      id: "inq_" + Date.now(),
      date: now.toISOString(),
      dateFormatted: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      name,
      email,
      phone,
      projectType,
      projectTypeLabel,
      budget,
      message,
      status: "new"
    };

    // 1. AUTOMATIC EMAIL DIRECTLY TO SUNNY'S GMAIL (sunnyindia321@gmail.com)
    // Instant background dispatch — zero visitor action needed!
    fetch("https://formsubmit.co/ajax/sunnyindia321@gmail.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        "Client Name": name,
        "Client Email": email,
        "Client WhatsApp / Phone": phone || "Not provided",
        "Reel Service Style": projectTypeLabel,
        "Budget Tier": budget,
        "Project Scope & Drive Links": message || "No extra notes provided",
        "_subject": `🎬 New Video Editing Lead: ${name} (${budget})`,
        "_template": "table",
        "_captcha": "false"
      })
    }).catch(err => {
      console.warn("Email alert warning:", err);
    });

    // 2. Persist to Local Server API (works on file:///, localhost, and live public tunnel)
    const apiBase = getApiBase();
    fetch(apiBase + '/api/save-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiry)
    }).catch(err => {
      console.warn("Server API fallback:", err);
    });

    // 3. Save to Client LocalStorage
    try {
      let existing = JSON.parse(localStorage.getItem("SUNNY_PORTFOLIO_INQUIRIES") || "[]");
      if (!Array.isArray(existing)) existing = [];
      existing.unshift(inquiry);
      localStorage.setItem("SUNNY_PORTFOLIO_INQUIRIES", JSON.stringify(existing));
    } catch (err) {}

    // 4. Format optional WhatsApp quick chat URL
    const rawPhone = PORTFOLIO_DATA?.brand?.phoneRaw || "9234536469";
    const waText = `🔥 *New Video Editing Project Inquiry*\n\n` +
      `👤 *Client Name:* ${name}\n` +
      `📧 *Email:* ${email}\n` +
      (phone ? `📱 *Phone / WA:* ${phone}\n` : '') +
      `🎬 *Reel Style:* ${projectTypeLabel}\n` +
      `💰 *Budget Tier:* ${budget}\n\n` +
      `📝 *Project Details & Links:*\n${message}\n\n` +
      `— Sent via https://sunnythakurportfolio.netlify.app`;

    const waUrl = `https://wa.me/91${rawPhone}?text=${encodeURIComponent(waText)}`;

    // 5. Update UI & Show Success Confirmation
    setTimeout(() => {
      submitBtn.innerHTML = `✓ Inquiry Delivered to Sunny!`;
      submitBtn.style.background = "var(--accent-neon-green)";
      submitBtn.style.color = "#000";

      showToast("🚀 Inquiry delivered! Details sent to Sunny's Email & Studio.");

      const successModal = document.getElementById("inquiry-success-modal");
      const waBtn = document.getElementById("inquiry-whatsapp-btn");
      const modalClose = document.getElementById("inquiry-modal-close-btn");

      if (waBtn) waBtn.href = waUrl;
      if (successModal) {
        successModal.classList.add("open");
        document.body.style.overflow = "hidden";

        const closeSuccess = () => {
          successModal.classList.remove("open");
          document.body.style.overflow = "auto";
        };

        if (modalClose) modalClose.onclick = closeSuccess;
        successModal.onclick = (e) => {
          if (e.target === successModal) closeSuccess();
        };
      }

      form.reset();
      budgetPills.forEach(p => p.classList.remove("active"));
      budgetPills[0]?.classList.add("active");

      // Reset dropdown
      options.forEach(o => o.classList.remove("active"));
      if (dropdownTrigger) dropdownTrigger.classList.add("is-placeholder");
      if (categoryInput) categoryInput.value = "";
      if (triggerTitle) triggerTitle.textContent = "What kind of reel service you want?";
      if (triggerSub) triggerSub.textContent = "Tap to explore short-form editing styles & packages";
      if (triggerBadge) {
        triggerBadge.className = "trigger-icon-badge badge-sparkle";
        triggerBadge.innerHTML = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"></path></svg>`;
      }

      setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        submitBtn.style.background = "";
        submitBtn.style.color = "";
      }, 5000);
    }, 600);
  });
}

/**
 * 15. TOAST NOTIFICATION SYSTEM
 */
function showToast(message) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/**
 * 16. NAVBAR SCROLL & ACTIVE LINK HIGHLIGHT
 */
function initNavbarScroll() {
  const header = document.querySelector(".site-header");
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section[id]");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      header?.classList.add("scrolled");
    } else {
      header?.classList.remove("scrolled");
    }

    // Active link highlighting
    let currentId = "";
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      const height = section.offsetHeight;
      if (window.scrollY >= top && window.scrollY < top + height) {
        currentId = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${currentId}`) {
        link.classList.add("active");
      }
    });
  });
}

/**
 * 17. MOBILE MENU TOGGLE
 */
function initMobileMenu() {
  const toggle = document.getElementById("mobile-nav-toggle");
  const drawer = document.getElementById("mobile-drawer");
  const mobileLinks = document.querySelectorAll(".mobile-drawer .nav-link, .mobile-drawer .btn");

  if (!toggle || !drawer) return;

  const toggleMenu = () => {
    const isOpen = drawer.classList.contains("open");
    drawer.classList.toggle("open", !isOpen);
    toggle.classList.toggle("open", !isOpen);
    document.body.style.overflow = isOpen ? "auto" : "hidden";
  };

  toggle.addEventListener("click", toggleMenu);

  mobileLinks.forEach(link => {
    link.addEventListener("click", () => {
      drawer.classList.remove("open");
      toggle.classList.remove("open");
      document.body.style.overflow = "auto";
    });
  });
}


/**
 * 19. LIGHT / DARK THEME TOGGLE & PERSISTENCE
 */
function initThemeToggle() {
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const storedTheme = localStorage.getItem("sunny_portfolio_theme") || "light";

  document.documentElement.setAttribute("data-theme", storedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
      const newTheme = currentTheme === "light" ? "dark" : "light";

      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("sunny_portfolio_theme", newTheme);

      showToast(`Switched to ${newTheme === 'light' ? '☀️ Light' : '🌙 Dark'} Theme`);
    });
  }
}
