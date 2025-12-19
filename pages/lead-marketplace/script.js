document.addEventListener('DOMContentLoaded', () => {

    console.log('Lead Marketplace Page Loaded');

    const tabsWrapper = document.getElementById('leadTabs');
    const leadsGrid = document.getElementById('leadsGrid');
    const cards = leadsGrid.querySelectorAll('.lead-card');

    /* === 1. FUNCTION: UPDATE COUNTS === */
    function updateTabCounts() {
        // Знаходимо всі таби
        const tabs = tabsWrapper.querySelectorAll('.filter-tab');

        tabs.forEach(tab => {
            const filterValue = tab.getAttribute('data-filter');
            const countSpan = tab.querySelector('.tab-count');
            let count = 0;

            if (filterValue === 'all') {
                // Якщо 'all', то це просто загальна кількість карток
                count = cards.length;
            } else {
                // Якщо інший фільтр, проходимо по картках і рахуємо збіги
                cards.forEach(card => {
                    const categories = card.getAttribute('data-categories');
                    if (categories && categories.includes(filterValue)) {
                        count++;
                    }
                });
            }

            // Оновлюємо текст всередині span
            if (countSpan) {
                countSpan.textContent = `(${count})`;
            }
        });
    }

    // ВИКЛИКАЄМО ФУНКЦІЮ ОДРАЗУ ПРИ ЗАВАНТАЖЕННІ
    updateTabCounts();


    /* === 2. FILTER LOGIC (Вже існуюча) === */
    function filterCards(filterValue) {
        let visibleCount = 0;

        cards.forEach(card => {
            // Отримуємо категорії поточної картки
            const categories = card.getAttribute('data-categories');

            // Логіка: 
            // 1. Якщо фільтр 'all' -> показуємо все
            // 2. Якщо категорії картки містять вибраний фільтр -> показуємо
            if (filterValue === 'all' || (categories && categories.includes(filterValue))) {
                card.style.display = 'flex'; // Повертаємо display: flex

                // Перезапуск анімації (маленький хак)
                card.style.animation = 'none';
                card.offsetHeight; /* trigger reflow */
                card.style.animation = 'fadeIn 0.4s ease forwards';

                visibleCount++;
            } else {
                card.style.display = 'none'; // Ховаємо
            }
        });

        console.log(`Showing ${visibleCount} cards for filter: ${filterValue}`);
    }

    // Слухаємо подію зміни табу (яка приходить з ui.js)
    if (tabsWrapper) {
        tabsWrapper.addEventListener('tabChange', (e) => {
            const filterValue = e.detail.filter; // 'all', 'recommended', 'new'
            filterCards(filterValue);
        });
    }

    /* === SEARCH & SORT LISTENER (Заглушки) === */
    // Тут можна додати логіку пошуку, якщо потрібно буде пізніше
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            // Тут можна дописати фільтрацію по тексту заголовка
        });
    }

});