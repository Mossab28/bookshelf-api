const API = "";
let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user") || "null");
let authMode = "login";

// ── Init ──
document.addEventListener("DOMContentLoaded", () => {
  if (token) onLoggedIn();
  loadRooms();
});

// ── Auth UI ──
function showLogin() {
  authMode = "login";
  document.getElementById("modal-title").textContent = "Login";
  document.getElementById("auth-name").classList.add("hidden");
  document.getElementById("auth-submit").textContent = "Login";
  document.getElementById("auth-error").textContent = "";
  document.getElementById("modal").classList.remove("hidden");
}

function showRegister() {
  authMode = "register";
  document.getElementById("modal-title").textContent = "Register";
  document.getElementById("auth-name").classList.remove("hidden");
  document.getElementById("auth-submit").textContent = "Register";
  document.getElementById("auth-error").textContent = "";
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

async function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  const name = document.getElementById("auth-name").value;

  const body = authMode === "register" ? { email, password, name } : { email, password };

  try {
    const res = await fetch(`${API}/api/auth/${authMode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    token = data.token;
    currentUser = data.user;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(currentUser));
    closeModal();
    onLoggedIn();
  } catch (err) {
    document.getElementById("auth-error").textContent = err.message;
  }
}

function onLoggedIn() {
  document.getElementById("auth-area").innerHTML =
    `<span class="user-name">${currentUser.name}</span>
     <button class="secondary" onclick="logout()">Logout</button>`;
  document.getElementById("booking-section").classList.remove("hidden");
  document.getElementById("my-bookings-section").classList.remove("hidden");
  loadRoomOptions();
  loadMyBookings();
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  document.getElementById("auth-area").innerHTML =
    `<button onclick="showLogin()">Login</button>
     <button onclick="showRegister()">Register</button>`;
  document.getElementById("booking-section").classList.add("hidden");
  document.getElementById("my-bookings-section").classList.add("hidden");
}

// ── Rooms ──
async function loadRooms() {
  const res = await fetch(`${API}/api/rooms`);
  const rooms = await res.json();

  document.getElementById("rooms").innerHTML = rooms.map(r => `
    <div class="card">
      <h3>${esc(r.name)}</h3>
      <p>${r.capacity} seats · Floor ${r.floor}</p>
      <div class="amenities">
        ${r.amenities.map(a => `<span class="tag">${esc(a)}</span>`).join("")}
      </div>
    </div>
  `).join("");
}

async function loadRoomOptions() {
  const res = await fetch(`${API}/api/rooms`);
  const rooms = await res.json();
  document.getElementById("book-room").innerHTML =
    `<option value="">Select a room</option>` +
    rooms.map(r => `<option value="${r.id}">${esc(r.name)} (${r.capacity} seats)</option>`).join("");
}

// ── Bookings ──
async function handleBooking(e) {
  e.preventDefault();
  const errEl = document.getElementById("booking-error");
  const okEl = document.getElementById("booking-success");
  errEl.textContent = "";
  okEl.textContent = "";

  const body = {
    roomId: document.getElementById("book-room").value,
    title: document.getElementById("book-title").value,
    startTime: new Date(document.getElementById("book-start").value).toISOString(),
    endTime: new Date(document.getElementById("book-end").value).toISOString(),
    notes: document.getElementById("book-notes").value || undefined,
  };

  try {
    const res = await fetch(`${API}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    okEl.textContent = `Booked "${data.title}" in ${data.room.name}`;
    document.getElementById("booking-form").reset();
    loadMyBookings();
  } catch (err) {
    errEl.textContent = err.message;
  }
}

async function loadMyBookings() {
  const res = await fetch(`${API}/api/bookings?mine=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const bookings = await res.json();

  document.getElementById("my-bookings").innerHTML = bookings.length === 0
    ? "<p style='color:#888;font-size:.85rem'>No bookings yet.</p>"
    : bookings.map(b => `
      <div class="booking-item ${b.status === 'CANCELLED' ? 'cancelled' : ''}">
        <div class="info">
          <h4>${esc(b.title)}</h4>
          <p>${esc(b.room.name)} · ${fmtDate(b.startTime)} → ${fmtTime(b.endTime)}</p>
        </div>
        ${b.status === "CONFIRMED"
          ? `<button class="danger" onclick="cancelBooking('${b.id}')">Cancel</button>`
          : `<span style="color:#888;font-size:.8rem">Cancelled</span>`}
      </div>
    `).join("");
}

async function cancelBooking(id) {
  await fetch(`${API}/api/bookings/${id}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  loadMyBookings();
}

// ── Helpers ──
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + " " + fmtTime(iso);
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
