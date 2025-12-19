document.addEventListener('DOMContentLoaded', () => {
    console.log('Orders Page Logic Loaded');

    /* =========================================
       1. CHECKBOXES & EXPORT LOGIC
    ========================================= */
    const checkAll = document.getElementById('checkAll');
    const tableBody = document.getElementById('tableBody');
    const rowCheckboxes = tableBody.querySelectorAll('.row-checkbox'); // .checkbox-item
    const btnExport = document.getElementById('btnExport');

    function updateState() {
        const total = rowCheckboxes.length;
        const checkedCount = document.querySelectorAll('#tableBody .row-checkbox.checkbox-item--checked').length;
        const checkAllInput = checkAll.querySelector('input');

        // Update Header Checkbox
        if (checkedCount === total && total > 0) {
            checkAll.classList.add('checkbox-item--checked');
            checkAllInput.checked = true;
        } else {
            checkAll.classList.remove('checkbox-item--checked');
            checkAllInput.checked = false;
        }

        // Enable Export
        if (checkedCount > 0) {
            btnExport.disabled = false;
            btnExport.style.opacity = '1';
            btnExport.style.cursor = 'pointer';
        } else {
            btnExport.disabled = true;
            btnExport.style.opacity = '0.5';
            btnExport.style.cursor = 'not-allowed';
        }
    }

    // A. Header Checkbox
    checkAll.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return;

        const isChecked = checkAll.classList.toggle('checkbox-item--checked');
        const input = checkAll.querySelector('input');
        input.checked = isChecked;

        rowCheckboxes.forEach(cb => {
            const rowInput = cb.querySelector('input');
            if (isChecked) {
                cb.classList.add('checkbox-item--checked');
                rowInput.checked = true;
            } else {
                cb.classList.remove('checkbox-item--checked');
                rowInput.checked = false;
            }
        });
        updateState();
    });

    // B. Row Checkboxes
    rowCheckboxes.forEach(cb => {
        cb.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT') return;

            const isChecked = cb.classList.toggle('checkbox-item--checked');
            const input = cb.querySelector('input');
            input.checked = isChecked;

            updateState();
        });
    });

    // C. Export
    btnExport.addEventListener('click', () => {
        if (btnExport.disabled) return;

        const selectedRows = [];
        const checkedBoxes = document.querySelectorAll('#tableBody .row-checkbox.checkbox-item--checked');

        checkedBoxes.forEach(cb => {
            // Шукаємо батьківський .data-table__row замість tr
            const row = cb.closest('.data-table__row');
            const id = row.getAttribute('data-id');
            if (id) selectedRows.push(id);
        });

        const exportData = {
            count: selectedRows.length,
            ids: selectedRows
        };

        console.log('=== EXPORT DATA ===');
        console.log(JSON.stringify(exportData, null, 2));
    });


    /* =========================================
       2. STATUS MODAL LOGIC
    ========================================= */
    const modalOverlay = document.getElementById('statusModal');
    const btnCloseX = document.getElementById('modalCloseX');
    const btnCancel = document.getElementById('modalCancel');
    const btnSave = document.getElementById('modalSave');
    const editButtons = document.querySelectorAll('.btn-edit-status');

    let currentRow = null;

    function openModal(row) {
        currentRow = row;
        currentRow.classList.add('row-highlight');
        modalOverlay.classList.add('status-modal--open'); // Новий клас для відкриття
    }

    function closeModal() {
        modalOverlay.classList.remove('status-modal--open');
        if (currentRow) {
            currentRow.classList.remove('row-highlight');
            currentRow = null;
        }
    }

    editButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const row = btn.closest('.data-table__row'); // Новий селектор
            openModal(row);
        });
    });

    btnCloseX.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);

    btnSave.addEventListener('click', () => {
        // const newVal = document.getElementById('statusSelect').value;
        closeModal();
    });
});