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
const NOTIFICATIONS_KEY = "boaction_notifications_db";
const PASSWORD_ITERATIONS = 210000;
const REPORT_STATUSES = [
  "Pending Verification",
  "Verified",
  "Assigned",
  "In Progress",
  "Resolved",
  "Rejected",
];
const REPORT_PRIORITIES = ["Urgent", "High", "Normal", "Low"];
const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_EVIDENCE_PHOTOS = 5;
let profileDraft = null;
let activeReportId = null;

document.addEventListener("DOMContentLoaded", () => {
  initBarangays();
  initAdminDashboard();
  initUsers();
  initDatabase();
  checkSession();
  renderEvidencePreviews();
  window.addEventListener("storage", handleCrossTabUpdate);
});

function initBarangays() {
  const selects = [
    document.getElementById("barangaySelect"),
    document.getElementById("gateRegBrgy"),
    document.getElementById("adminOfficerBarangay"),
    document.getElementById("profileBarangay"),
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
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  if (!Array.isArray(users)) {
    throw new Error("Stored BoAction accounts are invalid.");
  }
  if (users.some((user) => user.role === "admin")) return;
  users.push({
    id: "admin",
    pass: "admin123",
    name: "LGU Admin Officer",
    barangay: "Isok 1 (Poblacion)",
    role: "admin",
  });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function initDatabase() {
  if (localStorage.getItem(STORAGE_KEY) === null) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return;
  }
  const reports = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (!Array.isArray(reports))
    throw new Error("Stored complaint records are invalid.");
  let migrated = false;
  const defaultOfficer = JSON.parse(
    localStorage.getItem(USERS_KEY) || "[]",
  ).find((user) => user.role === "admin");
  reports.forEach((report) => {
    if (report.status === "Pending Review") {
      report.status = "Pending Verification";
      migrated = true;
    } else if (report.status === "Closed") {
      report.status = "Resolved";
      report.verified = true;
      migrated = true;
    }
    if (
      ["In Progress", "Resolved"].includes(report.status) &&
      !report.verified
    ) {
      report.verified = true;
      migrated = true;
    }
    if (report.verified && !report.assignedPersonnelId && defaultOfficer) {
      report.assignedPersonnelId = defaultOfficer.id;
      report.assignedPersonnelName = defaultOfficer.name;
      migrated = true;
    }
    if (
      report.verified &&
      !report.assignedPersonnelBarangay &&
      defaultOfficer
    ) {
      report.assignedPersonnelBarangay = defaultOfficer.barangay || "";
      migrated = true;
    }
    if (report.evidencePhoto && !report.evidencePhotos) {
      report.evidencePhotos = [report.evidencePhoto];
      migrated = true;
    }
    if (!report.messages) {
      report.messages = [];
      migrated = true;
    }
  });
  if (migrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
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
    : "Register as a resident to continue.";
}

function toggleGatePasswordVisibility() {
  togglePasswordVisibility(
    "gateLoginPass",
    document.getElementById("gateLoginPassToggle"),
  );
}

function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  const isVisible = input.type === "text";
  input.type = isVisible ? "password" : "text";
  button.textContent = isVisible ? "Show" : "Hide";
  button.setAttribute("aria-pressed", String(!isVisible));
}

function fillGateDemo(role) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  let account;
  if (role === "admin") {
    account = users.find((user) => user.role === "admin");
  } else {
    account = users.find(
      (user) => user.id === "demo-resident" && user.isDemoAccount === true,
    );
    if (!account) {
      if (
        users.some(
          (user) =>
            user.id === "demo-resident" ||
            normalizeContact(user.contactNumber) === "09000000001",
        )
      ) {
        alert("The demo resident account details are already in use.");
        return;
      }
      account = {
        id: "demo-resident",
        pass: "resident123",
        name: "Demo Resident",
        contactNumber: "09000000001",
        barangay: "Isok 1 (Poblacion)",
        role: "resident",
        isDemoAccount: true,
      };
      users.push(account);
      saveUsers(users);
    }
  }
  if (!account) {
    alert("No demo account is available for this role.");
    return;
  }
  document.getElementById("gateLoginId").value =
    account.email || account.contactNumber || account.id;
  document.getElementById("gateLoginPass").value = account.pass || "";
}

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

async function hashPassword(password, saltValue) {
  if (!crypto?.subtle) {
    throw new Error(
      "Secure password hashing is unavailable in this browser context.",
    );
  }
  const salt = saltValue
    ? Uint8Array.from(atob(saltValue), (character) => character.charCodeAt(0))
    : crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS },
    material,
    256,
  );
  return { salt: bytesToBase64(salt), hash: bytesToBase64(hash) };
}

async function verifyPassword(password, user) {
  if (!user.passwordHash || !user.passwordSalt) return false;
  const { hash } = await hashPassword(password, user.passwordSalt);
  return hash === user.passwordHash;
}

function normalizeContact(value) {
  return String(value || "")
    .replace(/[\s()-]/g, "")
    .toLowerCase();
}

