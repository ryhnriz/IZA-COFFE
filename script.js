/* IZA COFFEE - keranjang, checkout, dan panel staf.
   PENTING: lapisan Store di bawah memakai localStorage hanya untuk DEMO di satu browser.
   Untuk penggunaan nyata, ganti isi Store (dan login staf) dengan panggilan API ke backend + database. */

// ===== Data menu contoh (ganti dengan menu asli; isi "img" dengan URL foto) =====
const MENU = [
  { id: 1, name: "Espresso", cat: "Coffee", price: 18000, icon: "☕", img: "", desc: "Shot tunggal, pekat dan harum." },
  { id: 2, name: "Caffe Latte", cat: "Coffee", price: 28000, icon: "☕", img: "", desc: "Espresso dengan susu lembut." },
  { id: 3, name: "Cappuccino", cat: "Coffee", price: 28000, icon: "☕", img: "", desc: "Busa susu tebal di atas espresso." },
  { id: 4, name: "Kopi Susu Gula Aren", cat: "Coffee", price: 25000, icon: "🥛", img: "", desc: "Manis legit dari gula aren." },
  { id: 5, name: "Chocolate", cat: "Non-Coffee", price: 26000, icon: "🍫", img: "", desc: "Cokelat pekat dengan susu." },
  { id: 6, name: "Matcha Latte", cat: "Non-Coffee", price: 30000, icon: "🍵", img: "", desc: "Matcha segar dan creamy." },
  { id: 7, name: "Croissant Butter", cat: "Makanan", price: 24000, icon: "🥐", img: "", desc: "Renyah di luar, lembut di dalam." },
  { id: 8, name: "Banana Bread", cat: "Makanan", price: 22000, icon: "🍞", img: "", desc: "Dipanggang setiap pagi." },
  { id: 9, name: "Nasi Goreng Kampung", cat: "Makanan", price: 35000, icon: "🍳", img: "", desc: "Dengan telur dan kerupuk." },
];
const STATUSES = ["Menunggu", "Diproses", "Selesai", "Dibatalkan"];
const DEMO_PIN = "1234"; // DEMO saja. Jangan dipakai di produksi.

// ===== Store (adapter demo; ganti dengan API) =====
const Store = {
  all() { try { return JSON.parse(localStorage.getItem("iza_orders") || "[]"); } catch { return []; } },
  save(list) { try { localStorage.setItem("iza_orders", JSON.stringify(list)); } catch {} },
  create(order) {
    const list = this.all();
    order.no = "IZA-" + String(list.length + 1).padStart(4, "0");
    order.status = "Menunggu"; order.time = Date.now();
    list.unshift(order); this.save(list); return order;
  },
  setStatus(no, status) { const l = this.all(); const o = l.find(x => x.no === no); if (o) o.status = status; this.save(l); },
  get(no) { return this.all().find(x => x.no === no); },
};

const $ = (s, r = document) => r.querySelector(s);
const rp = n => "Rp " + n.toLocaleString("id-ID");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let cart = [], cat = "Semua", q = "";

function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2200); }

// ===== Menu =====
function renderChips() {
  $("#chips").innerHTML = ["Semua", "Coffee", "Non-Coffee", "Makanan"].map(c =>
    `<button class="chip" data-cat="${c}" aria-pressed="${c === cat}">${c}</button>`).join("");
}
function renderMenu() {
  const list = MENU.filter(m => (cat === "Semua" || m.cat === cat) && (m.name + m.desc).toLowerCase().includes(q));
  $("#menuGrid").innerHTML = list.map(m => `
    <article class="card">
      ${m.img ? `<img src="${esc(m.img)}" alt="${esc(m.name)}" loading="lazy">` : `<div class="ph" aria-hidden="true">${m.icon}</div>`}
      <div class="card-body"><span class="cat">${m.cat}</span><h3>${esc(m.name)}</h3><p>${esc(m.desc)}</p>
        <div class="card-foot"><span class="price">${rp(m.price)}</span><button class="btn" data-add="${m.id}" aria-label="Tambah ${esc(m.name)} ke keranjang">Tambah</button></div>
      </div>
    </article>`).join("");
  $("#menuEmpty").hidden = list.length > 0;
}

