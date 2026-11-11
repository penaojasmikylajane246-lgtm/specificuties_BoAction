// COMPLETE 61 BARANGAYS OF BOAC, MARINDUQUE
const BOAC_BARANGAYS = [
  "Agtapan",
  "Agot",
  "Alupay",
  "Amoing",
  "Apitong",
  "Argao",
  "Balagbag",
  "Balimbing",
  "Balogo",
  "Bamban",
  "Bangbangalon",
  "Bantad",
  "Bantay",
  "Bayuti",
  "Binunga",
  "Boi",
  "Botoan",
  "Canat",
  "Cawit",
  "Dapiti",
  "Dawis",
  "Dayhagan",
  "Ihatub",
  "Isok 1 (Poblacion)",
  "Isok 2 (Poblacion)",
  "Laylay",
  "Lupac",
  "Mahinhin",
  "Mainit",
  "Malbog",
  "Malusak (Poblacion)",
  "Mansiwat",
  "Matandang Gasan",
  "Mercado (Poblacion)",
  "Mogpog",
  "Murallon (Poblacion)",
  "Oja",
  "Pawa",
  "Pili",
  "Poctoy",
  "Poras",
  "Rizal",
  "San Miguel (Poblacion)",
  "Santol",
  "Sawi",
  "Tabi",
  "Tabigue",
  "Tagtapan",
  "Tambunan",
  "Tampus",
  "Tanza",
  "Tugos",
  "Tumagabok",
].sort();

const STORAGE_KEY = "boaction_complaints_db";
const USERS_KEY = "boaction_users_db";
const SESSION_KEY = "boaction_current_user";
const REPORT_STATUSES = ["Pending Review", "In Progress", "Resolved", "Closed"];
let activeReportId = null;

document.addEventListener("DOMContentLoaded", () => {
  initBarangays();
  initUsers();
  initDatabase();
  initAdminDashboard();
  checkSession();
});

function initBarangays() {
  const selects = [
    document.getElementById("barangaySelect"),
    document.getElementById("gateRegBrgy"),
  ];
  selects.forEach((select) => {
    if (!select) return;
    select.innerHTML = '<option value="">-- Choose Barangay --</option>';
    BOAC_BARANGAYS.forEach((b) => {
      const opt = document.createElement("option");
      opt.value = b;
      opt.textContent = `Brgy. ${b}`;
      select.appendChild(opt);
    });
  });
}

function initUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    const defaults = [
      {
        id: "09123456789",
        pass: "user123",
        name: "Maria Santos",
        barangay: "Poras",
        role: "citizen",
      },
      {
        id: "admin",
        pass: "admin123",
        name: "LGU Admin Officer",
        barangay: "Poblacion",
        role: "admin",
      },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
  }
}

function initDatabase() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    const mock = [
      {
        id: "BOAC-2026-8912",
        name: "Juan Dela Cruz",
        contact: "09181234567",
        barangay: "Poras",
        category: "Road Maintenance",
        description: "Deep pothole near barangay hall.",
        date: "2026-11-01",
        status: "In Progress",
      },
      {
        id: "BOAC-2026-4431",
        name: "Maria Santos",
        contact: "09123456789",
        barangay: "Malusak (Poblacion)",
        category: "Waste Management",
        description: "Uncollected garbage piles.",
        date: "2026-11-02",
        status: "Pending Review",
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mock));
  }
}

function toggleAuthGateTab(tab) {
  const loginBtn = document.getElementById("gateTabLoginBtn");
  const regBtn = document.getElementById("gateTabRegBtn");
  const loginForm = document.getElementById("gateLoginForm");
  const regForm = document.getElementById("gateRegisterForm");
  const eyebrow = document.getElementById("authEyebrow");
  const heading = document.getElementById("authHeading");
  const description = document.getElementById("authDescription");
  const isLogin = tab === "login";

  loginBtn.classList.toggle("auth-tab-active", isLogin);
  regBtn.classList.toggle("auth-tab-active", !isLogin);
  loginBtn.classList.toggle("text-slate-500", !isLogin);
  loginBtn.classList.toggle("hover:text-slate-800", !isLogin);
  regBtn.classList.toggle("text-slate-500", isLogin);
  regBtn.classList.toggle("hover:text-slate-800", isLogin);
  loginBtn.setAttribute("aria-selected", String(isLogin));
  regBtn.setAttribute("aria-selected", String(!isLogin));
  loginForm.classList.toggle("hidden", !isLogin);
  regForm.classList.toggle("hidden", isLogin);
  eyebrow.textContent = isLogin ? "Welcome back" : "Join BoAction";
  heading.textContent = isLogin
    ? "Sign in to your community"
    : "Create your account";
  description.textContent = isLogin
    ? "Enter your details to continue to the BoAction community portal."
    : "Register as a resident or LGU Admin Officer to continue.";
}

