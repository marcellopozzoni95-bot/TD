const CACHE = 'td-v5';
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./src/assets/assets.json", "./src/assets/fonts/Braile.ttf", "./src/assets/fonts/DynaPuff.ttf", "./src/assets/fonts/Gaegu-Bold.ttf", "./src/assets/fonts/Lexend.ttf", "./src/assets/fonts/NGC.ttf", "./src/assets/fonts/PixelMPlus.ttf", "./src/assets/fonts/PressStart2P.ttf", "./src/assets/fonts/Rubik.ttf", "./src/assets/fonts/Silkscreen.ttf", "./src/assets/fonts/Unown.ttf", "./src/assets/icon.png", "./src/css/box.css", "./src/css/challenge.css", "./src/css/editor.css", "./src/css/inventory.css", "./src/css/map.css", "./src/css/menu.css", "./src/css/profile.css", "./src/css/scenes.css", "./src/css/shop.css", "./src/css/ui.css", "./src/js/bootstrap.js", "./src/js/config.js", "./src/js/file/audio.js", "./src/js/file/data.js", "./src/js/file/redeemProtocol.js", "./src/js/file/text.js", "./src/js/game/Game.js", "./src/js/game/Init.js", "./src/js/game/Main.js", "./src/js/game/UI.js", "./src/js/game/component/Enemy.js", "./src/js/game/component/Piece.js", "./src/js/game/component/PlacementTile.js", "./src/js/game/component/Pokemon.js", "./src/js/game/component/Projectile.js", "./src/js/game/component/Tower.js", "./src/js/game/controller/DamageController.js", "./src/js/game/controller/ItemController.js", "./src/js/game/controller/ThemeController.js", "./src/js/game/core/Area.js", "./src/js/game/core/Box.js", "./src/js/game/core/Enemy.js", "./src/js/game/core/Player.js", "./src/js/game/core/Shop.js", "./src/js/game/core/Team.js", "./src/js/game/core/TeamManager.js", "./src/js/game/data/abilityData.js", "./src/js/game/data/achievementData.js", "./src/js/game/data/achievementReworkData.js", "./src/js/game/data/enemyData.js", "./src/js/game/data/itemData.js", "./src/js/game/data/passiveData.js", "./src/js/game/data/placementTileData.js", "./src/js/game/data/pokemonData.js", "./src/js/game/data/projectileData.js", "./src/js/game/data/routeData.js", "./src/js/game/data/songData.js", "./src/js/game/data/tagsData.js", "./src/js/game/data/tutorialData.js", "./src/js/game/data/waveData.js", "./src/js/game/data/weatherData.js", "./src/js/game/scenes/BoxScene.js", "./src/js/game/scenes/ChallengeScene.js", "./src/js/game/scenes/ChangePokemonName.js", "./src/js/game/scenes/DefeatScene.js", "./src/js/game/scenes/DexScene.js", "./src/js/game/scenes/DraftScene.js", "./src/js/game/scenes/EditorScene.js", "./src/js/game/scenes/FinalScene.js", "./src/js/game/scenes/InventoryScene.js", "./src/js/game/scenes/MapScene.js", "./src/js/game/scenes/MenuScene.js", "./src/js/game/scenes/NewGameScene.js", "./src/js/game/scenes/PokemonScene.js", "./src/js/game/scenes/ProfileScene.js", "./src/js/game/scenes/ShopScene.js", "./src/js/game/scenes/TutorialScene.js", "./src/js/utils/Element.js", "./src/js/utils/GameScene.js", "./src/js/utils/Input.js", "./src/js/utils/KeyController.js", "./src/js/utils/Redeem.js", "./src/js/utils/SectionScene.js", "./src/js/utils/Sprite.js", "./src/js/utils/Tooltip.js", "./src/js/utils/Utility.js", "./styles.css"];
const inflight = new Map();

async function rangeResponse(res, range) {
  const buf = await res.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
  let start = m[1] ? parseInt(m[1]) : 0;
  let end = m[2] ? parseInt(m[2]) : buf.byteLength - 1;
  if (!m[1] && m[2]) { start = buf.byteLength - parseInt(m[2]); end = buf.byteLength - 1; }
  end = Math.min(end, buf.byteLength - 1);
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

// Scarica un file una sola volta anche se richiesto più volte in contemporanea, e lo salva in cache
function fetchAndStore(cache, path) {
  if (inflight.has(path)) return inflight.get(path).then(r => r.clone());
  const p = fetch(path).then(async res => {
    if (res.ok && res.status === 200) await cache.put(path, res.clone());
    return res;
  }).finally(() => inflight.delete(path));
  inflight.set(path, p);
  return p.then(r => r.clone());
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const range = e.request.headers.get('range');
    const hit = await cache.match(url.pathname);
    if (hit) return range ? rangeResponse(hit, range) : hit;
    try {
      const res = await fetchAndStore(cache, url.pathname);
      return range && res.ok ? rangeResponse(res, range) : res;
    } catch (err) {
      return fetch(e.request);
    }
  })());
});
