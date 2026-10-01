/*
 Roblox Empty Server Finder
 ВАЖНО: GitHub Pages не может безопасно обращаться к Roblox API напрямую
 из-за CORS. Укажи адрес своего CORS-прокси в API_BASE.

 Прокси должен принимать:
   GET ?placeId=123456

 и возвращать:
 {
   "data": [
     {"id":"JOB_ID","playing":0,"maxPlayers":12}
   ],
   "nextPageCursor": null
 }
*/

const API_BASE = "";

const gameUrl = document.getElementById("gameUrl");
const startBtn = document.getElementById("startBtn");
const statusEl = document.getElementById("status");
const checkedEl = document.getElementById("checked");
const resultEl = document.getElementById("result");
const serverInfoEl = document.getElementById("serverInfo");
const joinBtn = document.getElementById("joinBtn");
const logEl = document.getElementById("log");

let running = false;
let checked = 0;

function writeLog(text) {
  logEl.textContent += "\n" + new Date().toLocaleTimeString() + " — " + text;
  logEl.scrollTop = logEl.scrollHeight;
}

function getPlaceId(urlText) {
  try {
    const url = new URL(urlText);
    const match = url.pathname.match(/\/games\/(\d+)/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function stopSearch() {
  running = false;
  startBtn.textContent = "Начать поиск";
  statusEl.textContent = "Остановлен";
}

async function checkServers(placeId) {
  if (!API_BASE) {
    throw new Error("API_BASE не настроен в script.js");
  }

  let cursor = "";

  for (let page = 0; page < 20 && running; page++) {
    let url = API_BASE + "?placeId=" + encodeURIComponent(placeId);

    if (cursor) {
      url += "&cursor=" + encodeURIComponent(cursor);
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const json = await response.json();
    const servers = Array.isArray(json.data) ? json.data : [];

    checked += servers.length;
    checkedEl.textContent = "Проверено серверов: " + checked;

    const empty = servers.find(server => Number(server.playing) === 0);

    if (empty) {
      running = false;
      statusEl.textContent = "Пустой сервер найден";
      resultEl.hidden = false;

      serverInfoEl.textContent =
        "Server ID: " + (empty.id || "не указан") +
        " | Игроков: 0/" + (empty.maxPlayers ?? "?");

      if (empty.joinUrl) {
        joinBtn.href = empty.joinUrl;
      } else {
        joinBtn.href =
          "https://www.roblox.com/games/start?placeId=" +
          encodeURIComponent(placeId) +
          "&gameInstanceId=" +
          encodeURIComponent(empty.id || "");
      }

      writeLog("Найден сервер с 0 игроками.");
      startBtn.textContent = "Начать поиск";
      return true;
    }

    cursor = json.nextPageCursor || "";

    if (!cursor) break;
  }

  return false;
}

async function startSearch() {
  if (running) {
    stopSearch();
    return;
  }

  const placeId = getPlaceId(gameUrl.value.trim());

  if (!placeId) {
    statusEl.textContent = "Ошибка";
    writeLog("Неверная ссылка. Нужен адрес вида /games/123456789/...");
    return;
  }

  if (!API_BASE) {
    statusEl.textContent = "Нужен API-прокси";
    writeLog("Открой script.js и укажи API_BASE.");
    return;
  }

  running = true;
  checked = 0;
  checkedEl.textContent = "Проверено серверов: 0";
  resultEl.hidden = true;
  startBtn.textContent = "Остановить";
  statusEl.textContent = "Идёт поиск...";

  writeLog("Поиск для placeId " + placeId);

  while (running) {
    try {
      const found = await checkServers(placeId);

      if (found) return;

      if (!running) return;

      statusEl.textContent = "Сервер не найден. Повтор через 5 секунд...";
      await new Promise(resolve => setTimeout(resolve, 5000));

      if (running) {
        statusEl.textContent = "Идёт поиск...";
      }
    } catch (error) {
      writeLog("Ошибка: " + error.message);
      stopSearch();
      return;
    }
  }
}

startBtn.addEventListener("click", startSearch);
