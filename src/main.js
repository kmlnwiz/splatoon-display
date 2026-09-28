import './style.css'

const API_BASE = 'https://spla3.yuu26.com/api'
const CACHE_KEY = 'splatoon-display-cache-v1'
const REFRESH_MINUTE = 55
let refreshTimer = null
let rotationTimer = null

const colors = {
  regular: '#a0cc0a',
  fest: '#2851f6',
  bankara: '#fa5a00',
  x: '#00c8b4',
  salmon: '#fa5a00',
  event: '#f93195',
}

const icons = {
  regular: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 15.5c2.2-1.8 4-1.4 5.8.1 2.2 1.8 4.4 2.1 7.1.2M5.5 9.5c1.8-3.9 5.2-5.1 8-2.8 1.1.9 1.7 2.1 2 3.6M6 18.5h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="17.5" cy="8" r="2.1" fill="currentColor"/></svg>',
  bankara: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 2.1 5.3L20 9l-4.5 3.7L17 19l-5-3.2L7 19l1.5-6.3L4 9l5.9-.7L12 3Z" fill="currentColor"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 5 12 14M18 5 6 19" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
  salmon: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12c3.1-5.7 9.4-7.2 15-3.3l-2.4 2.7 2.4 3c-5.6 3.8-12 2.5-15-2.4Z" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/><circle cx="14.8" cy="9.7" r="1.1" fill="currentColor"/><path d="m7 14-2.5 4M7.2 10 5 6.7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  event: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 2.8 2.3 5.4 5.7.6-4.3 3.9 1.2 5.7-4.9-2.9-4.9 2.9 1.2-5.7L4 8.8l5.7-.6L12 2.8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
}

const SPLATOON3_INK_ASSETS = 'https://raw.githubusercontent.com/misenhower/splatoon3.ink/main/src/assets/img'

const ruleIcons = {
  TURF_WAR: `${SPLATOON3_INK_ASSETS}/rules/regular.svg`,
  AREA: `${SPLATOON3_INK_ASSETS}/rules/area.svg`,
  LOFT: `${SPLATOON3_INK_ASSETS}/rules/yagura.svg`,
  GOAL: `${SPLATOON3_INK_ASSETS}/rules/hoko.svg`,
  CLAM: `${SPLATOON3_INK_ASSETS}/rules/asari.svg`,
  FEST: `${SPLATOON3_INK_ASSETS}/rules/regular.svg`,
  DEFAULT: `${SPLATOON3_INK_ASSETS}/rules/regular.svg`,
}

const bossIcons = {
  'ヨコヅナ': `${SPLATOON3_INK_ASSETS}/king-cohozuna.png`,
  'タツ': `${SPLATOON3_INK_ASSETS}/king-horrorboros.png`,
  'ジョー': `${SPLATOON3_INK_ASSETS}/king-megalodontia.png`,
  'オカシラ連合': `${SPLATOON3_INK_ASSETS}/king-triumvirate.png`,
  DEFAULT: `${SPLATOON3_INK_ASSETS}/king-cohozuna.png`,
}

const state = {
  data: null,
  loading: true,
  source: 'live',
  lastUpdated: null,
  error: null,
}

const root = document.querySelector('#root')

root.innerHTML = `
  <div class="display-shell">
    <header class="page-header">
      <div>
        <div class="brand-kicker ink-font">Splatoon3 BATTLE ROTATION</div>
        <h1 class="brand-title">ステージ情報</h1>
      </div>
      <div class="header-status">
        <div class="clock" aria-label="現在時刻">
          <time class="clock-time" id="clock-time">--:--</time>
          <span class="clock-date" id="clock-date">----.--.-- ---</span>
        </div>
        <button class="icon-button" type="button" data-action="refresh" aria-label="情報を更新">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" aria-hidden="true"><path d="M19 8a7.5 7.5 0 1 0 .2 7.7M19 4v4h-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="icon-button" type="button" data-action="fullscreen" aria-label="全画面表示">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" aria-hidden="true"><path d="M8 4H4v4m12-4h4v4M8 20H4v-4m12 4h4v-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </header>
    <main class="schedule-grid" id="schedule" aria-live="polite"></main>
    <footer class="page-footer">
      <div class="live-state">
        <span class="live-dot" id="live-dot"></span>
        <span class="footer-copy" id="status-copy">データを取得しています</span>
      </div>
      <a class="api-credit" href="https://spla3.yuu26.com/" target="_blank" rel="noreferrer">DATA: Spla3 API</a>
    </footer>
  </div>
`

