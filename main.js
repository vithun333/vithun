(() => {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Theme toggle (dark/light) with localStorage
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") root.setAttribute("data-theme", "light");

  const syncToggleState = () => {
    if (!themeToggle) return;
    const isLight = root.getAttribute("data-theme") === "light";
    themeToggle.setAttribute("aria-pressed", String(isLight));
  };
  syncToggleState();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isLight = root.getAttribute("data-theme") === "light";
      if (isLight) {
        root.removeAttribute("data-theme");
        localStorage.setItem("theme", "dark");
      } else {
        root.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
      }
      syncToggleState();
    });
  }

  // Contact form validation (simple + clean)
  const form = document.getElementById("contactForm");
  if (!form) return;

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const messageInput = document.getElementById("message");

  const nameError = document.getElementById("nameError");
  const emailError = document.getElementById("emailError");
  const messageError = document.getElementById("messageError");
  const formNote = document.getElementById("formNote");

  const isEmail = (value) => {
    // Basic but valid-enough email check for assignment
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const setError = (el, msg) => {
    if (el) el.textContent = msg;
  };

  const clearErrors = () => {
    setError(nameError, "");
    setError(emailError, "");
    setError(messageError, "");
    if (formNote) formNote.textContent = "";
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors();

    const nameVal = nameInput?.value.trim() ?? "";
    const emailVal = emailInput?.value.trim() ?? "";
    const msgVal = messageInput?.value.trim() ?? "";

    let ok = true;

    if (nameVal.length < 2) {
      setError(nameError, "Please enter your name (2+ characters).");
      ok = false;
    }
    if (!isEmail(emailVal)) {
      setError(emailError, "Please enter a valid email address.");
      ok = false;
    }
    if (msgVal.length < 10) {
      setError(messageError, "Message should be at least 10 characters.");
      ok = false;
    }

    if (!ok) return;

    // Demo submission (no backend)
    if (formNote) {
      formNote.textContent =
        "Thanks! This form is front-end only—connect it to a backend to send messages.";
    }

    form.reset();
  });
})();
