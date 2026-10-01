// После публикации Cloudflare Worker вставь сюда его URL.
// Например: https://roblox-empty-finder.yourname.workers.dev
const API_BASE = "PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE";

const gameUrl = document.getElementById("gameUrl");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusEl = document.getElementById("status");
const checkedEl = document.getElementById("checked");
const foundEl = document.getElementById("found");
const resultEl = document.getElementById("result");
const serverInfo = document.getElementById("serverInfo");
const joinBtn = document.getElementById("joinBtn");
const webJoinBtn = document.getElementById("webJoinBtn");
const logEl = document.getElementById("log");

let running = false;
let checked = 0;
let found = 0;

function log(msg){
  const time = new Date().toLocaleTimeString();
  logEl.textContent = `${time} — ${msg}\n` + logEl.textContent;
}

function getPlaceId(value){
  try{
    const url = new URL(value.trim());
    const m = url.pathname.match(/\/games\/(\d+)/i);
    if(m) return m[1];
    const qp = url.searchParams.get("placeId");
    if(qp && /^\d+$/.test(qp)) return qp;
  }catch(_){}
  const m = value.match(/(?:games\/|placeId=)(\d+)/i);
  return m ? m[1] : null;
}

function setStatus(text){ statusEl.textContent = text; }

function showServer(server, placeId){
  found++;
  foundEl.textContent = found;
  const jobId = server.id;
  const playing = Number(server.playing ?? 0);
  const maxPlayers = Number(server.maxPlayers ?? 0);

  // Protocol deep-link: designed to ask the Roblox app to open this JobId.
  const protocolUrl =
    `roblox://experiences/start?placeId=${encodeURIComponent(placeId)}&gameInstanceId=${encodeURIComponent(jobId)}`;

  // Web deep-link. Roblox has documented gameInstanceId, but reports exist of
  // the web form sometimes falling back to a random server.
  const webUrl =
    `https://www.roblox.com/games/start?placeId=${encodeURIComponent(placeId)}&gameInstanceId=${encodeURIComponent(jobId)}`;

  serverInfo.textContent = `JobId: ${jobId} · Игроков: ${playing}/${maxPlayers}`;
  joinBtn.href = protocolUrl;
  webJoinBtn.href = webUrl;
  resultEl.classList.remove("hidden");
  setStatus("Пустой сервер найден");
  log(`Найден сервер 0/${maxPlayers}: ${jobId}`);
}

async function findEmpty(placeId){
  if(!API_BASE || API_BASE.includes("PASTE_YOUR")){
    setStatus("Нужен API-прокси");
    log("Вставь URL Cloudflare Worker в API_BASE в script.js.");
    return;
  }

  let cursor = "";
  const maxPages = 20;

  for(let page=1; page<=maxPages && running; page++){
    const u = new URL(API_BASE);
    u.searchParams.set("placeId", placeId);
    if(cursor) u.searchParams.set("cursor", cursor);

    log(`Запрос страницы ${page}...`);
    const response = await fetch(u.toString(), {cache:"no-store"});
    const body = await response.json().catch(()=>({}));

    if(!response.ok){
      throw new Error(body.error || `HTTP ${response.status}`);
    }

    const servers = Array.isArray(body.data) ? body.data : [];
    checked += servers.length;
    checkedEl.textContent = checked;

    for(const server of servers){
      if(Number(server.playing) === 0){
        showServer(server, placeId);
        return true;
      }
    }

    cursor = body.nextPageCursor || "";
    if(!cursor) break;
  }

  return false;
}

async function start(){
  const placeId = getPlaceId(gameUrl.value);
  if(!placeId){
    setStatus("Неверная ссылка");
    log("Не удалось определить placeId.");
    return;
  }

  running = true;
  checked = 0;
  found = 0;
  checkedEl.textContent = "0";
  foundEl.textContent = "0";
  resultEl.classList.add("hidden");
  startBtn.disabled = true;
  stopBtn.disabled = false;

  setStatus("Ищу...");
  log(`Ищу пустой публичный сервер для placeId ${placeId}`);

  while(running){
    try{
      const foundEmpty = await findEmpty(placeId);
      if(foundEmpty) break;

      if(running){
        setStatus("Пустого сервера пока нет");
        log("В просмотренных страницах серверов с 0 игроками нет. Повтор через 5 секунд...");
        await new Promise(r=>setTimeout(r,5000));
      }
    }catch(err){
      setStatus("Ошибка API");
      log(`Ошибка: ${err.message}`);
      await new Promise(r=>setTimeout(r,5000));
    }
  }

  startBtn.disabled = false;
  stopBtn.disabled = true;
  if(!running) setStatus("Остановлено");
}

function stop(){
  running = false;
  log("Поиск остановлен.");
}

startBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);

log("Готов. Вставь URL игры и нажми «Начать поиск».");