const scheduleElement = document.querySelector('#schedule')
const refreshButton = document.querySelector('[data-action="refresh"]')
const fullscreenButton = document.querySelector('[data-action="fullscreen"]')

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function safeImageUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

function formatTime(value) {
  if (!value) return '--:--'
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function formatRange(slot) {
  if (!slot) return '--:-- - --:--'
  return `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
}

function pickSlots(items = [], now = new Date()) {
  const valid = items
    .filter((item) => item && (item.stages?.length || item.stage))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  const currentIndex = valid.findIndex((item) => {
    const start = new Date(item.start_time)
    const end = new Date(item.end_time)
    return start <= now && now < end
  })

  if (currentIndex >= 0) {
    return [
      { item: valid[currentIndex], stateLabel: 'NOW' },
      { item: valid[currentIndex + 1] ?? null, stateLabel: 'NEXT' },
    ]
  }

  const futureIndex = valid.findIndex((item) => new Date(item.start_time) > now)
  if (futureIndex >= 0) {
    return [
      { item: valid[futureIndex], stateLabel: 'UPCOMING' },
      { item: valid[futureIndex + 1] ?? null, stateLabel: 'AFTER' },
    ]
  }

  return [
    { item: null, stateLabel: 'NOW' },
    { item: null, stateLabel: 'NEXT' },
  ]
}

function buildRegularSchedule(battleData = {}) {
  const regular = battleData.regular ?? []
  const fest = battleData.fest ?? []
  const byStart = new Map(fest.map((slot) => [slot.start_time, slot]))

  return regular.map((slot) => {
    const festSlot = byStart.get(slot.start_time)
    return festSlot?.is_fest && festSlot?.stages?.length ? festSlot : slot
  })
}

function emptySlot() {
  return `
    <div class="empty-slot">
      <strong>情報なし</strong>
      <span>次のスケジュールを<br>待っています</span>
    </div>
  `
}

function imageMarkup(image, name) {
  const url = safeImageUrl(image)
  return `
    <span class="stage-fallback" aria-hidden="true">?</span>
    ${url ? `<img src="${escapeHtml(url)}" alt="" loading="eager" referrerpolicy="no-referrer" onerror="this.dataset.error='true'">` : ''}
    <span class="stage-name">${escapeHtml(name || 'ステージ未定')}</span>
  `
}

function scheduleIcon(src, label, type) {
  return `<span class="schedule-icon ${type}" role="img" aria-label="${escapeHtml(label)}"><img src="${escapeHtml(src)}" alt="" loading="eager" referrerpolicy="no-referrer"></span>`
}

function ruleIconMarkup(slot) {
  const key = slot.rule?.key || (slot.is_fest ? 'FEST' : 'DEFAULT')
  const label = slot.rule?.name || (slot.is_fest ? 'フェスマッチ' : 'ルール未定')
  return scheduleIcon(ruleIcons[key] ?? ruleIcons.DEFAULT, label, 'rule-icon')
}

function bossIconMarkup(slot) {
  const name = slot.boss?.name || 'オカシラ未定'
  const key = Object.keys(bossIcons).find((bossName) => bossName !== 'DEFAULT' && name.includes(bossName))
  return scheduleIcon(bossIcons[key] ?? bossIcons.DEFAULT, `オカシラ ${name}`, 'boss-icon')
}

function battleSlotMarkup(entry, modeKey) {
  const slot = entry.item
  if (!slot) return emptySlot()

  const eventText = modeKey === 'event' && slot.event?.name
    ? `<div class="slot-extra">${escapeHtml(slot.event.name)}</div>`
    : '<div class="slot-extra" aria-hidden="true"></div>'

  return `
    <section class="slot" aria-label="${entry.stateLabel === 'NOW' ? '現在' : '次'}のステージ">
      <div class="slot-heading">
        <div class="slot-leading">
          <span class="slot-state">${escapeHtml(entry.stateLabel)}</span>
          ${ruleIconMarkup(slot)}
        </div>
        <time class="slot-time">${formatRange(slot)}</time>
      </div>
      <div class="stage-stack">
        ${(slot.stages ?? []).slice(0, 2).map((stage) => `
          <div class="stage-tile">${imageMarkup(stage.image, stage.name)}</div>
        `).join('') || emptySlot()}
      </div>
      ${eventText}
    </section>
  `
}

function salmonSlotMarkup(entry) {
  const slot = entry.item
  if (!slot) return emptySlot()

  return `
    <section class="slot" aria-label="${entry.stateLabel === 'NOW' ? '現在' : '次'}のサーモンラン">
      <div class="slot-heading">
        <div class="slot-leading">
          <span class="slot-state">${escapeHtml(entry.stateLabel)}</span>
          ${bossIconMarkup(slot)}
        </div>
        <time class="slot-time">${formatRange(slot)}</time>
      </div>
      <div class="stage-tile salmon-stage">${imageMarkup(slot.stage?.image, slot.stage?.name)}</div>
      <div class="weapon-strip" aria-label="支給ブキ">
        ${(slot.weapons ?? []).slice(0, 4).map((weapon) => {
    const url = safeImageUrl(weapon.image)
    return `
            <div class="weapon" aria-label="${escapeHtml(weapon.name)}">
              ${url ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(weapon.name)}" loading="eager" referrerpolicy="no-referrer" onerror="this.style.opacity='0'">` : ''}
            </div>
          `
  }).join('')}
      </div>
    </section>
  `
}

function modeCard({ key, title, color, icon, slots, salmon = false }) {
  return `
    <article class="mode-card mode-${key}" style="--accent:${color}">
      <header class="mode-header">
        <div class="mode-icon">${icon}</div>
        <div class="mode-title">
          <h2>${escapeHtml(title)}</h2>
        </div>
      </header>
      <div class="slots">
        ${slots.map((entry) => salmon ? salmonSlotMarkup(entry) : battleSlotMarkup(entry, key)).join('')}
      </div>
    </article>
  `
}

function renderSkeletons() {
  scheduleElement.innerHTML = Array.from({ length: 6 }, () => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton-head">
        <div class="skeleton-block"></div>
        <div class="skeleton-line"></div>
      </div>
      <div class="skeleton-body">
        <div class="skeleton-block"></div>
        <div class="skeleton-block"></div>
      </div>
    </div>
  `).join('')
}

function render() {
  if (state.loading && !state.data) {
    renderSkeletons()
    updateFooter()
    return
  }

  if (!state.data) {
    scheduleElement.innerHTML = `
      <section class="error-panel">
        <div>
          <h2>ステージ情報を取得できませんでした</h2>
          <p>通信状態を確認して、右上の更新ボタンを押してください。</p>
        </div>
      </section>
    `
    updateFooter()
    return
  }

  const now = new Date()
  const battle = state.data.battle.result ?? {}
  const regularSchedule = buildRegularSchedule(battle)
  const regularSlots = pickSlots(regularSchedule, now)
  const regularIsFest = regularSlots[0]?.item?.is_fest === true

  const cards = [
    {
      key: 'regular',
      title: regularIsFest ? 'フェスマッチ' : 'ナワバリ',
      color: regularIsFest ? colors.fest : colors.regular,
      icon: icons.regular,
      slots: regularSlots,
    },
    {
      key: 'bankara-open',
      title: 'バンカラ・オープン',
      color: colors.bankara,
      icon: icons.bankara,
      slots: pickSlots(battle.bankara_open, now),
    },
    {
      key: 'bankara-challenge',
      title: 'バンカラ・チャレンジ',
      color: colors.bankara,
      icon: icons.bankara,
      slots: pickSlots(battle.bankara_challenge, now),
    },
    {
      key: 'x',
      title: 'Xマッチ',
      color: colors.x,
      icon: icons.x,
      slots: pickSlots(battle.x, now),
    },
    {
      key: 'salmon',
      title: 'サーモンラン',
      color: colors.salmon,
      icon: icons.salmon,
      slots: pickSlots(state.data.coop.results, now),
      salmon: true,
    },
    {
      key: 'event',
      title: 'イベントマッチ',
      color: colors.event,
      icon: icons.event,
      slots: pickSlots(battle.event, now),
    },
  ]

  scheduleElement.innerHTML = cards.map(modeCard).join('')
  updateFooter()
}

function updateClock() {
  const now = new Date()
  document.querySelector('#clock-time').textContent = new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)

  document.querySelector('#clock-date').textContent = new Intl.DateTimeFormat('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).format(now).replaceAll('/', '.')
}

function updateFooter() {
  const statusCopy = document.querySelector('#status-copy')
  const liveDot = document.querySelector('#live-dot')

  liveDot.classList.toggle('is-error', Boolean(state.error))

  if (state.loading && !state.data) {
    statusCopy.textContent = 'データを取得しています'
    return
  }

  if (state.error && state.data) {
    statusCopy.textContent = 'オフライン・保存済みデータを表示中'
    return
  }

  if (state.error) {
    statusCopy.textContent = 'APIに接続できません'
    return
  }

  const updated = state.lastUpdated ? formatTime(state.lastUpdated) : '--:--'
  statusCopy.textContent = `LIVE・${updated} 更新`
}

async function fetchJson(path, signal) {
  const response = await fetch(`${API_BASE}${path}`, {
    signal,
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`API error: ${response.status}`)
  return response.json()
}

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (!cached?.battle?.result || !cached?.coop?.results) return null
    return cached
  } catch {
    return null
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // The display can continue without a persistent cache.
  }
}

async function loadData({ manual = false } = {}) {
  if (state.loading && manual) return
  state.loading = true
  state.error = null
  refreshButton.classList.add('is-loading')
  refreshButton.disabled = true
  updateFooter()

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 15000)

  try {
    const [battle, coop] = await Promise.all([
      fetchJson('/schedule', controller.signal),
      fetchJson('/coop-grouping/schedule', controller.signal),
    ])
    const data = { battle, coop, cachedAt: new Date().toISOString() }
    state.data = data
    state.source = 'live'
    state.lastUpdated = new Date()
    writeCache(data)
  } catch (error) {
    state.error = error
    const cached = state.data ?? readCache()
    if (cached) {
      state.data = cached
      state.source = 'cache'
      state.lastUpdated = cached.cachedAt ? new Date(cached.cachedAt) : null
    }
  } finally {
    window.clearTimeout(timeout)
    state.loading = false
    refreshButton.classList.remove('is-loading')
    refreshButton.disabled = false
    render()
    scheduleNextRotation()
  }
}

function nextEvenHourRefresh(from = new Date()) {
  const next = new Date(from)
  next.setSeconds(0, 0)

  if (next.getHours() % 2 === 0 && next.getMinutes() < REFRESH_MINUTE) {
    next.setMinutes(REFRESH_MINUTE)
    return next
  }

  next.setMinutes(REFRESH_MINUTE)
  next.setHours(next.getHours() + (next.getHours() % 2 === 0 ? 2 : 1))
  return next
}

function latestEvenHourRefresh(from = new Date()) {
  const latest = new Date(from)
  latest.setSeconds(0, 0)
  latest.setMinutes(REFRESH_MINUTE)

  if (from < latest || latest.getHours() % 2 !== 0) {
    latest.setHours(latest.getHours() - (latest.getHours() % 2 === 0 ? 2 : 1))
  }

  return latest
}

function scheduleApiRefresh() {
  window.clearTimeout(refreshTimer)
  const next = nextEvenHourRefresh()
  refreshTimer = window.setTimeout(async () => {
    await loadData()
    scheduleApiRefresh()
  }, Math.max(1000, next.getTime() - Date.now()))
}

function allScheduleStarts() {
  if (!state.data) return []
  const battle = state.data.battle.result ?? {}
  const groups = [
    buildRegularSchedule(battle),
    battle.bankara_open,
    battle.bankara_challenge,
    battle.x,
    battle.event,
    state.data.coop.results,
  ]

  return groups
    .flatMap((group) => group ?? [])
    .map((item) => new Date(item.start_time).getTime())
    .filter((time) => Number.isFinite(time) && time > Date.now())
}

function scheduleNextRotation() {
  window.clearTimeout(rotationTimer)
  const nextStart = Math.min(...allScheduleStarts())
  if (!Number.isFinite(nextStart)) return

  rotationTimer = window.setTimeout(() => {
    loadData()
  }, Math.max(1000, nextStart - Date.now() + 500))
}

async function enterFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen()
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch {
    // iPad uses standalone mode from "Add to Home Screen" instead.
  }
}

refreshButton.addEventListener('click', () => loadData({ manual: true }))
fullscreenButton.addEventListener('click', enterFullscreen)

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    render()
    scheduleNextRotation()
    const missedRefresh = !state.lastUpdated || state.lastUpdated < latestEvenHourRefresh()
    if (missedRefresh) loadData()
  }
})

updateClock()
window.setInterval(updateClock, 1000)
render()
loadData()
scheduleApiRefresh()
