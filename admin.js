// AlicetleLabs Admin — Supabase Auth + CRUD
let data = [], editingId = null;
const $ = id => document.getElementById(id);

function iso(value) { return value ? value.slice(0, 10) : ''; }
function displayDate(value) { return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase(); }
function statusClass(s) { return s === 'AVAILABLE' ? 'available' : s === 'PENDING' ? 'pending' : 'booked'; }
function showAdmin(session) { $('login').hidden = !!session; $('adminApp').hidden = !session; if (session) loadAdminData(); }
function setSaveStatus(message, type = '') {
  ['saveStatus', 'appStatus'].forEach(id => { const node = $(id); if (!node) return; node.textContent = message; node.className = `statusMessage ${type}`; });
}
function showResultModal(title, message, type = 'success') { $('resultModal').className = `resultModal on ${type}`; $('resultIcon').textContent = type === 'success' ? '✓' : '!'; $('resultTitle').textContent = title; $('resultText').textContent = message; }
function closeResultModal() { $('resultModal').classList.remove('on'); }

async function loadAdminData() {
  try {
    const client = requireSupabase();
    const { data: rows, error } = await client.from('events').select('id,name,category,tag,venue,pickup,base_price,is_active,event_dates(id,event_date,status),promotions(id,days,discount_amount)').order('created_at', { ascending: false });
    if (error) throw error;
    data = (rows || []).map(e => ({ ...e, dates: (e.event_dates || []).sort((a, b) => a.event_date.localeCompare(b.event_date)), promotions: e.promotions || [] }));
    render();
  } catch (error) { alert(supabaseError(error)); }
}

function render() {
  $('events').innerHTML = data.map(e => `<article class="event" style="opacity:${e.is_active ? 1 : .55}"><div class="eventtop"><div><h3>${e.name}</h3><div class="meta">⌖ ${e.venue} · ${e.is_active ? 'เปิดอยู่' : 'ปิดอยู่'}</div></div><div class="eventActions"><label class="switch" title="เปิด/ปิดอีเวนท์"><input type="checkbox" ${e.is_active ? 'checked' : ''} onchange="toggleActive('${e.id}')" aria-label="เปิดหรือปิด ${e.name}"><span class="slider"></span></label><button class="edit" onclick="openEdit('${e.id}')">แก้ไข</button><button class="danger" onclick="deleteEvent('${e.id}')">ลบ</button></div></div><div class="price">฿${Number(e.base_price).toLocaleString()}/วัน · ${e.promotions.length ? e.promotions.map(p => `${p.days} วัน ลด ${Number(p.discount_amount).toLocaleString()}.-`).join(' · ') : 'ไม่มีโปรหลายวัน'}</div><div class="dayrows">${e.dates.map(d => `<div class="dayrow"><span class="dayname">${displayDate(d.event_date)}</span><button class="status ${statusClass(d.status.toUpperCase())}" onclick="cycle('${e.id}','${d.id}')">${d.status.toUpperCase()}</button></div>`).join('')}</div></article>`).join('') || '<div class="note">ยังไม่มีคอนเสิร์ต</div>';
  const c = { AVAILABLE: 0, PENDING: 0, BOOKED: 0 }; data.forEach(e => e.dates.forEach(d => c[d.status.toUpperCase()]++)); $('av').textContent = c.AVAILABLE; $('pd').textContent = c.PENDING; $('bk').textContent = c.BOOKED;
}

async function cycle(eventId, dateId) {
  const event = data.find(e => e.id === eventId), date = event?.dates.find(d => d.id === dateId); if (!date) return;
  const order = ['available', 'pending', 'booked'], next = order[(order.indexOf(date.status) + 1) % order.length];
  const { error } = await requireSupabase().from('event_dates').update({ status: next }).eq('id', dateId); if (error) return alert(supabaseError(error)); await loadAdminData();
}

