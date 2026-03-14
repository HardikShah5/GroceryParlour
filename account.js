const store = window.DBStore;

const errorEl = document.getElementById("accountError");
const infoEl = document.getElementById("accountInfo");
const nameEl = document.getElementById("accountName");
const emailEl = document.getElementById("accountEmail");
const phoneEl = document.getElementById("accountPhone");
const roleEl = document.getElementById("accountRole");
const logoutEl = document.getElementById("accountLogout");
const adminLinkEl = document.getElementById("accountAdminLink");
const fullNameInputEl = document.getElementById("accountFullNameInput");
const phoneInputEl = document.getElementById("accountPhoneInput");
const saveBtnEl = document.getElementById("accountSaveBtn");
const cancelBtnEl = document.getElementById("accountCancelBtn");
const editBtnEl = document.getElementById("editProfileBtn");

let currentProfile = null;
let editMode = false;

async function getSessionViaStoreOrClient() {
  if (store && typeof store.getSession === "function") return store.getSession();
  const client = store?.client;
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

async function getProfileViaStoreOrClient() {
  if (store && typeof store.getProfile === "function") return store.getProfile();
  const client = store?.client;
  const session = await getSessionViaStoreOrClient();
  const user = session?.user;
  if (!client || !user) return null;
  const { data, error } = await client
    .from("profiles")
    .select("id,email,full_name,phone,role")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name || "",
    phone: data.phone || "",
    role: data.role || "user",
  };
}

async function updateProfileViaStoreOrClient(payload) {
  if (store && typeof store.updateProfile === "function") {
    return store.updateProfile(payload);
  }
  const client = store?.client;
  const session = await getSessionViaStoreOrClient();
  const user = session?.user;
  if (!client || !user) throw new Error("Please sign in.");
  const updates = {
    full_name: (payload?.fullName || "").trim() || null,
    phone: String(payload?.phone || "").replace(/\D+/g, "").slice(0, 15) || null,
  };
  const { error } = await client.from("profiles").update(updates).eq("id", user.id);
  if (error) throw error;
}

function renderProfile(profile, session) {
  const displayName = profile?.fullName || session.user?.email || "User";
  nameEl.textContent = displayName;
  emailEl.textContent = profile?.email || session.user?.email || "-";
  phoneEl.textContent = profile?.phone || "-";
  roleEl.textContent = profile?.role || "user";
  adminLinkEl.hidden = profile?.role !== "admin";
  fullNameInputEl.value = profile?.fullName || "";
  phoneInputEl.value = profile?.phone || "";
  infoEl.hidden = false;
}

function setEditMode(nextMode) {
  editMode = !!nextMode;
  editBtnEl.hidden = editMode;
  saveBtnEl.hidden = !editMode;
  cancelBtnEl.hidden = !editMode;
  nameEl.hidden = editMode;
  phoneEl.hidden = editMode;
  fullNameInputEl.hidden = !editMode;
  phoneInputEl.hidden = !editMode;
  if (!editMode) {
    fullNameInputEl.value = currentProfile?.fullName || "";
    phoneInputEl.value = currentProfile?.phone || "";
  }
}

logoutEl.addEventListener("click", async () => {
  try {
    await store.signOut();
    window.location.href = "auth.html?next=account.html";
  } catch (error) {
    console.error(error);
    errorEl.textContent = "Failed to sign out.";
  }
});

saveBtnEl.addEventListener("click", async () => {
  errorEl.textContent = "";
  saveBtnEl.disabled = true;
  try {
    const fullName = fullNameInputEl.value.trim();
    const phone = phoneInputEl.value.trim().replace(/\D+/g, "");
    if (phone && !/^[0-9]{10}$/.test(phone)) {
      throw new Error("Please enter a valid 10-digit mobile number.");
    }
    await updateProfileViaStoreOrClient({ fullName, phone });
    currentProfile = await getProfileViaStoreOrClient();
    const session = await getSessionViaStoreOrClient();
    if (!session) throw new Error("Please sign in.");
    renderProfile(currentProfile, session);
    setEditMode(false);
    errorEl.style.color = "#2e7d32";
    errorEl.textContent = "Profile updated.";
  } catch (error) {
    console.error(error);
    errorEl.style.color = "#9b1c1c";
    errorEl.textContent = error?.message || "Failed to update profile.";
  } finally {
    saveBtnEl.disabled = false;
  }
});

cancelBtnEl.addEventListener("click", () => {
  errorEl.textContent = "";
  setEditMode(false);
});

editBtnEl.addEventListener("click", () => {
  errorEl.textContent = "";
  setEditMode(true);
  fullNameInputEl.focus();
});

(async () => {
  try {
    const session = await getSessionViaStoreOrClient();
    if (!session) {
      window.location.href = "auth.html?next=account.html";
      return;
    }

    currentProfile = await getProfileViaStoreOrClient();
    errorEl.style.color = "#9b1c1c";
    renderProfile(currentProfile, session);
    setEditMode(false);
  } catch (error) {
    console.error(error);
    errorEl.textContent = "Failed to load account.";
  }
})();