function toggleGateRegisterRole() {
  const isAdmin = document.getElementById("gateRegAdmin").checked;
  const barangayField = document.getElementById("gateRegBarangayField");
  const barangaySelect = document.getElementById("gateRegBrgy");

  barangayField.classList.toggle("hidden", isAdmin);
  barangaySelect.required = !isAdmin;
}

function toggleGatePasswordVisibility() {
  const passwordInput = document.getElementById("gateLoginPass");
  const toggleButton = document.getElementById("gateLoginPassToggle");
  const isVisible = passwordInput.type === "text";

  passwordInput.type = isVisible ? "password" : "text";
  toggleButton.textContent = isVisible ? "Show" : "Hide";
  toggleButton.setAttribute("aria-pressed", String(!isVisible));
}

function fillGateDemo(type) {
  if (type === "citizen") {
    document.getElementById("gateLoginId").value = "09123456789";
    document.getElementById("gateLoginPass").value = "user123";
  } else {
    document.getElementById("gateLoginId").value = "admin";
    document.getElementById("gateLoginPass").value = "admin123";
  }
}

function handleGateLogin(e) {
  e.preventDefault();
  const id = document.getElementById("gateLoginId").value.trim();
  const pass = document.getElementById("gateLoginPass").value.trim();

  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  const user = users.find((u) => u.id === id && u.pass === pass);

  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    document.getElementById("authGateModal").classList.add("hidden");
    updateRoleView();
  } else {
    alert("⚠️ Invalid Phone/Username or Password!");
  }
}

function handleGateRegister(e) {
  e.preventDefault();
  const name = document.getElementById("gateRegName").value.trim();
  const phone = document.getElementById("gateRegPhone").value.trim();
  const isAdmin = document.getElementById("gateRegAdmin").checked;
  const barangay = isAdmin ? "" : document.getElementById("gateRegBrgy").value;
  const pass = document.getElementById("gateRegPass").value.trim();

  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

  if (users.some((u) => u.id.toLowerCase() === phone.toLowerCase())) {
    alert(
      "❌ MAY KATULAD NANG ACCOUNT!\n\nAng phone number na ito ay nakarehistro na sa sistema.",
    );
    return;
  }

  const newUser = {
    id: phone,
    pass: pass,
    name: name,
    barangay: barangay,
    role: isAdmin ? "admin" : "citizen",
  };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));

  alert("✅ Matagumpay ang iyong pagpaparehistro!");
  document.getElementById("authGateModal").classList.add("hidden");
  updateRoleView();
}

function handleLogout() {
  localStorage.removeItem(SESSION_KEY);
  document.getElementById("authGateModal").classList.remove("hidden");
  updateRoleView();
}

function checkSession() {
  const user = JSON.parse(localStorage.getItem(SESSION_KEY));
  if (user) {
    document.getElementById("authGateModal").classList.add("hidden");
    updateRoleView();
  } else {
    document.getElementById("authGateModal").classList.remove("hidden");
  }
}

