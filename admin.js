/**
 * =========================================================================
 * SUNNY THAKUR // ADMIN STUDIO JAVASCRIPT CONTROLLER
 * Reactive State Management, Video Assets, Reordering, and API Sync
 * =========================================================================
 */

// Local copy of portfolio data
let adminData = null;
let availableVideos = [];
let isServerOnline = false;

function getApiBase() {
  if (window.location.protocol === "file:") {
    return "http://localhost:8080";
  }
  return "";
}

document.addEventListener("DOMContentLoaded", () => {
  initAdminApp();
});

function initAdminApp() {
  initAuth();
  loadInitialData();
  initTabs();
  initServerCheck();
  initGlobalSave();
  initProjectModal();
  initBackupTab();
  initInquiriesManager();
}

/**
 * 1. PIN AUTHENTICATION
 */
function initAuth() {
  const overlay = document.getElementById("auth-overlay");
  const form = document.getElementById("pin-auth-form");
  const pinInput = document.getElementById("pin-input");
  const errorMsg = document.getElementById("auth-error-msg");

  const storedPin = localStorage.getItem("SUNNY_ADMIN_PIN") || "1234";
  const isSessionUnlocked = sessionStorage.getItem("SUNNY_ADMIN_UNLOCKED") === "true";

  if (isSessionUnlocked) {
    overlay.classList.add("hidden");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const enteredPin = pinInput.value.trim();
    if (enteredPin === storedPin) {
      sessionStorage.setItem("SUNNY_ADMIN_UNLOCKED", "true");
      overlay.classList.add("hidden");
      showToast("Admin Studio Unlocked");
    } else {
      errorMsg.classList.add("show");
      pinInput.value = "";
      pinInput.focus();
    }
  });

  document.getElementById("btn-change-pin")?.addEventListener("click", () => {
    const newPin = document.getElementById("new-pin-input").value.trim();
    if (newPin.length >= 4) {
      localStorage.setItem("SUNNY_ADMIN_PIN", newPin);
      showToast("Security PIN updated successfully");
      document.getElementById("new-pin-input").value = "";
    } else {
      showToast("PIN must be at least 4 digits");
    }
  });
}

/**
 * 2. LOAD INITIAL PORTFOLIO DATA
 */
function loadInitialData() {
  // Check if we have data from data.js or localStorage
  if (typeof PORTFOLIO_DATA !== "undefined") {
    adminData = JSON.parse(JSON.stringify(PORTFOLIO_DATA));
  } else {
    adminData = {};
  }

  // Populate UI panes
  renderProjectsList();
  renderBrandForm();
  renderServicesList();
  renderStatsAndShowreel();
  renderReviewsAndFaq();
}

/**
 * 3. SIDEBAR NAVIGATION TABS
 */
function initTabs() {
  const tabButtons = document.querySelectorAll(".nav-tab");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add("active");
    });
  });
}

/**
 * 4. SERVER CONNECTIVITY CHECK & VIDEO ASSETS LISTING
 */
async function initServerCheck() {
  const pill = document.getElementById("server-status-pill");
  const text = document.getElementById("server-status-text");

  try {
    const res = await fetch(getApiBase() + "/api/list-videos");
    if (res.ok) {
      const data = await res.json();
      isServerOnline = true;
      availableVideos = data.videos || [];
      pill.classList.add("online");
      text.textContent = "Live Server Connected";
      populateVideoSelectors();
    } else {
      throw new Error("Server offline");
    }
  } catch (err) {
    isServerOnline = false;
    pill.classList.remove("online");
    text.textContent = "Offline Mode (Local Cache)";
  }
}

