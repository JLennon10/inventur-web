(function () {
  "use strict";

  const I = window.Inventur;

  I.ready(function () {
    const page = I.$(".signin-page");
    if (!page) return;

    const form = I.$("form", page);
    const email = I.$('input[type="email"]', page);
    const password = I.$('input[type="password"]', page);
    const remember = I.$(".remember input", page);
    const submit = I.$(".signin-submit", page);
    const google = I.$(".google-button", page);
    const eye = password ? password.parentElement.querySelector("img") : null;

    const remembered = localStorage.getItem("inventur.email");
    if (remembered && email) email.value = remembered;

    function setInvalid(input, invalid) {
      input.parentElement.style.borderColor = invalid ? "#ef4444" : "";
      input.parentElement.style.boxShadow = invalid ? "0 0 0 3px rgba(239,68,68,.10)" : "";
    }

    function submitForm() {
      const emailInvalid = !email.value.includes("@");
      const passwordInvalid = password.value.trim().length < 4;
      setInvalid(email, emailInvalid);
      setInvalid(password, passwordInvalid);

      if (emailInvalid || passwordInvalid) {
        I.toast("Use a valid email and at least 4 password characters", "error");
        return;
      }

      if (remember && remember.checked) {
        localStorage.setItem("inventur.email", email.value);
      } else {
        localStorage.removeItem("inventur.email");
      }
      localStorage.setItem("inventur.session", JSON.stringify({ email: email.value, signedInAt: Date.now() }));
      location.href = "./dashboard.html";
    }

    if (eye) {
      eye.style.cursor = "pointer";
      eye.addEventListener("click", function () {
        const hidden = password.type === "password";
        password.type = hidden ? "text" : "password";
        eye.src = hidden ? "../assets/img/icons/eye.svg" : "../assets/img/icons/eye-off.svg";
      });
    }

    if (submit) submit.addEventListener("click", submitForm);
    if (form) form.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        submitForm();
      }
    });
    if (google) google.addEventListener("click", function () {
      I.toast("Google sign-in is ready for backend connection");
    });
  });
})();
