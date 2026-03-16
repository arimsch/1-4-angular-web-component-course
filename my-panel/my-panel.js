class MyPanel extends HTMLElement {
  static #styles = `
    :host {
      display: block;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      margin: 1rem 0;
    }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
      border-radius: 5px 5px 0 0;
      font-weight: 600;
    }
    .panel-header-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .panel-icons {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .panel-toggle-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .panel-toggle-btn:hover {
      background: #e9ecef;
    }
    .panel-content {
      padding: 1rem;
    }
    .panel-content.collapsed {
      display: none;
    }
    .panel-footer {
      padding: 1rem;
      border-top: 1px solid #dee2e6;
      background: #f8f9fa;
      border-radius: 0 0 5px 5px;
    }
    .panel-footer.hidden {
      display: none;
    }
    .arrow {
      display: inline-block;
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid #6c757d;
      transition: transform 0.2s;
    }
    .arrow.expanded {
      transform: rotate(180deg);
    }
  `;

  static #template = (() => {
    const template = document.createElement("template");
    template.innerHTML = `
      <style>${MyPanel.#styles}</style>
      <div class="panel">
        <div class="panel-header">
          <div class="panel-header-content">
            <slot name="header"><span></span></slot>
          </div>
          <div class="panel-icons"></div>
        </div>
        <div class="panel-content">
          <slot></slot>
        </div>
        <div class="panel-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
    return template;
  })();

  // При изменении атрибута, указанного в observedAttributes(), вызывается attributeChangedCallback
  static observedAttributes = ["header", "toggleable", "collapsed"];

  #panelContent;
  #toggleBtn;
  #panelFooter;
  #footerSlot;
  #arrow;
  #boundToggleHandler;
  #boundSlotChangeHandler;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(MyPanel.#template.content.cloneNode(true));
    this.#initElements();
    this.#boundToggleHandler = this.#toggleHandler.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.shadowRoot) return;

    if (name === "collapsed") {
      this.#updateToggleState(newValue !== null);
    } else if (name === "toggleable") {
      this.#updateToggleButton();
    } else if (name === "header") {
      this.#updateHeader();
    }
  }

  connectedCallback() {
    this.#updateFooterVisibility();
    this.#attachEvents();
  }

  disconnectedCallback() {
    this.#toggleBtn?.removeEventListener("click", this.#boundToggleHandler);
    this.#footerSlot?.removeEventListener(
      "slotchange",
      this.#boundSlotChangeHandler,
    );
  }

  #createToggleButton(collapsed) {
    const iconsContainer = this.shadowRoot.querySelector(".panel-icons");
    if (!iconsContainer) return;

    const button = document.createElement("button");
    button.className = "panel-toggle-btn";
    button.setAttribute("aria-label", "Переключить панель");

    const arrow = document.createElement("span");
    arrow.className = "arrow";
    if (!collapsed) {
      arrow.classList.add("expanded");
    }

    button.appendChild(arrow);
    iconsContainer.appendChild(button);

    return { button, arrow };
  }

  #updateHeader() {
    const headerSlot = this.shadowRoot.querySelector(
      '.panel-header-content slot[name="header"]',
    );
    if (headerSlot) {
      const span =
        headerSlot.nextElementSibling || headerSlot.querySelector("span");
      if (span && span.tagName === "SPAN") {
        span.textContent = this.getAttribute("header") || "Заголовок";
      }
    }
  }

  #updateToggleButton() {
    const toggleable = this.hasAttribute("toggleable");

    if (toggleable && !this.#toggleBtn) {
      const collapsed = this.hasAttribute("collapsed");
      const { button, arrow } = this.#createToggleButton(collapsed);

      this.#toggleBtn = button;
      this.#arrow = arrow;
      this.#attachEvents();
    } else if (!toggleable && this.#toggleBtn) {
      this.#toggleBtn.removeEventListener("click", this.#boundToggleHandler);
      this.#toggleBtn.remove();
      this.#toggleBtn = null;
      this.#arrow = null;
    }
  }

  #attachEvents() {
    if (this.#toggleBtn) {
      this.#toggleBtn.addEventListener("click", this.#boundToggleHandler);
    }

    this.#boundSlotChangeHandler = () => this.#updateFooterVisibility();
    this.#footerSlot.addEventListener(
      "slotchange",
      this.#boundSlotChangeHandler,
    );
  }

  #toggleHandler() {
    if (this.hasAttribute("collapsed")) {
      this.removeAttribute("collapsed");
    } else {
      this.setAttribute("collapsed", "");
    }
  }

  #updateToggleState(collapsed) {
    if (!this.#panelContent) return;

    this.#panelContent.classList.toggle("collapsed", collapsed);
    this.#arrow?.classList.toggle("expanded", !collapsed);
  }

  #initElements() {
    this.#panelContent = this.shadowRoot.querySelector(".panel-content");
    this.#toggleBtn = this.shadowRoot.querySelector(".panel-toggle-btn");
    this.#arrow = this.shadowRoot.querySelector(".arrow");
    this.#panelFooter = this.shadowRoot.querySelector(".panel-footer");
    this.#footerSlot = this.#panelFooter?.querySelector('slot[name="footer"]');
  }

  #updateFooterVisibility() {
    if (!this.#panelFooter || !this.#footerSlot) return;

    const hasFooterContent = this.#footerSlot.assignedNodes().length > 0;
    this.#panelFooter.classList.toggle("hidden", !hasFooterContent);
  }
}

// Регистрируем компонент
customElements.define("my-panel", MyPanel);
