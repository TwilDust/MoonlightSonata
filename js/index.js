var swiper = new Swiper(".mySwiper", {
    spaceBetween: 30,
    pagination: {
        el: ".custom-pagination",
        clickable: true,
    },
    navigation: {
        nextEl: ".custom-next", // Указываем класс кнопки вперед
        prevEl: ".custom-prev", // Указываем класс кнопки назад
    },
});

const menuBtn = document.querySelector("#menu-btn");
const menu = document.querySelector(".header-menu");

let menuClosed = true;

menuBtn.addEventListener("click", () => {
    if (menuClosed) {
        menuBtn.style.position = "relative";
        menuBtn.style.bottom = "46.5px";

        menu.style.display = "flex";
        menu.style.flexDirection = "column";
        menuClosed = !menuClosed;
    } else {
        menuBtn.style.bottom = "0px";

        menu.style.display = "none";
        menuClosed = !menuClosed;
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form.column");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Получаем поля формы
        const fioInput = document.getElementById("fio-input");
        const emailInput = document.getElementById("email-input");
        const consentCheckbox = document.getElementById("personal-chbox");
        const submitButton = document.getElementById("send-button");

        const fio = fioInput.value.trim();
        const email = emailInput.value.trim();
        const isConsented = consentCheckbox.checked;

        // Валидация
        if (!fio) {
            alert("Пожалуйста, введите ФИО");
            fioInput.focus();
            return;
        }
        if (!email) {
            alert("Пожалуйста, введите email");
            emailInput.focus();
            return;
        }
        if (!isConsented) {
            alert("Необходимо согласие на обработку персональных данных");
            return;
        }

        // Простая проверка формата email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Введите корректный email");
            emailInput.focus();
            return;
        }

        // Блокируем кнопку, чтобы избежать повторной отправки
        submitButton.disabled = true;

        try {
            const response = await fetch("http://127.0.0.1:3000/api/comment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fio: fio,
                    user_email: email, // сервер ожидает поле user_email
                }),
            });

            const result = await response.json();

            if (response.ok) {
                alert("Комментарий успешно отправлен!");
                form.reset(); // очищаем форму после успеха
            } else {
                alert("Ошибка: " + (result.error || "Неизвестная ошибка"));
            }
        } catch (error) {
            console.error("Ошибка сети:", error);
            alert(
                "Не удалось отправить комментарий. Проверьте подключение к серверу.",
            );
        } finally {
            submitButton.disabled = false; // разблокируем кнопку
        }
    });
});
