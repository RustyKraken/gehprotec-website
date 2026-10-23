/* Scroll-Animationen für die neueren GehProTec-Bereiche.
   Die alten Webflow-Bereiche animiert bereits das externe script.js. */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrollTrigger);

  // Gruppen werden gemeinsam und gestaffelt eingeblendet
  var REVEAL = [
    // Startseite
    ".gp-svc_head > *",
    ".gp-svc_card",
    ".gp-reviews_head > *",
    ".gp-reviews_slider",
    ".gp-cta_content > *",
    ".gp-footer_brand, .gp-footer_column",
    // Infos
    ".gp-about_label",
    ".gp-about_feature-card",
    ".gp-about_stat",
    // Leistungsseiten
    ".gp-lp-intro .gp-about_lead, .gp-lp-intro_text",
    ".gp-svc_head--row > *",
    ".gp-svc-step",
    ".gp-svc-bento_item",
    ".gp-lp .gp-review"
  ];

  var inView = function (el, ratio) {
    return el.getBoundingClientRect().top < window.innerHeight * (ratio || 0.92);
  };

  var done = function (el) {
    el.classList.remove("gp-reveal-active");
    gsap.set(el, { clearProps: "transform,opacity,visibility" });
  };

  /* Auslöser anhand der echten, aktuellen Position (bei jedem Scrollen gemessen).
     Vorberechnete ScrollTrigger-Positionen können veralten, wenn Schriften oder
     Bilder nachladen – dann blieben Inhalte unsichtbar. */
  var watchers = [];
  var watch = function (el, ratio, fn) {
    watchers.push({ el: el, ratio: ratio, fn: fn });
  };
  var check = function () {
    var fired = [];
    watchers = watchers.filter(function (w) {
      if (!inView(w.el, w.ratio)) return true;
      fired.push(w);
      return false;
    });
    // Reveal-Elemente, die gleichzeitig sichtbar werden, gemeinsam staffeln
    var group = [];
    fired.forEach(function (w) {
      if (w.fn) w.fn();
      else group.push(w.el);
    });
    if (group.length) {
      gsap.to(group, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.09,
        onComplete: function () {
          group.forEach(done);
        }
      });
    }
  };
  var queued = false;
  var schedule = function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      check();
    });
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);

  var revealItems = [];
  REVEAL.forEach(function (selector) {
    gsap.utils.toArray(selector).forEach(function (el) {
      // Bereits sichtbare Elemente nicht nachträglich ausblenden (kein Flackern)
      if (inView(el) || revealItems.indexOf(el) !== -1) return;
      revealItems.push(el);
    });
  });
  // in Dokument-Reihenfolge, damit die Staffelung von oben nach unten läuft
  revealItems.sort(function (a, b) {
    return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });
  revealItems.forEach(function (el) {
    el.classList.add("gp-reveal-active");
    watch(el, 0.88);
  });
  gsap.set(revealItems, { autoAlpha: 0, y: 32 });

  // CTA-Karte: weiches Aufziehen
  gsap.utils.toArray(".gp-cta_card").forEach(function (card) {
    if (inView(card)) return;
    gsap.set(card, { scale: 0.96, autoAlpha: 0 });
    watch(card, 0.85, function () {
      gsap.to(card, {
        scale: 1,
        autoAlpha: 1,
        duration: 1,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility"
      });
    });
  });

  // Leichter Parallax-Zoom auf großen Bildern
  [
    ".gp-about_hero-media img",
    ".gp-about_feature-media img",
    ".gp-svc-split_media img",
    ".gp-svc-quote_media img",
    ".gp-cta_media img"
  ].forEach(function (selector) {
    gsap.utils.toArray(selector).forEach(function (img) {
      gsap.fromTo(
        img,
        { scale: 1.12 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: img.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    });
  });

  // Langer Text: startet grau, färbt sich beim Scrollen Wort für Wort schwarz
  gsap.utils.toArray(".gp-about_lead").forEach(function (el) {
    if (el.children.length) return;
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach(function (word, i) {
      var span = document.createElement("span");
      span.className = "gp-word";
      span.textContent = word;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    gsap.fromTo(
      el.querySelectorAll(".gp-word"),
      { color: "#c4c1cc" },
      {
        color: "#202020",
        ease: "none",
        stagger: 0.1,
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          end: "bottom 45%",
          scrub: true
        }
      }
    );
  });

  // Zahlen hochzählen (z. B. „500+“)
  gsap.utils.toArray(".gp-about_stat-value").forEach(function (el) {
    var match = el.textContent.trim().match(/^(\d+)(.*)$/);
    if (!match) return;
    var target = Number(match[1]);
    var suffix = match[2];
    var counter = { value: 0 };
    el.textContent = "0" + suffix;
    watch(el, 0.9, function () {
      gsap.to(counter, {
        value: target,
        duration: 1.8,
        ease: "power2.out",
        onUpdate: function () {
          el.textContent = Math.round(counter.value) + suffix;
        }
      });
    });
  });

  // Content-Sections („Leben mit Amputation“, „Individuelle Fertigung“):
  // Das externe script.js animiert sie gespiegelt und die Schritte separat.
  // Nach dessen Initialisierung übernehmen wir sie mit einer einheitlichen Zeitleiste.
  var unifyContentSections = function () {
    gsap.utils.toArray(".content-container").forEach(function (section) {
      var image = section.querySelector(".content-image");
      var wrapper = section.querySelector(".content-wrapper");
      if (!wrapper) return;
      var steps = section.querySelector(".gp-steps");
      var items = [
        wrapper.querySelector(".h2"),
        wrapper.querySelector(".text.line-height-big")
      ]
        .concat(steps ? gsap.utils.toArray(steps.children) : [])
        .filter(Boolean);
      var all = (image ? [image] : []).concat(items);

      ScrollTrigger.getAll().forEach(function (st) {
        if (st.trigger === section) st.kill();
      });
      gsap.killTweensOf(all);
      if (steps) steps.classList.add("is-visible");
      all.forEach(function (el) {
        el.classList.add("gp-reveal-active");
      });

      if (inView(section, 0.75)) {
        all.forEach(done);
        return;
      }

      gsap.set(all, { autoAlpha: 0, x: 0, y: 32 });
      watch(section, 0.75, function () {
        var tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: function () {
            all.forEach(done);
          }
        });
        if (image) tl.to(image, { autoAlpha: 1, y: 0, duration: 0.9 }, 0);
        tl.to(items, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0.1);
      });
    });
    check();
  };

  var refresh = function () {
    ScrollTrigger.refresh();
    check();
  };
  window.addEventListener("load", function () {
    // erst nach dem externen script.js (das ebenfalls bei „load“ startet)
    setTimeout(function () {
      unifyContentSections();
      refresh();
    }, 0);
  });
  // Scrub-Animationen neu vermessen, sobald die Webfonts da sind
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  check();
})();
