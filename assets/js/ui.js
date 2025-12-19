document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       1. GLOBAL TABS LOGIC
       Працює для будь-якого блоку з класом .filter-tabs-wrapper
    ========================================= */
    const tabWrappers = document.querySelectorAll('.filter-tabs-wrapper');

    tabWrappers.forEach(wrapper => {
        const tabs = wrapper.querySelectorAll('.filter-tab');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 1. Прибираємо активний клас у сусідів
                tabs.forEach(t => t.classList.remove('active'));
                // 2. Додаємо активний клас натиснутому
                tab.classList.add('active');

                // (Опціонально) Генеруємо подію, щоб локальний скрипт знав про зміну
                // Це дозволить у script.js слухати подію 'tabChange'
                const event = new CustomEvent('tabChange', {
                    detail: { filter: tab.getAttribute('data-filter') }
                });
                wrapper.dispatchEvent(event);
            });
        });
    });


    /* =========================================
       2. GLOBAL DROPDOWN LOGIC
       Працює для будь-якого блоку .custom-dropdown
    ========================================= */

    // Делегування подій: слухаємо кліки на всьому документі, 
    // щоб обробляти динамічні елементи та закриття по кліку зовні
    document.addEventListener('click', (e) => {
        const target = e.target;

        // --- А. Клік по Трігеру (Відкрити/Закрити) ---
        const trigger = target.closest('.dropdown-trigger');
        if (trigger) {
            const dropdown = trigger.closest('.custom-dropdown');
            // Закриваємо всі інші відкриті дропдауни на сторінці (якщо їх декілька)
            document.querySelectorAll('.custom-dropdown.open').forEach(d => {
                if (d !== dropdown) d.classList.remove('open');
            });
            dropdown.classList.toggle('open');
            return;
        }

        // --- Б. Клік по Опції (Вибір) ---
        const option = target.closest('.dropdown-option');
        if (option) {
            const dropdown = option.closest('.custom-dropdown');
            const triggerText = dropdown.querySelector('.dropdown-text'); // Текст у кнопці

            // 1. Знімаємо вибір з інших опцій в цьому дропдауні
            dropdown.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('selected'));

            // 2. Обираємо поточну
            option.classList.add('selected');

            // 3. Оновлюємо текст кнопки (якщо треба, щоб він змінювався)
            // Беремо текст з .option-text обраного елемента
            const newText = option.querySelector('.option-text').textContent;
            if (triggerText) triggerText.textContent = newText;

            // 4. Закриваємо дропдаун
            dropdown.classList.remove('open');

            // 5. Генеруємо подію для локального скрипта
            const event = new CustomEvent('dropdownChange', {
                detail: { value: option.getAttribute('data-value') }
            });
            dropdown.dispatchEvent(event);
            return;
        }

        // --- В. Клік поза дропдауном (Закрити все) ---
        if (!target.closest('.custom-dropdown')) {
            document.querySelectorAll('.custom-dropdown.open').forEach(d => {
                d.classList.remove('open');
            });
        }
    });

});