function hasDuplicateIdentifier(users, identifier) {
  const normalized = normalizeContact(identifier);
  return users.some((user) =>
    [user.id, user.email, user.contactNumber].some(
      (value) => value && normalizeContact(value) === normalized,
    ),
  );
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function getCurrentUser() {
  const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  if (!session) return null;
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  const user = users.find(
    (account) => account.id === (session.userId || session.id),
  );
  return user && user.status !== "inactive" ? user : null;
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function handleGateLogin(event) {
  event.preventDefault();
  const identifier = document.getElementById("gateLoginId").value.trim();
  const password = document.getElementById("gateLoginPass").value;
  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  const account = users.find((user) => {
    const candidate = identifier.toLowerCase();
    return (
      user.id?.toLowerCase() === candidate ||
      user.email?.toLowerCase() === candidate ||
      normalizeContact(user.contactNumber) === normalizeContact(identifier)
    );
  });
  const validPassword =
    account?.pass === password ||
    (account?.passwordHash && (await verifyPassword(password, account)));
  if (!account || !validPassword) {
    alert("Invalid email/phone number or password.");
    return;
  }
  if (account.status === "inactive") {
    alert("This account is inactive. Contact an LGU Admin for assistance.");
    return;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(account));
  document.getElementById("authGateModal").classList.add("hidden");
  updateRoleView();
}

function handleGateRegister(event) {
  event.preventDefault();
  const name = document.getElementById("gateRegName").value.trim();
  const id = document.getElementById("gateRegPhone").value.trim();
  const barangay = document.getElementById("gateRegBrgy").value;
  const pass = document.getElementById("gateRegPass").value;
  if (!name || !id || !barangay || pass.length < 6) {
    alert(
      "Please complete all fields and use a password with at least 6 characters.",
    );
    return;
  }

  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  if (hasDuplicateIdentifier(users, id)) {
    alert("An account already uses this phone number or email address.");
    return;
  }

  users.push({ id, pass, name, barangay, role: "resident" });
  saveUsers(users);
  document.getElementById("gateRegisterForm").reset();
  toggleAuthGateTab("login");
  document.getElementById("gateLoginId").value = id;
  alert("Resident account created. You can now sign in.");
}

function handleLogout() {
  clearSession();
  document.getElementById("authGateModal").classList.remove("hidden");
  updateRoleView();
}

function checkSession() {
  const user = getCurrentUser();
  if (user) {
    document.getElementById("authGateModal").classList.add("hidden");
    updateRoleView();
  } else {
    clearSession();
    updateRoleView();
  }
}

function updateRoleView() {
  const user = getCurrentUser();
  const roleNav = document.getElementById("roleNavLinks");
  const authHeaderNav = document.getElementById("authHeaderNav");
  const portalBadge = document.getElementById("portalBadge");
  const heroTitle = document.getElementById("hero-title");
  const heroSubtitle = document.getElementById("hero-subtitle");

  if (!user) {
    clearSession();
    roleNav.innerHTML = "";
    authHeaderNav.innerHTML = "";
    portalBadge.classList.add("hidden");
    document.getElementById("authGateModal").classList.remove("hidden");
    return;
  }

  const isAdmin = user.role === "admin";
  const isResident = isResidentRole(user.role);
  if (!isAdmin && !isResident) {
    clearSession();
    roleNav.innerHTML = "";
    authHeaderNav.innerHTML = "";
    document.getElementById("authGateModal").classList.remove("hidden");
    return;
  }
  const roleLabel = getProfileRoleLabel(user.role);
  updateNotificationBadge();
  portalBadge.classList.toggle("hidden", !isAdmin);
  heroTitle.textContent = isAdmin
    ? "Manage community reports"
    : "Report a concern in your barangay";
  heroSubtitle.textContent = isAdmin
    ? "Review incoming reports, filter by status or barangay, and keep residents informed with timely updates."
    : "Tell us what needs attention. Submit a report, keep your tracking code, and check for status updates here.";

  authHeaderNav.innerHTML = `
    <div class="account-panel">
      <button type="button" onclick="openProfile()" class="account-profile-button" title="Edit Profile" aria-label="Edit profile for ${escapeHtml(user.name || "User")}, ${escapeHtml(roleLabel)}">
        <span class="header-avatar" aria-hidden="true">
          <span class="avatar-fallback"><i class="fa-solid fa-user"></i></span>
          ${getStoredProfilePhoto(user) ? `<img src="${getStoredProfilePhoto(user)}" alt="" />` : ""}
        </span>
        <span class="account-identity">
          <span class="account-name">${escapeHtml(user.name || "User")}</span>
          <span class="account-type">${escapeHtml(roleLabel)}</span>
        </span>
        <i class="fa-solid fa-pen-to-square account-edit-icon" aria-hidden="true"></i>
      </button>
      <div class="account-actions">
        <button type="button" onclick="handleLogout()" class="account-button logout-action"><i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i><span>Log out</span></button>
      </div>
    </div>
  `;
  const headerAvatar = authHeaderNav.querySelector(".header-avatar img");
  if (headerAvatar) {
    headerAvatar.addEventListener("error", () => {
      headerAvatar.hidden = true;
      headerAvatar.previousElementSibling.classList.remove("hidden");
    });
  }

  if (isResident) {
    roleNav.innerHTML = `
                    <button type="button" id="mobileNavToggle" class="mobile-nav-toggle" aria-expanded="false" aria-controls="primaryNavLinks" onclick="toggleMobileNavigation()"><i class="fa-solid fa-bars" aria-hidden="true"></i><span>Menu</span></button>
                    <div id="primaryNavLinks" class="primary-nav-links">
                    <button type="button" onclick="switchTab('submit')" id="nav-submit" class="nav-btn min-h-11 flex-1 justify-center whitespace-nowrap px-3 sm:px-3.5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 bg-emerald-800 text-white">
                        <i class="fa-solid fa-pen-to-square"></i> Submit Complaint
                    </button>
                    <button type="button" onclick="switchTab('track')" id="nav-track" class="nav-btn min-h-11 flex-1 justify-center whitespace-nowrap px-3 sm:px-3.5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 text-emerald-100 hover:bg-emerald-800">
                        <i class="fa-solid fa-magnifying-glass"></i> Track Status
                    </button>
                    <button type="button" onclick="switchTab('mine')" id="nav-mine" class="nav-btn min-h-11 flex-1 justify-center whitespace-nowrap px-3 sm:px-3.5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 text-emerald-100 hover:bg-emerald-800">
                        <i class="fa-solid fa-folder-open"></i> My Complaints
                    </button>
                    <button type="button" onclick="switchTab('notifications')" id="nav-notifications" class="nav-btn min-h-11 flex-1 justify-center whitespace-nowrap px-3 sm:px-3.5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 text-emerald-100 hover:bg-emerald-800">
                        <i class="fa-solid fa-bell"></i> Notifications <span id="notificationCount" class="hidden rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-emerald-950"></span>
                    </button>
                    </div>
                `;
    document.getElementById("citizenName").value = user.name;
    document.getElementById("citizenName").readOnly = true;
    document.getElementById("citizenContact").value =
      user.contactNumber || user.email || "";
    document.getElementById("citizenContact").readOnly = true;
    document.getElementById("barangaySelect").value = user.barangay;
    switchTab("submit");
  } else if (user.role === "admin") {
    roleNav.innerHTML = `
                    <button type="button" id="mobileNavToggle" class="mobile-nav-toggle" aria-expanded="false" aria-controls="primaryNavLinks" onclick="toggleMobileNavigation()"><i class="fa-solid fa-bars" aria-hidden="true"></i><span>Menu</span></button>
                    <div id="primaryNavLinks" class="primary-nav-links">
                    <button type="button" onclick="switchTab('admin')" id="nav-admin" class="nav-btn min-h-11 flex-1 justify-center whitespace-nowrap px-3 sm:px-3.5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 bg-emerald-800 text-white">
                        <i class="fa-solid fa-chart-line"></i> Admin Dashboard
                    </button>
                    <button type="button" onclick="switchTab('notifications')" id="nav-notifications" class="nav-btn min-h-11 flex-1 justify-center whitespace-nowrap px-3 sm:px-3.5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 text-emerald-100 hover:bg-emerald-800">
                        <i class="fa-solid fa-bell"></i> Notifications <span id="notificationCount" class="hidden rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-emerald-950"></span>
                    </button>
                    </div>
                `;
    switchTab("admin");
  }
}

function isResidentRole(role) {
  return role === "resident" || role === "citizen";
}

function getProfileRoleLabel(role) {
  if (role === "admin") return "LGU Admin";
  if (role === "citizen" || role === "resident") return "Resident";
  return String(role || "User")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function switchTab(tab) {
  const user = getCurrentUser();
  const roleNav = document.getElementById("roleNavLinks");
  if (
    !user ||
    (user.role === "admin" && !["admin", "notifications"].includes(tab))
  ) {
    alert("This dashboard is not available for your account.");
    if (user?.role === "admin") switchTab("admin");
    return;
  }
  if (tab === "admin" && !isAdmin()) {
    alert(
      "⛔ UNAUTHORIZED ACCESS!\n\nAng Admin Dashboard ay para lamang sa mga opisyal na LGU Administrative Officers.",
    );
    return;
  }
  if (["submit", "track", "mine"].includes(tab) && !isResidentRole(user.role)) {
    alert("Resident pages are only available to resident accounts.");
    switchTab("admin");
    return;
  }
  if (tab === "mine" && !isResidentRole(user.role)) return;

  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("bg-emerald-800", "text-white");
    btn.classList.add("text-emerald-100", "hover:bg-emerald-800");
  });
  const activeBtn = document.getElementById(`nav-${tab}`);
  if (activeBtn) {
    activeBtn.classList.remove("text-emerald-100", "hover:bg-emerald-800");
    activeBtn.classList.add("bg-emerald-800", "text-white");
  }

  roleNav.classList.remove("is-open");
  document
    .getElementById("mobileNavToggle")
    ?.setAttribute("aria-expanded", "false");
  if (tab === "admin") {
    renderAdminTable();
  }
  if (tab === "mine") renderMyReports();
  if (tab === "notifications") renderNotifications();
}

function toggleMobileNavigation() {
  const nav = document.getElementById("roleNavLinks");
  const toggle = document.getElementById("mobileNavToggle");
  const isOpen = nav.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(isOpen));
}

