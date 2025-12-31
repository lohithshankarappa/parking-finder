"use strict";

const API = "/api";

/* =====================================================
   TOAST SYSTEM
===================================================== */
function showToast(type, message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${type === "success" ? "✔" : "✖"}</div>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* =====================================================
   AUTH HELPERS
===================================================== */
function getToken() {
  return sessionStorage.getItem("token");
}

function requireAuth() {
  if (!getToken()) window.location.href = "login.html";
}

function logout() {
  sessionStorage.removeItem("token");
  window.location.href = "intro.html";
}

/* =====================================================
   REGISTER
===================================================== */
async function register() {
  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("re")?.value.trim();
  const password = document.getElementById("rp")?.value.trim();

  if (!name || !email || !password) {
    showToast("error", "Please fill all fields");
    return;
  }

  const res = await fetch(API + "/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    showToast("error", data.message || "Registration failed");
    return;
  }

  showToast("success", "Registration successful");
  setTimeout(() => window.location.href = "login.html", 1200);
}

/* =====================================================
   LOGIN
===================================================== */
async function login() {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!email || !password) {
    showToast("error", "Enter email and password");
    return;
  }

  const res = await fetch(API + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    showToast("error", data.message || "Login failed");
    return;
  }

  sessionStorage.setItem("token", data.token);
  showToast("success", "Login successful");
  setTimeout(() => window.location.href = "home.html", 800);
}

/* =====================================================
   LOAD USER
===================================================== */
async function loadUser() {
  const el = document.getElementById("userName");
  if (!el) return;

  const res = await fetch(API + "/auth/me", {
    headers: { Authorization: "Bearer " + getToken() }
  });

  if (!res.ok) return;
  const user = await res.json();
  el.innerText = `Hello ${user.name} 👋`;
}

/* =====================================================
   HOME LOAD
===================================================== */
function load() {
  requireAuth();
  loadUser();
  loadLocations();
  loadMyBookings();
}

/* =====================================================
   LOCATIONS
===================================================== */
async function loadLocations() {
  const list = document.getElementById("list");
  if (!list) return;

  const area = document.getElementById("area")?.value.trim() || "";

  const res = await fetch(
    `${API}/locations?area=${encodeURIComponent(area)}`,
    { headers: { Authorization: "Bearer " + getToken() } }
  );

  if (!res.ok) return;

  const locations = await res.json();
  list.innerHTML = "";

  if (!locations.length) {
    list.innerHTML = "<p class='text-muted'>No locations found</p>";
    return;
  }

  locations.forEach(l => {
    list.innerHTML += `
      <div class="col-md-4 mb-3">
        <div class="card p-3 shadow-sm rounded-4 h-100">
          <h6>${l.name}</h6>
          <small class="text-muted">${l.area}</small>
          <p class="text-muted small">${l.address}</p>
          <p><b>${l.availableSlots}</b> / ${l.totalSlots} slots</p>

          <input type="date" id="date-${l._id}" class="form-control mb-2">
          <label class="small fw-semibold text-secondary d-flex align-items-center gap-1">
            <i class="bi bi-clock"></i> Start Time
          </label>
          <input
            type="time"
            id="start-${l._id}"
            class="form-control mb-3"
          >

          <label class="small fw-semibold text-secondary d-flex align-items-center gap-1">
            <i class="bi bi-clock-history"></i> End Time
          </label>
          <input
            type="time"
            id="end-${l._id}"
            class="form-control mb-3"
          >



          <button class="btn btn-primary btn-sm w-100"
            ${l.availableSlots === 0 ? "disabled" : ""}
            onclick="book('${l._id}')">
            Book Slot
          </button>
        </div>
      </div>
    `;
  });
}

