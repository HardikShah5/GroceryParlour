const store = window.DBStore;

const formEl = document.getElementById("authForm");
const fullNameWrapEl = document.getElementById("fullNameWrap");
const fullNameEl = document.getElementById("fullName");
const mobileWrapEl = document.getElementById("mobileWrap");
const mobileEl = document.getElementById("mobile");
const emailWrapEl = document.getElementById("emailWrap");
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const errorEl = document.getElementById("authError");
const noticeEl = document.getElementById("authNotice");
const submitEl = document.getElementById("authSubmit");
const toggleModeEl = document.getElementById("toggleMode");
const forgotPasswordEl = document.getElementById("forgotPassword");
const titleEl = document.querySelector(".auth-card h1");
const toastStackEl = document.getElementById("toastStack");

const nextTarget = new URLSearchParams(window.location.search).get("next") || "index.html";

let mode = "signin";

function showToast(message, type = "success") {
  if (!toastStackEl || !message) return;
  const toastEl = document.createElement("div");
  toastEl.className = `toast${type === "error" ? " error" : ""}`;
  toastEl.textContent = message;
  toastStackEl.appendChild(toastEl);

  setTimeout(() => {
    toastEl.classList.add("hide");
    setTimeout(() => {
      toastEl.remove();
    }, 220);
  }, 2600);
}

async function getSessionViaStoreOrClient() {
  if (store && typeof store.getSession === "function") {
    return store.getSession();
  }
  const client = store?.client;
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

async function signUpViaStoreOrClient(payload) {
  if (store && typeof store.signUp === "function") {
    return store.signUp(payload);
  }
  const client = store?.client;
  if (!client) throw new Error("Auth client not available.");
  const { data, error } = await client.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.fullName || null,
        phone: payload.mobile || null,
      },
    },
  });
  if (error) throw error;
  return data;
}

async function signInViaStoreOrClient(payload) {
  if (store && typeof store.signIn === "function") {
    return store.signIn(payload);
  }
  const client = store?.client;
  if (!client) throw new Error("Auth client not available.");
  const { data, error } = await client.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });
  if (error) throw error;
  return data;
}

function applyMode() {
  const isSignUp = mode === "signup";
  const isReset = mode === "reset";
  titleEl.textContent = isSignUp ? "Create Account" : "Sign In";
  if (isReset) {
    titleEl.textContent = "Reset Password";
  }
  submitEl.textContent = isSignUp ? "Create Account" : isReset ? "Update Password" : "Sign In";
  toggleModeEl.textContent = isSignUp ? "Already have an account? Sign in" : "Create new account";
  toggleModeEl.hidden = isReset;
  fullNameWrapEl.style.display = isSignUp ? "grid" : "none";
  fullNameEl.required = isSignUp;
  mobileWrapEl.style.display = isSignUp ? "grid" : "none";
  mobileEl.required = isSignUp;
  emailWrapEl.style.display = isReset ? "none" : "grid";
  emailEl.required = !isReset;
  forgotPasswordEl.hidden = mode !== "signin";
  if (!isSignUp) {
    fullNameEl.value = "";
    mobileEl.value = "";
  }
  if (isReset) {
    emailEl.value = "";
  }
  errorEl.textContent = "";
  noticeEl.textContent = "";
}

toggleModeEl.addEventListener("click", () => {
  mode = mode === "signin" ? "signup" : "signin";
  applyMode();
});

if (forgotPasswordEl) {
  forgotPasswordEl.addEventListener("click", async () => {
    errorEl.textContent = "";
    noticeEl.textContent = "";
    const email = emailEl.value.trim();
    if (!email) {
      errorEl.textContent = "Please enter your email to reset the password.";
      return;
    }
    try {
      const client = store?.client;
      if (!client) throw new Error("Auth client not available.");
      const redirectTo = `${window.location.origin}/auth.html?reset=1`;
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      noticeEl.textContent = "Password reset email sent. Please check your inbox.";
      showToast("Reset link sent to your email.");
    } catch (error) {
      console.error(error);
      const message = error?.message || "Failed to send reset email.";
      errorEl.textContent = message;
      showToast(message, "error");
    }
  });
}

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.textContent = "";
  noticeEl.textContent = "";
  submitEl.disabled = true;

  const email = emailEl.value.trim();
  const password = passwordEl.value;
  const fullName = fullNameEl.value.trim();
  const mobile = mobileEl.value.trim().replace(/\D+/g, "");

  try {
    if (mode === "reset") {
      const client = store?.client;
      if (!client) throw new Error("Auth client not available.");
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      noticeEl.textContent = "Password updated. Please sign in.";
      showToast("Password updated successfully.");
      mode = "signin";
      window.history.replaceState({}, document.title, window.location.pathname);
      applyMode();
    } else if (mode === "signup") {
      if (!/^[0-9]{10}$/.test(mobile)) {
        throw new Error("Please enter a valid 10-digit mobile number.");
      }
      await signUpViaStoreOrClient({ email, password, fullName, mobile });
      await signInViaStoreOrClient({ email, password });
    } else {
      await signInViaStoreOrClient({ email, password });
    }
    window.location.href = nextTarget;
  } catch (error) {
    console.error(error);
    errorEl.textContent = error?.message || "Authentication failed.";
  } finally {
    submitEl.disabled = false;
  }
});

function getHashParams() {
  const hash = window.location.hash.replace(/^#/, "");
  return new URLSearchParams(hash);
}

(async () => {
  try {
    const hashParams = getHashParams();
    if (hashParams.get("type") === "recovery") {
      mode = "reset";
      applyMode();
      return;
    }
    const session = await getSessionViaStoreOrClient();
    if (session) {
      window.location.href = nextTarget;
      return;
    }
  } catch (error) {
    console.error(error);
  }
  applyMode();
})();