function updateRoleView() {
  const user = JSON.parse(localStorage.getItem(SESSION_KEY));
  const roleNav = document.getElementById("roleNavLinks");
  const authHeaderNav = document.getElementById("authHeaderNav");

  if (!user) return;

  authHeaderNav.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-xs text-white font-bold">${user.name} (${user.role === "admin" ? "LGU Admin" : "Resident"})</span>
                    <button onclick="handleLogout()" class="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-xs text-white font-semibold rounded">Logout</button>
                </div>
            `;

  if (user.role === "citizen") {
    roleNav.innerHTML = `
                    <button onclick="switchTab('submit')" id="nav-submit" class="nav-btn px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 bg-emerald-900 text-amber-300">
                        <i class="fa-solid fa-pen-to-square"></i> Submit Complaint
                    </button>
                    <button onclick="switchTab('track')" id="nav-track" class="nav-btn px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 text-emerald-100 hover:bg-emerald-700">
                        <i class="fa-solid fa-magnifying-glass"></i> Track Status
                    </button>
                `;
    document.getElementById("citizenName").value = user.name;
    document.getElementById("citizenContact").value = user.id;
    document.getElementById("barangaySelect").value = user.barangay;
    switchTab("submit");
  } else if (user.role === "admin") {
    roleNav.innerHTML = `
                    <button onclick="switchTab('admin')" id="nav-admin" class="nav-btn px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 bg-emerald-900 text-amber-300">
                        <i class="fa-solid fa-chart-line"></i> Admin Dashboard
                    </button>
                    <button onclick="switchTab('submit')" id="nav-submit" class="nav-btn px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 text-emerald-100 hover:bg-emerald-700">
                        <i class="fa-solid fa-pen-to-square"></i> Submit Complaint
                    </button>
                    <button onclick="switchTab('track')" id="nav-track" class="nav-btn px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 text-emerald-100 hover:bg-emerald-700">
                        <i class="fa-solid fa-magnifying-glass"></i> Track Status
                    </button>
                `;
    switchTab("admin");
  }
}

function switchTab(tab) {
  const user = JSON.parse(localStorage.getItem(SESSION_KEY));
  if (tab === "admin" && user?.role !== "admin") {
    alert(
      "⛔ UNAUTHORIZED ACCESS!\n\nAng Admin Dashboard ay para lamang sa mga opisyal na LGU Administrative Officers.",
    );
    return;
  }

  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("bg-emerald-900", "text-amber-300");
    btn.classList.add("text-emerald-100", "hover:bg-emerald-700");
  });
  const activeBtn = document.getElementById(`nav-${tab}`);
  if (activeBtn) {
    activeBtn.classList.remove("text-emerald-100", "hover:bg-emerald-700");
    activeBtn.classList.add("bg-emerald-900", "text-amber-300");
  }

  if (tab === "admin") renderAdminTable();
}

function prepareEvidencePhoto(file) {
  if (!file) return Promise.resolve(null);
  if (
    !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)
  ) {
    return Promise.reject(new Error("Choose a JPEG, PNG, WebP, or GIF image."));
  }
  if (file.size > 10 * 1024 * 1024) {
    return Promise.reject(
      new Error("The evidence photo must be 10 MB or smaller."),
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error("The evidence photo could not be read."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () =>
        reject(new Error("The selected file is not a readable image."));
      image.onload = () => {
        try {
          if (image.width * image.height > 40000000) {
            reject(
              new Error(
                "The evidence photo dimensions are too large to process.",
              ),
            );
            return;
          }
          const maxDimension = 1280;
          const scale = Math.min(
            1,
            maxDimension / Math.max(image.width, image.height),
          );
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("The evidence photo could not be processed."));
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.78));
        } catch {
          reject(new Error("The evidence photo could not be processed."));
        }
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const evidenceFile = document.getElementById("evidencePhoto").files[0];
  submitButton.disabled = true;

  let evidencePhoto;
  try {
    evidencePhoto = await prepareEvidencePhoto(evidenceFile);
  } catch (error) {
    alert(error.message);
    submitButton.disabled = false;
    return;
  }

  const code = `BOAC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const newRecord = {
    id: code,
    name: document.getElementById("citizenName").value,
    contact: document.getElementById("citizenContact").value,
    barangay: document.getElementById("barangaySelect").value,
    category: document.getElementById("categorySelect").value,
    description: document.getElementById("descriptionInput").value,
    evidencePhoto,
    date: new Date().toISOString().split("T")[0],
    status: "Pending Review",
  };

  const db = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  db.unshift(newRecord);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    console.error("Unable to save the incident report.", error);
    alert(
      "The report could not be saved in this browser. Free up local storage and try again.",
    );
    submitButton.disabled = false;
    return;
  }

  submitButton.disabled = false;
  document.getElementById("modalTrackingCode").textContent = code;
  document.getElementById("successModal").classList.remove("hidden");
}

function closeSuccessModal() {
  document.getElementById("successModal").classList.add("hidden");
  switchTab("track");
  document.getElementById("trackInput").value =
    document.getElementById("modalTrackingCode").textContent;
  handleTrackSearch();
}