function populateVideoSelectors() {
  const selects = [
    document.getElementById("modal-project-video-select"),
    document.getElementById("showreel-video-select")
  ];

  selects.forEach(sel => {
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = `<option value="">Choose existing video...</option>` +
      availableVideos.map(v => `<option value="${v.path}">${v.name} (${formatBytes(v.size)})</option>`).join("");
    if (currentVal) sel.value = currentVal;
  });

  document.getElementById("modal-project-video-select")?.addEventListener("change", (e) => {
    if (e.target.value) {
      document.getElementById("modal-project-videourl").value = e.target.value;
    }
  });

  document.getElementById("showreel-video-select")?.addEventListener("change", (e) => {
    if (e.target.value) {
      document.getElementById("showreel-videoUrl").value = e.target.value;
    }
  });
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * 5. PROJECTS & REELS MANAGEMENT (REORDER, ADD, EDIT, DELETE)
 */
function renderProjectsList() {
  const container = document.getElementById("admin-projects-list");
  const countBadge = document.getElementById("badge-projects-count");
  if (!container || !adminData.projects) return;

  countBadge.textContent = adminData.projects.length;

  container.innerHTML = adminData.projects.map((project, idx) => `
    <div class="project-admin-card" data-index="${idx}">
      <div class="project-order-badge">#${idx + 1}</div>
      <div class="project-admin-media">
        <video src="${project.videoUrl}" muted playsinline preload="metadata"></video>
      </div>
      <div class="project-admin-info">
        <div class="project-admin-title">${project.title}</div>
        <div class="project-admin-meta">
          <span class="category-tag-pill">${project.categoryLabel || project.category}</span>
          <span>•</span>
          <span>${project.tag || 'Vertical Short'}</span>
          <span>•</span>
          <span>${project.duration || '0:30'}</span>
          <span>•</span>
          <span style="color: var(--accent-green);">${project.metrics || ''}</span>
        </div>
      </div>
      <div class="project-admin-actions">
        <div class="order-btn-group">
          <button type="button" class="order-btn" title="Move Up" onclick="moveProjectUp(${idx})" ${idx === 0 ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
          </button>
          <button type="button" class="order-btn" title="Move Down" onclick="moveProjectDown(${idx})" ${idx === adminData.projects.length - 1 ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
        </div>
        <button type="button" class="admin-btn admin-btn-outline admin-btn-sm" onclick="openEditProjectModal(${idx})">
          <span>Edit</span>
        </button>
        <button type="button" class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteProject(${idx})">
          <span>Delete</span>
        </button>
      </div>
    </div>
  `).join("");
}

window.moveProjectUp = function(idx) {
  if (idx <= 0) return;
  const temp = adminData.projects[idx];
  adminData.projects[idx] = adminData.projects[idx - 1];
  adminData.projects[idx - 1] = temp;
  renderProjectsList();
  showToast(`Moved #${idx + 1} to position #${idx}`);
};

window.moveProjectDown = function(idx) {
  if (idx >= adminData.projects.length - 1) return;
  const temp = adminData.projects[idx];
  adminData.projects[idx] = adminData.projects[idx + 1];
  adminData.projects[idx + 1] = temp;
  renderProjectsList();
  showToast(`Moved #${idx + 1} to position #${idx + 2}`);
};

window.deleteProject = function(idx) {
  const p = adminData.projects[idx];
  if (confirm(`Are you sure you want to remove "${p.title}" from your portfolio?`)) {
    adminData.projects.splice(idx, 1);
    renderProjectsList();
    showToast(`Removed "${p.title}"`);
  }
};

/**
 * 6. PROJECT MODAL (ADD / EDIT)
 */
function initProjectModal() {
  const modal = document.getElementById("project-modal-backdrop");
  const closeBtn = document.getElementById("btn-close-project-modal");
  const cancelBtn = document.getElementById("btn-cancel-project-modal");
  const addBtn = document.getElementById("btn-open-add-project");
  const form = document.getElementById("project-edit-form");

  addBtn.addEventListener("click", () => {
    document.getElementById("project-modal-title").textContent = "Add New Reel Project";
    document.getElementById("modal-project-index").value = "-1";
    document.getElementById("modal-project-id").value = "project-" + Date.now();
    form.reset();
    populateVideoSelectors();
    modal.classList.add("open");
  });

  const closeModal = () => modal.classList.remove("open");
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const idx = parseInt(document.getElementById("modal-project-index").value, 10);
    const cat = document.getElementById("modal-project-category").value;
    const catText = document.getElementById("modal-project-category").selectedOptions[0].text;

    const projectObj = {
      id: document.getElementById("modal-project-id").value || ("project-" + Date.now()),
      title: document.getElementById("modal-project-title").value,
      category: cat,
      categoryLabel: catText,
      tag: document.getElementById("modal-project-tag").value || "Dynamic Reel",
      shortDesc: document.getElementById("modal-project-shortdesc").value,
      client: document.getElementById("modal-project-client").value || "Creator Series",
      year: "2026",
      duration: document.getElementById("modal-project-duration").value || "0:30",
      aspectRatio: "9:16",
      services: ["High-Retention Editing", "Dynamic Captions", "Sound FX Pops"],
      techniques: document.getElementById("modal-project-techniques").value || "Match cuts, audio risers, punch-ins.",
      metrics: document.getElementById("modal-project-metrics").value || "High Retention",
      videoUrl: document.getElementById("modal-project-videourl").value,
      embedType: "mp4",
      themeColor: "#00F5A0"
    };

    if (idx >= 0) {
      adminData.projects[idx] = { ...adminData.projects[idx], ...projectObj };
      showToast(`Updated "${projectObj.title}"`);
    } else {
      adminData.projects.unshift(projectObj);
      showToast(`Added new reel to #1 position`);
    }

    renderProjectsList();
    closeModal();
  });
}

