# Roblox Empty Server Finder

## Что делает

1. Получает `placeId` из ссылки Roblox.
2. Через Cloudflare Worker обращается к публичному Games API Roblox.
3. Перебирает страницы серверов.
4. Ищет объект, у которого `playing === 0`.
5. Показывает JobId и две ссылки:
   - `roblox://...` — попытка открыть конкретный сервер в приложении;
   - `https://www.roblox.com/games/start?...` — web-вариант.

Roblox официально документирует список игровых серверов как
`/v1/games/{placeId}/servers/{serverType}`. JobId является уникальным идентификатором экземпляра сервера.

## Важно

Сайт не может гарантировать, что сервер останется пустым к моменту нажатия. Публичный сервер может закрыться или в него может зайти другой игрок.

## Установка

### 1. GitHub Pages

Загрузи в репозиторий:

- `index.html`
- `style.css`
- `script.js`

### 2. Cloudflare Worker

Создай новый Worker и замени его код содержимым `worker.js`.

После Deploy скопируй адрес вида:

`https://имя-worker.твой-subdomain.workers.dev`

### 3. Свяжи сайт с Worker

В `script.js` замени:

`const API_BASE = "PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE";`

на адрес своего Worker.

Пример:

`const API_BASE = "https://roblox-empty-finder.example.workers.dev";`

Сохрани `script.js` в GitHub Pages.

## Проверка

Открой сайт и вставь:

`https://www.roblox.com/games/107164765081465/Steal-A-Verity`

Нажми «Начать поиск».

## Ограничение ссылки

Roblox документирует `gameInstanceId` как идентификатор конкретного игрового экземпляра, но на веб-ссылках с `gameInstanceId` встречались случаи, когда Roblox открывал другой сервер. Поэтому кнопка также формирует protocol deep-link `roblox://experiences/start?...`.
