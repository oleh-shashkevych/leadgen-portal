document.addEventListener("DOMContentLoaded", () => {
    console.log("Page Logic Loaded");

    // === СПІЛЬНІ ЗМІННІ (Оголошуємо один раз тут) ===
    const dataTable = document.querySelector(".data-table");

    /* =========================================
       1. CHECKBOXES & EXPORT LOGIC
    ========================================= */
    const checkAllContainer = document.getElementById("checkAll");
    const checkAllInput = checkAllContainer
        ? checkAllContainer.querySelector("input")
        : null;
    const tableBody = document.getElementById("tableBody");
    const rowInputs = tableBody
        ? tableBody.querySelectorAll(".checkbox-item__input")
        : [];
    const btnExport = document.getElementById("btnExport");

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
        const checkedRows = Array.from(rowInputs).filter(
            (input) => input.checked,
        ).length;

        // Логіка хедера
        if (totalRows > 0 && checkedRows === totalRows) {
            checkAllInput.checked = true;
            checkAllContainer.classList.add("checkbox-item--checked");
        } else {
            checkAllInput.checked = false;
            checkAllContainer.classList.remove("checkbox-item--checked");
        }

        // Логіка кнопки Export
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

    // Слухач на Check All
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

    // Слухачі на рядки
    rowInputs.forEach((input) => {
        input.addEventListener("change", function () {
            toggleCheckboxVisual(this, this.checked);
            updateGlobalState();
        });
    });

    // Кнопка Export
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
            console.log(
                "=== EXPORT DATA ===",
                JSON.stringify(
                    { count: selectedIds.length, ids: selectedIds },
                    null,
                    2,
                ),
            );
        });
    }

    /* =========================================
       2. STATUS EDIT MODAL LOGIC (CUSTOM DROPDOWN)
    ========================================= */
    const modalOverlay = document.getElementById("statusModal");
    const btnCloseX = document.getElementById("modalCloseX");
    const btnCancel = document.getElementById("modalCancel");
    const btnSave = document.getElementById("modalSave");

    // Селектори для кастомного дропдауна в модалці
    const modalDropdown = document.getElementById("modalStatusDropdown");
    const dropdownTriggerText = modalDropdown
        ? modalDropdown.querySelector(".dropdown-text")
        : null;
    const dropdownOptions = modalDropdown
        ? modalDropdown.querySelectorAll(".dropdown-option")
        : [];

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

            // 1. Оновлюємо текст на кнопці дропдауна
            if (dropdownTriggerText) {
                dropdownTriggerText.textContent = currentStatusText;
            }

            // 2. Візуально виділяємо опцію в списку
            dropdownOptions.forEach((opt) => {
                const val = opt.getAttribute("data-value");
                if (val === currentStatusText) {
                    opt.classList.add("selected");
                } else {
                    opt.classList.remove("selected");
                }
            });
        }
    }

    function closeModal() {
        if (modalOverlay) modalOverlay.classList.remove("status-modal--open");
        // Закриваємо дропдаун, якщо він залишився відкритим
        if (modalDropdown) modalDropdown.classList.remove("open");

        if (currentRow) {
            currentRow.classList.remove("row-highlight");
            currentRow = null;
            currentBadge = null;
        }
    }

    function saveStatus() {
        if (!currentRow || !currentBadge || !modalDropdown) return;

        // Знаходимо вибрану опцію (клас .selected додає ui.js)
        const selectedOption = modalDropdown.querySelector(
            ".dropdown-option.selected",
        );

        let newStatus = "";

        if (selectedOption) {
            newStatus = selectedOption.getAttribute("data-value");
        } else {
            // Фолбек: якщо не клікали, беремо поточний текст
            newStatus = dropdownTriggerText.textContent.trim();
        }

        // 1. Оновлюємо текст
        currentBadge.textContent = newStatus;

        // 2. Оновлюємо колір
        Object.values(statusClasses).forEach((cls) => {
            currentBadge.classList.remove(cls);
        });

        const newClass = statusClasses[newStatus];
        if (newClass) {
            currentBadge.classList.add(newClass);
        }

        closeModal();
    }

    // Слухачі кнопок модалки
    if (btnCloseX) btnCloseX.addEventListener("click", closeModal);
    if (btnCancel) btnCancel.addEventListener("click", closeModal);
    if (btnSave) {
        btnSave.addEventListener("click", () => {
            saveStatus();
        });
    }

    /* =========================================
       3. ACTIONS DROPDOWN & TABLE CLICKS
       (Делегування подій)
    ========================================= */

    if (dataTable) {
        dataTable.addEventListener("click", (e) => {
            const target = e.target;

            // --- A. Клік по кнопці редагування статусу (Олівець) ---
            const editBtn = target.closest(".btn-edit-status");
            if (editBtn) {
                e.stopPropagation();
                const row = editBtn.closest(".data-table__row");
                openModal(row);
                return;
            }

            // --- B. Клік по трикрапці (Дропдаун Actions) ---
            const trigger = target.closest(".btn-actions");
            if (trigger) {
                e.stopPropagation();
                const dropdown = trigger.closest(".custom-dropdown");

                // Закрити інші відкриті дропдауни
                document
                    .querySelectorAll(".action-dropdown.open")
                    .forEach((d) => {
                        if (d !== dropdown) d.classList.remove("open");
                    });

                dropdown.classList.toggle("open");
                return;
            }

            // --- C. Клік по пункту меню (Edit/Delete) ---
            const option = target.closest(".dropdown-option");
            if (option) {
                const action = option.getAttribute("data-action");
                const row = option.closest(".data-table__row");
                const rowId = row.getAttribute("data-id");

                // Закриваємо меню
                const dropdown = option.closest(".custom-dropdown");
                dropdown.classList.remove("open");

                console.log(
                    `Action: ${action.toUpperCase()} on Row ID: ${rowId}`,
                );

                if (action === "edit") {
                    // Тут логіка для Edit з меню Actions
                    // openModal(row);
                } else if (action === "delete") {
                    // Тут логіка для Delete
                    // row.remove();
                }
            }
        });
    }

    // Закриття дропдаунів при кліку будь-де поза ними
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".action-dropdown")) {
            document.querySelectorAll(".action-dropdown.open").forEach((d) => {
                d.classList.remove("open");
            });
        }
    });
});
