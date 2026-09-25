// AlicetleLabs Customer — data layer ready for Supabase
const LINE_URL='https://lin.ee/zEPQXVT';

const MOCK_EVENTS=[
 {id:1,cat:'tpop',tag:'T-POP',name:'PERSES “UNCENSORED”',venue:'BITEC LIVE',pickup:'รับ–คืนหน้า BITEC',base:890,discounts:{},dates:[{d:'3 OCT',status:'available'}]},
 {id:2,cat:'tpop',tag:'T-POP',name:'OH MY FOURTH CONCERT',venue:'BITEC LIVE',pickup:'รับ–คืนหน้า BITEC',base:890,discounts:{2:80,3:270},dates:[{d:'16 OCT',status:'booked'},{d:'17 OCT',status:'available'},{d:'18 OCT',status:'available'}]},
 {id:3,cat:'kpop',tag:'K-POP',name:'NCT 127 THE REDLINE',venue:'Bangkok',pickup:'รับ–คืน BTS Siam / Mo Chit',base:1290,discounts:{2:180},dates:[{d:'31 OCT',status:'available'},{d:'1 NOV',status:'available'}]},
 {id:4,cat:'kpop',tag:'K-POP',name:'BTS WORLD TOUR ARIRANG',venue:'Rajamangala National Stadium',pickup:'รับ–คืน BTS Siam / Mo Chit',base:1290,discounts:{},dates:[{d:'3 DEC',status:'available'},{d:'5 DEC',status:'pending'},{d:'6 DEC',status:'available'}]}
];

let events=[];
let filter='all',current=null,selected=[];
const $=id=>document.getElementById(id), grid=$('grid'), q=$('q');

async function loadEvents(){
  // SUPABASE HOOK:
  // Replace only this function later with SELECT from events/event_dates/promotions.
  events=structuredClone(MOCK_EVENTS);
  render();
}

function badge(x){return x.status==='available'?`<span class="pill">${x.d} ✓</span>`:x.status==='pending'?`<span class="pill pend">${x.d} HOLD</span>`:`<span class="pill un">${x.d} UN</span>`}

function render(){
 const s=q.value.toLowerCase();
 const a=events.filter(e=>(filter==='all'||e.cat===filter)&&(e.name+' '+e.venue).toLowerCase().includes(s));
 grid.innerHTML=a.map(e=>`<div class="card" onclick="openEvent(${e.id})"><div class="row"><div><div class="title">${e.name}</div><div class="venue">⌖ ${e.venue}</div></div><span class="tag">${e.tag}</span></div><div class="dates">${e.dates.map(badge).join('')}</div><div class="arrow">เช็กคิว →</div></div>`).join('');
}

document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('.tab').forEach(x=>x.classList.remove('on'));
 b.classList.add('on');filter=b.dataset.f;render();
});
q.oninput=render;

window.openEvent=id=>{
 current=events.find(e=>e.id===id);selected=[];
 $('list').classList.add('off');$('detail').classList.add('on');
 $('dtag').textContent=current.tag;$('dname').textContent=current.name;
 $('dvenue').textContent='⌖ '+current.venue;$('pickup').textContent='📍 '+current.pickup;
 $('days').innerHTML=current.dates.map((x,i)=>{
  const dis=x.status!=='available';
  return `<button class="day ${x.status==='pending'?'pending':dis?'disabled':''}" ${dis?'disabled':`onclick="toggleDay(${i},this)"`}><strong>${x.d.split(' ')[0]}</strong><span>${x.d.split(' ').slice(1).join(' ')} · ${x.status==='available'?'ว่าง':x.status==='pending'?'รอยืนยัน':'จองแล้ว'}</span></button>`;
 }).join('');
 update();
};

window.toggleDay=(i,el)=>{
 const p=selected.indexOf(i);
 p>=0?selected.splice(p,1):selected.push(i);
 el.classList.toggle('selected');update();
};

function update(){
 const n=selected.length,disc=current?Number(current.discounts[n]||0):0;
 if(!n){
  $('selectedText').textContent='ยังไม่ได้เลือก';$('total').textContent='—';
  $('pkg').textContent='เลือกวันที่เพื่อดูราคา';$('save').style.display='none';
  $('linebtn').classList.add('disabled');$('linebtn').removeAttribute('href');return;
 }
 selected.sort((a,b)=>a-b);
 const total=current.base*n-disc;
 $('selectedText').textContent=selected.map(i=>current.dates[i].d).join(' + ');
 $('total').textContent='฿'+total.toLocaleString();
 $('pkg').textContent=n===1?`1 วัน · ฿${total.toLocaleString()}`:`${n} วัน · ฿${total.toLocaleString()}${disc?' (ราคาโปร)':''}`;
 if(disc){$('save').textContent=`ประหยัด ฿${disc}`;$('save').style.display='inline-block'}else $('save').style.display='none';
 const msg=`สนใจเช่า Samsung Galaxy S26 Ultra 💜\nงาน: ${current.name}\nวันที่: ${selected.map(i=>current.dates[i].d).join(' + ')}\nราคา: ${total.toLocaleString()} บาท`;
 $('linebtn').href=LINE_URL+'?text='+encodeURIComponent(msg);
 $('linebtn').classList.remove('disabled');
}

$('back').onclick=()=>{$('detail').classList.remove('on');$('list').classList.remove('off')};
loadEvents();
