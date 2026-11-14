<script>
    (() => {
      document.body.classList.remove("no-js");
      const WA_NUMBER = "919845863602";
      const statuses = ["Request received", "Device in transit", "Device received", "Diagnosis in progress", "Quote sent", "Recovery in progress", "Quality check", "Ready to return", "Completed", "On hold"];
      const statusIndex = new Map(statuses.map((status, index) => [status, index]));
      const $ = (selector, root = document) => root.querySelector(selector);
      const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
      const waLink = text => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
      let toastTimer;

      $("#year").textContent = new Date().getFullYear();

      function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
      }

      function showToast(message) {
        const toast = $("#toast");
        toast.textContent = message;
        toast.classList.add("visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("visible"), 4300);
      }

      async function request(action, params = {}, method = "GET") {
        const query = new URLSearchParams({ action, ...(method === "GET" ? params : {}) });
        const response = await fetch(`api.php?${query}`, {
          method,
          credentials: "same-origin",
          headers: method === "GET" ? { "Accept": "application/json" } : { "Accept": "application/json", "Content-Type": "application/json" },
          ...(method === "GET" ? {} : { body: JSON.stringify(params) })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "The recovery desk is temporarily unavailable. Please call or WhatsApp +91 98458 63602.");
        return result;
      }

      // Header shadow, reveal-on-scroll
      const topbar = $("#topbar");
      const onScroll = () => topbar.classList.toggle("scrolled", scrollY > 8);
      addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
          if (entry.isIntersecting) { entry.target.classList.add("in"); observer.unobserve(entry.target); }
        }), { rootMargin: "0px 0px -40px 0px", threshold: .05 });
        $$(".reveal").forEach((element, index) => { element.style.transitionDelay = `${(index % 4) * 70}ms`; observer.observe(element); });
      } else {
        $$(".reveal").forEach(element => element.classList.add("in"));
      }

      // Services dropdown
      const navDrop = $("#nav-drop");
      if (navDrop) {
        const dropButton = navDrop.querySelector(".nav-drop-btn");
        const setDrop = open => { navDrop.classList.toggle("open", open); dropButton.setAttribute("aria-expanded", String(open)); };
        dropButton.addEventListener("click", event => { event.stopPropagation(); setDrop(!navDrop.classList.contains("open")); });
        document.addEventListener("click", event => { if (!navDrop.contains(event.target)) setDrop(false); });
        navDrop.addEventListener("keydown", event => { if (event.key === "Escape") { setDrop(false); dropButton.focus(); } });
        navDrop.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setDrop(false)));
      }

      // Mobile drawer
      const drawer = $("#drawer");
      const menuButton = $("#menu-open");
      function setDrawer(open) {
        drawer.classList.toggle("open", open);
        drawer.setAttribute("aria-hidden", String(!open));
        menuButton.setAttribute("aria-expanded", String(open));
        document.body.style.overflow = open ? "hidden" : "";
        if (open) $("[data-close-drawer]", drawer.querySelector(".drawer-panel")).focus();
      }
      menuButton.addEventListener("click", () => setDrawer(true));
      $$("[data-close-drawer]").forEach(element => element.addEventListener("click", () => setDrawer(false)));

      // Pre-fill the booking form from service / tier / Mac buttons
      $$("[data-device]").forEach(link => link.addEventListener("click", () => { $("#device-type").value = link.dataset.device; }));
      $$("[data-priority]").forEach(link => link.addEventListener("click", () => { $("#priority").value = link.dataset.priority; }));
      $("#device-type").addEventListener("change", event => {
        if (event.target.value === "MacBook / iMac" && !$("#failure-type").value) $("#failure-type").value = "Mac won't boot / logic board fault";
      });

      // Booking
      const modal = $("#case-modal");
      function openCaseModal(caseId) {
        $("#modal-case").textContent = caseId;
        $("#modal-wa").href = waLink(`Hi Data Doctor Hub, I just opened recovery case ${caseId}. Please contact me.`);
        modal.classList.add("open");
        $("#copy-case").focus();
      }
      function closeCaseModal() {
        modal.classList.remove("open");
        $("#track").scrollIntoView({ behavior: "smooth" });
      }
      $$("[data-close-modal]").forEach(element => element.addEventListener("click", closeCaseModal));
      modal.addEventListener("click", event => { if (event.target === modal) closeCaseModal(); });
      $("#copy-case").addEventListener("click", async () => {
        try { await navigator.clipboard.writeText($("#modal-case").textContent); showToast("Case number copied."); }
        catch { showToast("Copy failed — please note the case number down."); }
      });

      $("#booking-form").addEventListener("submit", event => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        const values = Object.fromEntries(new FormData(form).entries());
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        request("create-case", values, "POST").then(({ case: item }) => {
          form.reset();
          $("#case-number").value = item.id;
          renderTracking(item);
          openCaseModal(item.id);
        }).catch(error => showToast(error.message)).finally(() => { button.disabled = false; });
      });

      // Tracking
      function track(caseId) {
        const button = $("#tracking-form button[type=submit]");
        button.disabled = true;
        return request("track", { case_number: caseId }).then(({ case: item }) => renderTracking(item))
          .catch(error => renderTracking(null, error.message))
          .finally(() => { button.disabled = false; });
      }
      $("#tracking-form").addEventListener("submit", event => {
        event.preventDefault();
        track($("#case-number").value.trim().toUpperCase());
      });
      $("#hero-track").addEventListener("submit", event => {
        event.preventDefault();
        const caseId = $("#hero-case").value.trim().toUpperCase();
        $("#case-number").value = caseId;
        $("#track").scrollIntoView({ behavior: "smooth" });
        track(caseId);
      });

      // Open a case straight from a link like /?case=DDH-2026-00001#track
      const presetCase = new URLSearchParams(location.search).get("case");
      if (presetCase && /^[A-Za-z0-9-]{4,32}$/.test(presetCase)) {
        $("#case-number").value = presetCase.toUpperCase();
        track(presetCase.toUpperCase());
      }

      function renderTracking(item, errorMessage = "") {
        const container = $("#track-result");
        if (!item) {
          const message = errorMessage || "We couldn't find that case number. Please check it and try again.";
          container.innerHTML = `<div class="result-empty">${escapeHtml(message)} Call <a href="tel:+919845863602"><strong>+91 98458 63602</strong></a> or <a href="${waLink("Hi, I can't find my case number online.")}" target="_blank" rel="noopener"><strong>WhatsApp us</strong></a>.</div>`;
          return;
        }
        const stage = statusIndex.has(item.status) ? statusIndex.get(item.status) : 0;
        const progress = item.status === "On hold" ? 0 : Math.min(stage, 7);
        const stepNames = ["Received", "In transit", "Diagnosis", "Quote", "Recovery"];
        const completedStages = item.status === "Completed" || item.status === "Ready to return" ? 4 : Math.min(4, Math.floor(progress * 4 / 7));
        const timeline = stepNames.map((name, index) => `<div class="step ${index <= completedStages ? "done" : ""}"><span class="step-dot"></span><span>${name}</span></div>`).join("");
        const updatedAt = item.updatedAt || item.createdAt;
        const updated = updatedAt ? new Date(String(updatedAt).replace(" ", "T")).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "just now";
        const hold = item.status === "On hold" ? " hold" : "";
        container.innerHTML = `<div class="result-head"><div><strong>${escapeHtml(item.id)}</strong><span>${escapeHtml(item.device)} · Updated ${escapeHtml(updated)}</span></div><span class="status-badge${hold}">${escapeHtml(item.status)}</span></div><div class="timeline" aria-label="Recovery progress">${timeline}</div>${item.publicNote ? `<p class="public-note"><span><strong>Latest update:</strong> ${escapeHtml(item.publicNote)}</span></p>` : ""}`;
      }

      // On-site business request
      const onsiteForm = $("#onsite-request");
      const today = new Date();
      $("#os-date").min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      onsiteForm.addEventListener("submit", event => {
        event.preventDefault();
        if (!onsiteForm.reportValidity()) return;
        const data = new FormData(onsiteForm);
        const values = Object.fromEntries(data.entries());
        values.nda = data.has("nda");
        values.isBusiness = data.has("isBusiness");
        values.gstin = String(values.gstin || "").trim().toUpperCase();
        const button = onsiteForm.querySelector('button[type="submit"]');
        button.disabled = true;
        request("onsite-request", values, "POST").then(({ request: item }) => {
          $("#onsite-number").textContent = item.id;
          $("#onsite-wa").href = waLink(`Hi Data Doctor Hub, we submitted on-site recovery request ${item.id} for ${item.company}.`);
          onsiteForm.reset();
          $("#os-city").value = "Bengaluru";
          onsiteForm.hidden = true;
          $("#onsite-done").classList.add("show");
          $("#onsite-form").scrollIntoView({ behavior: "smooth", block: "start" });
        }).catch(error => showToast(error.message)).finally(() => { button.disabled = false; });
      });
      $("#copy-onsite").addEventListener("click", async () => {
        try { await navigator.clipboard.writeText($("#onsite-number").textContent); showToast("Request number copied."); }
        catch { showToast("Copy failed — please note the request number down."); }
      });
      $("#onsite-again").addEventListener("click", () => {
        $("#onsite-done").classList.remove("show");
        onsiteForm.hidden = false;
        $("#os-company").focus();
      });

      // Location map switcher
      $$("[data-map]").forEach(tab => tab.addEventListener("click", () => {
        $$("[data-map]").forEach(other => other.setAttribute("aria-selected", String(other === tab)));
        $("#map-frame").src = tab.dataset.map;
        $("#map-frame").title = `Map to ${tab.textContent.trim()}`;
      }));

      // Contact form
      $("#contact-form").addEventListener("submit", event => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        const values = Object.fromEntries(new FormData(form).entries());
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        request("contact", values, "POST").then(() => {
          form.reset();
          $("#contact-ok").classList.add("show");
          showToast("Message sent. We'll get back to you soon.");
        }).catch(error => showToast(error.message)).finally(() => { button.disabled = false; });
      });

      // WhatsApp widget
      const widget = $("#wa-widget");
      const waToggle = $("#wa-toggle");
      const waText = $("#wa-text");
      function setWidget(open) {
        widget.classList.toggle("wa-open", open);
        waToggle.setAttribute("aria-expanded", String(open));
        waToggle.setAttribute("aria-label", open ? "Close WhatsApp chat" : "Chat with us on WhatsApp");
        $("#wa-hint").classList.remove("show");
        if (open) setTimeout(() => waText.focus(), 250);
      }
      waToggle.addEventListener("click", () => setWidget(!widget.classList.contains("wa-open")));
      $("#wa-close").addEventListener("click", () => setWidget(false));
      document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        setWidget(false);
        setDrawer(false);
        if (modal.classList.contains("open")) closeCaseModal();
      });
      $$("#wa-topics button").forEach(button => button.addEventListener("click", () => {
        $$("#wa-topics button").forEach(other => other.setAttribute("aria-pressed", String(other === button)));
        waText.value = button.dataset.msg;
        waText.focus();
        waText.setSelectionRange(waText.value.length, waText.value.length);
      }));
      waText.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); $("#wa-form").requestSubmit(); }
      });
      $("#wa-form").addEventListener("submit", event => {
        event.preventDefault();
        const message = waText.value.trim() || "Hi Data Doctor Hub, I need help recovering my data.";
        window.open(waLink(`${message}\n\n(Sent from datadoctorhub.in)`), "_blank", "noopener");
      });

      // Show online / after-hours status using India time (Mon–Sat 10:00–20:00 IST)
      const ist = new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 60000);
      const open = ist.getDay() !== 0 && ist.getHours() >= 10 && ist.getHours() < 20;
      $("#wa-status").textContent = open ? "Online · typically replies in minutes" : "After hours · emergency line active 24/7";
      $("#wa-avatar").classList.toggle("away", !open);
      $("#wa-time").textContent = new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
      setTimeout(() => { if (!widget.classList.contains("wa-open")) $("#wa-hint").classList.add("show"); }, 4000);
      setTimeout(() => $("#wa-hint").classList.remove("show"), 14000);
    })();
  </script>
