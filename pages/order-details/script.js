document.addEventListener("DOMContentLoaded", () => {
    console.log("Page Logic Loaded (Fixed)");

    // === СПІЛЬНІ ЗМІННІ ===
    const dataTable = document.querySelector(".data-table");
    const checkAllContainer = document.getElementById("checkAll");
    const checkAllInput = checkAllContainer ? checkAllContainer.querySelector("input") : null;
    const tableBody = document.getElementById("tableBody");
    const btnExport = document.getElementById("btnExport");

    // Total Elements
    const totalApprovalEl = document.getElementById("totalApproval");
    const totalRevenueEl = document.getElementById("totalRevenue");

    /* =========================================
       1. HELPER FUNCTIONS & CALCULATIONS
    ========================================= */

    function parseMoney(str) {
        if (!str) return 0;
        const clean = str.replace(/[^0-9.]/g, "");
        return parseFloat(clean) || 0;
    }

    function formatMoney(num, decimals = 2) {
        return "$" + num.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    function calculateTotals() {
        if (!tableBody || !totalApprovalEl || !totalRevenueEl) return;

        let sumApproval = 0;
        let sumRevenue = 0;

        // Берем все строки, КРОМЕ строки итогов
        const rows = tableBody.querySelectorAll(".data-table__row:not(.data-table__row--total)");

        rows.forEach(row => {
            // Если строка скрыта фильтром — пропускаем её
            if (window.getComputedStyle(row).display === 'none') return;

            const appCell = row.querySelector('[data-field="approval"]');
            const revCell = row.querySelector('[data-field="revenue"]');

            if (appCell) sumApproval += parseMoney(appCell.textContent);
            if (revCell) sumRevenue += parseMoney(revCell.textContent);
        });

        totalApprovalEl.textContent = formatMoney(sumApproval, 0);
        totalRevenueEl.textContent = formatMoney(sumRevenue, 2);
    }

    // Запускаем подсчет при старте
    calculateTotals();

    /* =========================================
       2. INLINE EDITING LOGIC (Approval / Revenue)
    ========================================= */

    function handleCellClick(e) {
        const cell = e.target.closest(".editable-cell");
        if (!cell || cell.querySelector("input")) return;

        const fieldType = cell.getAttribute("data-type");
        const fieldName = cell.getAttribute("data-field");
        const rowId = cell.closest(".data-table__row").getAttribute("data-id");

        const currentText = cell.textContent.trim();
        let rawValue = currentText.replace(/[^0-9.]/g, "");

        const input = document.createElement("input");
        input.type = "text";
        input.value = rawValue;
        input.className = "editable-input";

        cell.textContent = "";
        cell.appendChild(input);
        input.focus();

        // Валидация ввода
        input.addEventListener("input", () => {
            if (fieldType === 'integer') {
                input.value = input.value.replace(/[^0-9]/g, "");
            } else {
                input.value = input.value.replace(/[^0-9.]/g, "");
                // Запрет второй точки
                const parts = input.value.split('.');
                if (parts.length > 2) {
                    input.value = parts[0] + '.' + parts.slice(1).join('');
                }
            }
        });

        // Функция сохранения
        const save = () => {
            let newVal = input.value;
            let numVal = parseFloat(newVal) || 0;

            let formattedVal = "";
            if (fieldType === 'integer') {
                formattedVal = formatMoney(Math.floor(numVal), 0);
            } else {
                formattedVal = formatMoney(numVal, 2);
            }

            cell.textContent = formattedVal;

            console.log("=== DATA UPDATE ===", {
                id: rowId,
                field: fieldName,
                value: numVal
            });

            calculateTotals();
        };

        input.addEventListener("blur", save);
        input.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") {
                input.blur();
            }
        });
    }

    if (dataTable) {
        dataTable.addEventListener("click", handleCellClick);
    }

    /* =========================================
       3. CHECKBOXES & EXPORT LOGIC
    ========================================= */
    const rowInputs = tableBody ? tableBody.querySelectorAll(".checkbox-item__input") : [];

    function toggleCheckboxVisual(inputElement, isChecked) {
        const wrapper = inputElement.closest(".checkbox-item");
        if (wrapper) {
            isChecked
                ? wrapper.classList.add("checkbox-item--checked")
                : wrapper.classList.remove("checkbox-item--checked");
        }
    }

    function updateGlobalState() {
        if (!checkAllInput || !btnExport) return;
        const totalRows = rowInputs.length;
        const checkedRows = Array.from(rowInputs).filter(i => i.checked).length;

        if (totalRows > 0 && checkedRows === totalRows) {
            checkAllInput.checked = true;
            checkAllContainer.classList.add("checkbox-item--checked");
        } else {
            checkAllInput.checked = false;
            checkAllContainer.classList.remove("checkbox-item--checked");
        }

        if (checkedRows > 0) {
            btnExport.disabled = false;
            btnExport.style.opacity = "1";
            btnExport.style.cursor = "pointer";
        } else {
            btnExport.disabled = true;
            btnExport.style.opacity = "0.5";
            btnExport.style.cursor = "not-allowed";
        }
    }

    if (checkAllInput) {
        checkAllInput.addEventListener("change", function () {
            const isChecked = this.checked;
            toggleCheckboxVisual(this, isChecked);
            rowInputs.forEach((input) => {
                input.checked = isChecked;
                toggleCheckboxVisual(input, isChecked);
            });
            updateGlobalState();
        });
    }

    rowInputs.forEach((input) => {
        input.addEventListener("change", function () {
            toggleCheckboxVisual(this, this.checked);
            updateGlobalState();
        });
    });

    if (btnExport) {
        btnExport.addEventListener("click", () => {
            if (btnExport.disabled) return;
            const selectedIds = [];
            rowInputs.forEach((input) => {
                if (input.checked) {
                    const row = input.closest(".data-table__row");
                    const id = row.getAttribute("data-id");
                    if (id) selectedIds.push(id);
                }
            });
            console.log("=== EXPORT DATA ===", JSON.stringify({ count: selectedIds.length, ids: selectedIds }, null, 2));
        });
    }

    /* =========================================
       4. STATUS EDIT MODAL (OLD LOGIC RESTORED)
    ========================================= */
    const modalOverlay = document.getElementById("statusModal");
    const btnCloseX = document.getElementById("modalCloseX");
    const btnCancel = document.getElementById("modalCancel");
    const btnSave = document.getElementById("modalSave");

    // Элементы модального дропдауна
    const modalDropdown = document.getElementById("modalStatusDropdown");
    const modalDropdownTrigger = modalDropdown ? modalDropdown.querySelector(".dropdown-trigger") : null;
    const modalDropdownOptions = modalDropdown ? modalDropdown.querySelectorAll(".dropdown-option") : [];
    const modalDropdownText = modalDropdown ? modalDropdown.querySelector(".dropdown-text") : null;

    let currentRow = null;
    let currentBadge = null;

    const statusClasses = {
        ACTIVE: "status-badge--active",
        PLANNED: "status-badge--planned",
        COMPLETE: "status-badge--complete",
        COMPLETED: "status-badge--completed",
        PROSPECT: "status-badge--prospect",
        APPROVED: "status-badge--approved",
        FUNDED: "status-badge--funded",
    };

    function openModal(row) {
        currentRow = row;
        currentBadge = row.querySelector(".status-badge");
        currentRow.classList.add("row-highlight");
        modalOverlay.classList.add("status-modal--open");

        if (currentBadge && modalDropdown) {
            const currentStatusText = currentBadge.textContent.trim();
            if (modalDropdownText) modalDropdownText.textContent = currentStatusText;

            modalDropdownOptions.forEach((opt) => {
                const val = opt.getAttribute("data-value");
                if (val === currentStatusText) opt.classList.add("selected");
                else opt.classList.remove("selected");
            });
        }
    }

    function closeModal() {
        if (modalOverlay) modalOverlay.classList.remove("status-modal--open");
        if (modalDropdown) modalDropdown.classList.remove("open");
        if (currentRow) {
            currentRow.classList.remove("row-highlight");
            currentRow = null;
            currentBadge = null;
        }
    }

    function saveStatus() {
        if (!currentRow || !currentBadge || !modalDropdown) return;
        const selectedOption = modalDropdown.querySelector(".dropdown-option.selected");
        // Если опция выбрана, берем её, иначе оставляем старый текст
        let newStatus = selectedOption ? selectedOption.getAttribute("data-value") : modalDropdownText.textContent.trim();

        currentBadge.textContent = newStatus;
        Object.values(statusClasses).forEach((cls) => currentBadge.classList.remove(cls));
        const newClass = statusClasses[newStatus];
        if (newClass) currentBadge.classList.add(newClass);

        closeModal();
    }

    // Слушатели модального окна
    if (btnCloseX) btnCloseX.addEventListener("click", closeModal);
    if (btnCancel) btnCancel.addEventListener("click", closeModal);
    if (btnSave) btnSave.addEventListener("click", saveStatus);

    // === ЛОГИКА ДРОПДАУНА В МОДАЛКЕ (FIX) ===
    if (modalDropdownTrigger) {
        modalDropdownTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            modalDropdown.classList.toggle("open");
        });
    }

    modalDropdownOptions.forEach(opt => {
        opt.addEventListener("click", (e) => {
            e.stopPropagation();
            // Убираем selected у других
            modalDropdownOptions.forEach(o => o.classList.remove("selected"));
            // Ставим текущему
            opt.classList.add("selected");
            // Обновляем текст триггера
            if (modalDropdownText) {
                modalDropdownText.textContent = opt.getAttribute("data-value");
            }
            // Закрываем
            modalDropdown.classList.remove("open");
        });
    });


    /* =========================================
       5. ACTIONS DROPDOWN & TABLE CLICKS
    ========================================= */
    if (dataTable) {
        dataTable.addEventListener("click", (e) => {
            const target = e.target;

            // 1. Клик по карандашу (открыть модалку)
            const editBtn = target.closest(".btn-edit-status");
            if (editBtn) {
                e.stopPropagation();
                const row = editBtn.closest(".data-table__row");
                openModal(row);
                return;
            }

            // 2. Клик по триггеру Action Dropdown
            const trigger = target.closest(".btn-actions");
            if (trigger) {
                e.stopPropagation();
                const dropdown = trigger.closest(".custom-dropdown");
                // Закрываем другие открытые экшены
                document.querySelectorAll(".action-dropdown.open").forEach((d) => {
                    if (d !== dropdown) d.classList.remove("open");
                });
                dropdown.classList.toggle("open");
                return;
            }

            // 3. Клик по опциям Action (Edit/Delete)
            const option = target.closest(".dropdown-option");
            // Важно: проверяем, что это не опция внутри модального окна
            if (option && !option.closest("#modalStatusDropdown")) {
                const action = option.getAttribute("data-action");
                const row = option.closest(".data-table__row");
                const rowId = row.getAttribute("data-id");

                const dropdown = option.closest(".custom-dropdown");
                if (dropdown) dropdown.classList.remove("open");

                console.log(`Action: ${action.toUpperCase()} on Row ID: ${rowId}`);
                if (action === "delete") {
                    row.remove();
                    calculateTotals();
                }
            }
        });
    }

    // Закрытие всех дропдаунов при клике вне
    document.addEventListener("click", (e) => {
        // Закрываем Actions dropdowns
        if (!e.target.closest(".action-dropdown")) {
            document.querySelectorAll(".action-dropdown.open").forEach((d) => d.classList.remove("open"));
        }
        // Закрываем Modal Status dropdown
        if (modalDropdown && !e.target.closest("#modalStatusDropdown")) {
            modalDropdown.classList.remove("open");
        }
    });

    /* =========================================
       6. COLUMN FILTERS LOGIC (REAL FILTERING)
    ========================================= */

    const filterData = {
        industry: [
            "Construction",
            "Trucking",
            "Restaurant",
            "Retail",
            "Medical Services",
            "IT & Software",
            "Real Estate"
        ],
        revenue: [
            "$0 - $10,000",
            "$10,000 - $50,000",
            "$50,000 - $100,000",
            "$100,000 - $250,000",
            "$250,000 - $500,000",
            "$500,000+"
        ]
    };

    // Глобальное состояние активных фильтров
    let activeFilters = {
        industry: [],
        revenue: []
    };

    let activeDropdown = null;

    // --- HELPER: Парсинг диапазона Revenue ---
    function isRevenueInRange(revenueValue, rangeString) {
        // revenueValue - это число (например 45000)
        // rangeString - это строка типа "$10,000 - $50,000" или "$500,000+"

        const cleanRange = rangeString.replace(/\$/g, '').replace(/,/g, '');

        if (cleanRange.includes('+')) {
            const min = parseFloat(cleanRange.replace('+', ''));
            return revenueValue >= min;
        }

        const parts = cleanRange.split('-');
        if (parts.length === 2) {
            const min = parseFloat(parts[0]);
            const max = parseFloat(parts[1]);
            return revenueValue >= min && revenueValue < max; // или <=, зависит от логики
        }

        return false;
    }

    // --- MAIN: Функция применения фильтров к таблице ---
    function applyFiltersToTable() {
        const rows = tableBody.querySelectorAll(".data-table__row:not(.data-table__row--total)");

        rows.forEach(row => {
            // 1. Получаем данные строки
            // Industry - 3-я ячейка (индекс 2)
            // Revenue - 7-я ячейка (индекс 6). Внимание: там текст "$45,000", нужно распарсить.

            const cells = row.querySelectorAll('.data-table__cell');
            const industryText = cells[2].textContent.trim();
            const revenueText = cells[6].textContent.trim();
            const revenueVal = parseMoney(revenueText); // Используем существующую функцию parseMoney

            // 2. Проверка Industry
            let industryMatch = true;
            if (activeFilters.industry.length > 0) {
                // Если в фильтре что-то выбрано, строка должна совпадать хотя бы с одним значением
                // Используем includes для частичного совпадения или строгое равенство
                // Тут сделаем поиск: входит ли текст ячейки в массив выбранных
                industryMatch = activeFilters.industry.some(filter => industryText.includes(filter));
            }

            // 3. Проверка Revenue
            let revenueMatch = true;
            if (activeFilters.revenue.length > 0) {
                // Строка должна попадать хотя бы в один из выбранных диапазонов
                revenueMatch = activeFilters.revenue.some(range => isRevenueInRange(revenueVal, range));
            }

            // 4. Показываем или скрываем
            if (industryMatch && revenueMatch) {
                row.style.display = "grid"; // Возвращаем grid, так как в CSS row - это grid
            } else {
                row.style.display = "none";
            }
        });

        // После фильтрации обязательно пересчитываем итоги
        calculateTotals();
    }

    // --- UI: Обновление кнопок (подсветка active) ---
    function updateFilterButtonsUI() {
        // Industry Button
        const indBtn = document.querySelector('.data-table__cell[data-column="industry"] .filter-trigger');
        if (activeFilters.industry.length > 0) indBtn.classList.add('active');
        else indBtn.classList.remove('active');

        // Revenue Button
        const revBtn = document.querySelector('.data-table__cell[data-column="revenue"] .filter-trigger');
        if (activeFilters.revenue.length > 0) revBtn.classList.add('active');
        else revBtn.classList.remove('active');
    }

    // --- Функция генерации HTML (почти как раньше, но с восстановлением чекбоксов) ---
    function createDropdownHTML(columnType, items) {
        // Проверяем, какие пункты уже были выбраны ранее
        const currentlySelected = activeFilters[columnType] || [];

        const listItems = items.map(item => {
            const isChecked = currentlySelected.includes(item) ? 'checked' : '';
            return `
            <div class="filter-option-item">
                <input type="checkbox" id="filter-${columnType}-${item.replace(/\s/g, '')}" class="filter-option-input" value="${item}" ${isChecked}>
                <label for="filter-${columnType}-${item.replace(/\s/g, '')}" class="filter-option-label">${item}</label>
            </div>
            `;
        }).join('');

        const dropdown = document.createElement('div');
        dropdown.className = 'filter-dropdown-menu';
        dropdown.setAttribute('data-for', columnType);

        dropdown.innerHTML = `
            <div class="filter-search-box">
                <input type="text" placeholder="Search" class="filter-search-input">
            </div>
            <div class="filter-options-list">
                ${listItems}
            </div>
            <div class="filter-actions">
                <button class="filter-btn filter-btn-apply">Apply</button>
                <button class="filter-btn filter-btn-reset">Reset</button>
            </div>
        `;

        // Логика поиска
        const searchInput = dropdown.querySelector('.filter-search-input');
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            const options = dropdown.querySelectorAll('.filter-option-item');
            options.forEach(opt => {
                const text = opt.querySelector('label').textContent.toLowerCase();
                opt.style.display = text.includes(val) ? 'flex' : 'none';
            });
        });

        // APPLY
        dropdown.querySelector('.filter-btn-apply').addEventListener('click', () => {
            const checkedInputs = dropdown.querySelectorAll('.filter-option-input:checked');
            const values = Array.from(checkedInputs).map(input => input.value);

            // Сохраняем в глобальный стейт
            activeFilters[columnType] = values;

            console.log("Filters Applied:", activeFilters);

            // Запускаем фильтрацию и UI
            applyFiltersToTable();
            updateFilterButtonsUI();
            removeActiveDropdown();
        });

        // RESET
        dropdown.querySelector('.filter-btn-reset').addEventListener('click', () => {
            // Очищаем стейт для этой колонки
            activeFilters[columnType] = [];

            // Сбрасываем чекбоксы визуально
            dropdown.querySelectorAll('.filter-option-input').forEach(inp => inp.checked = false);

            // Применяем пустой фильтр (показать всё)
            applyFiltersToTable();
            updateFilterButtonsUI();
            removeActiveDropdown();
        });

        return dropdown;
    }

    function removeActiveDropdown() {
        if (activeDropdown) {
            activeDropdown.remove();
            activeDropdown = null;
        }
    }

    // Слушатели кнопок в заголовке
    document.querySelectorAll('.data-table__cell--header.has-filter .filter-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const headerCell = btn.closest('.data-table__cell');
            const columnType = headerCell.getAttribute('data-column');

            if (activeDropdown && activeDropdown.getAttribute('data-for') === columnType) {
                removeActiveDropdown();
                return;
            }
            removeActiveDropdown();

            const items = filterData[columnType] || [];
            const dropdownEl = createDropdownHTML(columnType, items);

            document.body.appendChild(dropdownEl);
            activeDropdown = dropdownEl;

            const rect = btn.getBoundingClientRect();
            dropdownEl.style.top = (rect.bottom + window.scrollY + 5) + 'px';
            dropdownEl.style.left = (rect.left + window.scrollX) + 'px';
            dropdownEl.classList.add('show');
        });
    });

    document.addEventListener('click', (e) => {
        if (activeDropdown && !activeDropdown.contains(e.target) && !e.target.closest('.filter-trigger')) {
            removeActiveDropdown();
        }
    });

    window.addEventListener('scroll', () => {
        if (activeDropdown) removeActiveDropdown();
    }, true);
});