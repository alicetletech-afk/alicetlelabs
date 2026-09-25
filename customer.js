// AlicetleLabs Customer — Supabase-backed data layer
// The short URL resolves to this AlicetleLabs official account. LINE's
// oaMessage scheme is required for reliable prefilled text on mobile.
const LINE_ACCOUNT_ID = '@106mcbfi';
let events = [];
let filter = 'all', current = null, selected = [];
const $ = id => document.getElementById(id), grid = $('grid'), q = $('q');

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
}

function transformEvent(row) {
  return {
    id: row.id, cat: row.category, tag: row.tag, name: row.name, venue: row.venue,
    pickup: row.pickup, base: Number(row.base_price), earlyBirdActive: Boolean(row.early_bird_active), earlyBirdPrice: row.early_bird_price == null ? null : Number(row.early_bird_price),
    discounts: Object.fromEntries((row.promotions || []).map(p => [p.days, Number(p.discount_amount)])),
    dates: (row.event_dates || []).sort((a, b) => a.event_date.localeCompare(b.event_date)).map(d => ({
      id: d.id, rawDate: d.event_date, d: formatDate(d.event_date), status: d.status
    }))
  };
}

async function loadEvents() {
  try {
    const client = requireSupabase();
    const { data, error } = await client.from('events').select('id,name,category,tag,venue,pickup,base_price,early_bird_active,early_bird_price,event_dates(id,event_date,status),promotions(id,days,discount_amount)').eq('is_active', true).order('name');
    if (error) throw error;
    events = (data || []).map(transformEvent).sort((a, b) => (a.dates[0]?.rawDate || '').localeCompare(b.dates[0]?.rawDate || ''));
    render();
  } catch (error) {
    grid.innerHTML = `<div class="notice">โหลดข้อมูลไม่สำเร็จ: ${supabaseError(error)}</div>`;
  }
}

function badge(x) { return x.status === 'available' ? `<span class="pill">${x.d} ✓</span>` : x.status === 'pending' ? `<span class="pill pend">${x.d} HOLD</span>` : `<span class="pill un">${x.d} UN</span>`; }
function calculateQuote() {
  const days = selected.length;
  const multiDayDiscount = current ? Number(current.discounts[days] || 0) : 0;
  const dailyPrice = current?.earlyBirdActive && current.earlyBirdPrice != null ? Math.min(current.base, current.earlyBirdPrice) : current?.base || 0;
  const total = dailyPrice * days - multiDayDiscount;
  return { days, multiDayDiscount, total, selectedDates: selected.map(i => current.dates[i].d).join(' + ') };
}
function render() {
  const s = q.value.toLowerCase();
  const a = events.filter(e => (filter === 'all' || e.cat === filter) && (e.name + ' ' + e.venue).toLowerCase().includes(s));
  grid.innerHTML = a.length ? a.map(e => `<div class="card" onclick="openEvent('${e.id}')"><div class="row"><div><div class="title">${e.name}</div><div class="venue">⌖ ${e.venue}</div></div><span class="tag">${e.tag}</span></div><div class="dates">${e.dates.map(badge).join('')}</div><div class="arrow">เช็กคิว →</div></div>`).join('') : '<div class="notice">ยังไม่มีคอนเสิร์ตที่เปิดให้จอง</div>';
}
document.querySelectorAll('.tab').forEach(b => b.onclick = () => { document.querySelectorAll('.tab').forEach(x => x.classList.remove('on')); b.classList.add('on'); filter = b.dataset.f; render(); });
q.oninput = render;

