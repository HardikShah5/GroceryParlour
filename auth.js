const store = window.DBStore;

const formEl = document.getElementById("authForm");
const fullNameWrapEl = document.getElementById("fullNameWrap");
const fullNameEl = document.getElementById("fullName");
const mobileWrapEl = document.getElementById("mobileWrap");
const mobileEl = document.getElementById("mobile");
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const errorEl = document.getElementById("authError");
const submitEl = document.getElementById("authSubmit");
const toggleModeEl = document.getElementById("toggleMode");
const titleEl = document.querySelector(".auth-card h1");

const nextTarget = new URLSearchParams(window.location.search).get("next") || "index.html";

let mode = "signin";

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
  titleEl.textContent = isSignUp ? "Create Account" : "Sign In";
  submitEl.textContent = isSignUp ? "Create Account" : "Sign In";
  toggleModeEl.textContent = isSignUp ? "Already have an account? Sign in" : "Create new account";
  fullNameWrapEl.style.display = isSignUp ? "grid" : "none";
  fullNameEl.required = isSignUp;
  mobileWrapEl.style.display = isSignUp ? "grid" : "none";
  mobileEl.required = isSignUp;
  if (!isSignUp) {
    fullNameEl.value = "";
    mobileEl.value = "";
  }
  errorEl.textContent = "";
}

toggleModeEl.addEventListener("click", () => {
  mode = mode === "signin" ? "signup" : "signin";
  applyMode();
});

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.textContent = "";
  submitEl.disabled = true;

  const email = emailEl.value.trim();
  const password = passwordEl.value;
  const fullName = fullNameEl.value.trim();
  const mobile = mobileEl.value.trim().replace(/\D+/g, "");

  try {
    if (mode === "signup") {
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

(async () => {
  try {
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
