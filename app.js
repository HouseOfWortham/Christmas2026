"use strict";

const STORAGE_KEYS = {
  wishes: "christmas-together-wishes",
  rsvps: "christmas-together-rsvps",
  potluck: "christmas-together-potluck",
  cruiseDate: "christmas-together-cruise-date"
};

let toastTimeout;

const state = {
  wishes: loadList(STORAGE_KEYS.wishes),
  rsvps: loadList(STORAGE_KEYS.rsvps),
  potluck: loadList(STORAGE_KEYS.potluck),
  cruiseDate: loadValue(STORAGE_KEYS.cruiseDate, "")
};

function loadList(key) {
  const value = loadValue(key, []);
  if (!Array.isArray(value)) {
    showToast("Saved information could not be read. New entries will still work in this session.");
    return [];
  }
  return value;
}

function loadValue(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.error(`Unable to read local data for ${key}.`, error);
    showToast("This browser could not read saved plans. Changes will be kept for this visit only.");
    return fallback;
  }
}

function saveValue(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Unable to save local data for ${key}.`, error);
    showToast("Your browser could not save this change. It will only last for this visit.");
    return false;
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 4500);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function commitList(key, property, entries) {
  state[property] = entries;
  saveValue(key, entries);
  renderAll();
}

function renderWishes() {
  const list = document.getElementById("wish-list");
  const showHandled = document.getElementById("show-handled").checked;
  const visible = state.wishes.filter((wish) => showHandled || !wish.handled);
  document.getElementById("wish-count").textContent = `${state.wishes.length} ${state.wishes.length === 1 ? "wish" : "wishes"}`;

  if (!visible.length) {
    list.innerHTML = `<div class="empty-state">${state.wishes.length ? "No wishes to show. Handled gifts are tucked away." : "No wishes just yet. Add the first little hint."}</div>`;
    return;
  }

  list.innerHTML = visible.map((wish) => {
    const storeLabel = wish.link ? (isStoreUrl(wish.link, "giftster.com") ? "GIFTSTER ↗" : "AMAZON ↗") : "";
    return `<article class="wish-item">
      <span class="wish-avatar" aria-hidden="true">${escapeHtml(wish.name.trim().charAt(0).toUpperCase())}</span>
      <div class="wish-main">
        <span class="wish-person">${escapeHtml(wish.name)}</span>
        <span class="wish-title">${escapeHtml(wish.title)}</span>
        ${wish.notes ? `<p class="wish-notes">${escapeHtml(wish.notes)}</p>` : ""}
      </div>
      <div class="wish-actions">
        ${wish.handled ? '<span class="handled-badge">HANDLED</span>' : ""}
        ${wish.link ? `<a class="store-link" href="${escapeHtml(wish.link)}" target="_blank" rel="noopener noreferrer">${storeLabel}</a>` : ""}
        <button class="item-action" type="button" data-wish-action="${wish.handled ? "unhandle" : "handle"}" data-id="${escapeHtml(wish.id)}">${wish.handled ? "Unmark" : "Mark handled"}</button>
        <button class="item-action" type="button" data-wish-action="delete" data-id="${escapeHtml(wish.id)}" aria-label="Remove ${escapeHtml(wish.title)}">Remove</button>
      </div>
    </article>`;
  }).join("");
}

function renderRsvps() {
  const list = document.getElementById("rsvp-list");
  list.innerHTML = state.rsvps.length
    ? state.rsvps.map((rsvp) => `<div class="signup-row"><span>${escapeHtml(rsvp.name)}</span><span>${escapeHtml(rsvp.event)}</span></div>`).join("")
    : '<div class="empty-state">Be the first to sign up for an activity.</div>';
  list.setAttribute("aria-label", `${state.rsvps.length} cruise sign-ups`);
}

function renderPotluck() {
  const list = document.getElementById("potluck-list");
  document.getElementById("potluck-count").textContent = `${state.potluck.length} ${state.potluck.length === 1 ? "dish" : "dishes"}`;
  list.innerHTML = state.potluck.length
    ? state.potluck.map((item) => `<div class="potluck-item">
        <div><span class="potluck-dish">${escapeHtml(item.dish)}</span><span class="potluck-owner">Bringing: ${escapeHtml(item.name)}</span>${item.notes ? `<span class="potluck-notes">${escapeHtml(item.notes)}</span>` : ""}</div>
        <button class="item-action" type="button" data-potluck-delete="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.dish)}">Remove</button>
      </div>`).join("")
    : '<div class="empty-state">The menu is waiting for its first dish.</div>';
}

function renderAll() {
  renderWishes();
  renderRsvps();
  renderPotluck();
}

function isStoreUrl(value, domain) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (url.protocol === "https:" || url.protocol === "http:") &&
      (hostname === domain || hostname.endsWith(`.${domain}`) ||
        (domain === "amazon.com" && hostname === "amzn.to"));
  } catch {
    return false;
  }
}

function setMessage(id, message) {
  document.getElementById(id).textContent = message;
}

function setupWishForm() {
  document.getElementById("wish-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const link = String(data.get("link") || "").trim();
    if (link && !isStoreUrl(link, "amazon.com") && !isStoreUrl(link, "giftster.com")) {
      setMessage("wish-message", "Please use an Amazon or Giftster link.");
      document.getElementById("wish-link").focus();
      return;
    }

    const wish = {
      id: makeId(),
      name: String(data.get("name")).trim(),
      title: String(data.get("title")).trim(),
      link,
      notes: String(data.get("notes") || "").trim(),
      handled: data.has("handled")
    };
    commitList(STORAGE_KEYS.wishes, "wishes", [...state.wishes, wish]);
    form.reset();
    setMessage("wish-message", "Your wish is on the list.");
    window.setTimeout(() => setMessage("wish-message", ""), 3500);
  });

  document.getElementById("show-handled").addEventListener("change", renderWishes);
  document.getElementById("wish-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-wish-action]");
    if (!button) return;
    const { wishAction, id } = button.dataset;
    if (wishAction === "delete") {
      commitList(STORAGE_KEYS.wishes, "wishes", state.wishes.filter((wish) => wish.id !== id));
      return;
    }
    const wishes = state.wishes.map((wish) => wish.id === id ? { ...wish, handled: wishAction === "handle" } : wish);
    commitList(STORAGE_KEYS.wishes, "wishes", wishes);
  });
}

function setupRsvpForm() {
  document.getElementById("rsvp-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const rsvp = { id: makeId(), name: String(data.get("name")).trim(), event: String(data.get("event")) };
    commitList(STORAGE_KEYS.rsvps, "rsvps", [...state.rsvps, rsvp]);
    event.currentTarget.reset();
    setMessage("rsvp-message", "You’re on the list. See you there!");
    window.setTimeout(() => setMessage("rsvp-message", ""), 3500);
  });
}

function setupPotluckForm() {
  document.getElementById("potluck-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const item = {
      id: makeId(),
      name: String(data.get("name")).trim(),
      dish: String(data.get("dish")).trim(),
      notes: String(data.get("notes") || "").trim()
    };
    commitList(STORAGE_KEYS.potluck, "potluck", [...state.potluck, item]);
    event.currentTarget.reset();
    setMessage("potluck-message", "Added to the family menu.");
    window.setTimeout(() => setMessage("potluck-message", ""), 3500);
  });

  document.getElementById("potluck-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-potluck-delete]");
    if (!button) return;
    commitList(STORAGE_KEYS.potluck, "potluck", state.potluck.filter((item) => item.id !== button.dataset.potluckDelete));
  });
}

function localDateFromInput(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysUntil(target) {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((targetDay - today) / 86400000);
}

function formatCountdown(element, target) {
  const days = daysUntil(target);
  if (days === 0) {
    element.innerHTML = '<span class="timer-unit"><strong>It’s</strong>HERE</span><span class="timer-unit"><strong>the</strong>BIG DAY</span><span class="timer-unit"><strong>✳</strong></span>';
    return;
  }
  const months = Math.floor(days / 30);
  const remainderAfterMonths = days % 30;
  const weeks = Math.floor(remainderAfterMonths / 7);
  const remainderDays = remainderAfterMonths % 7;
  const units = [
    ["MONTHS", months],
    ["WEEKS", weeks],
    ["DAYS", remainderDays]
  ];
  element.innerHTML = units.map(([label, amount]) => `<span class="timer-unit"><strong>${String(amount).padStart(2, "0")}</strong>${label}</span>`).join("");
}

function updateCountdowns() {
  const today = new Date();
  let christmasYear = today.getFullYear();
  const christmas = new Date(christmasYear, 11, 25);
  if (today.getTime() > new Date(christmasYear, 11, 25, 23, 59, 59, 999).getTime()) {
    christmasYear += 1;
  }
  const christmasTarget = new Date(christmasYear, 11, 25);
  document.getElementById("christmas-date").textContent = `DEC 25, ${christmasYear}`;
  formatCountdown(document.getElementById("christmas-countdown"), christmasTarget);

  const cruiseTarget = localDateFromInput(state.cruiseDate);
  const subtitle = document.getElementById("cruise-countdown");
  const timer = document.getElementById("cruise-timer");
  if (!cruiseTarget) {
    subtitle.textContent = "Set a date and start the countdown.";
    timer.innerHTML = "";
    return;
  }
  const cruiseDays = daysUntil(cruiseTarget);
  if (cruiseDays < 0) {
    subtitle.textContent = "This sail-away date has passed.";
    timer.innerHTML = "";
    return;
  }
  subtitle.textContent = cruiseDays === 0 ? "Today’s the day. Bon voyage!" : `Only ${cruiseDays} days until we sail.`;
  formatCountdown(timer, cruiseTarget);
}

function setupCruiseDate() {
  const input = document.getElementById("cruise-date");
  input.value = state.cruiseDate;
  input.addEventListener("change", () => {
    state.cruiseDate = input.value;
    saveValue(STORAGE_KEYS.cruiseDate, state.cruiseDate);
    updateCountdowns();
  });
}

setupWishForm();
setupRsvpForm();
setupPotluckForm();
setupCruiseDate();
renderAll();
updateCountdowns();
window.setInterval(updateCountdowns, 60000);