window.openEditProjectModal = function(idx) {
  const p = adminData.projects[idx];
  if (!p) return;

  const modal = document.getElementById("project-modal-backdrop");
  document.getElementById("project-modal-title").textContent = `Edit Project #${idx + 1}`;
  document.getElementById("modal-project-index").value = idx;
  document.getElementById("modal-project-id").value = p.id;
  document.getElementById("modal-project-title").value = p.title || "";
  document.getElementById("modal-project-category").value = p.category || "motion-graphics";
  document.getElementById("modal-project-videourl").value = p.videoUrl || "";
  document.getElementById("modal-project-tag").value = p.tag || "";
  document.getElementById("modal-project-client").value = p.client || "";
  document.getElementById("modal-project-metrics").value = p.metrics || "";
  document.getElementById("modal-project-duration").value = p.duration || "";
  document.getElementById("modal-project-shortdesc").value = p.shortDesc || "";
  document.getElementById("modal-project-techniques").value = p.techniques || "";

  populateVideoSelectors();
  modal.classList.add("open");
};

/**
 * 7. BRAND & CONTACT FORM
 */
function renderBrandForm() {
  const b = adminData.brand || {};
  document.getElementById("brand-name").value = b.name || "";
  document.getElementById("brand-title").value = b.title || "";
  document.getElementById("brand-tagline").value = b.tagline || "";
  document.getElementById("brand-experience").value = b.experienceYears || "";
  document.getElementById("brand-availability").value = b.availability || "";
  document.getElementById("brand-whatsapp").value = b.whatsapp || "";
  document.getElementById("brand-phoneRaw").value = b.phoneRaw || "";
  document.getElementById("brand-phone").value = b.phone || "";
  document.getElementById("brand-email").value = b.email || "";
  document.getElementById("brand-aboutBio").value = b.aboutBio || "";
  document.getElementById("brand-aboutSpecialty").value = b.aboutSpecialty || "";
  document.getElementById("brand-aboutExperience").value = b.aboutExperience || "";
  document.getElementById("brand-aboutPhilosophy").value = b.aboutPhilosophy || "";
}