// ===== Keranjang =====
const total = () => cart.reduce((s, i) => s + i.price * i.qty, 0);
function renderCart() {
  const n = cart.reduce((s, i) => s + i.qty, 0);
  $("#cartCount").textContent = n;
  $("#cartBody").innerHTML = cart.length ? cart.map(i => `
    <div class="line"><div><strong>${esc(i.name)}</strong><br><span class="meta">${rp(i.price)}</span></div><strong>${rp(i.price * i.qty)}</strong>
      <div class="qty"><button data-dec="${i.id}" aria-label="Kurangi ${esc(i.name)}">&minus;</button><span aria-live="polite">${i.qty}</span><button data-inc="${i.id}" aria-label="Tambah ${esc(i.name)}">+</button></div>
      <button class="rm" data-rm="${i.id}">Hapus</button></div>`).join("")
    : `<p class="empty">Keranjang masih kosong. Pilih menu untuk mulai memesan.</p>`;
  $("#cartFoot").innerHTML = cart.length
    ? `<div class="row"><span>Subtotal</span><span>${rp(total())}</span></div><div class="row total"><span>Total</span><span>${rp(total())}</span></div>
       <button class="btn block" id="toCheckout" style="margin-top:12px">Lanjut ke Checkout</button>` : "";
}
function addItem(id) { const m = MENU.find(x => x.id === id), it = cart.find(x => x.id === id); it ? it.qty++ : cart.push({ id, name: m.name, price: m.price, qty: 1 }); renderCart(); toast(m.name + " ditambahkan"); }
function chg(id, d) { const it = cart.find(x => x.id === id); if (!it) return; it.qty += d; if (it.qty < 1) cart = cart.filter(x => x.id !== id); renderCart(); }

function openLayer(el, open) { el.classList.toggle("open", open); el.setAttribute?.("aria-hidden", String(!open)); $("#overlay").hidden = !open; document.body.style.overflow = open ? "hidden" : ""; }
const openCart = o => openLayer($("#cartDrawer"), o);

// ===== Checkout =====
function summary() {
  $("#coSummary").innerHTML = cart.map(i => `<div class="row"><span>${i.qty} &times; ${esc(i.name)}</span><span>${rp(i.price * i.qty)}</span></div>`).join("") + `<div class="row total"><span>Total pembayaran</span><span>${rp(total())}</span></div>`;
}
function syncType() {
  const dine = $("input[name=type]:checked").value === "Dine-in";
  $("#tableBox").hidden = !dine; $("#pickupInfo").hidden = dine;
}
function openCheckout() {
  openCart(false); summary(); syncType(); $("#coErr").textContent = "";
  $("#checkoutForm").hidden = false; $("#doneBox").hidden = true;
  $("#checkoutModal").hidden = false; $("#overlay").hidden = true; $("#cName").focus();
}
function closeCheckout() { $("#checkoutModal").hidden = true; }
function submitOrder(e) {
  e.preventDefault();
  const name = $("#cName").value.trim(), type = $("input[name=type]:checked").value, table = $("#cTable").value.trim();
  if (!cart.length) return ($("#coErr").textContent = "Keranjang kosong. Tambahkan menu terlebih dahulu.");
  if (!name) return ($("#coErr").textContent = "Isi nama pemesan.");
  if (type === "Dine-in" && !table) return ($("#coErr").textContent = "Isi nomor meja untuk pesanan dine-in.");
  const o = Store.create({ name, type, table: type === "Dine-in" ? table : "", pay: $("input[name=pay]:checked").value, note: $("#cNote").value.trim(), items: cart.map(i => ({ ...i })), total: total() });
  cart = []; renderCart(); $("#checkoutForm").reset(); $("#checkoutForm").hidden = true;
  showDone(o.no);
}
function showDone(no) {
  const o = Store.get(no); if (!o) return;
  const pill = { Menunggu: "p-menunggu", Diproses: "p-proses", Selesai: "p-selesai", Dibatalkan: "p-batal" }[o.status];
  $("#doneBox").hidden = false;
  $("#doneBox").innerHTML = `<div class="done"><h2>Pesanan diterima</h2><p>Nomor pesanan Anda</p><div class="no">${o.no}</div>
    <span class="pill ${pill}">${o.status}</span>
    <p style="margin-top:14px">${o.type === "Dine-in" ? "Pesanan akan diantar ke Meja " + esc(o.table) + "." : "Ambil pesanan di kafe saat statusnya Selesai."}<br>Pembayaran: ${o.pay}. Total ${rp(o.total)}.</p>
    <button class="btn btn-ghost" id="refreshStatus" data-no="${o.no}">Perbarui status</button> <button class="btn" id="doneClose">Tutup</button></div>`;
}