function openProfile() {
  const user = getCurrentUser();
  if (!user) return;

  profileDraft = {
    name: user.name || "",
    email: user.email || "",
    barangay: user.barangay || "",
    profilePhoto: getStoredProfilePhoto(user) || "",
    profilePhotoChanged: false,
  };
  document.getElementById("profileName").value = profileDraft.name;
  document.getElementById("profileDisplayName").textContent =
    user.name || "Your profile";
  document.getElementById("profileEmail").value = profileDraft.email;
  document.getElementById("profileContact").value =
    user.contactNumber || user.id || "";
  document.getElementById("profileRole").textContent = getProfileRoleLabel(
    user.role,
  );
  const canEditBarangay = ["citizen", "resident"].includes(user.role);
  document
    .getElementById("profileBarangayField")
    .classList.toggle("hidden", !canEditBarangay);
  const barangaySelect = document.getElementById("profileBarangay");
  barangaySelect.required = canEditBarangay;
  barangaySelect.value = profileDraft.barangay;
  document.getElementById("profilePhotoInput").value = "";
  setProfileFeedback("");
  renderProfilePhotoPreview(profileDraft.profilePhoto);
  const modal = document.getElementById("profileModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeProfile() {
  const modal = document.getElementById("profileModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  profileDraft = null;
}

function updateProfileDraft() {
  if (!profileDraft) return;
  profileDraft.name = document.getElementById("profileName").value;
  profileDraft.email = document.getElementById("profileEmail").value;
  profileDraft.barangay = document.getElementById("profileBarangay").value;
}

function saveProfile(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user || !profileDraft) return;
  updateProfileDraft();
  const activeTab = document.querySelector(".tab-content.active")?.id;
  const name = profileDraft.name.trim();
  const email = profileDraft.email.trim().toLowerCase();
  if (!name) {
    setProfileFeedback("Ilagay ang buong pangalan bago mag-save.", true);
    document.getElementById("profileName").focus();
    return;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setProfileFeedback("Ilagay ang valid na email address.", true);
    document.getElementById("profileEmail").focus();
    return;
  }

  const updatedUser = {
    ...user,
    name,
    email,
    barangay: ["citizen", "resident"].includes(user.role)
      ? profileDraft.barangay
      : user.barangay,
  };
  if (profileDraft.profilePhotoChanged) {
    if (profileDraft.profilePhoto) {
      updatedUser.profilePhoto = profileDraft.profilePhoto;
    } else {
      delete updatedUser.profilePhoto;
    }
  }
  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  const userIndex = users.findIndex((account) => account.id === user.id);
  if (userIndex < 0) {
    setProfileFeedback(
      "Hindi ma-save ang profile dahil hindi makita ang account. Mag-log in muli.",
      true,
    );
    return;
  }
  if (
    email &&
    users.some(
      (account, index) =>
        index !== userIndex && account.email?.toLowerCase() === email,
    )
  ) {
    setProfileFeedback(
      "May account na gumagamit ng email address na ito.",
      true,
    );
    return;
  }

  const updatedAccount = { ...users[userIndex], ...updatedUser };
  if (profileDraft.profilePhotoChanged && !profileDraft.profilePhoto) {
    delete updatedAccount.profilePhoto;
  }
  users[userIndex] = updatedAccount;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  if (isResidentRole(updatedUser.role)) {
    document.getElementById("citizenName").value = updatedAccount.name;
    document.getElementById("citizenContact").value =
      updatedAccount.contactNumber || updatedAccount.id || "";
    document.getElementById("barangaySelect").value = updatedAccount.barangay;
  }
  updateRoleView();
  if (activeTab) switchTab(activeTab.replace("tab-", ""));
  profileDraft = {
    name: updatedAccount.name || "",
    email: updatedAccount.email || "",
    barangay: updatedAccount.barangay || "",
    profilePhoto: getStoredProfilePhoto(updatedAccount) || "",
    profilePhotoChanged: false,
  };
  document.getElementById("profileDisplayName").textContent =
    updatedAccount.name || "Your profile";
  renderProfilePhotoPreview(getStoredProfilePhoto(updatedAccount) || "");
  setProfileFeedback("Na-save ang profile mo.");
}

function cancelProfileEdit() {
  closeProfile();
}

function setProfileFeedback(message, isError = false) {
  const feedback = document.getElementById("profileFeedback");
  feedback.textContent = message;
  feedback.classList.toggle("hidden", !message);
  feedback.classList.toggle("text-rose-700", isError);
  feedback.classList.toggle("text-emerald-700", Boolean(message) && !isError);
  feedback.setAttribute("role", isError ? "alert" : "status");
}

function getStoredProfilePhoto(user) {
  const photo = user?.profilePhoto;
  return typeof photo === "string" &&
    photo.length <= 700000 &&
    /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo)
    ? photo
    : "";
}

function renderProfilePhotoPreview(photo) {
  const image = document.getElementById("profileAvatarPreview");
  const fallback = document.getElementById("profileAvatarFallback");
  const removeButton = document.getElementById("removeProfilePhotoButton");
  if (photo) {
    image.src = photo;
    image.classList.remove("hidden");
    fallback.classList.add("hidden");
    removeButton.classList.remove("hidden");
    image.onerror = () => {
      image.removeAttribute("src");
      image.classList.add("hidden");
      fallback.classList.remove("hidden");
      removeButton.classList.add("hidden");
    };
  } else {
    image.removeAttribute("src");
    image.classList.add("hidden");
    fallback.classList.remove("hidden");
    removeButton.classList.add("hidden");
  }
}

function handleProfilePhotoSelection(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const draft = profileDraft;
  if (!draft) return;

  const extension = file.name.split(".").pop()?.toLowerCase();
  const validExtensions = ["jpg", "jpeg", "png", "webp"];
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (
    !validExtensions.includes(extension) ||
    (file.type && !validTypes.includes(file.type.toLowerCase()))
  ) {
    event.target.value = "";
    setProfileFeedback("Pumili ng JPG, JPEG, PNG, o WEBP na image.", true);
    return;
  }
  if (file.size > MAX_PROFILE_PHOTO_BYTES) {
    event.target.value = "";
    setProfileFeedback(
      "Lumampas sa 5 MB ang photo. Pumili ng mas maliit na file.",
      true,
    );
    return;
  }

  setProfileFeedback("");
  prepareProfilePhoto(file)
    .then((photo) => {
      if (profileDraft !== draft) return;
      draft.profilePhoto = photo;
      draft.profilePhotoChanged = true;
      renderProfilePhotoPreview(photo);
    })
    .catch((error) => {
      if (profileDraft !== draft) return;
      event.target.value = "";
      setProfileFeedback(error.message, true);
    });
}

function prepareProfilePhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Hindi mabasa ang photo file."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () =>
        reject(new Error("Hindi ma-process ang photo na ito."));
      image.onload = () => {
        const maxDimension = 480;
        const scale = Math.min(
          1,
          maxDimension / Math.max(image.width, image.height),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Hindi ma-process ang photo sa browser na ito."));
          return;
        }
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressedPhoto = canvas.toDataURL("image/jpeg", 0.72);
        if (compressedPhoto.length > 700000) {
          reject(
            new Error(
              "Masyadong malaki ang photo pagkatapos i-compress. Pumili ng mas maliit na larawan.",
            ),
          );
          return;
        }
        resolve(compressedPhoto);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function removeProfilePhoto() {
  if (!profileDraft?.profilePhoto) return;
  if (!confirm("Alisin ang profile photo na ito?")) return;
  profileDraft.profilePhoto = "";
  profileDraft.profilePhotoChanged = true;
  document.getElementById("profilePhotoInput").value = "";
  renderProfilePhotoPreview("");
  setProfileFeedback("Aalisin ang photo kapag pinili mo ang Save Changes.");
}

function openAdminAccountModal() {
  if (!isAdmin()) {
    alert("Admin access is required to create officer accounts.");
    return;
  }
  document.getElementById("adminAccountForm").reset();
  setAdminAccountFeedback("");
  const modal = document.getElementById("adminAccountModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeAdminAccountModal() {
  const modal = document.getElementById("adminAccountModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function setAdminAccountFeedback(message, isError = false) {
  const feedback = document.getElementById("adminAccountFeedback");
  feedback.textContent = message;
  feedback.classList.toggle("hidden", !message);
  feedback.classList.toggle("text-rose-700", isError);
  feedback.classList.toggle("text-emerald-700", Boolean(message) && !isError);
  feedback.setAttribute("role", isError ? "alert" : "status");
}

function createAdminAccount(event) {
  event.preventDefault();
  if (!isAdmin()) {
    closeAdminAccountModal();
    alert("Admin access is required to create officer accounts.");
    return;
  }

  const name = document.getElementById("adminOfficerName").value.trim();
  const identifier = document
    .getElementById("adminOfficerContact")
    .value.trim();
  const barangay = document.getElementById("adminOfficerBarangay").value;
  const pass = document.getElementById("adminOfficerPassword").value;
  if (!name || !identifier || !barangay || pass.length < 6) {
    setAdminAccountFeedback(
      "Complete all fields and use a password with at least 6 characters.",
      true,
    );
    return;
  }

  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  if (hasDuplicateIdentifier(users, identifier)) {
    setAdminAccountFeedback(
      "An account already uses this mobile number or email.",
      true,
    );
    return;
  }

  users.push({ id: identifier, pass, name, barangay, role: "admin" });
  saveUsers(users);

  document.getElementById("adminAccountForm").reset();
  setAdminAccountFeedback(
    "Nagawa ang LGU Admin Officer account. Maaari na siyang mag-sign in gamit ang inilagay na contact at password.",
  );
}

function renderMyReports() {
  const user = getCurrentUser();
  if (!isResidentRole(user?.role)) return;
  const reports = getReports().filter((report) =>
    isReportOwnedBy(report, user),
  );
  const container = document.getElementById("myReportsList");
  container.innerHTML = reports.length
    ? reports
        .map(
          (report) => `
            <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p class="font-mono text-sm font-bold text-emerald-800">${escapeHtml(report.id)}</p>
                  <h3 class="mt-1 font-semibold text-slate-900">${escapeHtml(report.category)}</h3>
                  <p class="mt-1 text-sm text-slate-600">Brgy. ${escapeHtml(report.barangay)} · Filed ${escapeHtml(report.date)}</p>
                </div>
                <span class="inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(report.status)}">${escapeHtml(report.status)}</span>
              </div>
              <p class="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">${escapeHtml(report.description)}</p>
              <p class="mt-3 text-xs font-semibold text-slate-600">Assigned personnel: ${escapeHtml(getAssignedPersonnelLabel(report) || "Awaiting verification and assignment")}</p>
              ${report.rejectionReason ? `<p class="mt-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800"><strong>Reason:</strong> ${escapeHtml(report.rejectionReason)}</p>` : ""}
              ${renderReportPhotos(report.evidencePhotos || (report.evidencePhoto ? [report.evidencePhoto] : []), "Submitted evidence")}
              ${renderReportPhotos(report.resolutionPhotos || [], "Resolution proof")}
              ${renderReportConversation(report, user)}
            </article>
          `,
        )
        .join("")
    : `<div class="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
         <i class="fa-solid fa-inbox text-3xl text-slate-300" aria-hidden="true"></i>
         <h3 class="mt-3 font-semibold text-slate-800">Wala ka pang naisusumiteng complaint</h3>
         <p class="mt-1 text-sm text-slate-500">Kapag nagsumite ka, makikita rito ang tracking code at status nito.</p>
         <button type="button" onclick="switchTab('submit')" class="mt-4 min-h-11 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900">Submit a complaint</button>
       </div>`;
}

function isReportOwnedBy(report, user) {
  return report.ownerId
    ? report.ownerId === user.id
    : report.contact === (user.contactNumber || user.id);
}

function getAssignedPersonnelLabel(report) {
  if (!report.assignedPersonnelName) return "";
  return report.assignedPersonnelBarangay
    ? `${report.assignedPersonnelName} · Brgy. ${report.assignedPersonnelBarangay}`
    : report.assignedPersonnelName;
}

function renderReportPhotos(photos, label) {
  const validPhotos = photos.filter(isStoredEvidencePhoto);
  if (!validPhotos.length) return "";
  return `<div class="mt-4"><h4 class="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">${escapeHtml(label)}</h4><div class="grid grid-cols-3 gap-2">${validPhotos.map((photo, index) => `<button type="button" onclick="openEvidenceViewer('${photo}')" class="overflow-hidden rounded-lg border border-slate-200" aria-label="View ${escapeHtml(label.toLowerCase())} photo ${index + 1}"><img src="${photo}" alt="${escapeHtml(label)} photo ${index + 1}" class="h-24 w-full object-cover"></button>`).join("")}</div></div>`;
}

function isStoredEvidencePhoto(photo) {
  return (
    typeof photo === "string" &&
    /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo)
  );
}

function renderReportConversation(report, user) {
  const messages = report.messages || [];
  return `<section class="mt-4 border-t border-slate-200 pt-4">
    <h4 class="font-semibold text-slate-800">Complaint updates and messages</h4>
    <div class="mt-3 space-y-2">${messages.length ? messages.map((message) => `<article class="rounded-lg ${message.authorId === user.id ? "bg-emerald-50" : "bg-slate-50"} p-3"><p class="text-xs font-semibold text-slate-700">${escapeHtml(message.authorName)} · ${escapeHtml(new Date(message.createdAt).toLocaleString())}</p><p class="mt-1 whitespace-pre-wrap text-sm text-slate-700">${escapeHtml(message.text)}</p></article>`).join("") : '<p class="text-sm text-slate-500">No messages yet.</p>'}</div>
    ${report.status !== "Rejected" ? `<form onsubmit="sendComplaintMessage(event, '${escapeHtml(report.id)}')" class="mt-3 flex flex-col gap-2 sm:flex-row"><label class="sr-only" for="message-${escapeHtml(report.id)}">Message about this complaint</label><textarea id="message-${escapeHtml(report.id)}" maxlength="1000" required rows="2" class="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Ask a question or share an update"></textarea><button type="submit" class="min-h-10 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900">Send message</button></form>` : ""}
  </section>`;
}

function getNotifications() {
  const notifications = JSON.parse(
    localStorage.getItem(NOTIFICATIONS_KEY) || "[]",
  );
  if (!Array.isArray(notifications))
    throw new Error("Stored notifications are invalid.");
  return notifications;
}

function addNotification(userId, title, body, reportId) {
  const notifications = getNotifications();
  notifications.unshift({
    id: crypto.randomUUID(),
    userId,
    title,
    body,
    reportId,
    createdAt: new Date().toISOString(),
    read: false,
  });
  try {
    localStorage.setItem(
      NOTIFICATIONS_KEY,
      JSON.stringify(notifications.slice(0, 300)),
    );
  } catch (error) {
    console.error("Unable to save a complaint notification.", error);
    alert(
      "The complaint was saved, but its notification could not be stored in this browser.",
    );
  }
  updateNotificationBadge();
}

function notifyResident(report, title, body) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  const recipient =
    users.find((user) => user.id === report.ownerId) ||
    users.find((user) => (user.contactNumber || user.id) === report.contact);
  if (recipient) addNotification(recipient.id, title, body, report.id);
}

function notifyOfficials(title, body, reportId) {
  JSON.parse(localStorage.getItem(USERS_KEY) || "[]")
    .filter((user) => user.role === "admin")
    .forEach((user) => addNotification(user.id, title, body, reportId));
}

function updateNotificationBadge() {
  const user = getCurrentUser();
  const badge = document.getElementById("notificationCount");
  if (!badge || !user) return;
  const unread = getNotifications().filter(
    (item) => item.userId === user.id && !item.read,
  ).length;
  badge.textContent = unread > 99 ? "99+" : String(unread);
  badge.classList.toggle("hidden", unread === 0);
}

function renderNotifications() {
  const user = getCurrentUser();
  const container = document.getElementById("notificationsList");
  if (!user || !container) return;
  const notifications = getNotifications().filter(
    (item) => item.userId === user.id,
  );
  container.innerHTML = notifications.length
    ? notifications
        .map(
          (item) =>
            `<article class="rounded-xl border ${item.read ? "border-slate-200 bg-white" : "border-emerald-200 bg-emerald-50"} p-4 shadow-sm"><div class="flex items-start justify-between gap-3"><div><h3 class="font-semibold text-slate-900">${escapeHtml(item.title)}</h3><p class="mt-1 text-sm text-slate-600">${escapeHtml(item.body)}</p><p class="mt-2 text-xs text-slate-500">${escapeHtml(new Date(item.createdAt).toLocaleString())}</p></div>${item.reportId ? `<button type="button" onclick="openNotificationReport('${escapeHtml(item.reportId)}')" class="shrink-0 rounded-lg border border-emerald-700 px-3 py-2 text-xs font-semibold text-emerald-800">View complaint</button>` : ""}</div></article>`,
        )
        .join("")
    : '<div class="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">You are all caught up. New complaint updates will appear here.</div>';
  updateNotificationBadge();
}

function markNotificationsRead() {
  const user = getCurrentUser();
  if (!user) return;
  const notifications = getNotifications().map((item) =>
    item.userId === user.id ? { ...item, read: true } : item,
  );
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  renderNotifications();
}

function openNotificationReport(reportId) {
  const user = getCurrentUser();
  const report = getReports().find((item) => item.id === reportId);
  if (!user || !report) return;
  if (isAdmin()) {
    switchTab("admin");
    openReportViewer(reportId);
  } else if (isReportOwnedBy(report, user)) {
    switchTab("mine");
  }
}

function sendComplaintMessage(event, reportId) {
  event.preventDefault();
  const user = getCurrentUser();
  const reports = getReports();
  const report = reports.find((item) => item.id === reportId);
  if (!user || !report || report.status === "Rejected") return;
  if (!isAdmin() && !isReportOwnedBy(report, user)) return;
  if (
    isAdmin() &&
    report.assignedPersonnelId &&
    report.assignedPersonnelId !== user.id
  ) {
    alert("Only the assigned personnel can message this resident.");
    return;
  }
  const input = document.getElementById(`message-${reportId}`);
  const text = input.value.trim();
  if (!text) return;
  report.messages = report.messages || [];
  report.messages.push({
    authorId: user.id,
    authorName: user.name,
    text,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  if (isAdmin()) {
    notifyResident(
      report,
      "New message from barangay personnel",
      `${user.name}: ${text.slice(0, 140)}`,
    );
  } else {
    const recipientIds = report.assignedPersonnelId
      ? [report.assignedPersonnelId]
      : JSON.parse(localStorage.getItem(USERS_KEY) || "[]")
          .filter((account) => account.role === "admin")
          .map((account) => account.id);
    recipientIds.forEach((id) =>
      addNotification(
        id,
        "New resident message",
        `${user.name}: ${text.slice(0, 140)}`,
        report.id,
      ),
    );
  }
  if (isAdmin()) openReportViewer(report.id);
  else renderMyReports();
}

function handleCrossTabUpdate(event) {
  if (![STORAGE_KEY, NOTIFICATIONS_KEY].includes(event.key)) return;
  if (isAdmin()) renderAdminTable();
  renderMyReports();
  renderNotifications();
  if (activeReportId && isAdmin()) openReportViewer(activeReportId);
}

function prepareEvidencePhoto(file) {
  if (!file)
    return Promise.reject(new Error("Attach at least one evidence photo."));
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Promise.reject(new Error("Choose a JPEG, PNG, or WebP image."));
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
          const maxDimension = 1000;
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
          resolve(canvas.toDataURL("image/jpeg", 0.68));
        } catch {
          reject(new Error("The evidence photo could not be processed."));
        }
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function handleEvidenceSelection(event) {
  const input = event.currentTarget;
  const files = [...input.files];
  const feedback = document.getElementById("evidenceFeedback");
  if (files.length > MAX_EVIDENCE_PHOTOS) {
    input.value = "";
    feedback.textContent = `Choose no more than ${MAX_EVIDENCE_PHOTOS} evidence photos.`;
    feedback.classList.remove("hidden");
    renderEvidencePreviews();
    return;
  }
  const invalidFile = files.find(
    (file) =>
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024,
  );
  if (invalidFile) {
    input.value = "";
    feedback.textContent =
      "Choose JPG, PNG, or WebP images no larger than 10 MB each.";
    feedback.classList.remove("hidden");
    renderEvidencePreviews();
    return;
  }
  feedback.textContent = "";
  feedback.classList.add("hidden");
  renderEvidencePreviews();
}

function renderEvidencePreviews() {
  const input = document.getElementById("evidencePhoto");
  const container = document.getElementById("evidencePreview");
  if (!input || !container) return;
  container
    .querySelectorAll("img")
    .forEach((image) => URL.revokeObjectURL(image.src));
  container.innerHTML = [...input.files]
    .map((file, index) => {
      const src = URL.createObjectURL(file);
      return `<article class="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"><img src="${src}" alt="Selected evidence ${index + 1}" class="h-28 w-full object-cover"><button type="button" onclick="removeEvidencePhoto(${index})" class="absolute right-1 top-1 rounded-full bg-white px-2 py-1 text-xs font-bold text-rose-700 shadow">Remove</button></article>`;
    })
    .join("");
}

function removeEvidencePhoto(index) {
  const input = document.getElementById("evidencePhoto");
  const transfer = new DataTransfer();
  [...input.files].forEach((file, fileIndex) => {
    if (fileIndex !== index) transfer.items.add(file);
  });
  input.files = transfer.files;
  renderEvidencePreviews();
}

function renderResolutionPreviews() {
  const input = document.getElementById("resolutionPhotos");
  const container = document.getElementById("resolutionPreview");
  const files = [...input.files];
  if (
    files.length > MAX_EVIDENCE_PHOTOS ||
    files.some(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 10 * 1024 * 1024,
    )
  ) {
    input.value = "";
    container.innerHTML =
      '<p class="text-sm text-rose-700">Choose up to 5 JPG, PNG, or WebP images (10 MB max each).</p>';
    return;
  }
  container
    .querySelectorAll("img")
    .forEach((image) => URL.revokeObjectURL(image.src));
  container.innerHTML = files
    .map(
      (file) =>
        `<img src="${URL.createObjectURL(file)}" alt="Resolution proof preview" class="h-20 w-full rounded-lg border border-slate-200 object-cover">`,
    )
    .join("");
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const user = getCurrentUser();
  if (!isResidentRole(user?.role)) {
    alert("Only signed-in residents can submit complaints.");
    return;
  }
  const form = e.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const evidenceFiles = [...document.getElementById("evidencePhoto").files];
  if (!evidenceFiles.length || evidenceFiles.length > MAX_EVIDENCE_PHOTOS) {
    alert("Attach between 1 and 5 evidence photos before submitting.");
    return;
  }
  submitButton.disabled = true;

  let evidencePhotos;
  try {
    evidencePhotos = await Promise.all(evidenceFiles.map(prepareEvidencePhoto));
  } catch (error) {
    alert(error.message);
    submitButton.disabled = false;
    return;
  }

  const db = getReports();
  let code;
  do {
    code = `BOAC-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  } while (db.some((report) => report.id === code));
  const newRecord = {
    id: code,
    ownerId: user.id,
    name: user.name,
    contact: user.contactNumber || user.email,
    barangay: document.getElementById("barangaySelect").value,
    category: document.getElementById("categorySelect").value,
    description: document.getElementById("descriptionInput").value,
    evidencePhotos,
    messages: [],
    date: new Date().toISOString().split("T")[0],
    status: "Pending Verification",
  };

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

  notifyOfficials(
    "New complaint submitted",
    `${user.name} submitted ${code} for verification.`,
    code,
  );
  renderAdminTable();
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
  const user = getCurrentUser();
  if (!isResidentRole(user?.role)) return;
  const code = document.getElementById("trackInput").value.trim().toUpperCase();
  const db = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  const match = db.find(
    (item) =>
      String(item.id || "").toUpperCase() === code &&
      isReportOwnedBy(item, user),
  );
  const container = document.getElementById("trackResultContainer");
  container.classList.remove("hidden");

  if (!match) {
    container.innerHTML = `<div class="p-4 bg-red-50 text-red-700 text-xs rounded-lg text-center font-bold">Code not found or unavailable for this account.</div>`;
    return;
  }

  container.innerHTML = `
    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <p class="font-mono font-bold text-emerald-800">${escapeHtml(match.id)}</p>
        <span class="inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(match.status)}">${escapeHtml(match.status)}</span>
      </div>
      <div class="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <p><strong>Barangay:</strong> Brgy. ${escapeHtml(match.barangay)}</p>
        <p><strong>Category:</strong> ${escapeHtml(match.category)}</p>
        <p><strong>Assigned personnel:</strong> ${escapeHtml(getAssignedPersonnelLabel(match) || "Awaiting verification")}</p>
        <p><strong>Filed:</strong> ${escapeHtml(match.date)}</p>
        <p class="sm:col-span-2"><strong>Details:</strong> ${escapeHtml(match.description)}</p>
        ${match.rejectionReason ? `<p class="sm:col-span-2 rounded-lg bg-rose-50 p-3 text-rose-800"><strong>Rejection reason:</strong> ${escapeHtml(match.rejectionReason)}</p>` : ""}
      </div>
      ${renderReportPhotos(match.evidencePhotos || (match.evidencePhoto ? [match.evidencePhoto] : []), "Submitted evidence")}
      ${renderReportPhotos(match.resolutionPhotos || [], "Resolution proof")}
      ${renderReportConversation(match, user)}
    </article>
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
    .getElementById("reportViewerModal")
    .addEventListener("click", (event) => {
      if (event.target.id === "reportViewerModal") closeReportViewer();
    });
  document
    .getElementById("evidenceViewerModal")
    .addEventListener("click", (event) => {
      if (event.target.id === "evidenceViewerModal") closeEvidenceViewer();
    });
  document
    .getElementById("profileForm")
    .addEventListener("input", updateProfileDraft);
  document
    .getElementById("profileForm")
    .addEventListener("change", updateProfileDraft);
  document.getElementById("profileModal").addEventListener("click", (event) => {
    if (event.target.id === "profileModal") closeProfile();
  });
  document
    .getElementById("adminAccountModal")
    .addEventListener("click", (event) => {
      if (event.target.id === "adminAccountModal") closeAdminAccountModal();
    });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeEvidenceViewer();
      closeReportViewer();
      closeProfile();
      closeAdminAccountModal();
    }
  });
}

function getReports() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function statusBadgeClass(status) {
  const classes = {
    "Pending Verification": "bg-amber-100 text-amber-900",
    Verified: "bg-indigo-100 text-indigo-900",
    Assigned: "bg-violet-100 text-violet-900",
    "In Progress": "bg-sky-100 text-sky-900",
    Resolved: "bg-emerald-100 text-emerald-900",
    Rejected: "bg-rose-100 text-rose-900",
  };
  return classes[status] || "bg-slate-100 text-slate-700";
}

function priorityBadgeClass(priority) {
  const classes = {
    Urgent: "bg-rose-100 text-rose-900",
    High: "bg-orange-100 text-orange-900",
    Normal: "bg-sky-100 text-sky-900",
    Low: "bg-slate-100 text-slate-700",
  };
  return classes[priority] || classes.Normal;
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
  if (!isAdmin()) return;
  const db = getReports();
  const tbody = document.getElementById("adminTableBody");
  document.getElementById("statTotal").textContent = db.length;
  document.getElementById("statPending").textContent = db.filter(
    (report) => report.status === "Pending Verification",
  ).length;
  document.getElementById("statVerified").textContent = db.filter(
    (report) => report.verified === true,
  ).length;
  document.getElementById("statRejected").textContent = db.filter(
    (report) => report.status === "Rejected",
  ).length;
  document.getElementById("statProgress").textContent = db.filter((report) =>
    ["Assigned", "In Progress"].includes(report.status),
  ).length;
  document.getElementById("statResolved").textContent = db.filter(
    (report) => report.status === "Resolved",
  ).length;
  renderDashboardCharts(db);
  const statusFilter = document.getElementById("adminStatusFilter");
  const priorityFilter = document.getElementById("adminPriorityFilter");
  const categoryFilter = document.getElementById("adminCategoryFilter");
  const barangayFilter = document.getElementById("adminBarangayFilter");
  populateReportFilter(
    statusFilter,
    [...REPORT_STATUSES, ...db.map((report) => report.status)],
    "All statuses",
  );
  populateReportFilter(
    priorityFilter,
    [...REPORT_PRIORITIES, ...db.map((report) => report.priority || "Normal")],
    "All priorities",
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
  const priority = priorityFilter.value;
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
      report.priority || "Normal",
      getAssignedPersonnelLabel(report),
      report.assignedDepartment || "",
      report.description,
    ]
      .join(" ")
      .toLocaleLowerCase();
    return (
      (!keyword || searchableText.includes(keyword)) &&
      (!status || report.status === status) &&
      (!priority || (report.priority || "Normal") === priority) &&
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
                    <td class="py-3 px-4"><span class="inline-flex whitespace-nowrap px-2.5 py-1 text-[11px] rounded-full font-bold ${priorityBadgeClass(report.priority)}">${escapeHtml(report.priority || "Normal")}</span></td>
                    <td class="py-3 px-4">${escapeHtml(getAssignedPersonnelLabel(report) || "Unassigned")}</td>
                    <td class="py-3 px-4">${escapeHtml(report.date)}</td>
                    <td class="py-3 px-4"><span class="inline-flex whitespace-nowrap px-2.5 py-1 text-[11px] rounded-full font-bold ${statusBadgeClass(report.status)}">${escapeHtml(report.status)}</span></td>
                    <td class="py-3 px-4 text-right">
                        <button type="button" data-report-id="${escapeHtml(report.id)}" class="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold">${report.status === "Pending Verification" ? "Review complaint" : "View / Update"}</button>
                    </td>
                </tr>
            `,
        )
        .join("")
    : `
                <tr><td colspan="9" class="py-8 px-4 text-center text-slate-500">No reports match these filters.</td></tr>
            `;
}

function renderDashboardCharts(reports) {
  const categories = reports.reduce((counts, report) => {
    counts[report.category] = (counts[report.category] || 0) + 1;
    return counts;
  }, {});
  const categoryChart = document.getElementById("categoryChart");
  const categoryEntries = Object.entries(categories).sort(
    (a, b) => b[1] - a[1],
  );
  const maxCategory = Math.max(1, ...categoryEntries.map(([, count]) => count));
  categoryChart.innerHTML = categoryEntries.length
    ? categoryEntries
        .map(
          ([name, count]) =>
            `<div><div class="mb-1 flex justify-between gap-2 text-xs"><span class="truncate font-medium text-slate-700">${escapeHtml(name)}</span><span class="font-semibold text-slate-600">${count}</span></div><div class="h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-emerald-600" style="width:${Math.round((count / maxCategory) * 100)}%"></div></div></div>`,
        )
        .join("")
    : '<p class="text-sm text-slate-500">Category data will appear when complaints are submitted.</p>';

  const months = [];
  const now = new Date();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleString(undefined, { month: "short" }),
      count: 0,
    });
  }
  reports.forEach((report) => {
    const month = String(report.date || "").slice(0, 7);
    const entry = months.find((item) => item.key === month);
    if (entry) entry.count += 1;
  });
  const maxMonth = Math.max(1, ...months.map((item) => item.count));
  document.getElementById("trendChart").innerHTML = months
    .map(
      (item) =>
        `<div class="flex h-28 flex-col items-center justify-end gap-2"><span class="text-xs font-semibold text-slate-600">${item.count}</span><div class="w-full rounded-t-md bg-emerald-600" style="height:${Math.max(4, Math.round((item.count / maxMonth) * 72))}px" aria-hidden="true"></div><span class="text-xs text-slate-500">${item.label}</span></div>`,
    )
    .join("");

  const resolved = reports.filter(
    (report) => report.status === "Resolved",
  ).length;
  const verified = reports.filter((report) => report.verified === true).length;
  const percent = verified ? Math.round((resolved / verified) * 100) : 0;
  document.getElementById("resolutionChart").innerHTML =
    `<div class="flex justify-between text-xs text-slate-600"><span>${resolved} of ${verified} verified complaints resolved</span><strong>${percent}%</strong></div><div class="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-emerald-600" style="width:${percent}%"></div></div>`;
}

function isAdmin() {
  return getCurrentUser()?.role === "admin";
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
  document
    .getElementById("verificationForm")
    .classList.toggle("hidden", report.status !== "Pending Verification");
  document
    .getElementById("dispatchForm")
    .classList.toggle(
      "hidden",
      report.status === "Pending Verification" || report.status === "Rejected",
    );
  document.getElementById("rejectionReason").value = "";
  const personnel = JSON.parse(localStorage.getItem(USERS_KEY) || "[]").filter(
    (user) => user.role === "admin" && user.status !== "inactive",
  );
  const personnelOptions = (select, placeholder) => {
    select.replaceChildren(new Option(placeholder, ""));
    personnel.forEach((official) => {
      select.add(
        new Option(
          `${official.name} · Brgy. ${official.barangay}`,
          official.id,
        ),
      );
    });
  };
  personnelOptions(
    document.getElementById("verificationPersonnel"),
    "Select responsible personnel",
  );
  personnelOptions(
    document.getElementById("reportAssignedPersonnel"),
    "Select responsible personnel",
  );
  document.getElementById("verificationPersonnel").value =
    report.assignedPersonnelId || "";
  document.getElementById("reportAssignedPersonnel").value =
    report.assignedPersonnelId || "";
  document.getElementById("reportOfficialResponse").value = "";
  document.getElementById("resolutionPhotos").value = "";
  document.getElementById("resolutionPreview").innerHTML = renderReportPhotos(
    report.resolutionPhotos || [],
    "Existing resolution proof",
  );
  document.getElementById("reportStatusSelect").disabled = !report.verified;
  if (report.verified) {
    [...statusSelect.options].forEach((option) => {
      option.disabled =
        option.value === "Pending Verification" || option.value === "Rejected";
    });
  } else {
    [...statusSelect.options].forEach((option) => {
      option.disabled = false;
    });
  }
  const prioritySelect = document.getElementById("reportPrioritySelect");
  const priority = report.priority || "Normal";
  if (
    ![...prioritySelect.options].some((option) => option.value === priority)
  ) {
    prioritySelect.add(new Option(priority, priority));
  }
  prioritySelect.value = priority;
  const departmentSelect = document.getElementById("reportDepartmentSelect");
  if (
    report.assignedDepartment &&
    ![...departmentSelect.options].some(
      (option) => option.value === report.assignedDepartment,
    )
  ) {
    departmentSelect.add(
      new Option(report.assignedDepartment, report.assignedDepartment),
    );
  }
  departmentSelect.value = report.assignedDepartment || "";
  document.getElementById("reportStatusFeedback").classList.add("hidden");

  const evidencePhotos =
    report.evidencePhotos ||
    (report.evidencePhoto ? [report.evidencePhoto] : []);
  const currentUser = getCurrentUser();
  document.getElementById("reportViewerContent").innerHTML = `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <p><strong>Tracking Code</strong><br>${escapeHtml(report.id)}</p>
                    <p><strong>Date Filed</strong><br>${escapeHtml(report.date)}</p>
                    <p><strong>Resident</strong><br>${escapeHtml(report.name)}</p>
                    <p><strong>Contact</strong><br>${escapeHtml(report.contact)}</p>
                    <p><strong>Barangay</strong><br>Brgy. ${escapeHtml(report.barangay)}</p>
                    <p><strong>Category</strong><br>${escapeHtml(report.category)}</p>
                    <p><strong>Dispatch Priority</strong><br>${escapeHtml(report.priority || "Normal")}</p>
                    <p><strong>Assigned Municipal Unit</strong><br>${escapeHtml(report.assignedDepartment || "Not yet assigned")}</p>
                    <p><strong>Responsible Personnel</strong><br>${escapeHtml(getAssignedPersonnelLabel(report) || "Not assigned")}</p>
                    <p class="sm:col-span-2"><strong>Current Status</strong><br>${escapeHtml(report.status)}</p>
                    ${report.rejectionReason ? `<p class="sm:col-span-2 rounded-lg bg-rose-50 p-3 text-rose-800"><strong>Rejection reason</strong><br>${escapeHtml(report.rejectionReason)}</p>` : ""}
                    <p class="sm:col-span-2 whitespace-pre-wrap"><strong>Detailed Description</strong><br>${escapeHtml(report.description)}</p>
                </div>
                ${renderReportPhotos(evidencePhotos, "Resident-submitted evidence")}
                ${renderReportPhotos(report.resolutionPhotos || [], "Resolution proof")}
                ${renderReportConversation(report, currentUser)}
            `;
  document.getElementById("reportViewerModal").classList.remove("hidden");
}

function closeReportViewer() {
  document.getElementById("reportViewerModal").classList.add("hidden");
  activeReportId = null;
}

function openEvidenceViewer(photo) {
  if (!isStoredEvidencePhoto(photo)) return;
  document.getElementById("evidenceViewerImage").src = photo;
  document.getElementById("evidenceViewerModal").classList.remove("hidden");
}

function closeEvidenceViewer() {
  const modal = document.getElementById("evidenceViewerModal");
  modal.classList.add("hidden");
  document.getElementById("evidenceViewerImage").removeAttribute("src");
}

async function handleReportStatusUpdate(event) {
  event.preventDefault();
  if (!isAdmin() || !activeReportId) return;
  const reports = getReports();
  const report = reports.find((item) => item.id === activeReportId);
  if (!report) return;

  const nextStatus = document.getElementById("reportStatusSelect").value;
  const assigneeId = document.getElementById("reportAssignedPersonnel").value;
  const assignee = JSON.parse(localStorage.getItem(USERS_KEY) || "[]").find(
    (user) => user.id === assigneeId,
  );
  if (!report.verified || report.status === "Rejected") {
    alert(
      "Only verified complaints can be assigned or moved through progress statuses.",
    );
    return;
  }
  if (!assigneeId || !assignee) {
    alert("Assign a responsible barangay personnel before saving this update.");
    return;
  }
  if (
    nextStatus === "Resolved" &&
    !(report.resolutionPhotos || []).length &&
    !document.getElementById("resolutionPhotos").files.length
  ) {
    alert(
      "Upload at least one resolution proof photo before marking this complaint resolved.",
    );
    return;
  }

  const previousStatus = report.status;
  const previousAssignee = report.assignedPersonnelId;
  const uploadedFiles = [...document.getElementById("resolutionPhotos").files];
  const response = document
    .getElementById("reportOfficialResponse")
    .value.trim();
  if (uploadedFiles.length > MAX_EVIDENCE_PHOTOS) {
    alert("Choose no more than 5 resolution proof photos.");
    return;
  }
  const currentUser = getCurrentUser();
  const hasProgressWork =
    nextStatus !== report.status || response || uploadedFiles.length > 0;
  if (
    hasProgressWork &&
    report.assignedPersonnelId !== currentUser.id &&
    assignee.id !== currentUser.id
  ) {
    alert(
      "Only the assigned personnel can update progress. Reassign the complaint to yourself first if you are taking responsibility.",
    );
    return;
  }
  let newResolutionPhotos = [];
  try {
    newResolutionPhotos = await Promise.all(
      uploadedFiles.map(prepareEvidencePhoto),
    );
  } catch (error) {
    alert(error.message);
    return;
  }
  report.status = nextStatus;
  report.priority = document.getElementById("reportPrioritySelect").value;
  report.assignedDepartment = document.getElementById(
    "reportDepartmentSelect",
  ).value;
  report.assignedPersonnelId = assignee.id;
  report.assignedPersonnelName = assignee.name;
  report.assignedPersonnelBarangay = assignee.barangay || "";
  report.resolutionPhotos = [
    ...(report.resolutionPhotos || []),
    ...newResolutionPhotos,
  ];
  if (nextStatus === "Resolved" && !report.resolvedAt)
    report.resolvedAt = new Date().toISOString();
  if (response) {
    report.messages = report.messages || [];
    report.messages.push({
      authorId: getCurrentUser().id,
      authorName: getCurrentUser().name,
      text: response,
      createdAt: new Date().toISOString(),
    });
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (error) {
    console.error("Unable to save the report status.", error);
    alert("The status could not be saved in this browser. Please try again.");
    return;
  }

  if (previousAssignee !== assignee.id) {
    addNotification(
      assignee.id,
      "Complaint assigned to you",
      `${report.id} has been assigned to you.`,
      report.id,
    );
    notifyResident(
      report,
      "Complaint personnel assigned",
      `${assignee.name} is responsible for your complaint.`,
    );
  }
  if (previousStatus !== nextStatus) {
    notifyResident(
      report,
      `Complaint ${nextStatus.toLowerCase()}`,
      `Your complaint ${report.id} is now ${nextStatus}.`,
    );
  }
  if (response)
    notifyResident(
      report,
      "Progress update from barangay personnel",
      response.slice(0, 180),
    );
  renderAdminTable();
  openReportViewer(activeReportId);
  const feedback = document.getElementById("reportStatusFeedback");
  feedback.textContent = "Dispatch update saved.";
  feedback.classList.remove("hidden");
}

function handleComplaintVerification(event) {
  event.preventDefault();
  if (!isAdmin() || !activeReportId) return;
  const decision = event.submitter?.value;
  const reports = getReports();
  const report = reports.find((item) => item.id === activeReportId);
  if (!report || report.status !== "Pending Verification") return;
  if (decision === "reject") {
    const reason = document.getElementById("rejectionReason").value.trim();
    if (!reason) {
      alert("Provide a reason before rejecting a complaint.");
      document.getElementById("rejectionReason").focus();
      return;
    }
    report.status = "Rejected";
    report.rejectionReason = reason;
  } else if (decision === "verify") {
    const officialId = document.getElementById("verificationPersonnel").value;
    const official = JSON.parse(localStorage.getItem(USERS_KEY) || "[]").find(
      (user) =>
        user.id === officialId &&
        user.role === "admin" &&
        user.status !== "inactive",
    );
    if (!official) {
      alert(
        "Select an active barangay personnel before verifying this complaint.",
      );
      return;
    }
    report.status = "Verified";
    report.verified = true;
    report.verifiedAt = new Date().toISOString();
    report.assignedPersonnelId = official.id;
    report.assignedPersonnelName = official.name;
    report.assignedPersonnelBarangay = official.barangay || "";
  } else {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (error) {
    console.error("Unable to save complaint verification.", error);
    alert(
      "The verification decision could not be saved in this browser. Please try again.",
    );
    return;
  }
  if (decision === "reject") {
    notifyResident(
      report,
      "Complaint rejected",
      `Your complaint was rejected: ${report.rejectionReason}`,
    );
  } else {
    addNotification(
      report.assignedPersonnelId,
      "Complaint assigned to you",
      `${report.id} is verified and assigned to you.`,
      report.id,
    );
    notifyResident(
      report,
      "Complaint verified and assigned",
      `Your complaint was verified. ${report.assignedPersonnelName} will handle it.`,
    );
  }
  renderAdminTable();
  openReportViewer(report.id);
}