function collectBrandData() {
  if (!adminData.brand) adminData.brand = {};
  adminData.brand.name = document.getElementById("brand-name").value;
  adminData.brand.title = document.getElementById("brand-title").value;
  adminData.brand.tagline = document.getElementById("brand-tagline").value;
  adminData.brand.experienceYears = document.getElementById("brand-experience").value;
  adminData.brand.availability = document.getElementById("brand-availability").value;
  adminData.brand.whatsapp = document.getElementById("brand-whatsapp").value;
  adminData.brand.phoneRaw = document.getElementById("brand-phoneRaw").value;
  adminData.brand.phone = document.getElementById("brand-phone").value;
  adminData.brand.email = document.getElementById("brand-email").value;
  adminData.brand.aboutBio = document.getElementById("brand-aboutBio").value;
  adminData.brand.aboutSpecialty = document.getElementById("brand-aboutSpecialty").value;
  adminData.brand.aboutExperience = document.getElementById("brand-aboutExperience").value;
  adminData.brand.aboutPhilosophy = document.getElementById("brand-aboutPhilosophy").value;
}

/**
 * 8. SERVICES MANAGEMENT
 */
function renderServicesList() {
  const container = document.getElementById("admin-services-list");
  const countBadge = document.getElementById("badge-services-count");
  if (!container || !adminData.services) return;

  countBadge.textContent = adminData.services.length;

  container.innerHTML = adminData.services.map((s, idx) => `
    <div class="service-admin-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-green); font-size: 1.1rem;">${s.number}</span>
        <button type="button" class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteService(${idx})">Remove</button>
      </div>
      <div class="form-group">
        <label>Service Title</label>
        <input type="text" class="form-input" value="${s.title}" oninput="updateServiceField(${idx}, 'title', this.value)">
      </div>
      <div class="form-group">
        <label>Headline Subtitle</label>
        <input type="text" class="form-input" value="${s.headline}" oninput="updateServiceField(${idx}, 'headline', this.value)">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea class="form-textarea" rows="2" oninput="updateServiceField(${idx}, 'description', this.value)">${s.description}</textarea>
      </div>
    </div>
  `).join("");
}

window.updateServiceField = function(idx, field, val) {
  if (adminData.services[idx]) {
    adminData.services[idx][field] = val;
  }
};

window.deleteService = function(idx) {
  if (confirm("Remove this service card?")) {
    adminData.services.splice(idx, 1);
    // Renumber
    adminData.services.forEach((s, i) => s.number = String(i + 1).padStart(2, "0"));
    renderServicesList();
    showToast("Service removed");
  }
};

document.getElementById("btn-add-service")?.addEventListener("click", () => {
  const newNum = String(adminData.services.length + 1).padStart(2, "0");
  adminData.services.push({
    id: "service-" + Date.now(),
    number: newNum,
    title: "New Service Offering",
    headline: "Custom Deliverables & Fast Turnaround",
    description: "High-impact short-form service tailored for creators.",
    deliverables: ["Platform Optimization", "High-Resolution Export"],
    icon: "sparkles"
  });
  renderServicesList();
  showToast("Added new service card");
});

/**
 * 9. STATS & SHOWREEL
 */
function renderStatsAndShowreel() {
  const statsContainer = document.getElementById("admin-stats-list");
  if (statsContainer && adminData.stats) {
    statsContainer.innerHTML = adminData.stats.map((st, idx) => `
      <div style="display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-end;">
        <div class="form-group" style="flex: 1;">
          <label>${st.label}</label>
          <input type="number" class="form-input" value="${st.value}" oninput="updateStatVal(${idx}, this.value)">
        </div>
        <div class="form-group" style="max-width: 70px;">
          <label>Suffix</label>
          <input type="text" class="form-input" value="${st.suffix}" oninput="updateStatSuffix(${idx}, this.value)">
        </div>
      </div>
    `).join("");
  }

  const s = adminData.showreel || {};
  document.getElementById("showreel-title").value = s.title || "";
  document.getElementById("showreel-subtitle").value = s.subtitle || "";
  document.getElementById("showreel-videoUrl").value = s.videoUrl || "";
  document.getElementById("showreel-resolution").value = s.resolution || "";
  document.getElementById("showreel-year").value = s.year || "";
}

