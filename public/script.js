"use strict";

function formatDateDDMMYYYY(dateStr) {
  const [yyyy, mm, dd] = dateStr.split("-");
  return `${dd}-${mm}-${yyyy}`;
}

function formatTimeAMPM(timeStr) {
  let [hours, minutes] = timeStr.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, "0")} ${ampm}`;
}


const API = "/api";

/* ================= TOAST ================= */
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

/* ================= AUTH ================= */
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

/* ================= LOGIN / REGISTER ================= */
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

  setTimeout(() => {
    window.location.href = "home.html";
  }, 600);
}


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

/* ================= PAGE LOAD ================= */
function load() {
  // Only protect pages that actually need login
  if (document.getElementById("myBookings")) {
    requireAuth();
    loadUser();
    loadLocations();
    loadMyBookings();
  }
}


/* ================= LOCATIONS ================= */
async function loadLocations() {
  const list = document.getElementById("list");
  if (!list) return;

  const area = document.getElementById("area")?.value.trim() || "";

  const res = await fetch(`${API}/locations?area=${encodeURIComponent(area)}`, {
    headers: { Authorization: "Bearer " + getToken() }
  });

  if (!res.ok) return;

  const locations = await res.json();
  list.innerHTML = "";

  if (!locations.length) {
    list.innerHTML = "<p class='text-muted'>No locations found</p>";
    return;
  }

  locations.forEach(l => {
    list.innerHTML += `
      <div class="col-md-4">
        <div class="card h-100 overflow-hidden">

          <!-- IMAGE -->
          <img src="${l.image}" class="w-100" style="height:160px;object-fit:cover">

          <div class="p-3">
            <h6 class="fw-semibold">${l.name}</h6>
            <small class="fw-bold">${l.area}</small>
            <p class="small text-muted mb-2">${l.address}</p>

            <p class="mb-1">
              <b>${l.availableSlots}</b> / ${l.totalSlots} slots
            </p>

            <p class="mb-2 text-success fw-semibold">
              ₹${l.hourlyRate} / hour
            </p>

            <input type="date" id="date-${l._id}" class="form-control mb-2">

            <div class="row g-2 mb-2">
              <div class="col-6">
                <input type="time" id="start-${l._id}" class="form-control">
              </div>
              <div class="col-6">
                <select id="duration-${l._id}" class="form-select">
                  <option value="">Duration</option>
                  <option value="1">1 hr</option>
                  <option value="2">2 hrs</option>
                  <option value="3">3 hrs</option>
                  <option value="4">4 hr</option>
                  <option value="5">5 hrs</option>
                  <option value="6">6 hrs</option>
                  <option value="7">7 hr</option>
                  <option value="8">8 hrs</option>
                  <option value="9">9 hrs</option>
                  <option value="10">10 hr</option>
                  <option value="11">11 hrs</option>
                  <option value="12">12 hrs</option>
                  <option value="13">13 hrs</option>
                  <option value="14">14 hrs</option>
                  <option value="15">15 hr</option>
                  <option value="16">16 hrs</option>
                  <option value="17">17 hrs</option>
                  <option value="18">18 hrs</option>
                  <option value="19">19 hrs</option>
                  <option value="20">20 hr</option>
                  <option value="21">21 hrs</option>
                  <option value="22">22 hrs</option>
                  <option value="23">23 hrs</option>
                  <option value="24">24 hrs</option>
                </select>
              </div>
            </div>

            <button class="btn btn-primary w-100"
              onclick="book('${l._id}')"
              ${l.availableSlots === 0 ? "disabled" : ""}>
              Book Slot
            </button>
          </div>
        </div>
      </div>
    `;
  });

  // Restrict date to today & future
  const today = new Date().toISOString().split("T")[0];
  document.querySelectorAll("input[type='date']").forEach(d => d.min = today);
}


/* ================= BOOK SLOT ================= */
async function book(id) {
  const bookingDate = document.getElementById(`date-${id}`).value;
  const startTime = document.getElementById(`start-${id}`).value;
  const duration = Number(document.getElementById(`duration-${id}`).value);

  if (!bookingDate || !startTime || !duration) {
    return showToast("error", "Fill all booking fields");
  }

  const [h, m] = startTime.split(":").map(Number);
  const endTime = `${String(h + duration).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  const res = await fetch(`${API}/locations/book/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    },
    body: JSON.stringify({ bookingDate, startTime, endTime })
  });

  if (!res.ok) return showToast("error", "Booking failed");

  showToast("success", "Booking successful");
  loadLocations();
  loadMyBookings();
}

/* ================= BOOKINGS FILTER ================= */

let currentBookingFilter = "all";


function setBookingFilter(filter) {
  currentBookingFilter = filter;

  document.querySelectorAll("[id^='filter-']").forEach(btn =>
    btn.classList.remove("active")
  );

  document.getElementById(`filter-${filter}`)?.classList.add("active");

  loadMyBookings();
}

function getBookingCategory(b) {
  const now = new Date();
  const start = new Date(`${b.bookingDate}T${b.startTime}`);
  const end = new Date(`${b.bookingDate}T${b.endTime}`);

  if (b.status === "Cancelled") return "cancelled";
  if (b.status === "Finished" || end < now) return "expired";
  if (start <= now && end >= now) return "active";
  return "upcoming";
}



/* ================= MY BOOKINGS ================= */
async function loadMyBookings() {
  const div = document.getElementById("myBookings");
  if (!div) return;

  const res = await fetch(API + "/bookings/my", {
    headers: { Authorization: "Bearer " + getToken() }
  });

  if (!res.ok) return;

  const bookings = await res.json();
  div.innerHTML = "";

  const filtered =
    currentBookingFilter === "all"
      ? bookings
      : bookings.filter(
          b => getBookingCategory(b) === currentBookingFilter
        );


  if (!filtered.length) {
    div.innerHTML =
      "<p class='text-muted'>No bookings in this category</p>";
    return;
  }

  filtered.forEach(b => {
    const category = getBookingCategory(b);

    div.innerHTML += `
      <div class="col-md-4">
        <div class="card h-100 overflow-hidden">

          <img src="${b.image}"
               class="w-100"
               style="height:160px;object-fit:cover">

          <div class="p-3">
            <h6 class="fw-semibold mb-1">${b.locationName}</h6>
            <small class="fw-semibold">${b.area}</small>
            <p class="small text-muted mb-2">${b.address}</p>

            <p class="small mb-2">
              <b>Date:</b> ${formatDateDDMMYYYY(b.bookingDate)}<br>
              <b>Time:</b> ${formatTimeAMPM(b.startTime)} –
              ${formatTimeAMPM(b.endTime)}
            </p>

            <p class="small mb-2">
              <b>Rate:</b> ₹${b.hourlyRate}/hr<br>
              <b>Duration:</b> ${b.duration} hr(s)<br>
              <b>Total:</b> ₹${b.totalAmount}
            </p>

            <span class="badge mb-2 ${
              category === "active" ? "bg-success" :
              category === "upcoming" ? "bg-primary" :
              category === "expired" ? "bg-secondary" :
              "bg-danger"
            }">
              ${category.toUpperCase()}
            </span>

            <div class="d-flex gap-2 mt-2">
              <button class="btn btn-outline-primary btn-sm w-50
                      ${category === "expired" || category === "cancelled" ? "disabled" : ""}"
                      ${category === "expired" || category === "cancelled"
                        ? "disabled aria-disabled='true'"
                        : `onclick="openTicket('${b._id}')"`}>
                Ticket
              </button>


              ${
                category === "upcoming"
                  ? `<button class="btn btn-outline-danger btn-sm w-50"
                      onclick="confirmCancel('${b._id}')">
                      Cancel
                    </button>`
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `;
  });
}





/* ================= CANCEL ================= */
let cancelBookingId = null;

function confirmCancel(id) {
  cancelBookingId = id;
  const modal = new bootstrap.Modal(
    document.getElementById("cancelModal")
  );
  modal.show();
}


async function cancelBooking(id) {
  const res = await fetch(`${API}/bookings/cancel/${id}`, {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + getToken()
    }
  });

  if (!res.ok) return showToast("error", "Cancel failed");

  showToast("success", "Booking cancelled");
  loadLocations();
  loadMyBookings();
}

/* ================= TICKET + QR ================= */
async function openTicket(id) {
  try {
    const res = await fetch(`${API}/bookings/ticket/${id}`, {
      headers: { Authorization: "Bearer " + getToken() }
    });

    if (!res.ok) {
      showToast("error", "Failed to load ticket");
      return;
    }

    const t = await res.json();

    // DOM references
    const ticketModalEl = document.getElementById("ticketModal");
    const ticketLocation = document.getElementById("ticketLocation");
    const ticketAddress = document.getElementById("ticketAddress");
    const ticketDate = document.getElementById("ticketDate");
    const ticketTime = document.getElementById("ticketTime");
    const ticketNumber = document.getElementById("ticketNumber");
    const ticketRate = document.getElementById("ticketRate");
    const ticketTotal = document.getElementById("ticketTotal");
    const qrBox = document.getElementById("qrBox");

    // Format date
    const [yyyy, mm, dd] = t.bookingDate.split("-");
    const formattedDate = `${dd}-${mm}-${yyyy}`;

    // Fill ticket data
    ticketLocation.innerText = t.locationName;
    ticketAddress.innerText = t.area;
    ticketDate.innerText = formattedDate;
    ticketTime.innerText = `${t.startTime} - ${t.endTime}`;
    ticketNumber.innerText = t.bookingNumber;

    // ✅ NEW PRICE DETAILS
    ticketRate.innerText = `₹${t.hourlyRate} / hr`;
    ticketTotal.innerText = `₹${t.totalAmount}`;

    // QR Code (short payload = safe)
    qrBox.innerHTML = "";
    new QRCode(qrBox, {
      text: t.bookingNumber,
      width: 160,
      height: 160
    });

    new bootstrap.Modal(ticketModalEl).show();
  } catch (err) {
    console.error("Ticket error:", err);
    showToast("error", "Ticket failed");
  }
}


/* =====================================================
   ADMIN
===================================================== */
function loadAdmin() {
  requireAuth();
  loadUser();
  loadMyPlaces();
  loadAdminStats(); 
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
          <img src="${p.image}" class="img-fluid rounded mb-2" style="height:160px;object-fit:cover">
          <h6>${p.name}</h6>
          <small>${p.area}</small>
          <p class="text-muted">${p.address}</p>
          <p><b>${p.availableSlots}</b> / ${p.totalSlots} slots</p>

          <button class="btn btn-outline-primary btn-sm w-100 mb-2"
            onclick=onclick="openEdit('${p._id}','${p.name}','${p.area}','${p.address}',${p.totalSlots},${p.hourlyRate},'${p.image}')">
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
  const hourlyRate = Number(document.getElementById("rate").value);

  const imageInput = document.getElementById("placeImage");
  const image = imageInput.files[0];
  const imagePreview = document.getElementById("imagePreview");

  // Validation
  if (!name || !area || !address || !totalSlots || !hourlyRate) {
    showToast("error", "Fill all fields including hourly rate");
    return;
  }

  if (hourlyRate <= 0) {
    showToast("error", "Hourly rate must be greater than 0");
    return;
  }

  if (!image) {
    showToast("error", "Please attach an image");
    return;
  }

  // FormData
  const formData = new FormData();
  formData.append("name", name);
  formData.append("area", area);
  formData.append("address", address);
  formData.append("totalSlots", totalSlots);
  formData.append("hourlyRate", hourlyRate);
  formData.append("image", image);

  try {
    const res = await fetch(API + "/locations", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + getToken()
      },
      body: formData
    });

    if (!res.ok) {
      showToast("error", "Failed to add parking location");
      return;
    }

    showToast("success", "Parking place listed successfully");

    // Reset form fields
    lname.value = "";
    larea.value = "";
    addr.value = "";
    slots.value = "";
    document.getElementById("rate").value = "";

    // Reset image input & preview
    imageInput.value = "";
    imagePreview.src = "";
    imagePreview.classList.add("d-none");

    loadMyPlaces();
  } catch (err) {
    console.error("Add location error:", err);
    showToast("error", "Server error while adding location");
  }
}


/* =====================================================
   ADMIN EDIT
===================================================== */
let editId = null;

function openEdit(id, name, area, address, slots, rate, image) {
  editId = id;

  // Fill form fields
  editName.value = name;
  editArea.value = area;
  editAddress.value = address;
  editSlots.value = slots;
  editRate.value = rate;

  // Image preview
  const img = document.getElementById("editPreview");
  img.src = image;
  img.classList.remove("d-none");

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}



async function saveEdit() {
  const fd = new FormData();
  fd.append("name", editName.value);
  fd.append("area", editArea.value);
  fd.append("address", editAddress.value);
  fd.append("totalSlots", Number(editSlots.value));
  fd.append("hourlyRate", Number(editRate.value));

  const img = document.getElementById("editImage").files[0];
  if (img) fd.append("image", img);

  await fetch(`${API}/locations/${editId}`, {
    method: "PUT",
    headers: { Authorization: "Bearer " + getToken() },
    body: fd
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

document.getElementById("placeImage")?.addEventListener("change", e => {
  const img = document.getElementById("imagePreview");
  const file = e.target.files[0];

  if (!file) {
    img.classList.add("d-none");
    return;
  }

  img.src = URL.createObjectURL(file);
  img.classList.remove("d-none");
});

document.getElementById("editImage")?.addEventListener("change", e => {
  const img = document.getElementById("editPreview");
  const file = e.target.files[0];

  if (!file) {
    img.classList.add("d-none");
    return;
  }

  img.src = URL.createObjectURL(file);
  img.classList.remove("d-none");
});

let earningsChart = null;

async function loadAdminStats() {
  const res = await fetch(`${API}/bookings/stats/admin`, {
    headers: { Authorization: "Bearer " + getToken() }
  });

  if (!res.ok) return;

  const data = await res.json();

  // ===== TOTAL EARNINGS =====
  document.getElementById("totalEarnings").innerText =
    "₹" + data.totalEarnings;

  const labels = data.byLocation.map(
    l => `${l._id} – ₹${l.total}`
  );
  const values = data.byLocation.map(l => l.total);

  const canvas = document.getElementById("earningsChart");
  const ctx = canvas.getContext("2d");

  // ===== APPLE-LIKE GRADIENT COLORS =====
  const gradients = values.map((_, i) => {
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    const palette = [
      ["#34C759", "#2ECC71"],   // Green
      ["#007AFF", "#5AC8FA"],   // Blue
      ["#FF9F0A", "#FFD60A"],   // Orange
      ["#AF52DE", "#DA8FFF"],   // Purple
      ["#FF453A", "#FF9F9A"]    // Red
    ][i % 5];

    g.addColorStop(0, palette[0]);
    g.addColorStop(1, palette[1]);
    return g;
  });

  // Destroy previous chart
  if (earningsChart) earningsChart.destroy();

  earningsChart = new Chart(ctx, {
    type: "pie", // ✅ FULL PIE (NOT DOUGHNUT)
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: gradients,
        borderColor: "#ffffff",
        borderWidth: 3,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 900,
        easing: "easeOutQuart"
      },
      plugins: {
        legend: {
          position: "right",
          labels: {
            usePointStyle: true,
            pointStyle: "rectRounded",
            padding: 18,
            font: {
              size: 14,
              weight: "500"
            }
          }
        },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#000",
          bodyColor: "#000",
          borderColor: "#e0e0e0",
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: ctx => {
              const value = ctx.raw;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const percent = ((value / total) * 100).toFixed(1);
              return ` ₹${value} (${percent}%)`;
            }
          }
        }
      }
    }
  });
}

document.getElementById("confirmCancelBtn")?.addEventListener("click", () => {
  if (!cancelBookingId) return;

  cancelBooking(cancelBookingId);
  cancelBookingId = null;

  bootstrap.Modal.getInstance(
    document.getElementById("cancelModal")
  ).hide();
});

async function register() {
  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!name || !email || !password) {
    showToast("error", "Fill all fields");
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

  showToast("success", "Account created successfully");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 800);
}






