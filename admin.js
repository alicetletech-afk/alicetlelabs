// AlicetleLabs Admin — data layer ready for Supabase
const MOCK_DATA=[
 {id:1,name:'OH MY FOURTH CONCERT',cat:'tpop',venue:'BITEC LIVE',pickup:'หน้า BITEC',base:890,promo:'2 วัน 1,700 · 3 วัน 2,400',dates:[['16 OCT','BOOKED'],['17 OCT','AVAILABLE'],['18 OCT','AVAILABLE']]},
 {id:2,name:'NCT 127 THE REDLINE',cat:'kpop',venue:'Bangkok',pickup:'BTS Siam / Mo Chit',base:1290,promo:'2 วัน 2,400',dates:[['31 OCT','AVAILABLE'],['1 NOV','AVAILABLE']]},
 {id:3,name:'BTS WORLD TOUR ARIRANG',cat:'kpop',venue:'Rajamangala National Stadium',pickup:'BTS Siam / Mo Chit',base:1290,promo:'ไม่มีโปรหลายวัน',dates:[['3 DEC','AVAILABLE'],['5 DEC','PENDING'],['6 DEC','AVAILABLE']]},
 {id:4,name:'PERSES “UNCENSORED”',cat:'tpop',venue:'BITEC LIVE',pickup:'หน้า BITEC',base:890,promo:'ราคาปกติ',dates:[['3 OCT','AVAILABLE']]}
];
let data=[];

async function loadAdminData(){
 // SUPABASE HOOK: later SELECT events + event_dates + promotions here.
 data=structuredClone(MOCK_DATA);
 render();
}
async function persistStatus(eventId,dateIndex,status){
 // SUPABASE HOOK: later UPDATE event_dates SET status=...
 return {eventId,dateIndex,status};
}
async function persistEvent(payload){
 // SUPABASE HOOK: later INSERT/UPDATE events, event_dates, promotions here.
 return payload;
}

function statusClass(s){return s==='AVAILABLE'?'available':s==='PENDING'?'pending':'booked'}
function render(){
 events.innerHTML=data.map((e,ei)=>`<article class="event"><div class="eventtop"><div><h3>${e.name}</h3><div class="meta">⌖ ${e.venue}</div></div><button class="edit" onclick="alert('ขั้นต่อไปจะต่อฟอร์มแก้ไขกับ Supabase')">แก้ไข</button></div><div class="price">฿${e.base.toLocaleString()}/วัน · ${e.promo}</div><div class="dayrows">${e.dates.map((d,di)=>`<div class="dayrow"><span class="dayname">${d[0]}</span><button class="status ${statusClass(d[1])}" onclick="cycle(${ei},${di})">${d[1]}</button></div>`).join('')}</div></article>`).join('');
 let c={AVAILABLE:0,PENDING:0,BOOKED:0};
 data.forEach(e=>e.dates.forEach(d=>c[d[1]]++));
 av.textContent=c.AVAILABLE;pd.textContent=c.PENDING;bk.textContent=c.BOOKED;
}
async function cycle(ei,di){
 const order=['AVAILABLE','PENDING','BOOKED'];
 let s=data[ei].dates[di][1];
 const next=order[(order.indexOf(s)+1)%3];
 data[ei].dates[di][1]=next;render();
 await persistStatus(data[ei].id,di,next);
}
function openModal(){modal.classList.add('on');preview()}
function closeModal(){modal.classList.remove('on')}
function addDate(){dateFields.insertAdjacentHTML('beforeend',`<div class="dateinput"><input type="date"><select><option>AVAILABLE</option><option>PENDING</option><option>BOOKED</option></select></div>`)}
function addPromo(){
 const rows=[...document.querySelectorAll('.promoRow')];
 const used=rows.map(r=>+r.querySelector('.promoDays').value||0);
 let next=2;while(used.includes(next))next++;
 promoFields.insertAdjacentHTML('beforeend',`<div class="promo promoRow"><div class="field"><label>จำนวนวัน</label><input class="promoDays" type="number" min="2" value="${next}" oninput="preview()"></div><div class="field"><label>ลดจากราคาปกติ (บาท)</label><input class="promoDisc" type="number" min="0" value="0" oninput="preview()"></div></div>`);
 preview();
}
function preview(){
 let b=+base.value||0;
 const rows=[...document.querySelectorAll('.promoRow')];
 let lines=[`1 วัน = <b>${b.toLocaleString()}.-</b>`];
 rows.forEach(r=>{
  const n=+r.querySelector('.promoDays').value||0;
  const d=+r.querySelector('.promoDisc').value||0;
  if(n>0){
   const normal=b*n,final=Math.max(0,normal-d);
   lines.push(`${n} วัน = <s>${normal.toLocaleString()}.-</s> <b>${final.toLocaleString()}.-</b> · ประหยัด ${d.toLocaleString()}.-`);
  }
 });
 preview.innerHTML=lines.join('<br>');
}
base.oninput=preview;

async function mockSave(){
 const promoRows=[...document.querySelectorAll('.promoRow')].map(r=>({
  days:+r.querySelector('.promoDays').value||0,
  discount:+r.querySelector('.promoDisc').value||0
 }));
 const dateRows=[...document.querySelectorAll('#dateFields .dateinput')].map(r=>({
  date:r.querySelector('input').value,
  status:r.querySelector('select').value
 }));
 const payload={
  name:name.value,category:cat.value,base_price:+base.value||0,
  venue:venue.value,pickup:pickup.value,dates:dateRows,promotions:promoRows
 };
 await persistEvent(payload);
 alert('โครง JS พร้อมแล้ว 💜\nขั้นต่อไปจะเปลี่ยน persistEvent() ให้บันทึกลง Supabase จริง');
 closeModal();
}
loadAdminData();