window.updateStatVal = function(idx, val) {
  if (adminData.stats[idx]) adminData.stats[idx].value = parseInt(val, 10) || 0;
};
window.updateStatSuffix = function(idx, val) {
  if (adminData.stats[idx]) adminData.stats[idx].suffix = val;
};

function collectShowreelData() {
  if (!adminData.showreel) adminData.showreel = {};
  adminData.showreel.title = document.getElementById("showreel-title").value;
  adminData.showreel.subtitle = document.getElementById("showreel-subtitle").value;
  adminData.showreel.videoUrl = document.getElementById("showreel-videoUrl").value;
  adminData.showreel.resolution = document.getElementById("showreel-resolution").value;
  adminData.showreel.year = document.getElementById("showreel-year").value;
}

/**
 * 10. TESTIMONIALS & FAQ
 */
function renderReviewsAndFaq() {
  const testContainer = document.getElementById("admin-testimonials-list");
  if (testContainer && adminData.testimonials) {
    testContainer.innerHTML = adminData.testimonials.map((t, idx) => `
      <div style="background: var(--admin-bg-elevated); padding: 14px; border-radius: var(--radius-md); margin-bottom: 12px;">
        <div style="font-weight: 700; color: var(--admin-text-main);">${t.name} — <span style="color: var(--accent-cyan);">${t.company}</span></div>
        <p style="font-size: 0.85rem; color: var(--admin-text-muted); margin-top: 6px;">"${t.review}"</p>
      </div>
    `).join("");
  }

  const faqContainer = document.getElementById("admin-faq-list");
  if (faqContainer && adminData.faq) {
    faqContainer.innerHTML = adminData.faq.map((f, idx) => `
      <div style="background: var(--admin-bg-elevated); padding: 14px; border-radius: var(--radius-md); margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: var(--accent-green); font-size: 0.95rem;">Q: ${f.q}</strong>
          <button type="button" class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteFaq(${idx})">Remove</button>
        </div>
        <p style="font-size: 0.85rem; color: var(--admin-text-muted); margin-top: 6px;">${f.a}</p>
      </div>
    `).join("");
  }
}

window.deleteFaq = function(idx) {
  if (confirm("Delete this FAQ item?")) {
    adminData.faq.splice(idx, 1);
    renderReviewsAndFaq();
    showToast("FAQ removed");
  }
};

document.getElementById("btn-add-faq")?.addEventListener("click", () => {
  const q = prompt("Enter FAQ Question:");
  if (q) {
    const a = prompt("Enter FAQ Answer:");
    if (a) {
      adminData.faq.push({ q, a });
      renderReviewsAndFaq();
      showToast("FAQ Added");
    }
  }
});

/**
 * 11. GLOBAL SAVE CONTROLLER
 */
function initGlobalSave() {
  const saveBtn = document.getElementById("global-save-btn");
  const saveText = document.getElementById("save-btn-text");

  saveBtn.addEventListener("click", async () => {
    collectBrandData();
    collectShowreelData();

    saveText.textContent = "Saving...";
    saveBtn.disabled = true;

    try {
      // Save directly via local server API if online
      if (isServerOnline) {
        const response = await fetch(getApiBase() + "/api/save-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(adminData, null, 2)
        });

        if (!response.ok) throw new Error("Failed to save to server");
        showToast("Changes permanently saved to data.js!");
      } else {
        showToast("Saved to local browser cache! (Offline)");
      }

      // Also backup to localStorage
      localStorage.setItem("SUNNY_PORTFOLIO_DATA_OVERRIDE", JSON.stringify(adminData));
    } catch (err) {
      showToast("Error saving: " + err.message);
    } finally {
      saveText.textContent = "Save Changes";
      saveBtn.disabled = false;
    }
  });
}

/**
 * 12. BACKUP & EXPORT TAB
 */
