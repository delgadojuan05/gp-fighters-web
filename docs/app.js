import {Match,roster} from './combat.js';
const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d');
const images={},held=new Map(),keys=new Set(),taps=new Set();let uv,selected=0,match=null,screen='home',paused=false,muted=false,audio=null,last=0,accumulator=0;
const buffers={};
const portraitMode=matchMedia('(orientation:portrait) and (max-width:800px)');
try{muted=localStorage.getItem('gp-muted')==='1';}catch{}
function soundLabels(){document.querySelectorAll('.sound').forEach(b=>b.textContent=`SONIDO: ${muted?'NO':'SÍ'}`);}
soundLabels();
async function unlock(){try{audio??=new (window.AudioContext||window.webkitAudioContext)();await audio.resume();if(!buffers.loading){buffers.loading=true;await Promise.all(['Hit','Block','Whoosh','Jump','Land','Select','Round','Throw'].map(async n=>{try{const r=await fetch(`assets/${n}.wav`);if(r.ok)buffers[n]=await audio.decodeAudioData(await r.arrayBuffer());}catch{}}));}}catch{}}
function sound(n){if(muted||!audio||audio.state!=='running'||!buffers[n])return;const source=audio.createBufferSource(),gain=audio.createGain();source.buffer=buffers[n];gain.gain.value=n==='Whoosh'?.17:.32;source.connect(gain).connect(audio.destination);source.start();}
document.querySelectorAll('.sound').forEach(b=>b.addEventListener('click',()=>{muted=!muted;try{localStorage.setItem('gp-muted',muted?'1':'0');}catch{}unlock();soundLabels();}));
function clearInput(){document.querySelector('.dpad')?.style.setProperty('--stick-x','0px');document.querySelector('.dpad')?.style.setProperty('--stick-y','0px');held.clear();keys.clear();taps.clear();document.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));}
function show(next){screen=next;document.body.classList.toggle('playing',next==='arena');clearInput();for(const id of ['home','select','arena'])$(id).hidden=id!==next;if(next==='select')updateSelection();}
function sprite(c,sheet,pose,x,y,h,face=1,alpha=1){const u=uv[sheet]?.[pose],im=images[sheet];if(!u||!im)return;const k=h/450*(u[8]??1);c.save();c.translate(x,y);c.scale(face,1);c.globalAlpha=alpha;c.drawImage(im,u[0]*im.width,u[1]*im.height,u[2]*im.width,u[3]*im.height,-u[6]*k,-u[7]*k,u[4]*k,u[5]*k);c.restore();}
function updateSelection(){const p=roster[selected];$('fighter-name').textContent=p.name.toUpperCase();$('fighter-tag').textContent=p.tag;$('power-name').textContent=p.power;$('super-name').textContent=p.super;
 document.querySelectorAll('.fighter-card').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));
 const c=$('portrait').getContext('2d');c.clearRect(0,0,400,320);c.imageSmoothingEnabled=false;c.fillStyle='#0005';c.beginPath();c.ellipse(200,303,85,11,0,0,Math.PI*2);c.fill();sprite(c,p.sheet,0,200,306,290);
}
function start(){unlock();sound('Select');match=new Match(selected,(selected+1)%roster.length);paused=false;$('modal').hidden=true;show('arena');$('round-status').textContent='ROUND 1';last=performance.now();accumulator=0;canvas.focus();}
function openPause(){if(screen!=='arena'||!match||match.over)return;paused=true;clearInput();$('modal-kicker').textContent='TOMATE UN RESPIRO';$('modal-title').textContent='PAUSA';$('modal-copy').textContent='La pelea te espera.';$('resume').hidden=false;$('modal').hidden=false;$('resume').focus();}
function result(){paused=true;clearInput();$('modal-kicker').textContent='FIN DE LA PELEA';$('modal-title').textContent=match.winner===0?'¡GANASTE!':match.winner===1?'LA PRÓXIMA ES TUYA':'EMPATE';$('modal-copy').textContent=`${roster[match.f[0].character].name} ${match.f[0].wins} — ${match.f[1].wins} ${roster[match.f[1].character].name}`;$('resume').hidden=true;$('modal').hidden=false;$('rematch').focus();}
$('enter').onclick=()=>{unlock();show('select');sound('Select');};$('back-home').onclick=()=>show('home');$('fight').onclick=start;$('pause').onclick=openPause;$('resume').onclick=()=>{paused=false;$('modal').hidden=true;last=performance.now();accumulator=0;canvas.focus();unlock();};$('rematch').onclick=start;$('choose').onclick=()=>{paused=false;$('modal').hidden=true;show('select');};$('portrait-menu').onclick=()=>show('select');
const keyMap={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyS:'down',ArrowDown:'down',KeyW:'jump',ArrowUp:'jump',KeyF:'punch',KeyG:'kick',KeyH:'block',KeyR:'power',KeyT:'super'};
document.addEventListener('keydown',e=>{if(e.code==='Escape'&&screen==='arena'){e.preventDefault();if(!paused)openPause();else if(!match.over)$('resume').click();return;}if(screen==='home'&&!$('enter').disabled&&e.code==='Enter'){$('enter').click();return;}if(screen==='arena'&&keyMap[e.code]){e.preventDefault();keys.add(keyMap[e.code]);if(!e.repeat)taps.add(keyMap[e.code]);}});
document.addEventListener('keyup',e=>{if(keyMap[e.code])keys.delete(keyMap[e.code]);});
// Each finger owns its input; the movement thumb can slide without lifting.
const dpad=document.querySelector('.dpad');
function updateHeld(){
 const active=new Set([...held.values()].flat());
 document.querySelectorAll('[data-key]').forEach(b=>b.classList.toggle('held',active.has(b.dataset.key)));
}
function direction(e){
 const r=dpad.getBoundingClientRect(),radius=r.width/2;
 const x=(e.clientX-r.left-radius)/radius,y=(e.clientY-r.top-r.height/2)/radius;
 const length=Math.hypot(x,y),travel=radius*.47,scale=length>1?1/length:1;
 dpad.style.setProperty('--stick-x',`${x*scale*travel}px`);
 dpad.style.setProperty('--stick-y',`${y*scale*travel}px`);
 if(length<.22)return [];
 const out=[];
 if(x<-.3)out.push('left');else if(x>.3)out.push('right');
 if(y>.42)out.push('down');else if(y<-.5)out.push('jump');
 return out;
}
function releasePointer(e){
 held.delete(e.pointerId);updateHeld();
 if(e.currentTarget===dpad){dpad.style.setProperty('--stick-x','0px');dpad.style.setProperty('--stick-y','0px');}
}
dpad.addEventListener('pointerdown',e=>{
 e.preventDefault();if(paused||dpad.hasPointerCapture?.(e.pointerId))return;unlock();dpad.setPointerCapture(e.pointerId);
 const input=direction(e);held.set(e.pointerId,input);input.forEach(k=>taps.add(k));updateHeld();
});
dpad.addEventListener('pointermove',e=>{if(!held.has(e.pointerId))return;e.preventDefault();held.set(e.pointerId,direction(e));updateHeld();});
for(const name of ['pointerup','pointercancel','lostpointercapture'])dpad.addEventListener(name,releasePointer);
for(const button of document.querySelectorAll('.actions [data-key]')){
 button.addEventListener('pointerdown',e=>{e.preventDefault();if(paused)return;unlock();button.setPointerCapture(e.pointerId);held.set(e.pointerId,[button.dataset.key]);taps.add(button.dataset.key);updateHeld();});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,releasePointer);
}
for(const button of document.querySelectorAll('[data-key]')){
 button.addEventListener('click',e=>{if(e.detail===0&&!paused)taps.add(button.dataset.key);});
}
// Safari: suppress page gestures only on the fighting surface, keeping menus accessible.
for(const name of ['touchstart','touchmove','touchend','gesturestart','gesturechange','gestureend','dblclick','contextmenu']){
 $('arena').addEventListener(name,e=>{
  if(e.target.closest('.controls, #game')&&e.cancelable)e.preventDefault();
 },{passive:false});
}
window.addEventListener('orientationchange',()=>{clearInput();if(screen==='arena')openPause();});
window.addEventListener('blur',()=>{clearInput();openPause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();openPause();}last=performance.now();accumulator=0;});
function controls(){const down=new Set([...keys,...[...held.values()].flat(),...taps]);taps.clear();return {axis:Number(down.has('right'))-Number(down.has('left')),down:down.has('down'),jump:down.has('jump'),block:down.has('block'),punch:down.has('punch'),kick:down.has('kick'),power:down.has('power'),super:down.has('super')};}
function text(c,t,x,y,size=18,color='#fff',align='left'){c.fillStyle=color;c.font=`900 ${size}px Arial, sans-serif`;c.textAlign=align;c.fillText(t,x,y);}
function roundRect(c,x,y,w,h,r,fill){c.fillStyle=fill;c.beginPath();c.roundRect?c.roundRect(x,y,w,h,r):c.rect(x,y,w,h);c.fill();}
function pose(p){let sheet=roster[p.character].sheet;let n=0;
 if(p.character===0){n=({walk:1,punch:2,kick:3,guard:4,hurt:5,power:6,super:14,crouch:10,low:10,air:9})[p.move]??0;if(p.z>0&&!['air','hurt'].includes(p.move))n=4;}
 else if(p.character===1){n=({walk:1,punch:2,kick:3,guard:4,hurt:5,power:6,super:7})[p.move]??0;if(p.low||p.move==='low'){sheet='RodriAir';n=2;}else if(p.z>0){sheet='RodriAir';n=p.move==='air'?4:0;}}
 else {n=({walk:1,punch:2,kick:3,guard:4,hurt:5,power:6,super:7,crouch:11,low:15,air:10})[p.move]??0;if(p.low&&p.guard)n=11;if(p.z>0&&!['air','hurt'].includes(p.move))n=9;}
 if(p.move==='walk'&&Math.floor(match.total*8)%2===0)n=0;return [sheet,n];
}
function drawFighter(p,i){const info=roster[p.character];let x=p.x;const entrance=Math.min(1,(2.2-match.intro)/1.15);if(match.intro>0){const t=entrance*entrance*(3-2*entrance);x=(i?1040:-80)*(1-t)+x*t;}
 const y=400-p.z;ctx.fillStyle='#00141e55';ctx.beginPath();ctx.ellipse(x,401,48-p.z*.06,8,0,0,Math.PI*2);ctx.fill();let [sheet,n]=pose(p);
 if(match.break>0&&i===match.winner)n=p.character===0?7:p.character===1?7:8;
 sprite(ctx,sheet,n,x,y,info.height*.9,p.face,p.flash>0?.7:1);
}
function drawShot(s){ctx.save();ctx.translate(s.x,400-s.z);ctx.scale(s.face,1);
 if(s.kind==='goat'){ctx.restore();const n=2+Math.floor(match.total*10)%2;sprite(ctx,'AnimalsV16',n,s.x,400,110*uv.AnimalsV16[2][4]/uv.AnimalsV16[n][4],s.face);return;}
 ctx.rotate(match.total*8);if(s.kind==='bar'){ctx.fillStyle='#c1d3df';ctx.fillRect(-42,-5,84,10);ctx.fillStyle='#374a63';ctx.fillRect(-38,-25,14,50);ctx.fillRect(24,-25,14,50);ctx.fillStyle='#a4b7cf';ctx.fillRect(-43,-18,7,36);ctx.fillRect(36,-18,7,36);}else{roundRect(ctx,-9,-25,18,44,4,'#83bcc6');ctx.fillStyle='#e0e7df';ctx.fillRect(-10,-26,20,8);ctx.fillStyle='#416b78';ctx.fillRect(-8,4,16,8);}ctx.restore();}
