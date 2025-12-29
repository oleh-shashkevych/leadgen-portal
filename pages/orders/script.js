document.addEventListener('DOMContentLoaded', () => {
    console.log('Page Logic Loaded');

    // === СПІЛЬНІ ЗМІННІ (Оголошуємо один раз тут) ===
    const dataTable = document.querySelector('.data-table');


    /* =========================================
       1. CHECKBOXES & EXPORT LOGIC
    ========================================= */
    const checkAllContainer = document.getElementById('checkAll');
    const checkAllInput = checkAllContainer ? checkAllContainer.querySelector('input') : null;
    const tableBody = document.getElementById('tableBody');
    const rowInputs = tableBody ? tableBody.querySelectorAll('.checkbox-item__input') : [];
    const btnExport = document.getElementById('btnExport');

    function toggleCheckboxVisual(inputElement, isChecked) {
        const wrapper = inputElement.closest('.checkbox-item');
        if (wrapper) {
            isChecked ? wrapper.classList.add('checkbox-item--checked') : wrapper.classList.remove('checkbox-item--checked');
        }
    }

    function updateGlobalState() {
        if (!checkAllInput || !btnExport) return;

        const totalRows = rowInputs.length;
        const checkedRows = Array.from(rowInputs).filter(input => input.checked).length;

        // Логіка хедера
        if (totalRows > 0 && checkedRows === totalRows) {
            checkAllInput.checked = true;
            checkAllContainer.classList.add('checkbox-item--checked');
        } else {
            checkAllInput.checked = false;
            checkAllContainer.classList.remove('checkbox-item--checked');
        }

        // Логіка кнопки Export
        if (checkedRows > 0) {
            btnExport.disabled = false;
            btnExport.style.opacity = '1';
            btnExport.style.cursor = 'pointer';
        } else {
            btnExport.disabled = true;
            btnExport.style.opacity = '0.5';
            btnExport.style.cursor = 'not-allowed';
        }
    }

    // Слухач на Check All
    if (checkAllInput) {
        checkAllInput.addEventListener('change', function () {
            const isChecked = this.checked;
            toggleCheckboxVisual(this, isChecked);
            rowInputs.forEach(input => {
                input.checked = isChecked;
                toggleCheckboxVisual(input, isChecked);
            });
            updateGlobalState();
        });
    }

    // Слухачі на рядки
    rowInputs.forEach(input => {
        input.addEventListener('change', function () {
            toggleCheckboxVisual(this, this.checked);
            updateGlobalState();
        });
    });

    // Кнопка Export
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            if (btnExport.disabled) return;
            const selectedIds = [];
            rowInputs.forEach(input => {
                if (input.checked) {
                    const row = input.closest('.data-table__row');
                    const id = row.getAttribute('data-id');
                    if (id) selectedIds.push(id);
                }
            });
            console.log('=== EXPORT DATA ===', JSON.stringify({ count: selectedIds.length, ids: selectedIds }, null, 2));
        });
    }


    /* =========================================
       2. STATUS EDIT MODAL LOGIC (CUSTOM DROPDOWN)
    ========================================= */
    const modalOverlay = document.getElementById('statusModal');
    const btnCloseX = document.getElementById('modalCloseX');
    const btnCancel = document.getElementById('modalCancel');
    const btnSave = document.getElementById('modalSave');

    // Селектори для кастомного дропдауна в модалці
    const modalDropdown = document.getElementById('modalStatusDropdown');
    const dropdownTriggerText = modalDropdown ? modalDropdown.querySelector('.dropdown-text') : null;
    const dropdownOptions = modalDropdown ? modalDropdown.querySelectorAll('.dropdown-option') : [];

    let currentRow = null;
    let currentBadge = null;

    const statusClasses = {
        'ACTIVE': 'status-badge--active',
        'PLANNED': 'status-badge--planned',
        'COMPLETE': 'status-badge--complete',
        'COMPLETED': 'status-badge--completed',
        'PROSPECT': 'status-badge--prospect',
        'APPROVED': 'status-badge--approved',
        'FUNDED': 'status-badge--funded'
    };

    function openModal(row) {
        currentRow = row;
        currentBadge = row.querySelector('.status-badge');

        currentRow.classList.add('row-highlight');
        modalOverlay.classList.add('status-modal--open');

        if (currentBadge && modalDropdown) {
            const currentStatusText = currentBadge.textContent.trim();

            // 1. Оновлюємо текст на кнопці дропдауна
            if (dropdownTriggerText) {
                dropdownTriggerText.textContent = currentStatusText;
            }

            // 2. Візуально виділяємо опцію в списку
            dropdownOptions.forEach(opt => {
                const val = opt.getAttribute('data-value');
                if (val === currentStatusText) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });
        }
    }

    function closeModal() {
        if (modalOverlay) modalOverlay.classList.remove('status-modal--open');
        // Закриваємо дропдаун, якщо він залишився відкритим
        if (modalDropdown) modalDropdown.classList.remove('open');

        if (currentRow) {
            currentRow.classList.remove('row-highlight');
            currentRow = null;
            currentBadge = null;
        }
    }

    function saveStatus() {
        if (!currentRow || !currentBadge || !modalDropdown) return;

        // Знаходимо вибрану опцію (клас .selected додає ui.js)
        const selectedOption = modalDropdown.querySelector('.dropdown-option.selected');

        let newStatus = '';

        if (selectedOption) {
            newStatus = selectedOption.getAttribute('data-value');
        } else {
            // Фолбек: якщо не клікали, беремо поточний текст
            newStatus = dropdownTriggerText.textContent.trim();
        }

        // 1. Оновлюємо текст
        currentBadge.textContent = newStatus;

        // 2. Оновлюємо колір
        Object.values(statusClasses).forEach(cls => {
            currentBadge.classList.remove(cls);
        });

        const newClass = statusClasses[newStatus];
        if (newClass) {
            currentBadge.classList.add(newClass);
        }

        closeModal();
    }

    // Слухачі кнопок модалки
    if (btnCloseX) btnCloseX.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    if (btnSave) {
        btnSave.addEventListener('click', () => {
            saveStatus();
        });
    }


    /* =========================================
       3. ACTIONS DROPDOWN & TABLE CLICKS
       (Делегування подій)
    ========================================= */

    if (dataTable) {
        dataTable.addEventListener('click', (e) => {
            const target = e.target;

            // --- A. Клік по кнопці редагування статусу (Олівець) ---
            const editBtn = target.closest('.btn-edit-status');
            if (editBtn) {
                e.stopPropagation();
                const row = editBtn.closest('.data-table__row');
                openModal(row);
                return;
            }

            // --- B. Клік по трикрапці (Дропдаун Actions) ---
            const trigger = target.closest('.btn-actions');
            if (trigger) {
                e.stopPropagation();
                const dropdown = trigger.closest('.custom-dropdown');

                // Закрити інші відкриті дропдауни
                document.querySelectorAll('.action-dropdown.open').forEach(d => {
                    if (d !== dropdown) d.classList.remove('open');
                });

                dropdown.classList.toggle('open');
                return;
            }

            // --- C. Клік по пункту меню (Edit/Delete) ---
            const option = target.closest('.dropdown-option');
            if (option) {
                const action = option.getAttribute('data-action');
                const row = option.closest('.data-table__row');
                const rowId = row.getAttribute('data-id');

                // Закриваємо меню
                const dropdown = option.closest('.custom-dropdown');
                dropdown.classList.remove('open');

                console.log(`Action: ${action.toUpperCase()} on Row ID: ${rowId}`);

                if (action === 'edit') {
                    // Тут логіка для Edit з меню Actions
                    // openModal(row); 
                } else if (action === 'delete') {
                    // Тут логіка для Delete
                    // row.remove();
                }
            }
        });
    }

    // Закриття дропдаунів при кліку будь-де поза ними
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.action-dropdown')) {
            document.querySelectorAll('.action-dropdown.open').forEach(d => {
                d.classList.remove('open');
            });
        }
    });

    /* ==========================================================================
       4. APPROVAL DASHBOARD LOGIC (Preserved Functionality)
       ========================================================================== */
    const currentDataType = 'direct';

    const dashboardData = {
        direct: {
            lineChartData: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                funded: [250000, 420000, 300000, 450000, 190000, 440610, 280000, 180000, 95000, 280000, 398000, 250000],
                goal: [280000, 470000, 340000, 480000, 220000, 470000, 310000, 210000, 130000, 320000, 430000, 290000]
            },
            goalsData: [
                { label: 'monthly-goal', currentValue: 440610.37, maxValue: 500000 },
                { label: 'amount-funded', currentValue: 480000, maxValue: 500000 },
                { label: 'previous-total', currentValue: 460000, maxValue: 500000 }
            ],
            statsData: {
                concluded: { value: 2500000, count: 24, optionPercent: 5 },
                killed: { value: 1500000, count: 12, optionPercent: -5 }
            }
        }
    };

    const tableData = {
        direct: [
            { id: 1, representative: 'Michael', totalVol: 188880.84, numOfApprovals: 47, avgSize: 4018.74, contractsSigned: { units: 23, perc: 48.94 }, numOfFunded: { units: 15, perc: 65.22 }, approvedToFunded: { perc: 31.91 } },
            { id: 2, representative: 'Emily', totalVol: 278675.25, numOfApprovals: 15, avgSize: 18578.35, contractsSigned: { units: 10, perc: 66.67 }, numOfFunded: { units: 7, perc: 70.00 }, approvedToFunded: { perc: 46.67 } },
            { id: 3, representative: 'Olivia', totalVol: 95532.77, numOfApprovals: 28, avgSize: 3411.88, contractsSigned: { units: 5, perc: 17.86 }, numOfFunded: { units: 2, perc: 40.00 }, approvedToFunded: { perc: 7.14 } },
            { id: 4, representative: 'James', totalVol: 245671.13, numOfApprovals: 4, avgSize: 61417.78, contractsSigned: { units: 3, perc: 75.00 }, numOfFunded: { units: 1, perc: 33.33 }, approvedToFunded: { perc: 25.00 } },
            { id: 5, representative: 'Damon', totalVol: 150049.21, numOfApprovals: 33, avgSize: 4546.95, contractsSigned: { units: 21, perc: 63.64 }, numOfFunded: { units: 18, perc: 85.71 }, approvedToFunded: { perc: 54.55 } },
            { id: 6, representative: 'Sophia', totalVol: 68912.45, numOfApprovals: 51, avgSize: 1351.22, contractsSigned: { units: 45, perc: 88.24 }, numOfFunded: { units: 20, perc: 44.44 }, approvedToFunded: { perc: 39.22 } },
            { id: 7, representative: 'Filip', totalVol: 298450.96, numOfApprovals: 12, avgSize: 24870.91, contractsSigned: { units: 8, perc: 66.67 }, numOfFunded: { units: 3, perc: 37.50 }, approvedToFunded: { perc: 25.00 } },
            { id: 8, representative: 'Patrick', totalVol: 175231.54, numOfApprovals: 42, avgSize: 4172.18, contractsSigned: { units: 15, perc: 35.71 }, numOfFunded: { units: 1, perc: 6.67 }, approvedToFunded: { perc: 2.38 } },
            { id: 9, representative: 'Eliot', totalVol: 220101.33, numOfApprovals: 22, avgSize: 10004.61, contractsSigned: { units: 1, perc: 4.55 }, numOfFunded: { units: 0, perc: 0.00 }, approvedToFunded: { perc: 0.00 } },
            { id: 10, representative: 'Emma', totalVol: 59881.18, numOfApprovals: 38, avgSize: 1575.82, contractsSigned: { units: 30, perc: 78.95 }, numOfFunded: { units: 25, perc: 83.33 }, approvedToFunded: { perc: 65.79 } },
            { id: 11, representative: 'Cho', totalVol: 199420.57, numOfApprovals: 7, avgSize: 28488.65, contractsSigned: { units: 5, perc: 71.43 }, numOfFunded: { units: 4, perc: 80.00 }, approvedToFunded: { perc: 57.14 } },
            { id: 12, representative: 'Lucas', totalVol: 123456.78, numOfApprovals: 25, avgSize: 4938.27, contractsSigned: { units: 18, perc: 72.00 }, numOfFunded: { units: 9, perc: 50.00 }, approvedToFunded: { perc: 36.00 } },
            { id: 13, representative: 'Noah', totalVol: 88765.43, numOfApprovals: 45, avgSize: 1972.56, contractsSigned: { units: 20, perc: 44.44 }, numOfFunded: { units: 11, perc: 55.00 }, approvedToFunded: { perc: 24.44 } },
            { id: 14, representative: 'Mia', totalVol: 265432.10, numOfApprovals: 18, avgSize: 14746.23, contractsSigned: { units: 12, perc: 66.67 }, numOfFunded: { units: 10, perc: 83.33 }, approvedToFunded: { perc: 55.56 } },
            { id: 15, representative: 'Ava', totalVol: 112233.44, numOfApprovals: 30, avgSize: 3741.11, contractsSigned: { units: 25, perc: 83.33 }, numOfFunded: { units: 15, perc: 60.00 }, approvedToFunded: { perc: 50.00 } },
        ]
    };

    // --- CHART.JS INIT WITH CUSTOM TOOLTIP ---
    const lineChartCtx = document.getElementById('approvalApprovalAmountChart');

    if (lineChartCtx) {
        const initialData = dashboardData[currentDataType].lineChartData;
        const MAX_CHART_VALUE = 500000;

        new Chart(lineChartCtx, {
            type: 'line',
            data: {
                labels: initialData.labels,
                datasets: [{
                    label: 'Funded Amount',
                    data: initialData.funded,
                    fill: true,
                    borderColor: '#159C2A',
                    borderWidth: 3,
                    tension: 0,
                    backgroundColor: context => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, 'rgba(21, 156, 42, 0.4)');
                        gradient.addColorStop(1, 'rgba(21, 156, 42, 0)');
                        return gradient;
                    },
                    pointRadius: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#159C2A',
                    pointBorderWidth: 3,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#232323',
                    pointHoverBorderWidth: 3,
                }, {
                    label: 'Goal Amount',
                    data: initialData.goal,
                    fill: true,
                    borderColor: '#4242f5',
                    borderWidth: 3,
                    tension: 0,
                    backgroundColor: context => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, 'rgba(66, 66, 245, 0.4)');
                        gradient.addColorStop(1, 'rgba(66, 66, 245, 0)');
                        return gradient;
                    },
                    pointRadius: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#4242f5',
                    pointBorderWidth: 3,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#232323',
                    pointHoverBorderWidth: 3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    // CUSTOM TOOLTIP LOGIC (PRESERVED)
                    tooltip: {
                        enabled: false,
                        external: function (context) {
                            let tooltipEl = document.getElementById('chartjs-tooltip');
                            if (!tooltipEl) {
                                tooltipEl = document.createElement('div');
                                tooltipEl.id = 'chartjs-tooltip';
                                Object.assign(tooltipEl.style, {
                                    opacity: 0, pointerEvents: 'none', position: 'absolute',
                                    background: '#fff', borderRadius: '3px', color: '#1B1B1B',
                                    border: '1px solid #E8E9E8', padding: '8px 12px',
                                    fontFamily: 'var(--font-main)', textAlign: 'left', zIndex: 100, transition: 'all .3s ease'
                                });
                                tooltipEl.innerHTML = '<table></table>';
                                document.body.appendChild(tooltipEl);
                            }
                            const tooltipModel = context.tooltip;
                            if (tooltipModel.opacity === 0) {
                                tooltipEl.style.opacity = 0;
                                return;
                            }
                            if (tooltipModel.body) {
                                let innerHtml = '<tbody>';
                                tooltipModel.dataPoints.forEach(function (dataPoint) {
                                    const label = dataPoint.dataset.label;
                                    const val = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dataPoint.raw);
                                    innerHtml += `<tr><td style="font-size: 12px; color: #646564; padding-right: 10px;">${label}</td></tr>`;
                                    innerHtml += `<tr><td style="font-weight: 600; font-size: 14px;">${val}</td></tr>`;
                                });
                                innerHtml += '</tbody>';
                                tooltipEl.querySelector('table').innerHTML = innerHtml;
                            }
                            const { chart } = context;
                            const position = chart.canvas.getBoundingClientRect();
                            tooltipEl.style.opacity = 1;
                            tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
                            tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: MAX_CHART_VALUE,
                        grid: { drawBorder: false, color: ctx => (ctx.tick.value === 0 || ctx.tick.value === MAX_CHART_VALUE) ? 'transparent' : '#EEEEEE' },
                        ticks: { callback: val => val === 500000 ? '500K' : (val > 0 ? `${val / 1000}K` : '0'), padding: 10, font: { size: 12 } }
                    },
                    x: {
                        grid: { drawBorder: false, color: ctx => (ctx.index === 0 || ctx.index === initialData.labels.length - 1) ? 'transparent' : '#CDE3D0' },
                        ticks: { padding: 10, font: { size: 12 } }
                    }
                }
            }
        });
    }

    // --- ANIMATIONS (PRESERVED) ---
    function animateValue(id, start, end, duration, isFull) {
        const obj = document.getElementById(id);
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const val = Math.floor(progress * (end - start) + start);

            if (isFull) {
                obj.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
            } else {
                obj.textContent = `$${Math.round(val / 1000)}k`;
            }
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    const goals = dashboardData[currentDataType].goalsData;
    setTimeout(() => {
        goals.forEach(goal => {
            const circle = document.getElementById(`${goal.label}-circle`);
            if (circle) {
                const pct = (goal.currentValue / goal.maxValue) * 100;
                circle.style.setProperty('--p', pct);

                // Animate Numbers
                animateValue(`${goal.label}-value`, 0, goal.currentValue, 1500, false);
                animateValue(`${goal.label}-full-value`, 0, goal.currentValue, 1500, true);
            }
        });
    }, 500);

    // --- UPDATE STATS TEXT ---
    function updateStats(data) {
        const fmt = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
        document.getElementById('stats-concluded-value').textContent = fmt(data.concluded.value);
        document.getElementById('stats-concluded-count').textContent = data.concluded.count;
        document.getElementById('stats-concluded-total-value').textContent = fmt(data.concluded.value);

        document.getElementById('stats-killed-value').textContent = fmt(data.killed.value);
        document.getElementById('stats-killed-count').textContent = data.killed.count;
        document.getElementById('stats-killed-total-value').textContent = fmt(data.killed.value);
    }
    updateStats(dashboardData[currentDataType].statsData);

    // --- TABLE RENDER ---
    function renderTable(data) {
        const container = document.getElementById('tableContainer');
        container.innerHTML = '';

        const table = document.createElement('div');
        table.className = 'approval-table';

        // Header
        const header = document.createElement('div');
        header.className = 'table__header';
        ['Representative', 'Total Vol', '# of Approvals', 'Avg Size', '# of Signed', '# of Funded', 'Approved : Funded'].forEach(t => {
            const c = document.createElement('div'); c.className = 'table__cell'; c.textContent = t; header.appendChild(c);
        });
        table.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.className = 'table__body';
        const fmt = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
        const colClass = p => p >= 50 ? 'color-green' : 'color-red';

        data.forEach(item => {
            const row = document.createElement('div');
            row.className = 'table__row';
            row.innerHTML = `
                <div class="table__cell">${item.representative}</div>
                <div class="table__cell">${fmt(item.totalVol)}</div>
                <div class="table__cell">${item.numOfApprovals}</div>
                <div class="table__cell">${fmt(item.avgSize)}</div>
                <div class="table__cell">${item.contractsSigned.units} (<span class="${colClass(item.contractsSigned.perc)}">${item.contractsSigned.perc.toFixed(0)}%</span>)</div>
                <div class="table__cell">${item.numOfFunded.units} (<span class="${colClass(item.numOfFunded.perc)}">${item.numOfFunded.perc.toFixed(0)}%</span>)</div>
                <div class="table__cell"><span class="${colClass(item.approvedToFunded.perc)}">${item.approvedToFunded.perc.toFixed(0)}%</span></div>
            `;
            body.appendChild(row);
        });
        table.appendChild(body);

        // Footer (Placeholder for total)
        const footer = document.createElement('div');
        footer.className = 'table__footer';
        footer.innerHTML = `<div class="table__cell">Total</div><div class="table__cell">${fmt(2000000)}</div>`; // Example total
        table.appendChild(footer);

        container.appendChild(table);
    }

    // --- TABS SWITCHER ---
    const lineView = document.getElementById('lineChartContainer');
    const usersView = document.getElementById('usersChartContainer');
    const tableView = document.getElementById('tableContainer');
    const statsRow = document.getElementById('statsRow');

    const btnLine = document.getElementById('toggleLineChart');
    const btnUsers = document.getElementById('toggleUsersChart');
    const btnTable = document.getElementById('toggleTableChart');

    function switchView(view) {
        // Hide all
        [lineView, usersView, tableView].forEach(el => el.classList.add('hidden'));
        [btnLine, btnUsers, btnTable].forEach(el => el.classList.remove('approval__switch-btn--active'));

        if (statsRow) statsRow.classList.add('hidden'); // Hide stats for table/users view by default in your logic

        if (view === 'line') {
            lineView.classList.remove('hidden');
            btnLine.classList.add('approval__switch-btn--active');
            if (statsRow) statsRow.classList.remove('hidden');
        } else if (view === 'users') {
            usersView.classList.remove('hidden');
            btnUsers.classList.add('approval__switch-btn--active');
        } else if (view === 'table') {
            tableView.classList.remove('hidden');
            btnTable.classList.add('approval__switch-btn--active');
            renderTable(tableData[currentDataType]);
        }
    }

    btnLine.addEventListener('click', () => switchView('line'));
    btnUsers.addEventListener('click', () => switchView('users'));
    btnTable.addEventListener('click', () => switchView('table'));
});