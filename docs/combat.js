export const roster = [
 {id:0,name:'Juan',sheet:'JuanV8',height:223,tag:'Mate, termo y pocas vueltas.',power:'Termo',super:'Estampido',color:'#ffbe47'},
 {id:1,name:'Rodri',sheet:'Rodri',height:202,tag:'Una barra. Mucha actitud.',power:'Barra rodante',super:'Barra definitiva',color:'#9ca8ff'},
 {id:11,name:'Diego',sheet:'Diego',height:223,tag:'Las grandes ideas pegan fuerte.',power:'Cabezazo',super:'Manotazo',color:'#71c5ff'},
 {id:12,name:'Gabi',sheet:'Gabi',height:223,tag:'Del campo directo a la pelea.',power:'Cabra al ataque',super:'Destello',color:'#bde783'}
];
const attacks = {
 punch:{start:.075,end:.28,reach:91,damage:6},kick:{start:.13,end:.44,reach:124,damage:10},
 low:{start:.11,end:.43,reach:110,damage:8},air:{start:.085,end:.36,reach:132,damage:11},
 power:{start:.3,end:.85,reach:105,damage:17},super:{start:.35,end:1.1,reach:190,damage:27}
};
export function fighter(character,x,face){return {character,x,face,z:0,vz:0,hp:100,energy:40,wins:0,move:'idle',clock:0,hit:false,cd:0,stun:0,flash:0,guard:false,low:false,guardAge:1};}
export class Match {
 constructor(a=0,b=1,random=Math.random){this.random=random;this.f=[fighter(a,260,1),fighter(b,700,-1)];this.round=1;this.resetRound();this.total=0;this.aiWait=0;}
 resetRound(){this.f=this.f.map((p,i)=>({...fighter(p.character,i?700:260,i?-1:1),wins:p.wins}));this.time=60;this.intro=2.2;this.break=0;this.winner=-2;this.over=false;this.shots=[];this.effects=[];this.events=[];this.freeze=0;this.shake=0;this.light=0;}
 attack(i,kind){const p=this.f[i];if(this.over||this.break||this.intro||p.stun||p.guard||attacks[p.move])return false;
  if(kind==='kick')kind=p.z>0?'air':p.low?'low':'kick';
  if(kind==='power'||kind==='super'){const cost=kind==='super'?60:20;if(p.z>0||p.cd>0||p.energy<cost)return false;p.energy-=cost;p.cd=kind==='super'?7:3.5;}
  p.move=kind;p.clock=0;p.hit=false;this.events.push('Whoosh');return true;
 }
 hurt(i,amount,owner,level='mid',push=23){const q=this.f[i],p=this.f[owner];if(q.hp<=0)return false;
  const front=(p.x-q.x)*q.face>=-6;
  const blocked=q.guard&&front&&(level==='low'?q.low:level==='high'?!q.low:true);
  q.flash=.15;this.effects.push({x:q.x,z:q.z+(level==='low'?35:110),life:.3,blocked});
  this.events.push(blocked?'Block':'Hit');this.freeze=blocked?.025:.055;this.shake=blocked?2:5;
  if(blocked){q.energy=Math.min(100,q.energy+3);q.x+=p.face*7;return false;}
  q.hp=Math.max(0,q.hp-amount);q.stun=.22;q.move='hurt';q.clock=0;q.x+=p.face*push;
  p.energy=Math.min(100,p.energy+7);return true;
 }
 ai(dt){const p=this.f[1],q=this.f[0],d=Math.abs(p.x-q.x);this.aiWait-=dt;
  const danger=attacks[q.move]&&d<150;const out={axis:d>135?Math.sign(q.x-p.x):d<68?-Math.sign(q.x-p.x):0};
  if(danger&&this.random()<.72){out.block=true;out.down=q.move==='low';}
  if(this.aiWait<=0){this.aiWait=.25+this.random()*.45;
   if(d<155){if(this.random()<.32)out.down=true;out[this.random()<.55?'punch':'kick']=true;}
   if(d>170&&d<520&&p.energy>=20&&this.random()<.42)out.power=true;
   if(p.energy>=60&&d<180&&this.random()<.5)out.super=true;
   if(this.shots.some(s=>s.owner===0&&Math.abs(s.x-p.x)<180)&&this.random()<.45)out.jump=true;
  }return out;
 }
 control(i,c){const p=this.f[i];if(p.hp<=0)return;p.low=!!c.down&&p.z===0;
  const busy=!!attacks[p.move]||p.stun>0;p.guard=!busy&&p.z===0&&!!c.block;
  p.guardAge=p.guard?p.guardAge:0;
  if(busy)return;
  if(c.jump&&p.z===0&&!p.guard){p.vz=570;p.z=.1;this.events.push('Jump');}
  p.move=p.guard?'guard':p.low?'crouch':Math.abs(c.axis||0)>.1?'walk':'idle';
  if(!p.guard&&!p.low)p.x+=(c.axis||0)*230*this.dt;
  if(c.super)this.attack(i,'super');else if(c.power)this.attack(i,'power');else if(c.kick)this.attack(i,'kick');else if(c.punch)this.attack(i,'punch');
 }
 step(dt,a={},b=null){dt=Math.max(0,Math.min(dt,1/30));this.dt=dt;this.total+=dt;this.events=[];
  this.effects=this.effects.filter(e=>(e.life-=dt)>0);this.light=Math.max(0,this.light-dt);this.shake=Math.max(0,this.shake-30*dt);
  if(this.over)return;
  if(this.break>0){this.break-=dt;if(this.break<=0){if(this.f.some(p=>p.wins===2))this.over=true;else{this.round++;this.resetRound();}}return;}
  if(this.intro>0){this.intro=Math.max(0,this.intro-dt);return;}
  if(this.freeze>0){this.freeze-=dt;return;}
  this.time=Math.max(0,this.time-dt);
  this.f.forEach((p,i)=>{p.cd=Math.max(0,p.cd-dt);p.stun=Math.max(0,p.stun-dt);p.flash=Math.max(0,p.flash-dt);p.energy=Math.min(100,p.energy+dt*3.5);p.guardAge+=dt;
   if(!attacks[p.move])p.face=this.f[1-i].x>=p.x?1:-1;
   if(p.z>0){p.vz-=1500*dt;p.z+=p.vz*dt;if(p.z<=0){p.z=0;p.vz=0;this.events.push('Land');}}
   if(p.move==='hurt'&&p.stun===0)p.move='idle';
  });
  this.control(0,a);this.control(1,b??this.ai(dt));
  this.f.forEach((p,i)=>{const q=this.f[1-i],attack=attacks[p.move];if(!attack)return;p.clock+=dt;
   if(p.character===2&&p.move==='power'&&p.clock>.15&&p.clock<.65)p.x+=p.face*460*dt;
   if(p.clock>=attack.start&&!p.hit){
    if(p.move==='power'){
     if(p.character===2){if(Math.abs(q.x-p.x)<105&&q.z<115){this.hurt(1-i,18,i,'mid',45);p.hit=true;}}
     else{this.shots.push({owner:i,x:p.x+p.face*48,z:p.character===3?0:p.character===1?12:100,face:p.face,kind:p.character===3?'goat':p.character===1?'bar':'thermo',life:2.5});p.hit=true;this.events.push('Throw');}
    }else if(p.move==='super'){
     const reach=p.character===2?190:650;
     if(Math.abs(q.x-p.x)<reach&&(q.x-p.x)*p.face>=-10&&q.z<180)this.hurt(1-i,27,i,'mid',60);
     this.light=.32;this.effects.push({x:p.x+p.face*90,z:110,life:.6,super:p.character});p.hit=true;
    }else{
     const level=p.move==='low'?'low':p.move==='air'?'high':'mid';
     const vertical=p.move==='low'?q.z<40:Math.abs(p.z-q.z)<110;
     if(Math.abs(q.x-p.x)<attack.reach&&(q.x-p.x)*p.face>=-8&&vertical&&!(p.move==='punch'&&q.low&&p.z===0))this.hurt(1-i,attack.damage,i,level);
     p.hit=true;
    }
   }
   if(p.clock>=attack.end)p.move='idle';
  });
  this.shots=this.shots.filter(s=>{s.life-=dt;s.x+=s.face*(s.kind==='bar'?340:440)*dt;const q=this.f[1-s.owner];
   if(Math.abs(s.x-q.x)<44&&(s.kind==='thermo'?Math.abs(q.z+100-s.z)<85:q.z<75)){this.hurt(1-s.owner,17,s.owner,s.kind==='thermo'?'mid':'low',40);return false;}return s.life>0&&s.x>-120&&s.x<1080;});
  for(const p of this.f)p.x=Math.max(70,Math.min(890,p.x));
  if(Math.abs(this.f[0].x-this.f[1].x)<64&&Math.abs(this.f[0].z-this.f[1].z)<100){const mid=(this.f[0].x+this.f[1].x)/2,sign=this.f[0].x<=this.f[1].x?1:-1;this.f[0].x=mid-32*sign;this.f[1].x=mid+32*sign;}
  if(this.f.some(p=>p.hp<=0)||this.time<=0){this.winner=this.f[0].hp===this.f[1].hp?-1:this.f[0].hp>this.f[1].hp?0:1;if(this.winner>=0)this.f[this.winner].wins++;this.break=2.5;this.events.push('Round');}
 }
}