function draw(){if(!match)return;const dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==960*dpr){canvas.width=960*dpr;canvas.height=540*dpr;}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,960,540);
 ctx.save();ctx.translate(Math.sin(match.total*94)*match.shake,Math.cos(match.total*79)*match.shake*.5);ctx.drawImage(images.JardinPiscina,0,0,960,540);
 const shade=ctx.createLinearGradient(0,0,0,540);shade.addColorStop(0,'#031425a8');shade.addColorStop(.28,'#03142520');shade.addColorStop(.73,'#03142500');shade.addColorStop(.81,'#031425df');shade.addColorStop(1,'#031425');ctx.fillStyle=shade;ctx.fillRect(0,0,960,540);
 drawFighter(match.f[0],0);drawFighter(match.f[1],1);for(const s of match.shots)drawShot(s);
 for(const e of match.effects){ctx.save();ctx.translate(e.x,400-e.z);ctx.globalAlpha=Math.min(1,e.life*5);if(e.super!==undefined){ctx.strokeStyle=e.super===3?'#fff2a9':'#9be5ff';ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,60+(1-e.life/.6)*180,0,Math.PI*2);ctx.stroke();}else{ctx.strokeStyle=e.blocked?'#9eeaff':'#ffe18a';ctx.lineWidth=4;for(let n=0;n<8;n++){const a=n*Math.PI/4,r=(1-e.life/.3)*35;ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);ctx.lineTo(Math.cos(a)*(r+18),Math.sin(a)*(r+18));ctx.stroke();}}ctx.restore();}
 if(match.light>0){ctx.fillStyle=`rgba(255,239,173,${Math.min(.2,match.light*.6)})`;ctx.fillRect(0,85,960,325);}ctx.restore();
 for(let i=0;i<2;i++){const p=match.f[i],info=roster[p.character],x=i?555:32,w=373;roundRect(ctx,x-7,48,w+14,69,5,'#07182ae8');text(ctx,info.name.toUpperCase(),i?x+w:x,66,16,'#fff',i?'right':'left');text(ctx,i?'CPU':'VOS',i?x:x+w,65,9,'#9db2c7',i?'left':'right');ctx.fillStyle='#34465b';ctx.fillRect(x,74,w,17);ctx.fillStyle=p.hp>30?(i?'#ff9a91':'#80e4dd'):'#ff6268';ctx.fillRect(i?x+w*(1-p.hp/100):x,74,w*p.hp/100,17);
  ctx.fillStyle='#28475b';ctx.fillRect(x,97,w,5);ctx.fillStyle='#f6cf5a';ctx.fillRect(i?x+w*(1-p.energy/100):x,97,w*p.energy/100,5);for(let n=0;n<2;n++){ctx.fillStyle=p.wins>n?'#ffcf5b':'#496170';ctx.beginPath();ctx.arc(i?x+w-8-n*18:x+8+n*18,110,4,0,Math.PI*2);ctx.fill();}}
 roundRect(ctx,443,46,74,66,7,'#07182aed');text(ctx,String(Math.ceil(match.time)).padStart(2,'0'),480,88,34,'#ffda79','center');text(ctx,'BLANES VIALE',480,425,9,'#9bb6c2','center');
 const p=match.f[0],powerButton=document.querySelector('[data-key=power]'),superButton=document.querySelector('[data-key=super]');powerButton.style.opacity=p.energy<20||p.cd>0?'.5':'1';superButton.style.opacity=p.energy<60||p.cd>0?'.5':'1';
 if(match.intro>0){const title=match.intro>.7?`ROUND ${match.round}`:'¡A PELEAR!';text(ctx,title,480,245,45,'#07182a','center');text(ctx,title,478,242,45,'#ffda79','center');}
 if(match.break>0){text(ctx,match.winner===-1?'EMPATE':match.f.some(f=>f.hp===0)?'K.O.':'TIEMPO',480,220,55,'#ffda79','center');text(ctx,match.winner<0?'OTRA VEZ, SIN EXCUSAS':`${roster[match.f[match.winner].character].name.toUpperCase()} GANA EL ROUND`,480,250,14,'#fff','center');}
 $('round-status').textContent=`ROUND ${match.round} · MEJOR DE 3`;
}
function frame(now){const elapsed=Math.min(.1,(now-last)/1000||0);last=now;if(screen==='arena'&&match){if(!paused&&!portraitMode.matches){accumulator+=elapsed;let steps=0;while(accumulator>=1/60&&steps++<6){match.step(1/60,controls());for(const event of match.events)sound(event);accumulator-=1/60;if(match.over){result();break;}}}draw();}requestAnimationFrame(frame);}
async function load(){try{const response=await fetch('assets/sprites.json');if(!response.ok)throw Error('No se pudieron cargar los personajes');uv=await response.json();const names=[...Object.keys(uv),'FacesV16','TitleV16','JardinPiscina'];let loaded=0;await Promise.all(names.map(name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[name]=im;$('loading').textContent=`Preparando la pelea · ${Math.round(++loaded/names.length*100)}%`;resolve();};im.onerror=()=>reject(Error(`No se pudo cargar ${name}`));im.src=`assets/${name}.webp`;})));
 for(const [i,p] of roster.entries()){const button=document.createElement('button');button.className='fighter-card';button.setAttribute('aria-pressed',String(i===selected));button.setAttribute('aria-label',`Elegir a ${p.name}`);const tile=p.id;button.innerHTML=`<span class="face" style="background-position:${tile%5*25}% ${Math.floor(tile/5)*50}%"></span><strong>${p.name.toUpperCase()}</strong>`;button.onclick=()=>{selected=i;updateSelection();unlock();sound('Select');};$('cards').append(button);}
 $('loading').textContent='Tocá para empezar';$('enter').textContent='ENTRAR AL JUEGO →';$('enter').disabled=false;requestAnimationFrame(frame);
 }catch(error){$('loading').textContent=`${error.message}. Recargá la página para reintentar.`;$('enter').textContent='RECARGAR';$('enter').disabled=false;$('enter').onclick=()=>location.reload();}}
load();
