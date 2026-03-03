// Global UX helpers for all pages.
(function () {
  function showToast(message, type) {
    var toast = document.createElement("div");
    toast.className = "ux-toast " + (type || "info");
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, 2200);
  }

  function enhanceForms() {
    var forms = document.querySelectorAll("form");
    forms.forEach(function (form) {
      form.addEventListener("submit", function () {
        var submitBtn = form.querySelector('button[type="submit"], .btn-primary');
        if (!submitBtn) return;
        if (submitBtn.dataset.loading === "1") return;

        submitBtn.dataset.loading = "1";
        submitBtn.dataset.originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        setTimeout(function () {
          submitBtn.disabled = false;
          submitBtn.dataset.loading = "0";
          if (submitBtn.dataset.originalText) {
            submitBtn.innerHTML = submitBtn.dataset.originalText;
          }
        }, 1500);
      });
    });
  }

  function enhanceMobileMenu() {
    var links = document.querySelectorAll(".nav-links a");
    var navLinks = document.querySelector(".nav-links");
    links.forEach(function (link) {
      link.addEventListener("click", function () {
        if (navLinks && navLinks.classList.contains("show")) {
          navLinks.classList.remove("show");
        }
      });
    });
  }

  window.showUxToast = showToast;

  document.addEventListener("DOMContentLoaded", function () {
    enhanceForms();
    enhanceMobileMenu();
  });
})();