function initBackupTab() {
  document.getElementById("btn-download-datajs")?.addEventListener("click", () => {
    collectBrandData();
    collectShowreelData();

    const formattedJs = `/**
 * =========================================================================
 * SUNNY THAKUR PORTFOLIO - CENTRAL DATA CONFIGURATION
 * Laser-Focused on High-Retention Short-Form Content (Reels, Shorts, TikTok)
 * Last Updated: ${new Date().toISOString()} via Admin Studio Export
 * =========================================================================
 */

const PORTFOLIO_DATA = ${JSON.stringify(adminData, null, 2)};

// Export for module or global use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PORTFOLIO_DATA;
}
`;

    const blob = new Blob([formattedJs], { type: "application/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Downloaded data.js backup file");
  });
}

/**
 * 13. TOAST NOTIFICATIONS
 */
function showToast(msg) {
  const stack = document.getElementById("toast-stack");
  if (!stack) return;

  const toast = document.createElement("div");
  toast.className = "toast-item";
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span>${msg}</span>
  `;

  stack.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * 14. LEADS & CLIENT INQUIRIES CONTROLLER
 */
let adminInquiries = [];
let currentInquiriesFilter = "all";
let currentSearchQuery = "";

async function initInquiriesManager() {
  await fetchInquiries();

  // Search filter
  const searchInput = document.getElementById("inquiries-search-input");
  searchInput?.addEventListener("input", (e) => {
    currentSearchQuery = e.target.value.toLowerCase().trim();
    renderInquiriesUI();
  });

  // Filter pills
  const filterPills = document.querySelectorAll("#inquiries-filter-group .filter-pill");
  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      filterPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentInquiriesFilter = pill.getAttribute("data-filter") || "all";
      renderInquiriesUI();
    });
  });

  // Refresh
  document.getElementById("btn-refresh-inquiries")?.addEventListener("click", async () => {
    await fetchInquiries();
    showToast("Leads list refreshed");
  });

  // Clear All
  document.getElementById("btn-clear-inquiries")?.addEventListener("click", async () => {
    if (!adminInquiries.length) return;
    if (confirm("Are you sure you want to clear all inquiries? This action cannot be undone.")) {
      adminInquiries = [];
      localStorage.setItem("SUNNY_PORTFOLIO_INQUIRIES", "[]");
      renderInquiriesUI();
      showToast("All inquiries cleared");
    }
  });

  // Export CSV
  document.getElementById("btn-export-inquiries")?.addEventListener("click", () => {
    exportInquiriesCSV();
  });

  // Auto-refresh inquiries every 4 seconds for real-time updates
  setInterval(fetchInquiries, 4000);
}

async function fetchInquiries() {
  let serverList = [];
  try {
    const res = await fetch(getApiBase() + "/api/get-inquiries");
    if (res.ok) {
      serverList = await res.json();
      if (!Array.isArray(serverList)) serverList = serverList ? [serverList] : [];
    }
  } catch (e) {}

  let localList = [];
  try {
    const raw = localStorage.getItem("SUNNY_PORTFOLIO_INQUIRIES");
    if (raw) localList = JSON.parse(raw);
    if (!Array.isArray(localList)) localList = [];
  } catch (e) {}

  // Merge lists by unique ID
  const map = new Map();
  serverList.forEach(item => { if (item && item.id) map.set(item.id, item); });
  localList.forEach(item => { if (item && item.id && !map.has(item.id)) map.set(item.id, item); });

  adminInquiries = Array.from(map.values());
  // Sort descending by date
  adminInquiries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // Sync to local storage
  localStorage.setItem("SUNNY_PORTFOLIO_INQUIRIES", JSON.stringify(adminInquiries));

  renderInquiriesUI();
}

function renderInquiriesUI() {
  const container = document.getElementById("admin-inquiries-list");
  const badge = document.getElementById("badge-inquiries-count");
  const totalEl = document.getElementById("metric-inquiries-total");
  const newEl = document.getElementById("metric-inquiries-new");
  const contactedEl = document.getElementById("metric-inquiries-contacted");

  const totalCount = adminInquiries.length;
  const newCount = adminInquiries.filter(i => i.status === "new").length;
  const contactedCount = adminInquiries.filter(i => i.status === "contacted").length;

  if (badge) badge.textContent = newCount > 0 ? String(newCount) : (totalCount > 0 ? String(totalCount) : "0");
  if (totalEl) totalEl.textContent = String(totalCount);
  if (newEl) newEl.textContent = String(newCount);
  if (contactedEl) contactedEl.textContent = String(contactedCount);

  if (!container) return;

  // Filter items
  let filtered = adminInquiries.filter(item => {
    // Status filter
    if (currentInquiriesFilter !== "all" && item.status !== currentInquiriesFilter) {
      return false;
    }
    // Search query filter
    if (currentSearchQuery) {
      const q = currentSearchQuery;
      const haystack = [
        item.name || "",
        item.email || "",
        item.phone || "",
        item.projectTypeLabel || "",
        item.budget || "",
        item.message || ""
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-inquiries-box">
        <div class="empty-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
        </div>
        <h3 class="empty-title">${currentSearchQuery || currentInquiriesFilter !== "all" ? "No Matching Inquiries Found" : "No Inquiries Yet"}</h3>
        <p class="empty-desc">
          ${currentSearchQuery || currentInquiriesFilter !== "all" ? "Try clearing your search query or switching to 'All' filter." : "When visitors submit project inquiries on your portfolio, their details, budget, and raw video Drive links will appear here."}
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const isNew = item.status === "new";
    const isContacted = item.status === "contacted";
    const isClosed = item.status === "closed";
    const initial = (item.name || "C").charAt(0).toUpperCase();

    // Client phone & WhatsApp link
    const cleanPhone = (item.phone || "").replace(/[^0-9]/g, "");
    const waChatUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi ${item.name || ''}! Thank you for reaching out through my portfolio regarding ${item.projectTypeLabel || 'your video editing project'}.`)}`
      : `https://wa.me/919234536469`;

    const mailtoUrl = `mailto:${item.email}?subject=${encodeURIComponent(`Re: Video Editing Project Inquiry — ${item.projectTypeLabel || 'Sunny Thakur'}`)}&body=${encodeURIComponent(`Hi ${item.name || ''},\n\nThank you for reaching out through my portfolio! I reviewed your project details and would love to help you produce these videos.\n\nBest regards,\nSunny Thakur\nVideo Editor`)}`;

    return `
      <div class="inquiry-card ${isNew ? 'is-new' : (isContacted ? 'is-contacted' : 'is-closed')}" id="card-${item.id}">
        <div class="inquiry-card-header">
          <div class="inquiry-client-info">
            <div class="inquiry-avatar-icon">${initial}</div>
            <div>
              <div class="inquiry-client-name">${escapeHtml(item.name || 'Anonymous Client')}</div>
              <div class="inquiry-date-text">${item.dateFormatted || (item.date ? new Date(item.date).toLocaleString() : 'Recent')}</div>
            </div>
          </div>
          <div class="inquiry-status-group">
            <span class="inquiry-status-pill ${isNew ? 'status-badge-new' : (isContacted ? 'status-badge-contacted' : 'status-badge-closed')}">
              ● ${item.status ? item.status.toUpperCase() : 'NEW'}
            </span>
          </div>
        </div>

        <div class="inquiry-details-grid">
          <div class="inquiry-detail-item">
            <span class="detail-label">Client Email</span>
            <span class="detail-value">
              <a href="${mailtoUrl}">${escapeHtml(item.email || 'None')}</a>
            </span>
          </div>

          <div class="inquiry-detail-item">
            <span class="detail-label">Client Phone / WhatsApp</span>
            <span class="detail-value">
              ${item.phone ? `<a href="${waChatUrl}" target="_blank">${escapeHtml(item.phone)}</a>` : '<span style="color: var(--admin-text-dim);">Not provided</span>'}
            </span>
          </div>

          <div class="inquiry-detail-item">
            <span class="detail-label">Reel Service Category</span>
            <span class="detail-value" style="color: var(--accent-cyan);">
              ${escapeHtml(item.projectTypeLabel || item.projectType || 'Standard Reel')}
            </span>
          </div>

          <div class="inquiry-detail-item">
            <span class="detail-label">Budget Tier</span>
            <span class="detail-value budget-highlight-tag">
              ${escapeHtml(item.budget || 'Standard')}
            </span>
          </div>
        </div>

        <div class="inquiry-message-box">
          <div class="inquiry-message-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span>Project Details &amp; Video Drive Links</span>
          </div>
          <div class="inquiry-message-content">${formatMessageContent(item.message || 'No additional details provided.')}</div>
        </div>

        <div class="inquiry-actions-row">
          <div class="inquiry-action-btns">
            <a href="${waChatUrl}" target="_blank" class="admin-btn admin-btn-sm btn-wa-reply" title="Open WhatsApp chat with client">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
              <span>Chat on WhatsApp</span>
            </a>

            <a href="${mailtoUrl}" class="admin-btn admin-btn-sm btn-mail-reply" title="Send email to client">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <span>Email Client</span>
            </a>

            <button type="button" class="admin-btn admin-btn-sm admin-btn-outline" onclick="toggleInquiryStatus('${item.id}')" title="Change lead status">
              <span>Status: <strong>${item.status === 'new' ? 'Mark Contacted' : (item.status === 'contacted' ? 'Mark Closed' : 'Reopen')}</strong></span>
            </button>
          </div>

          <button type="button" class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteInquiryLead('${item.id}')" title="Delete this lead">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            <span>Delete</span>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMessageContent(str) {
  if (!str) return "";
  const escaped = escapeHtml(str);
  return escaped.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: var(--accent-cyan); text-decoration: underline;">$1</a>');
}

window.toggleInquiryStatus = async function(id) {
  const item = adminInquiries.find(i => i.id === id);
  if (!item) return;

  if (item.status === "new") item.status = "contacted";
  else if (item.status === "contacted") item.status = "closed";
  else item.status = "new";

  localStorage.setItem("SUNNY_PORTFOLIO_INQUIRIES", JSON.stringify(adminInquiries));

  try {
    await fetch(getApiBase() + "/api/update-inquiry-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: item.status })
    });
  } catch (e) {}

  showToast(`Lead status updated to: ${item.status.toUpperCase()}`);
  renderInquiriesUI();
};

window.deleteInquiryLead = async function(id) {
  if (!confirm("Are you sure you want to delete this lead?")) return;

  adminInquiries = adminInquiries.filter(i => i.id !== id);
  localStorage.setItem("SUNNY_PORTFOLIO_INQUIRIES", JSON.stringify(adminInquiries));

  try {
    await fetch(getApiBase() + "/api/delete-inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
  } catch (e) {}

  showToast("Lead deleted");
  renderInquiriesUI();
};

function exportInquiriesCSV() {
  if (!adminInquiries.length) {
    showToast("No inquiries available to export");
    return;
  }

  const headers = ["ID", "Date", "Name", "Email", "Phone", "Category", "Budget", "Status", "Message"];
  const rows = adminInquiries.map(i => [
    `"${(i.id || '').replace(/"/g, '""')}"`,
    `"${(i.dateFormatted || i.date || '').replace(/"/g, '""')}"`,
    `"${(i.name || '').replace(/"/g, '""')}"`,
    `"${(i.email || '').replace(/"/g, '""')}"`,
    `"${(i.phone || '').replace(/"/g, '""')}"`,
    `"${(i.projectTypeLabel || i.projectType || '').replace(/"/g, '""')}"`,
    `"${(i.budget || '').replace(/"/g, '""')}"`,
    `"${(i.status || 'new').replace(/"/g, '""')}"`,
    `"${(i.message || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sunny_thakur_leads_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Exported leads to CSV spreadsheet");
}

