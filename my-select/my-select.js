class MySelect extends HTMLElement {
  constructor() {
    super();

    this.selectTemplates = {
      mainElContent: (selectPopupOptions) => `
        <button class="select-button">Select</button>
        <div class="select-popup">
          <slot name="search">
            <input class="select-popup-search" placeholder="Search..."/>
          </slot>
          ${selectPopupOptions}
        </div>
      `,

      option: (data) => `
        <label class="option" data-value="${data.value}">
          <input type="checkbox"/>
          ${data.textContent}
        </label>
      `,

      selectPopupOptions: (options) => `
        <div class="select-popup-options">
          ${options}
        </div>
      `,
    };
  }

  #selectButton;
  #selectPopup;
  #selectPopupSearch;
  #optionsBox;
  #shadow;
  #searchSlot;
  #selectedValues = [];

  connectedCallback() {
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#createTemplate();
  }

  get value() {
    return this.#selectedValues.join(',');
  }

  #createTemplate() {
    const options = Array.from(this.querySelectorAll("option"));
    this.#removeOptions();
    const selectPopupOptions = this.#renderOptions(options);
    const template = document.createElement("template");
    template.innerHTML =
      this.#getStyles() +
      this.selectTemplates.mainElContent(selectPopupOptions);
    this.#shadow.append(template.content.cloneNode(true));
    this.#initElements();
    this.#addEventListeners();
  }

  #renderOptions(options) {
    const optionsHTML = options
      .map((opt) => this.selectTemplates.option(opt))
      .join("");
    return this.selectTemplates.selectPopupOptions(optionsHTML);
  }

  #removeOptions() {
    this.querySelectorAll("option").forEach((opt) => opt.remove());
  }

  #initElements() {
    this.#selectPopup = this.#shadow.querySelector(".select-popup");
    this.#optionsBox = this.#shadow.querySelector(".select-popup-options");
    this.#selectButton = this.#shadow.querySelector(".select-button");
    this.#searchSlot = this.#shadow.querySelector('slot[name="search"]');
    this.#initSearchInput();
    // this.#updateButtonText();
  }

  #initSearchInput() {
    const slottedElements = this.#searchSlot.assignedElements();
    const container = slottedElements[0];
    this.#selectPopupSearch = container?.querySelector('input') || container;
  }

  #addEventListeners() {
    // Открывает/закрывает выпадающий список
    this.#selectButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#openPopup();
    });

    // Закрытие по клику вне компонента
    document.addEventListener("click", (e) => {
      if (!this.contains(e.target)) {
        this.#selectPopup.classList.remove("open");
      }
    });

    // Поиск
    if (this.#selectPopupSearch) {
      this.#selectPopupSearch.addEventListener('input', (e) => {
        const searchText = e.target.value.toLowerCase();
        const options = this.#optionsBox.querySelectorAll('.option');

        options.forEach(option => {
          const text = option.textContent.toLowerCase();
          option.style.display = text.includes(searchText) ? 'flex' : 'none';
        });
      });
    }

    // Обработка выбора опций
    this.#optionsBox.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        this.#handleCheckboxChange(e.target);
      }
    });
  }

  #handleCheckboxChange(checkbox) {
    const option = checkbox.closest('.option');
    const value = option.dataset.value;

    if (checkbox.checked) {
      if (!this.#selectedValues.includes(value)) {
        this.#selectedValues.push(value);
      }
    } else {
      this.#selectedValues = this.#selectedValues.filter(v => v !== value);
    }

    this.#updateButtonText();
  }

  #updateButtonText() {
    if (this.#selectedValues.length === 0) {
      this.#selectButton.textContent = 'Select';
    } else if (this.#selectedValues.length <= 3) {
      const selectedNames = this.#selectedValues.map(value => {
        const option = this.#optionsBox.querySelector(`[data-value="${value}"]`);
        return option?.textContent.trim() || value;
      });
      this.#selectButton.textContent = selectedNames.join(', ');
    } else {
      this.#selectButton.textContent = `Выбрано: ${this.#selectedValues.length}`;
    }
  }

  #openPopup() {
    this.#selectPopup.classList.toggle("open");
  }

  #getStyles() {
    return `
      <style>
          :host {
            position: relative;
            display: inline-block;
            width: 100%;
            max-width: 300px;
          }

          .select-popup {
            top: 100%;
            left: 0;
            right: 0;
            z-index: 100;
            position: absolute;
            display: none;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
          }

          .select-popup.open{
            display: block;
          }

          .select-button {
            position: relative;
            width: 100%;
            padding: 0.5rem 0.75rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            color: #334155;
            font-size: 14px;
            line-height: 1.5;
            text-align: left;
            cursor: pointer;
            transition: border-color 0.15s, box-shadow 0.15s;
          }
          
          .select-button:hover {
            border-color: #3B82F6;
          }

          .select-button::after {
            position: absolute;
            right: 10px;
            top: 50%;
            content: "▼";
            transform: translateY(-50%);
            font-size: 12px;
            color: #64748B;
            transition: transform 0.3s;
          }
          
          .select-popup-options {
            max-height: 200px;
            overflow-y: auto;
          }
          
          .option {
            display: flex;
            align-items: center;
            padding: 0.7rem 0.75rem;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .option:hover {
            background-color: #f8f9fa;
          }
          
          .option input[type="checkbox"] {
            margin-right: 10px;
            width: 1rem;
            height: 1rem;
            cursor: pointer;
          }
      </style>
    `;
  }
}

customElements.define("my-select", MySelect);