window.openEvent = id => {
  current = events.find(e => e.id === id); selected = [];
  if (!current) return;
  $('list').classList.add('off'); $('detail').classList.add('on');
  $('dtag').textContent = current.tag; $('dname').textContent = current.name;
  $('dvenue').textContent = '⌖ ' + current.venue; $('pickup').textContent = '📍 ' + current.pickup;
  $('days').innerHTML = current.dates.map((x, i) => {
    const dis = x.status !== 'available';
    return `<button class="day ${x.status === 'pending' ? 'pending' : dis ? 'disabled' : ''}" ${dis ? 'disabled' : `onclick="toggleDay(${i},this)"`}><strong>${x.d.split(' ')[0]}</strong><span>${x.d.split(' ').slice(1).join(' ')} · ${x.status === 'available' ? 'ว่าง' : x.status === 'pending' ? 'รอยืนยัน' : 'จองแล้ว'}</span></button>`;
  }).join('');
  update();
};
window.toggleDay = (i, el) => { const p = selected.indexOf(i); p >= 0 ? selected.splice(p, 1) : selected.push(i); el.classList.toggle('selected'); update(); };
function update() {
  const quote = calculateQuote(), n = quote.days, disc = quote.multiDayDiscount;
  if (!n) { $('selectedText').textContent = 'ยังไม่ได้เลือก'; $('total').textContent = '—'; $('pkg').textContent = 'เลือกวันที่เพื่อดูราคา'; $('save').style.display = 'none'; $('linebtn').classList.add('disabled'); $('linebtn').removeAttribute('href'); return; }
  selected.sort((a, b) => a - b);
  const dailyPrice = current.earlyBirdActive && current.earlyBirdPrice != null ? Math.min(current.base, current.earlyBirdPrice) : current.base;
  const earlyBirdSaving = current.earlyBirdActive ? (current.base - dailyPrice) * n : 0;
  const total = quote.total;
  const saved = earlyBirdSaving + disc;
  $('selectedText').textContent = selected.map(i => current.dates[i].d).join(' + '); $('total').textContent = '฿' + total.toLocaleString();
  const regular = current.base * n;
  $('pkg').innerHTML = `${current.earlyBirdActive ? '<b>EARLY BIRD</b> · ' : ''}${n} วัน · ${saved ? `<s>฿${regular.toLocaleString()}</s> → ` : ''}฿${total.toLocaleString()}${disc ? ' (ราคาโปร)' : ''}`;
  if (saved) { $('save').textContent = `ประหยัด ฿${saved.toLocaleString()}`; $('save').style.display = 'inline-block'; } else $('save').style.display = 'none';
  $('linebtn').classList.remove('disabled');
}
$('back').onclick = () => { $('detail').classList.remove('on'); $('list').classList.remove('off'); };
$('linebtn').onclick = event => {
  if (!current || !selected.length) { event.preventDefault(); $('linebtn').classList.add('disabled'); return; }
  selected.sort((a, b) => a - b);
  const quote = calculateQuote();
  const message = `✨ สนใจเช่า Samsung Galaxy S26 Ultra 💜\nงาน: ${current.name}\nวันที่: ${quote.selectedDates}\nจำนวน: ${quote.days} วัน\nราคา: ${quote.total.toLocaleString()} บาท\nรับ–คืน: ${current.pickup}\n\n⭐️ รบกวนเช็กคิวและแจ้งรายละเอียดการจอง⭐️ `;
  const lineUrl = `https://line.me/R/oaMessage/${encodeURIComponent(LINE_ACCOUNT_ID)}/?${encodeURIComponent(message)}`;
  $('linebtn').href = lineUrl;
  event.preventDefault();
  const request = {
    event_id: current.id,
    date_ids: selected.map(i => current.dates[i].id),
    selected_dates: selected.map(i => current.dates[i].rawDate),
    start_date: current.dates[selected[0]].rawDate,
    end_date: current.dates[selected[selected.length - 1]].rawDate,
    pickup_location: current.pickup,
    return_location: current.pickup,
    rental_total: quote.total,
    message
  };
  requireSupabase().from('booking_requests').insert(request).then(({ error }) => {
    if (error) console.warn('[AlicetleLabs] booking request was not saved', error);
    window.location.assign(lineUrl);
  });
};

loadEvents();
if (SUPABASE_READY) {
  supabaseClient.channel('customer-events').on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, loadEvents).on('postgres_changes', { event: '*', schema: 'public', table: 'event_dates' }, loadEvents).on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, loadEvents).subscribe();
}
