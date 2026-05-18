/* SmartSplit · Web Component wrapper.
   Drop <script src="https://justmonikangel.github.io/smartsplit/js/embed.js">
   on any page, then use:

     <smart-split></smart-split>
     <smart-split width="380" height="780"></smart-split>
     <smart-split src="https://justmonikangel.github.io/smartsplit/#capture"></smart-split>

   Renders the full SPA inside an isolated iframe so the host page's
   CSS, JS, and global state can't bleed in (or out).

   This is the "skill" form-factor: ~10 lines of HTML in any other
   product and you get the entire SmartSplit flow. */

(function () {
  "use strict";
  if (window.customElements && customElements.get("smart-split")) return;

  const DEFAULT_SRC = (() => {
    const here = document.currentScript && document.currentScript.src;
    if (here) {
      // /smartsplit/js/embed.js → /smartsplit/
      return here.replace(/\/js\/embed\.js.*$/, "/");
    }
    return "https://justmonikangel.github.io/smartsplit/";
  })();

  class SmartSplitEmbed extends HTMLElement {
    static get observedAttributes() { return ["src", "width", "height", "framed"]; }

    connectedCallback() {
      const root = this.shadowRoot || this.attachShadow({ mode: "open" });
      root.innerHTML = `
        <style>
          :host {
            display: inline-block;
            width: 100%;
            max-width: ${this.getAttribute("width") || "440px"};
            vertical-align: top;
          }
          .frame {
            position: relative;
            width: 100%;
            height: ${this.getAttribute("height") || "900px"};
            max-width: 100%;
            border-radius: 22px;
            overflow: hidden;
            background: #fcf6e9;
            box-shadow: 0 16px 36px rgba(31, 42, 38, 0.10);
            border: 1px solid rgba(31, 42, 38, 0.06);
          }
          iframe {
            width: 100%;
            height: 100%;
            border: 0;
            display: block;
          }
          .credit {
            position: absolute;
            right: 8px;
            bottom: 8px;
            font: 600 10px/1 -apple-system, "Inter", sans-serif;
            color: rgba(31, 42, 38, 0.45);
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(4px);
            border-radius: 999px;
            pointer-events: none;
          }
          :host([framed="false"]) .frame {
            border-radius: 0;
            box-shadow: none;
            border: 0;
          }
        </style>
        <div class="frame">
          <iframe
            title="SmartSplit"
            allow="camera; clipboard-read; clipboard-write"
            loading="lazy"
            src="${this.getAttribute("src") || DEFAULT_SRC}"
          ></iframe>
          <span class="credit">Powered by SmartSplit</span>
        </div>
      `;
    }

    attributeChangedCallback(name, _old, value) {
      if (!this.shadowRoot) return;
      if (name === "src") {
        const ifr = this.shadowRoot.querySelector("iframe");
        if (ifr && value) ifr.src = value;
      }
      if (name === "width") this.style.maxWidth = value || "440px";
      if (name === "height") {
        const f = this.shadowRoot.querySelector(".frame");
        if (f) f.style.height = value || "900px";
      }
    }
  }

  if (window.customElements) {
    customElements.define("smart-split", SmartSplitEmbed);
  }
})();
