document.addEventListener('DOMContentLoaded', () => {
    console.log('Page Logic Loaded');

    // === СПІЛЬНІ ЗМІННІ ===
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
       2. STATUS EDIT MODAL LOGIC
    ========================================= */
    const modalOverlay = document.getElementById('statusModal');
    const btnCloseX = document.getElementById('modalCloseX');
    const btnCancel = document.getElementById('modalCancel');
    const btnSave = document.getElementById('modalSave');

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

            if (dropdownTriggerText) {
                dropdownTriggerText.textContent = currentStatusText;
            }

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
        if (modalDropdown) modalDropdown.classList.remove('open');

        if (currentRow) {
            currentRow.classList.remove('row-highlight');
            currentRow = null;
            currentBadge = null;
        }
    }

    function saveStatus() {
        if (!currentRow || !currentBadge || !modalDropdown) return;

        const selectedOption = modalDropdown.querySelector('.dropdown-option.selected');
        let newStatus = '';

        if (selectedOption) {
            newStatus = selectedOption.getAttribute('data-value');
        } else {
            newStatus = dropdownTriggerText.textContent.trim();
        }

        currentBadge.textContent = newStatus;

        Object.values(statusClasses).forEach(cls => {
            currentBadge.classList.remove(cls);
        });

        const newClass = statusClasses[newStatus];
        if (newClass) {
            currentBadge.classList.add(newClass);
        }

        closeModal();
    }

    if (btnCloseX) btnCloseX.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    if (btnSave) {
        btnSave.addEventListener('click', () => {
            saveStatus();
        });
    }


    /* =========================================
       3. ACTIONS DROPDOWN & TABLE CLICKS
    ========================================= */
    if (dataTable) {
        dataTable.addEventListener('click', (e) => {
            const target = e.target;

            // --- A. Edit Status ---
            const editBtn = target.closest('.btn-edit-status');
            if (editBtn) {
                e.stopPropagation();
                const row = editBtn.closest('.data-table__row');
                openModal(row);
                return;
            }

            // --- B. Actions Dropdown ---
            const trigger = target.closest('.btn-actions');
            if (trigger) {
                e.stopPropagation();
                const dropdown = trigger.closest('.custom-dropdown');

                document.querySelectorAll('.action-dropdown.open').forEach(d => {
                    if (d !== dropdown) d.classList.remove('open');
                });

                dropdown.classList.toggle('open');
                return;
            }

            // --- C. Dropdown Options ---
            const option = target.closest('.dropdown-option');
            if (option) {
                const action = option.getAttribute('data-action');
                const row = option.closest('.data-table__row');
                const rowId = row.getAttribute('data-id');

                const dropdown = option.closest('.custom-dropdown');
                dropdown.classList.remove('open');

                console.log(`Action: ${action.toUpperCase()} on Row ID: ${rowId}`);
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.action-dropdown')) {
            document.querySelectorAll('.action-dropdown.open').forEach(d => {
                d.classList.remove('open');
            });
        }
    });

    /* ==========================================================================
       4. APPROVAL DASHBOARD DATA
       ========================================================================== */
    const currentDataType = 'direct';

    const dashboardData = {
        direct: {
            lineChartData: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                funded: [250000, 250000, 600000, 50000, 730000, 350000, 800000, 530000, 500000, 760000, 80000, 50000],
                goal: [660000, 760000, 80000, 740000, 620000, 450000, 250000, 300000, 970000, 80000, 740000, 50000]
            },
            goalsData: [
                { label: 'monthly-goal', currentValue: 440610.37, maxValue: 500000 },
                { label: 'amount-funded', currentValue: 480000, maxValue: 500000 },
                { label: 'previous-total', currentValue: 600, maxValue: 1000 }
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
        ]
    };

    /* ==========================================================================
       5. USERS CHART LOGIC (UPDATED: Bigger Size, Thicker Lines, Circular Flow)
       ========================================================================== */

    // JSON Data
    const usersChartDataJson = [
        { "label": "Lead In", "value": 26.85, "color": "#0D661A54" },      // Transparent Green
        { "label": "Contact Made", "value": 18.46, "color": "#159C2A" },   // Green
        { "label": "Close Lost", "value": 21.32, "color": "#EB9B00" },     // Orange
        { "label": "Interview", "value": 14.85, "color": "#14AAC7" },      // Blue
        { "label": "Proposal", "value": 9.84, "color": "#6BA31D" },        // Olive
        { "label": "Negotiation", "value": 5.06, "color": "#00A488" }      // Teal
    ];

    // Custom Plugin for Outside Labels
    const outsideLabelsPlugin = {
        id: 'outsideLabels',
        afterDraw: (chart) => {
            const { ctx } = chart;

            chart.data.datasets.forEach((dataset, i) => {
                const meta = chart.getDatasetMeta(i);
                if (meta.hidden) return;

                meta.data.forEach((element, index) => {
                    // Geometry
                    const center = element.getCenterPoint();
                    const model = element;
                    const angle = (element.startAngle + element.endAngle) / 2;
                    const outerRadius = element.outerRadius;

                    // UPDATED: Adjusted line lengths for bigger chart
                    const textRadius = outerRadius + 25;
                    const xEdge = model.x + Math.cos(angle) * outerRadius;
                    const yEdge = model.y + Math.sin(angle) * outerRadius;

                    const xLine = model.x + Math.cos(angle) * (outerRadius + 10);
                    const yLine = model.y + Math.sin(angle) * (outerRadius + 10);

                    const xText = model.x + Math.cos(angle) * textRadius;
                    const yText = model.y + Math.sin(angle) * textRadius;

                    const isLeft = xText < model.x;
                    const extraLineX = isLeft ? -15 : 15;

                    // Draw Line
                    ctx.beginPath();
                    ctx.moveTo(xEdge, yEdge);
                    ctx.lineTo(xLine, yLine);
                    ctx.lineTo(xLine + extraLineX, yLine);
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Draw Text
                    const dataItem = usersChartDataJson[index];
                    const labelText = dataItem.label;
                    const valueText = dataItem.value + '%';

                    const textPosX = xLine + extraLineX + (isLeft ? -5 : 5);

                    ctx.textAlign = isLeft ? 'right' : 'left';
                    ctx.textBaseline = 'middle';

                    // Label (Urbanist, 400, 11px)
                    ctx.font = '400 11px Urbanist';
                    ctx.fillStyle = '#232323';
                    ctx.fillText(labelText, textPosX, yLine - 7);

                    // Value (Urbanist, 600, 11px)
                    ctx.fillStyle = '#666';
                    ctx.font = '600 11px Urbanist';
                    ctx.fillText(valueText, textPosX, yLine + 7);
                });
            });
        }
    };

    let usersChartsInstances = [];

    function renderUsersCharts() {
        const container = document.getElementById('usersChartContainer');

        // 1. ОЧИСТКА
        if (usersChartsInstances.length > 0) {
            usersChartsInstances.forEach(chartInstance => {
                chartInstance.destroy();
            });
            usersChartsInstances = [];
        }

        // 2. Обнулення HTML
        container.innerHTML = '';

        // 3. Створення розмітки
        container.innerHTML = `
            <div class="users-chart__wrapper">
                <div class="users-chart__item"><canvas id="userChart1"></canvas></div>
                <div class="users-chart__item"><canvas id="userChart2"></canvas></div>
            </div>
        `;

        const ctx1 = document.getElementById('userChart1').getContext('2d');
        const ctx2 = document.getElementById('userChart2').getContext('2d');

        const labels = usersChartDataJson.map(d => d.label);
        const dataValues = usersChartDataJson.map(d => d.value);
        const backgroundColors = usersChartDataJson.map(d => d.color);

        const config = {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: backgroundColors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: 40
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                    outsideLabels: true
                },
                cutout: '50%',
                // --- ЗМІНА 1: Вимикаємо анімацію ---
                animation: false
            },
            plugins: [outsideLabelsPlugin]
        };

        // Створюємо нові екземпляри
        usersChartsInstances.push(new Chart(ctx1, config));

        const config2 = JSON.parse(JSON.stringify(config));
        config2.plugins = [outsideLabelsPlugin];

        usersChartsInstances.push(new Chart(ctx2, config2));
    }


    /* ==========================================================================
       6. LINE CHART (ORIGINAL)
       ========================================================================== */
    const lineChartCtx = document.getElementById('approvalApprovalAmountChart');

    if (lineChartCtx) {
        const initialData = dashboardData[currentDataType].lineChartData;
        const MAX_CHART_VALUE = 1000000;
        const labelsWithYear = initialData.labels.map(month => [month, '2025']);

        new Chart(lineChartCtx, {
            type: 'line',
            data: {
                labels: labelsWithYear,
                datasets: [{
                    label: 'Funded Amount',
                    data: initialData.funded,
                    borderColor: '#00A488',
                    borderWidth: 3,
                    tension: 0,
                    fill: false,
                    pointRadius: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#00A488',
                    pointBorderWidth: 3,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#232323',
                    pointHoverBorderWidth: 3,
                }, {
                    label: 'Goal Amount',
                    data: initialData.goal,
                    borderColor: '#6BA31D',
                    borderWidth: 3,
                    tension: 0,
                    fill: false,
                    pointRadius: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#6BA31D',
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
                        min: 0,
                        border: { dash: [4, 4] },
                        grid: { color: '#E8E9E8', drawBorder: false, tickLength: 0 },
                        ticks: {
                            stepSize: 250000,
                            padding: 15,
                            font: { size: 12, family: "'Inter', sans-serif" },
                            color: '#808080',
                            callback: function (value) {
                                if (value === 0) return '0';
                                if (value === 1000000) return '1M';
                                return (value / 1000) + 'K';
                            }
                        }
                    },
                    x: {
                        border: { dash: [4, 4] },
                        grid: { color: '#E8E9E8', drawBorder: false, tickLength: 0 },
                        ticks: { padding: 10, font: { size: 11, family: "'Inter', sans-serif" }, color: '#808080' }
                    }
                }
            }
        });
    }

    /* ==========================================================================
       7. ANIMATIONS
       ========================================================================== */
    function animateValue(id, start, end, duration, isFull) {
        const obj = document.getElementById(id);
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const val = Math.floor(progress * (end - start) + start);

            if (id.includes('previous-total')) {
                obj.textContent = new Intl.NumberFormat('en-US').format(val);
            } else {
                if (isFull) {
                    obj.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
                } else {
                    obj.textContent = `$${Math.round(val / 1000)}k`;
                }
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

                animateValue(`${goal.label}-value`, 0, goal.currentValue, 1500, false);
                animateValue(`${goal.label}-full-value`, 0, goal.currentValue, 1500, true);
            }
        });
    }, 500);

    function updateStats(data) {
        const fmt = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
        document.getElementById('stats-concluded-value').textContent = fmt(data.concluded.value);
        document.getElementById('stats-concluded-count').textContent = data.concluded.count;
        document.getElementById('stats-concluded-total-value').textContent = fmt(data.concluded.value);

        document.getElementById('stats-killed-count').textContent = data.killed.count;
    }
    updateStats(dashboardData[currentDataType].statsData);

    /* ==========================================================================
       8. TABLE RENDER
       ========================================================================== */
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

        const footer = document.createElement('div');
        footer.className = 'table__footer';
        footer.innerHTML = `<div class="table__cell">Total</div><div class="table__cell">${fmt(2000000)}</div>`;
        table.appendChild(footer);

        container.appendChild(table);
    }

    /* ==========================================================================
       9. TABS SWITCHER (UPDATED)
       ========================================================================== */
    const lineView = document.getElementById('lineChartContainer');
    const usersView = document.getElementById('usersChartContainer');
    const tableView = document.getElementById('tableContainer');
    const statsRow = document.getElementById('statsRow');

    const btnLine = document.getElementById('toggleLineChart');
    const btnUsers = document.getElementById('toggleUsersChart');
    const btnTable = document.getElementById('toggleTableChart');

    function switchView(view) {
        if (view === 'line' && btnLine.classList.contains('approval__switch-btn--active')) {
            return;
        }
        if (view === 'users' && btnUsers.classList.contains('approval__switch-btn--active')) {
            return;
        }
        if (view === 'table' && btnTable.classList.contains('approval__switch-btn--active')) {
            return;
        }

        // Hide all logic...
        [lineView, usersView, tableView].forEach(el => el.classList.add('hidden'));
        [btnLine, btnUsers, btnTable].forEach(el => el.classList.remove('approval__switch-btn--active'));

        if (statsRow) statsRow.classList.add('hidden');

        if (view === 'line') {
            lineView.classList.remove('hidden');
            btnLine.classList.add('approval__switch-btn--active');
            if (statsRow) statsRow.classList.remove('hidden');
        } else if (view === 'users') {
            usersView.classList.remove('hidden');
            btnUsers.classList.add('approval__switch-btn--active');

            setTimeout(() => {
                renderUsersCharts();
            }, 50);

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