/* Video-Popup für alle Elemente mit youtube-src (Hero und Erfahrungsberichte) */
(function () {
  function toYouTubeEmbed(url) {
    if (!url) return "";
    try {
      var parsed = new URL(url, window.location.origin);
      var host = parsed.hostname.replace("www.", "");
      var id = "";
      if (host === "youtu.be") {
        id = parsed.pathname.replace(/\//g, "");
      } else if (
        host.indexOf("youtube.com") > -1 ||
        host.indexOf("youtube-nocookie.com") > -1
      ) {
        if (parsed.pathname.indexOf("/shorts/") === 0) {
          id = parsed.pathname.split("/shorts/")[1].split("/")[0];
        } else if (parsed.pathname.indexOf("/embed/") === 0) {
          id = parsed.pathname.split("/embed/")[1].split("/")[0];
        } else {
          id = parsed.searchParams.get("v") || "";
        }
      }
      if (!id) return "";
      return (
        "https://www.youtube-nocookie.com/embed/" +
        id +
        "?autoplay=1&rel=0&modestbranding=1&playsinline=1"
      );
    } catch (error) {
      return "";
    }
  }
  var style = document.createElement("style");
  style.textContent = `
    .gp-review-modal {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(10, 10, 14, .76);
      opacity: 0;
      visibility: hidden;
      transition: opacity .25s ease, visibility .25s ease;
      z-index: 99999;
    }
    .gp-review-modal.is-open {
      opacity: 1;
      visibility: visible;
    }
    .gp-review-modal__dialog {
      position: relative;
      width: min(960px, 100%);
      background: #000;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 24px 80px rgba(0, 0, 0, .45);
      transform: scale(.96);
      transition: transform .25s ease;
    }
    .gp-review-modal.is-open .gp-review-modal__dialog {
      transform: scale(1);
    }
    .gp-review-modal__close {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 42px;
      height: 42px;
      border: 0;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, .14);
      color: #fff;
      cursor: pointer;
      z-index: 2;
      transition: background-color .2s ease, transform .2s ease;
    }
    .gp-review-modal__close:hover {
      background: rgba(255, 255, 255, .22);
      transform: scale(1.06);
    }
    .gp-review-modal__close:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }
    .gp-review-modal__icon {
      font-size: 24px;
      line-height: 1;
      transform: translateY(-1px);
    }
    .gp-review-modal__video {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #000;
    }
    .gp-review-modal__video iframe {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
    }
  `;
  document.head.appendChild(style);
  var modal = document.createElement("div");
  modal.className = "gp-review-modal";
  modal.innerHTML = `
    <div class="gp-review-modal__dialog" role="dialog" aria-modal="true" aria-label="Video Popup">
      <button class="gp-review-modal__close" type="button" aria-label="Popup schliessen">
        <span class="gp-review-modal__icon">&times;</span>
      </button>
      <div class="gp-review-modal__video">
        <iframe
          src=""
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin">
        </iframe>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  var iframe = modal.querySelector("iframe");
  var closeButton = modal.querySelector(".gp-review-modal__close");
  var previousHtmlOverflow = "";
  var previousBodyOverflow = "";
  var lastTrigger = null;
  function closeModal() {
    modal.classList.remove("is-open");
    iframe.src = "";
    document.documentElement.style.overflow = previousHtmlOverflow;
    document.body.style.overflow = previousBodyOverflow;
    if (lastTrigger) lastTrigger.focus();
    document.dispatchEvent(new CustomEvent("gp-video-modal:close"));
  }
  function openModal(url) {
    var embedUrl = toYouTubeEmbed(url);
    if (!embedUrl) return;
    previousHtmlOverflow = document.documentElement.style.overflow;
    previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    iframe.src = embedUrl;
    modal.classList.add("is-open");
    document.dispatchEvent(new CustomEvent("gp-video-modal:open"));
    requestAnimationFrame(function () {
      closeButton.focus();
    });
  }
  document.addEventListener("click", function (event) {
    var trigger = event.target.closest && event.target.closest("[youtube-src]");
    if (!trigger) return;
    event.preventDefault();
    lastTrigger = trigger;
    openModal(trigger.getAttribute("youtube-src"));
  });
  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("click", function (event) {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
})();