// ===== Panel staf =====
const authed = () => sessionStorage.getItem("iza_staff") === "1";
function route() {
  const staff = location.hash === "#staff";
  $("#customerView").hidden = staff; $("#staffView").hidden = !staff;
  if (staff) { $("#staffLogin").hidden = authed(); $("#staffDash").hidden = !authed(); if (authed()) renderStaff(); }
}
function renderStaff() {
  const L = Store.all(), c = s => L.filter(o => o.status === s).length;
  $("#stats").innerHTML = [["Total pesanan", L.length], ["Menunggu", c("Menunggu")], ["Diproses", c("Diproses")], ["Selesai", c("Selesai")]].map(([k, v]) => `<div class="stat"><b>${v}</b>${k}</div>`).join("");
  $("#orderList").innerHTML = L.length ? L.map(o => `
    <article class="order"><div class="order-top"><strong>${o.no}</strong><span class="meta">${new Date(o.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span></div>
      <p class="meta"><strong>${esc(o.name)}</strong> | ${o.type}${o.table ? ", Meja " + esc(o.table) : ""} | ${o.pay}</p>
      <ul>${o.items.map(i => `<li>${i.qty} &times; ${esc(i.name)}</li>`).join("")}</ul>
      ${o.note ? `<p class="meta">Catatan: ${esc(o.note)}</p>` : ""}
      <strong>${rp(o.total)}</strong>
      <label class="sr" for="st${o.no}">Status ${o.no}</label>
      <select id="st${o.no}" data-st="${o.no}">${STATUSES.map(s => `<option${s === o.status ? " selected" : ""}>${s}</option>`).join("")}</select>
    </article>`).join("") : `<p class="empty">Belum ada pesanan. Pesanan baru akan muncul di sini.</p>`;
}

// ===== Event =====
document.addEventListener("click", e => {
  const t = e.target.closest("button,a"); if (!t) return;
  if (t.dataset.add) addItem(+t.dataset.add);
  else if (t.dataset.inc) chg(+t.dataset.inc, 1);
  else if (t.dataset.dec) chg(+t.dataset.dec, -1);
  else if (t.dataset.rm) { cart = cart.filter(x => x.id !== +t.dataset.rm); renderCart(); }
  else if (t.dataset.cat) { cat = t.dataset.cat; renderChips(); renderMenu(); }
  else if (t.id === "openCart") openCart(true);
  else if (t.id === "closeCart") openCart(false);
  else if (t.id === "toCheckout") openCheckout();
  else if (t.id === "closeCheckout" || t.id === "doneClose") closeCheckout();
  else if (t.id === "refreshStatus") { showDone(t.dataset.no); toast("Status diperbarui"); }
  else if (t.id === "logout") { sessionStorage.removeItem("iza_staff"); route(); }
  else if (t.id === "navToggle") { const o = $("#nav").classList.toggle("open"); t.setAttribute("aria-expanded", o); }
  else if (t.closest("#nav")) $("#nav").classList.remove("open");
});
$("#overlay").addEventListener("click", () => openCart(false));
document.addEventListener("keydown", e => { if (e.key === "Escape") { openCart(false); closeCheckout(); } });
$("#search").addEventListener("input", e => { q = e.target.value.trim().toLowerCase(); renderMenu(); });
$("#checkoutForm").addEventListener("submit", submitOrder);
$("#checkoutForm").addEventListener("change", e => { if (e.target.name === "type") syncType(); });
$("#orderList").addEventListener("change", e => { if (e.target.dataset.st) { Store.setStatus(e.target.dataset.st, e.target.value); renderStaff(); toast("Status diperbarui"); } });
$("#loginForm").addEventListener("submit", e => {
  e.preventDefault();
  if ($("#pin").value === DEMO_PIN) { sessionStorage.setItem("iza_staff", "1"); $("#pin").value = ""; $("#loginErr").textContent = ""; route(); }
  else $("#loginErr").textContent = "PIN salah. Coba lagi.";
});
window.addEventListener("hashchange", route);
renderChips(); renderMenu(); renderCart(); route();