function handleTrackSearch(e) {
  if (e) e.preventDefault();
  const code = document.getElementById("trackInput").value.trim().toUpperCase();
  const db = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  const match = db.find((i) => i.id === code);
  const container = document.getElementById("trackResultContainer");
  container.classList.remove("hidden");

  if (!match) {
    container.innerHTML = `<div class="p-4 bg-red-50 text-red-700 text-xs rounded-lg text-center font-bold">Code Not Found</div>`;
    return;
  }

  container.innerHTML = `
                <div class="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2 shadow-sm">
                    <div class="flex justify-between font-bold text-emerald-800">
                        <span>${escapeHtml(match.id)}</span>
                        <span class="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">${escapeHtml(match.status)}</span>
                    </div>
                    <p><strong>Barangay:</strong> Brgy. ${escapeHtml(match.barangay)}</p>
                    <p><strong>Category:</strong> ${escapeHtml(match.category)}</p>
                    <p><strong>Details:</strong> ${escapeHtml(match.description)}</p>
                </div>
            `;
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function initAdminDashboard() {
  const tbody = document.getElementById("adminTableBody");
  tbody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-report-id]");
    if (button) openReportViewer(button.dataset.reportId);
  });
  document
    .getElementById("reportViewerContent")
    .addEventListener("click", (event) => {
      if (event.target.closest("[data-view-evidence]") && activeReportId) {
        const report = getReports().find((item) => item.id === activeReportId);
        if (report?.evidencePhoto) openEvidenceViewer(report.evidencePhoto);
      }
    });
  document
    .getElementById("reportViewerModal")
    .addEventListener("click", (event) => {
      if (event.target.id === "reportViewerModal") closeReportViewer();
    });
  document
    .getElementById("evidenceViewerModal")
    .addEventListener("click", (event) => {
      if (event.target.id === "evidenceViewerModal") closeEvidenceViewer();
    });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeEvidenceViewer();
      closeReportViewer();
    }
  });
}