/* =====================================================
   BOOK SLOT
===================================================== */
async function book(id) {
  const bookingDate = document.getElementById(`date-${id}`).value;
  const startTime = document.getElementById(`start-${id}`).value;
  const endTime = document.getElementById(`end-${id}`).value;

  if (!bookingDate || !startTime || !endTime) {
    showToast("error", "Select date and time");
    return;
  }

  const res = await fetch(`${API}/locations/book/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    },
    body: JSON.stringify({ bookingDate, startTime, endTime })
  });

  if (!res.ok) {
    showToast("error", "Booking failed");
    return;
  }

  showToast("success", "Booking successful");
  loadLocations();
  loadMyBookings();
}

async function loadMyBookings() {
  const div = document.getElementById("myBookings");
  if (!div) return;

  const res = await fetch(API + "/bookings/my", {
    headers: { Authorization: "Bearer " + getToken() }
  });

  if (!res.ok) return;

  const bookings = await res.json();
  div.innerHTML = "";

  if (!bookings.length) {
    div.innerHTML = "<p class='text-muted'>No bookings yet</p>";
    return;
  }

  bookings.forEach(b => {
    const isCancelled = b.status?.toUpperCase() === "CANCELLED";


    div.innerHTML += `
      <div class="col-md-4 mb-3">
        <div class="card p-3 shadow-sm rounded-4">
          <h6>${b.locationName}</h6>

          <span class="badge ${isCancelled ? "bg-secondary" : "bg-success"} mb-2">
            ${isCancelled ? "Cancelled" : "Booked"}
          </span>

          <p><b>Date:</b> ${b.bookingDate}</p>
          <p><b>Time:</b> ${b.startTime} - ${b.endTime}</p>

          <div class="d-flex gap-2 mt-2">
            <button class="btn btn-outline-primary btn-sm w-50"
              ${isCancelled ? "disabled" : ""}
              onclick="openTicket('${b._id}')">
              Generate Ticket
            </button>

            ${
              !isCancelled
                ? `<button class="btn btn-outline-danger btn-sm w-50"
                    onclick="confirmCancel('${b._id}')">
                    Cancel
                  </button>`
                : ""
            }
          </div>
        </div>
      </div>
    `;
  });
}

/* =====================================================
   CONFIRM CANCEL
===================================================== */
function confirmCancel(id) {
  if (confirm("Are you sure you want to cancel this booking?")) {
    cancelBooking(id);
  }
}

async function cancelBooking(id) {
  const res = await fetch(`${API}/bookings/cancel/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    }
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Cancel failed:", data);
    showToast("error", data.message || "Cancellation failed");
    return;
  }

  showToast("success", "Booking cancelled");
  loadLocations();
  loadMyBookings();
}


/* =====================================================
   TICKET + QR
===================================================== */
async function openTicket(id) {
  const res = await fetch(`${API}/bookings/ticket/${id}`, {
    headers: { Authorization: "Bearer " + getToken() }
  });

  if (!res.ok) return;

  const t = await res.json();

  ticketLocation.innerText = t.locationName;
  ticketAddress.innerText = t.address;
  ticketDate.innerText = t.bookingDate;
  ticketTime.innerText = `${t.startTime} - ${t.endTime}`;
  ticketNumber.innerText = t.bookingNumber;

  qrBox.innerHTML = "";
  new QRCode(qrBox, { text: t.bookingNumber, width: 160, height: 160 });

  new bootstrap.Modal(ticketModal).show();
}

/* =====================================================
   ADMIN
===================================================== */
function loadAdmin() {
  requireAuth();
  loadUser();
  loadMyPlaces();
}

async function loadMyPlaces() {
  const div = document.getElementById("myPlaces");
  if (!div) return;

  const res = await fetch(API + "/locations/my", {
    headers: { Authorization: "Bearer " + getToken() }
  });

  if (!res.ok) return;

  const places = await res.json();
  div.innerHTML = "";

  if (!places.length) {
    div.innerHTML = "<p class='text-muted'>No parking locations yet</p>";
    return;
  }

  places.forEach(p => {
    div.innerHTML += `
      <div class="col-md-4 mb-3">
        <div class="card p-3 shadow-sm rounded-4">
          <h6>${p.name}</h6>
          <small>${p.area}</small>
          <p class="text-muted">${p.address}</p>
          <p><b>${p.availableSlots}</b> / ${p.totalSlots} slots</p>

          <button class="btn btn-outline-primary btn-sm w-100 mb-2"
            onclick="openEdit('${p._id}','${p.name}','${p.area}','${p.address}',${p.totalSlots})">
            Edit
          </button>

          <button class="btn btn-outline-danger btn-sm w-100"
            onclick="deletePlace('${p._id}')">
            Delete
          </button>
        </div>
      </div>
    `;
  });
}

async function addLocation() {
  const name = lname.value.trim();
  const area = larea.value.trim();
  const address = addr.value.trim();
  const totalSlots = Number(slots.value);

  if (!name || !area || !address || !totalSlots) {
    showToast("error", "Fill all fields");
    return;
  }

  await fetch(API + "/locations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    },
    body: JSON.stringify({ name, area, address, totalSlots })
  });

  showToast("success", "Parking place listed");
  lname.value = larea.value = addr.value = slots.value = "";
  loadMyPlaces();
}

/* =====================================================
   ADMIN EDIT
===================================================== */
let editId = null;

function openEdit(id, name, area, address, slots) {
  editId = id;
  editName.value = name;
  editArea.value = area;
  editAddress.value = address;
  editSlots.value = slots;
  new bootstrap.Modal(editModal).show();
}

async function saveEdit() {
  await fetch(`${API}/locations/${editId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    },
    body: JSON.stringify({
      name: editName.value,
      area: editArea.value,
      address: editAddress.value,
      totalSlots: Number(editSlots.value)
    })
  });

  showToast("success", "Location updated");
  bootstrap.Modal.getInstance(editModal).hide();
  loadMyPlaces();
}

/* =====================================================
   ADMIN DELETE
===================================================== */
async function deletePlace(id) {
  if (!confirm("Delete this parking location?")) return;

  await fetch(`${API}/locations/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + getToken() }
  });

  showToast("success", "Location deleted");
  loadMyPlaces();
}