function clearForm() { editingId = null; $('name').value = ''; $('cat').value = 'T-POP'; $('base').value = 890; $('venue').value = ''; $('pickup').value = ''; $('dateFields').innerHTML = ''; $('promoFields').innerHTML = ''; $('preview').innerHTML = ''; setSaveStatus('', ''); document.querySelector('.sheet h2').textContent = 'เพิ่มคอนเสิร์ต ✨'; }
function openModal() { clearForm(); $('modal').classList.add('on'); addDate(); preview(); }
function openEdit(id) {
  const e = data.find(x => x.id === id); if (!e) return;
  editingId = id; setSaveStatus('', ''); $('name').value = e.name; $('cat').value = e.category === 'kpop' ? 'K-POP' : e.category === 'tpop' ? 'T-POP' : 'อื่นๆ'; $('base').value = e.base_price; $('venue').value = e.venue; $('pickup').value = e.pickup;
  $('dateFields').innerHTML = e.dates.map(d => `<div class="dateinput"><input type="date" value="${iso(d.event_date)}"><select><option ${d.status === 'available' ? 'selected' : ''}>AVAILABLE</option><option ${d.status === 'pending' ? 'selected' : ''}>PENDING</option><option ${d.status === 'booked' ? 'selected' : ''}>BOOKED</option></select><button class="removeRow" type="button" onclick="removeRow(this)" aria-label="ลบวันที่">×</button></div>`).join('');
  $('promoFields').innerHTML = e.promotions.map(p => `<div class="promo promoRow"><div class="field"><label>จำนวนวัน</label><input class="promoDays" type="number" min="1" value="${p.days}" oninput="preview()"></div><div class="field"><label>ลดจากราคาปกติ (บาท)</label><input class="promoDisc" type="number" min="0" value="${p.discount_amount}" oninput="preview()"></div><button class="removeRow" type="button" onclick="removeRow(this)" aria-label="ลบโปรโมชั่น">×</button></div>`).join('');
  document.querySelector('.sheet h2').textContent = 'แก้ไขคอนเสิร์ต ✨'; $('modal').classList.add('on'); preview();
}
function closeModal() { $('modal').classList.remove('on'); }
function addDate(date = '', status = 'available') { $('dateFields').insertAdjacentHTML('beforeend', `<div class="dateinput"><input type="date" value="${date}"><select><option ${status === 'available' ? 'selected' : ''}>AVAILABLE</option><option ${status === 'pending' ? 'selected' : ''}>PENDING</option><option ${status === 'booked' ? 'selected' : ''}>BOOKED</option></select><button class="removeRow" type="button" onclick="removeRow(this)" aria-label="ลบวันที่">×</button></div>`); }
function addPromo() { const rows = [...document.querySelectorAll('.promoRow')], used = rows.map(r => +r.querySelector('.promoDays').value || 0); let next = 1; while (used.includes(next)) next++; $('promoFields').insertAdjacentHTML('beforeend', `<div class="promo promoRow"><div class="field"><label>จำนวนวัน</label><input class="promoDays" type="number" min="1" value="${next}" oninput="preview()"></div><div class="field"><label>ลดจากราคาปกติ (บาท)</label><input class="promoDisc" type="number" min="0" value="0" oninput="preview()"></div><button class="removeRow" type="button" onclick="removeRow(this)" aria-label="ลบโปรโมชั่น">×</button></div>`); preview(); }
function removeRow(button) { button.closest('.dateinput, .promoRow')?.remove(); preview(); }
function preview() { const b = +$('base').value || 0, lines = [`1 วัน = <b>${b.toLocaleString()}.-</b>`]; document.querySelectorAll('.promoRow').forEach(r => { const n = +r.querySelector('.promoDays').value || 0, d = +r.querySelector('.promoDisc').value || 0; if (n > 0) lines.push(`${n} วัน = <s>${(b * n).toLocaleString()}.-</s> <b>${Math.max(0, b * n - d).toLocaleString()}.-</b> · ประหยัด ${d.toLocaleString()}.-`); }); $('preview').innerHTML = lines.join('<br>'); }