function getReports() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function populateReportFilter(select, values, placeholder) {
  const selectedValue = select.value;
  select.replaceChildren(new Option(placeholder, ""));
  [...new Set(values.filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .forEach((value) => {
      select.add(new Option(value, value));
    });
  select.value = values.includes(selectedValue) ? selectedValue : "";
}

function renderAdminTable() {
  const db = getReports();
  const tbody = document.getElementById("adminTableBody");
  const statusFilter = document.getElementById("adminStatusFilter");
  const categoryFilter = document.getElementById("adminCategoryFilter");
  const barangayFilter = document.getElementById("adminBarangayFilter");
  populateReportFilter(
    statusFilter,
    [...REPORT_STATUSES, ...db.map((report) => report.status)],
    "All statuses",
  );
  populateReportFilter(
    categoryFilter,
    db.map((report) => report.category),
    "All categories",
  );
  populateReportFilter(
    barangayFilter,
    db.map((report) => report.barangay),
    "All barangays",
  );

  const keyword = document
    .getElementById("adminSearch")
    .value.trim()
    .toLocaleLowerCase();
  const status = document.getElementById("adminStatusFilter").value;
  const category = categoryFilter.value;
  const barangay = barangayFilter.value;
  const filtered = db.filter((report) => {
    const searchableText = [
      report.id,
      report.name,
      report.contact,
      report.barangay,
      report.category,
      report.date,
      report.status,
      report.description,
    ]
      .join(" ")
      .toLocaleLowerCase();
    return (
      (!keyword || searchableText.includes(keyword)) &&
      (!status || report.status === status) &&
      (!category || report.category === category) &&
      (!barangay || report.barangay === barangay)
    );
  });

  document.getElementById("adminReportCount").textContent =
    `Showing ${filtered.length} of ${db.length} reports`;
  tbody.innerHTML = filtered.length
    ? filtered
        .map(
          (report) => `
                <tr class="border-b border-slate-100">
                    <td class="py-3 px-4 font-bold text-emerald-800">${escapeHtml(report.id)}</td>
                    <td class="py-3 px-4">${escapeHtml(report.name)}<br><span class="text-slate-500">${escapeHtml(report.contact)}</span></td>
                    <td class="py-3 px-4">Brgy. ${escapeHtml(report.barangay)}</td>
                    <td class="py-3 px-4">${escapeHtml(report.category)}</td>
                    <td class="py-3 px-4">${escapeHtml(report.date)}</td>
                    <td class="py-3 px-4"><span class="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">${escapeHtml(report.status)}</span></td>
                    <td class="py-3 px-4 text-right">
                        <button type="button" data-report-id="${escapeHtml(report.id)}" class="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold">View / Update</button>
                    </td>
                </tr>
            `,
        )
        .join("")
    : `
                <tr><td colspan="7" class="py-8 px-4 text-center text-slate-500">No reports match these filters.</td></tr>
            `;
}

function isAdmin() {
  return JSON.parse(localStorage.getItem(SESSION_KEY))?.role === "admin";
}

function openReportViewer(reportId) {
  if (!isAdmin()) return;
  const report = getReports().find((item) => item.id === reportId);
  if (!report) return;

  activeReportId = report.id;
  const statusSelect = document.getElementById("reportStatusSelect");
  if (
    ![...statusSelect.options].some((option) => option.value === report.status)
  ) {
    statusSelect.add(new Option(report.status, report.status));
  }
  statusSelect.value = report.status;
  document.getElementById("reportStatusFeedback").classList.add("hidden");

  const photo =
    typeof report.evidencePhoto === "string" &&
    report.evidencePhoto.startsWith("data:image/jpeg;base64,")
      ? report.evidencePhoto
      : null;
  document.getElementById("reportViewerContent").innerHTML = `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <p><strong>Tracking Code</strong><br>${escapeHtml(report.id)}</p>
                    <p><strong>Date Filed</strong><br>${escapeHtml(report.date)}</p>
                    <p><strong>Resident</strong><br>${escapeHtml(report.name)}</p>
                    <p><strong>Contact</strong><br>${escapeHtml(report.contact)}</p>
                    <p><strong>Barangay</strong><br>Brgy. ${escapeHtml(report.barangay)}</p>
                    <p><strong>Category</strong><br>${escapeHtml(report.category)}</p>
                    <p class="sm:col-span-2"><strong>Current Status</strong><br>${escapeHtml(report.status)}</p>
                    <p class="sm:col-span-2 whitespace-pre-wrap"><strong>Detailed Description</strong><br>${escapeHtml(report.description)}</p>
                </div>
                <div class="border-t border-slate-200 pt-4">
                    <h3 class="font-semibold text-slate-800 mb-2">Evidence Photo</h3>
                    ${
                      photo
                        ? `<button type="button" data-view-evidence class="block text-left rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-emerald-600" aria-label="View and enlarge evidence photo"><img src="${photo}" alt="Resident-submitted evidence" class="max-h-48 max-w-full object-contain bg-slate-50"><span class="block px-3 py-2 text-xs font-semibold text-emerald-800">View and enlarge photo</span></button>`
                        : '<p class="text-sm text-slate-500">No evidence photo was submitted.</p>'
                    }
                </div>
            `;
  document.getElementById("reportViewerModal").classList.remove("hidden");
}

function closeReportViewer() {
  document.getElementById("reportViewerModal").classList.add("hidden");
  activeReportId = null;
}

function openEvidenceViewer(photo) {
  if (!photo.startsWith("data:image/jpeg;base64,")) return;
  document.getElementById("evidenceViewerImage").src = photo;
  document.getElementById("evidenceViewerModal").classList.remove("hidden");
}

function closeEvidenceViewer() {
  const modal = document.getElementById("evidenceViewerModal");
  modal.classList.add("hidden");
  document.getElementById("evidenceViewerImage").removeAttribute("src");
}

function handleReportStatusUpdate(event) {
  event.preventDefault();
  if (!isAdmin() || !activeReportId) return;
  const reports = getReports();
  const report = reports.find((item) => item.id === activeReportId);
  if (!report) return;

  report.status = document.getElementById("reportStatusSelect").value;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (error) {
    console.error("Unable to save the report status.", error);
    alert("The status could not be saved in this browser. Please try again.");
    return;
  }

  renderAdminTable();
  openReportViewer(activeReportId);
  const feedback = document.getElementById("reportStatusFeedback");
  feedback.textContent = "Report status updated.";
  feedback.classList.remove("hidden");
}