async function saveEvent() {
  const button = $('saveButton'); button.disabled = true; setSaveStatus('กำลังบันทึก…', '');
  try {
    const client = requireSupabase(), category = $('cat').value === 'K-POP' ? 'kpop' : $('cat').value === 'T-POP' ? 'tpop' : 'other', tag = $('cat').value === 'อื่นๆ' ? 'อื่นๆ' : $('cat').value;
    const eventPayload = { name: $('name').value.trim(), category, tag, base_price: +$('base').value || 0, venue: $('venue').value.trim(), pickup: $('pickup').value.trim() };
    const dates = [...document.querySelectorAll('#dateFields .dateinput')].map(r => ({ event_date: r.querySelector('input').value, status: r.querySelector('select').value.toLowerCase() })).filter(x => x.event_date);
    const promotions = [...document.querySelectorAll('.promoRow')].map(r => ({ days: +r.querySelector('.promoDays').value || 0, discount_amount: +r.querySelector('.promoDisc').value || 0 })).filter(x => x.days > 0);
    if (!eventPayload.name || !eventPayload.venue || !eventPayload.pickup || !dates.length) throw new Error('กรุณากรอกชื่อ สถานที่ จุดรับ–คืน และอย่างน้อย 1 วันที่');
    if (new Set(dates.map(x => x.event_date)).size !== dates.length) throw new Error('วันที่ซ้ำกัน กรุณาตรวจสอบอีกครั้ง');
    if (new Set(promotions.map(x => x.days)).size !== promotions.length) throw new Error('จำนวนวันของโปรโมชั่นซ้ำกัน กรุณาตรวจสอบอีกครั้ง');
    let eventId = editingId;
    if (editingId) { const { error } = await client.from('events').update(eventPayload).eq('id', editingId); if (error) throw error; await client.from('event_dates').delete().eq('event_id', editingId); await client.from('promotions').delete().eq('event_id', editingId); }
    else { const { data: inserted, error } = await client.from('events').insert(eventPayload).select('id').single(); if (error) throw error; eventId = inserted.id; }
    const { error: datesError } = await client.from('event_dates').insert(dates.map(x => ({ ...x, event_id: eventId }))); if (datesError) throw datesError;
    if (promotions.length) { const { error: promoError } = await client.from('promotions').insert(promotions.map(x => ({ ...x, event_id: eventId }))); if (promoError) throw promoError; }
    closeModal(); await loadAdminData(); setSaveStatus('', ''); showResultModal('บันทึกอีเวนท์สำเร็จ', 'ข้อมูลอีเวนท์ถูกบันทึกลง Supabase เรียบร้อยแล้ว', 'success');
  } catch (error) { const message = supabaseError(error); setSaveStatus(`บันทึกไม่สำเร็จ: ${message}`, 'error'); showResultModal('บันทึกไม่สำเร็จ', message, 'error'); } finally { button.disabled = false; }
}
async function toggleActive(id) { const e = data.find(x => x.id === id); const { error } = await requireSupabase().from('events').update({ is_active: !e.is_active }).eq('id', id); if (error) return alert(supabaseError(error)); loadAdminData(); }
async function deleteEvent(id) { if (!confirm('ลบคอนเสิร์ตนี้และข้อมูลวันที่/โปรโมชั่นทั้งหมดหรือไม่?')) return; const { error } = await requireSupabase().from('events').delete().eq('id', id); if (error) return alert(supabaseError(error)); loadAdminData(); }

$('base').oninput = preview; $('loginButton').onclick = async () => { const { error } = await requireSupabase().auth.signInWithPassword({ email: $('loginEmail').value.trim(), password: $('loginPassword').value }); $('loginError').textContent = error ? supabaseError(error) : ''; if (!error) showAdmin((await requireSupabase().auth.getSession()).data.session); };
$('logout').onclick = async () => { await requireSupabase().auth.signOut(); showAdmin(null); };
if (SUPABASE_READY) requireSupabase().auth.getSession().then(({ data }) => showAdmin(data.session)); else $('loginError').textContent = 'ยังไม่ได้ตั้งค่า Supabase publishable key ใน supabase-config.js';
