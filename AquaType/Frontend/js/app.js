const $=s=>document.querySelector(s);
const S={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let sv=S.get('aq',{xp:0,best:{},daily:{}});
const Z=[
['Sunlit Lagoon','0 to 10 m',0,'Warm, shallow water for first dives.','🐠','Clownfish','Clownfish live among anemone tentacles that protect them.'],
['Coral Kingdom','10 to 30 m',100,'Intermediate passages and reef restoration.','🐢','Green sea turtle','Green turtles can hold their breath for hours while resting.'],
['Jellyfish Forest','30 to 60 m',250,'Precision challenges in drifting light.','🪼','Moon jelly','Jellyfish have no brain, heart or bones.'],
['Sunken City','60 to 120 m',500,'Advanced passages among ancient ruins.','🐬','Bottlenose dolphin','Dolphins use clicks and echoes to find food.'],
['Abyssal Frontier','120 to 300 m',900,'High-difficulty expeditions into the dark.','🦈','Lantern shark','Some small sharks make their own light.'],
['Thermal Vents','300 to 600 m',1400,'Endurance dives with long passages.','🐙','Dumbo octopus','Dumbo octopuses flap ear-like fins to swim.'],
['Trench of Secrets','600 m and below',2200,'Expert challenges and rare finds.','🦑','Vampire squid','It lives in low-oxygen water far below sunlight.']];
const P={
easy:['the sea is calm and blue','a small fish swims past the reef','waves roll in with the tide','sand shifts under the warm light','we dive down to see the coral','the turtle glides through clear water','bubbles rise to the bright surface','a crab walks across the rock'],
mid:['The current carries us toward the Coral Kingdom, where colours glow.','Every careful keystroke feeds the reef, so type with patience.','A jellyfish drifts by; its tentacles trail like silk ribbons.','Divers log their finds: sponges, anemones, and a hidden cave.','Light fades slowly as the water grows colder and deeper.'],
hard:['At 120 metres, the ruins appear: arches, stairs, and a door (sealed since 1893).','"Signal received," she typed; coordinates 41.7, -13.2 were repeating.','Bioluminescence, pressure, silence: the trench rewards steady, accurate hands.','Warning! Oxygen at 38%; ascend slowly, or risk decompression sickness.','The log reads: day 14, depth 612 m, temperature 4°C, no contact.']};
const lvl=x=>Math.floor(Math.sqrt(x/50))+1;
const stage=x=>x<50?0:x<200?1:x<500?2:x<1000?3:4;
const SN=['Damaged coral','Small new growth','Colorful reef','Active habitat','Thriving ecosystem'];
const unlocked=()=>Z.filter(z=>sv.xp>=z[2]).length;
function ui(){
 $('#s1').textContent=lvl(sv.xp);$('#s2').textContent=sv.xp;
 const b=sv.best[(g.mode==='sym'?'sym':'')+g.dur+g.diff];$('#s3').textContent=b?b:'–';
 $('#s4').textContent=unlocked()+'/7';$('#s5').textContent=SN[stage(sv.xp)];
 $('#rf').innerHTML=[0,1,2,3,4].map(i=>'<i class="'+(i<=stage(sv.xp)?'on':'')+'"></i>').join('');
 $('#reg').innerHTML=Z.map(z=>{const o=sv.xp>=z[2];return '<li class="'+(o?'open':'')+'"><span class="d">'+z[1]+'</span><h3>'+z[0]+'</h3><p>'+z[3]+'</p>'+(o?'':'<span class="lk">Unlocks at '+z[2]+' XP</span>')+'</li>'}).join('');
 $('#cr').innerHTML=Z.map(z=>{const o=sv.xp>=z[2];return '<div><span class="e '+(o?'':'x')+'">'+z[4]+'</span><b>'+(o?z[5]:'Undiscovered')+'</b><small>'+(o?z[6]:'Reach '+z[0])+'</small></div>'}).join('');
 $('#zn').textContent=Z[unlocked()-1][0];
}
/* daily expedition */
const DQ=[['Reef Rescue','Finish any dive with 95% accuracy or better.',r=>r.acc>=95],['Deep Dive','Complete a 120 second dive.',r=>r.dur==120],['Perfect Current','Finish a 15 second dive with no mistakes.',r=>r.dur==15&&r.errs==0],['Pressure Challenge','Reach 30 WPM in a 60 second dive.',r=>r.dur==60&&r.wpm>=30]];
const today=new Date().toISOString().slice(0,10),dq=DQ[Math.floor(Date.now()/864e5)%4];
function dqui(){$('#dqn').textContent='Daily expedition: '+dq[0];$('#dqd').textContent=dq[1]+' Reward: 60 XP.';$('#dqs').textContent=sv.daily.d===today?'Completed ✓':'Not done yet'}
/* typing engine */
const g={dur:30,diff:'easy',mode:'free',cust:'',text:'',pos:0,st:[],keys:0,good:0,errs:0,cc:0,t0:0,run:false,combo:0,tid:0,done:false};
const inn=$('#in'),hid=$('#hid');
const WL=[...new Set(Object.values(P).flat().join(' ').toLowerCase().replace(/[^a-z ]/g,'').split(' '))].filter(Boolean);
const weak=()=>Object.entries(sv.miss||{}).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e[0]);
function src(){if(g.mode==='story')return[ST[g.chap][1]];if(g.mode==='endless')return P[['easy','mid','hard'][Math.min(2,g.cc/150|0)]];if(g.mode==='prec')return P.mid;if(g.mode==='sym')return P.sym;if(g.mode==='custom'&&g.cust)return[g.cust];if(g.mode==='weak'){const w=weak();if(w.length){let f=WL.filter(x=>w.some(c=>x.includes(c)));if(f.length<4)f=w.map(c=>c+c+c);const o=[];for(let i=0;i<8;i++)o.push([0,1,2,3].map(()=>f[Math.random()*f.length|0]).join(' '));return o}}return P[g.diff]}
function more(){let s='';const a=src();while(s.length<160)s+=a[Math.random()*a.length|0]+' ';const fr=document.createDocumentFragment();for(const c of s){const e=document.createElement('span');e.textContent=c;fr.appendChild(e)}g.text+=s;inn.appendChild(fr)}
function reset(){clearInterval(g.tid);Object.assign(g,{ep:{dbl:0,skip:0,swap:0,oth:0},text:'',pos:0,st:[],keys:0,good:0,errs:0,cc:0,run:false,combo:0,done:false});inn.innerHTML='';inn.style.transform='';more();inn.children[0].className='cur';
 $('#lt').textContent=g.dur;$('#lw').textContent=0;$('#la').textContent='100%';$('#gf').style.width='0';$('#vg').style.opacity=0;$('#dp').textContent='0 m';$('#hint').style.display='flex';ui();guide()}
function key(ch){
 if(g.done)return;
 if(!g.run){g.run=true;g.t0=performance.now();g.tid=setInterval(tick,100);$('#hint').style.display='none'}
 const sp=inn.children,p=g.pos;g.keys++;
 if(ch===g.text[p]){g.good++;g.cc++;g.combo++;g.st[p]=1;sp[p].className='ok';snd(500+Math.min(g.combo,30)*10,.04,.03)}else{g.errs++;g.combo=0;g.st[p]=2;sp[p].className='no';snd(180,.1,.05);g.ep[ch===g.text[p-1]?'dbl':ch===g.text[p+1]?'skip':(NB[g.text[p].toLowerCase()]||[]).includes(ch.toLowerCase())?'swap':'oth']++;const m=g.text[p].toLowerCase();if(/[a-z]/.test(m)){sv.miss=sv.miss||{};sv.miss[m]=(sv.miss[m]||0)+1}}
 g.pos++;sp[g.pos].className+=' cur';
 if(g.pos>g.text.length-90)more();if((g.mode==='prec'&&g.errs>=3)||(g.mode==='endless'&&g.errs>=5)||(g.mode==='story'&&g.pos>=g.L))finish();
 const y=sp[g.pos].offsetTop-sp[0].offsetTop;inn.style.transform='translateY(-'+Math.max(0,y-50)+'px)';guide();
}
function back(){if(g.done||g.pos<1)return;const sp=inn.children;sp[g.pos].className='';g.pos--;if(g.st[g.pos]==1){g.cc--}g.st[g.pos]=0;sp[g.pos].className='cur';guide()}
function stats(){const m=Math.max((performance.now()-g.t0)/6e4,1/600);return{wpm:Math.round(g.cc/5/m),acc:g.keys?Math.round(g.good/g.keys*100):100}}
function tick(){const el=(performance.now()-g.t0)/1e3,en=g.mode==='endless',left=en?1:Math.max(0,g.dur-el),s=stats();
 $('#lt').textContent=en?Math.floor(el):Math.ceil(left);$('#lw').textContent=s.wpm;$('#la').textContent=s.acc+'%';
 const d=Math.round(g.cc*.4);$('#dp').textContent=d+' m';$('#gf').style.width=Math.min(100,g.cc/4)+'%';if(st().press)$('#vg').style.opacity=Math.min(.7,g.cc/700);
 if(left<=0)finish()}
function finish(){clearInterval(g.tid);g.done=true;hid.blur();const s=stats(),k=g.mode==='endless'?'endless':(g.mode==='sym'?'sym':'')+g.dur+g.diff;
 const mult={easy:1,mid:1.3,hard:1.6}[g.diff];let xp=Math.round(g.cc*.3*(s.acc/100)*(s.acc/100)*mult);
 if(g.mode==='prec'&&g.errs<3&&s.acc>=98)xp+=25;if(g.mode==='endless'&&g.cc>(sv.endBest||0))sv.endBest=g.cc;const before=unlocked();let nb=false;if(s.wpm>(sv.best[k]||0)&&g.cc>5){sv.best[k]=s.wpm;nb=true}
 let bonus='';if(sv.daily.d!==today&&dq[2]({acc:s.acc,dur:g.dur,errs:g.errs,wpm:s.wpm})&&g.cc>5){sv.daily={d:today};xp+=60;bonus='Daily expedition complete: +60 XP. '}
 const pv=(sv.hist||[]).slice(-1)[0];let sm='';if(g.mode==='story'&&g.pos>=g.L&&s.acc>=90){sv.story=sv.story||{};if(!sv.story[g.chap]){xp+=40;sm='Chapter complete: +40 XP. '}sv.story[g.chap]=1;sm+=ST[g.chap][2]+' '}else if(g.mode==='story')sm='Message not decoded. Finish it with 90% accuracy to continue. ';
 const lb=lvl(sv.xp);sv.xp+=xp;if(g.cc>5){(sv.hist=sv.hist||[]).push({t:Date.now(),wpm:s.wpm,acc:s.acc,dur:g.dur,diff:g.diff});sv.hist=sv.hist.slice(-60)}
 const nbd=badges({s,errs:g.errs,cc:g.cc});S.set('aq',sv);snd(660,.4,.08);
 $('#r1').textContent=s.wpm;$('#r2').textContent=s.acc+'%';$('#r3').textContent=g.errs;$('#r4').textContent='+'+xp;
 $('#rm').textContent=g.mode==='endless'?'You typed '+g.cc+' correct characters. Best: '+(sv.endBest||0)+'.':nb?'New personal best for this setup!':s.acc>=95?'Smooth current. Very clean typing.':'Good dive. Accuracy earns more XP.';
 const nu=unlocked()>before?'You unlocked '+Z[unlocked()-1][0]+' and discovered the '+Z[unlocked()-1][5]+'. ':'';
 $('#rn').textContent=sm+bonus+nu+(nbd.length?'Badge: '+nbd.join(', ')+'. ':'')+(lvl(sv.xp)>lb?'Level up! You are level '+lvl(sv.xp)+'.':'')||'Keep diving to reach the next zone.';
 ui();dqui();dash();$('#cmp').textContent=g.cc<=5?'':pv?'Compared with your last dive: WPM '+(s.wpm>=pv.wpm?'+':'')+(s.wpm-pv.wpm)+', accuracy '+(s.acc>=pv.acc?'+':'')+(s.acc-pv.acc)+' points. Some dives are slower, and that is normal.':'This is your first saved dive.';epr();$('#res').showModal()}
hid.addEventListener('beforeinput',e=>{e.preventDefault();if(e.inputType==='insertText'&&e.data)for(const c of e.data)key(c);else if(e.inputType==='deleteContentBackward')back()});
hid.addEventListener('keydown',e=>{if(e.key==='Backspace'){e.preventDefault();back()}else if(e.key==='Escape'){reset()}});
const focusT=()=>{if(!g.done)hid.focus()};
$('#txt').addEventListener('click',focusT);
$('#txt').addEventListener('keydown',e=>{if(e.key.length===1||e.key==='Enter'){focusT()}});
$('#txt').addEventListener('focus',focusT);
function seg(id,key,num){$(id).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$(id).children].forEach(x=>x.setAttribute('aria-pressed',x===b));g[key]=num?+b.dataset.v:b.dataset.v;reset()})}
seg('#dur','dur',1);seg('#dif','diff',0);
$('#again').onclick=()=>{$('#res').close();reset();focusT()};
$('#close').onclick=()=>{$('#res').close();reset()};
$('#res').addEventListener('close',()=>{reset()});
/* sound, focus, modes, dashboard */
let AC=null,snOn=false,VOL=.6;
function snd(f,d,v){if(!snOn)return;try{AC=AC||new AudioContext();const o=AC.createOscillator(),a=AC.createGain(),n=AC.currentTime;o.frequency.value=f;a.gain.setValueAtTime((v||.04)*VOL*2,n);a.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(a);a.connect(AC.destination);o.start();o.stop(n+d)}catch(e){}}
$('#vol').oninput=e=>{VOL=+e.target.value};
$('#snd').onclick=e=>{snOn=!snOn;e.target.setAttribute('aria-pressed',snOn);if(snOn){try{AC=AC||new AudioContext();AC.resume()}catch(x){}snd(440,.15,.05)}};
$('#foc').onclick=e=>{const f=document.body.classList.toggle('focus');e.target.setAttribute('aria-pressed',f);if(f)scrollTo(0,0)};
$('#mod').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$('#mod').children].forEach(x=>x.setAttribute('aria-pressed',x===b));g.mode=b.dataset.v;$('#cw').hidden=g.mode!=='custom';const w=weak();$('#mn').textContent=g.mode==='weak'?(w.length?'Practicing your most missed keys: '+w.join(' ').toUpperCase():'No weak keys recorded yet, so this uses normal text.'):({prec:'Precision: the dive ends after 3 mistakes. Finish with 98% accuracy or better for 25 bonus XP.',sym:'Symbols: practice the number row, brackets and punctuation. This mode keeps its own best scores.',endless:'Endless Current: no timer. Text gets harder every 150 correct characters. The dive ends after 5 mistakes.'}[g.mode]||'');reset()});
$('#cuse').onclick=()=>{g.cust=$('#ct').value.replace(/\s+/g,' ').trim();$('#mn').textContent=g.cust?'Custom text is private practice and is never shared.':'Type some text first.';reset();focusT()};
const BD=[['first','First Dive','Complete a dive',x=>1],['smooth','Smooth Current','Finish a dive with 95% accuracy or better',x=>x.s.acc>=95],['fast','Fast Fin','Reach 40 WPM',x=>x.s.wpm>=40],['perfect','Perfect Passage','Finish a dive with no mistakes',x=>x.errs==0&&x.cc>20],['days','Consistent Diver','Practice on 3 different days',x=>new Set((sv.hist||[]).map(h=>new Date(h.t).toDateString())).size>=3],['coll','Marine Collector','Discover 4 creatures',x=>unlocked()>=4],['reef','Reef Guardian','Reach the thriving ecosystem stage',x=>stage(sv.xp)==4],['deep','Deep Explorer','Unlock the Abyssal Frontier',x=>unlocked()>=5]];
function badges(x){sv.ach=sv.ach||{};const n=[];if(x.cc<=5)return n;BD.forEach(b=>{if(!sv.ach[b[0]]&&b[3](x)){sv.ach[b[0]]=Date.now();n.push(b[1])}});return n}
function ch(a,mx,c,avg){if(a.length<2)return'<p class="note">Complete 2 dives to see this chart.</p>';const w=320,h=110,y=v=>h-10-v/mx*(h-20),pt=a.map((v,i)=>[10+i*(w-20)/(a.length-1),y(v)]);return '<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Chart of your last '+a.length+' dives"><line x1="10" x2="'+(w-10)+'" y1="'+y(avg)+'" y2="'+y(avg)+'" stroke="#8fb8c6" stroke-dasharray="4 4"/><polyline fill="none" stroke="'+c+'" stroke-width="2.5" points="'+pt.join(' ')+'"/>'+pt.map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="'+c+'"/>').join('')+'</svg>'}
function dash(){prof();stui();hab();const HS=sv.hist||[],mxf=a=>a.length?Math.max(...a):0,av=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0,WP=HS.map(h=>h.wpm),AP=HS.map(h=>h.acc);
$('#d1').textContent=mxf(WP);$('#d2').textContent=av(WP);$('#d3').textContent=av(AP)+'%';$('#d4').textContent=HS.length;$('#d5').textContent=Math.round(HS.reduce((s,h)=>s+h.dur,0)/60)+' min';
$('#c1').innerHTML=ch(WP.slice(-20),Math.max(60,mxf(WP)),'#6ff5de',av(WP));$('#c2').innerHTML=ch(AP.slice(-20),100,'#ffd88a',av(AP));
const w=weak();$('#wk').textContent=w.length?'Most missed keys: '+w.map(c=>c.toUpperCase()).join(', ')+'. Choose Weak keys mode to practice them.':'No weak keys recorded yet. Keep typing and AquaType will find them.';
$('#bd').innerHTML=BD.map(b=>{const o=sv.ach&&sv.ach[b[0]];return '<div class="'+(o?'':'x')+'"><span class="e">'+(o?'🏅':'🔒')+'</span><b>'+b[1]+'</b><small>'+b[2]+'</small></div>'}).join('')}
/* story, habitat, constellation */
const ST=[['Dawn signal','Message received: Station Aurora lost contact at dawn. The team dove toward the lagoon.','Log 1: The team left the lagoon before the signal faded.'],['Coral warning','Warning from the reef: the lights are failing, and something large moves below the arches.','Log 2: Lights failed in the Coral Kingdom. The team heard a deep, slow hum.'],['Sunken door','Coordinates 41.7, -13.2 confirmed. A sealed door stands in the Sunken City; the code is hidden in the logs.','Log 3: The sealed door is older than any map. It answers to patterns of sound.'],['The last log','Final entry: we found the city alive with light. We are safe, and the signal returns when you reach us.','Log 4: The city was never lost. Its light simply needed someone to listen.']];
function stui(){const d=sv.story||{};$('#stl').innerHTML=ST.map((c,i)=>{const ok=d[i],open=i==0||d[i-1];return '<div class="'+(open?'':'x')+'"><span class="e">'+(ok?'📜':open?'📡':'🔒')+'</span><b>'+c[0]+'</b><small>'+(ok?c[2]:open?'Type the message to decode it.':'Finish the previous chapter first.')+'</small>'+(open?'<button class="btn s" data-i="'+i+'">'+(ok?'Replay':'Decode')+'</button>':'')+'</div>'}).join('')}
$('#stl').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const i=+b.dataset.i;g.mode='story';g.chap=i;g.L=ST[i][1].length;g.dur=120;[...$('#dur').children].forEach(x=>x.setAttribute('aria-pressed',x.dataset.v==120));[...$('#mod').children].forEach(x=>x.setAttribute('aria-pressed',false));$('#cw').hidden=true;$('#mn').textContent='Story: type the full message with 90% accuracy or better.';reset();$('#play').scrollIntoView();focusT()});
const DEC=[['🪸','Coral',0],['🌿','Seaweed',0],['🐚','Shell',50],['🪨','Rock',50],['⭐','Starfish',200],['⚓','Anchor',200],['💎','Gem',500],['🏺','Amphora',500],['🐠','Fish',1000],['🐢','Turtle',1400],['🔱','Treasure trident',0,5],['👑','Treasure crown',0,15],['🗝','Treasure key',0,30]];let sel=0;
function hab(){sv.hab=sv.hab||Array(32).fill('');
$('#pal').innerHTML=DEC.map((d,i)=>{const o=d[3]?(sv.hist||[]).length>=d[3]:sv.xp>=d[2];return '<button '+(o?'':'disabled ')+'data-i="'+i+'" aria-pressed="'+(i==sel)+'" aria-label="'+d[1]+(o?'':d[3]?', unlocks after '+d[3]+' dives':', unlocks at '+d[2]+' XP')+'">'+(o?d[0]:'🔒')+'</button>'}).join('');
$('#hg').innerHTML=sv.hab.map((c,i)=>'<button data-c="'+i+'" aria-label="Square '+(i+1)+(c?', filled':', empty')+'">'+c+'</button>').join('');
const H2=sv.hist||[],T=[...H2].sort((a,b)=>b.wpm-a.wpm).slice(0,5),pt=(h,i)=>(20+(i*73)%280)+','+(15+(i*41)%110);
$('#topl').innerHTML=T.length?T.map(h=>'<li>'+h.wpm+' WPM at '+h.acc+'% accuracy, '+h.dur+' second dive</li>').join(''):'<li>No dives yet.</li>';
$('#cn').innerHTML=H2.length?'<polyline fill="none" stroke="rgba(143,184,198,.4)" points="'+H2.map(pt).join(' ')+'"/>'+H2.map((h,i)=>'<circle cx="'+pt(h,i).split(',')[0]+'" cy="'+pt(h,i).split(',')[1]+'" r="3.5" fill="#ffd88a"/>').join(''):'<text x="20" y="70" fill="#8fb8c6">Finish a dive to light your first star.</text>'}
$('#pal').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.disabled){sel=+b.dataset.i;[...$('#pal').children].forEach((x,j)=>x.setAttribute('aria-pressed',j==sel))}});
$('#hg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const i=+b.dataset.c,d=DEC[sel][0];sv.hab[i]=sv.hab[i]===d?'':d;b.textContent=sv.hab[i];b.setAttribute('aria-label','Square '+(i+1)+(sv.hab[i]?', filled':', empty'));S.set('aq',sv)});
/* settings, guide, patterns, profile */
P.sym=['2 + 3 = 5; 8 * 7 = 56.','(a + b) [c] {d} <e> 10/20','user@mail.com, #tag, 50% off!','"Quote," he said: 4/5 - 1 = 3?','$19.99 & tax (7%) = $21.39','x = [1, 2, 3]; y = {a: 9};'];
const esc=s=>String(s).replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';');
const KR=['1234567890','qwertyuiop','asdfghjkl;','zxcvbnm,./'],FN=['left pinky','left ring','left middle','left index','left index','right index','right index','right middle','right ring','right pinky'],NB={},SY={'!':'1','@':'2','#':'3','$':'4','%':'5','&':'7','(':'9',')':'0',':':';','?':'/','<':',','>':'.','"':"'"};
KR.forEach((r,y)=>[...r].forEach((c,x)=>{NB[c]=[];for(const[dy,dx]of[[0,-1],[0,1],[-1,0],[-1,1],[1,-1],[1,0]]){const c2=(KR[y+dy]||'')[x+dx];if(c2)NB[c].push(c2)}}));
$('#kb').innerHTML=KR.map(r=>'<div>'+[...r].map(c=>'<i data-k="'+c+'">'+c+'</i>').join('')+'</div>').join('')+'<div><i class="sp" data-k=" ">space</i></div>';
function guide(){if(!st().guide)return;const raw=g.text[g.pos]||'';if(!raw)return;const low=raw.toLowerCase(),k=SY[raw]||low,sh=!!SY[raw]||raw!==low,ks=[...$('#kb').querySelectorAll('i')];ks.forEach(i=>i.classList.toggle('on',i.dataset.k===k));const ci=KR.join('').indexOf(k);$('#fg').textContent='Next: '+(raw===' '?'space':raw)+' with your '+(k===' '?'thumb':ci>=0?FN[ci%10]:'nearest finger')+(sh?' (hold Shift with the other hand)':'')}
const TIP={dbl:'You often double-tap keys. Press once and lift your finger fully before the next key.',skip:'You sometimes skip a letter. Slow down a little and read one word ahead.',swap:'Many mistakes hit a neighboring key. Keep your fingers on the home row and return after each reach.',oth:'Your mistakes are spread out. Try Precision mode to build careful habits.'},PN={dbl:'double taps',skip:'skipped letters',swap:'neighboring keys',oth:'mixed keys'};
function epr(){const t=Object.entries(g.ep).sort((a,b)=>b[1]-a[1])[0];$('#ep').textContent=g.errs&&t[1]?'Main mistake pattern: '+PN[t[0]]+' ('+t[1]+'). Tip: '+TIP[t[0]]:'No mistakes to analyze. Try a harder setting to keep improving.'}
const TH={deep:[[[26,166,183],[7,58,86]],[[2,12,22],[1,4,9]]],coral:[[[255,140,120],[120,40,70]],[[20,6,14],[8,2,6]]],kelp:[[[90,190,110],[16,70,50]],[[2,16,10],[1,8,5]]],trench:[[[70,80,170],[20,16,70]],[[4,2,14],[1,1,6]]]},NEED={deep:1,coral:2,kelp:3,trench:4};
function st(){return sv.set=Object.assign({theme:'deep',cur:'line',size:1.3,dys:false,press:true,guide:false,name:'',av:0,gw:40,ga:95},sv.set||{})}
function ap(){const c=st();if(lvl(sv.xp)<NEED[c.theme])c.theme='deep';const h=new Date().getHours(),n=h<6||h>=19?.6:1,t=TH[c.theme],b=document.body;C0=t[0].map(a=>a.map(v=>Math.round(v*n)));C1=t[1];b.dataset.theme=c.theme;b.dataset.cur=c.cur;b.classList.toggle('dys',c.dys);$('#txt').style.fontSize=c.size+'rem';$('#kb').hidden=$('#fg').hidden=!c.guide;if(!c.press)$('#vg').style.opacity=0;guide()}
function prof(){const c=st(),u=Z.filter(z=>sv.xp>=z[2]),hs=sv.hist||[];if(c.av>=u.length)c.av=0;$('#prof').innerHTML='<span style="font-size:2.2rem">'+u[c.av][4]+'</span><div><h3>'+esc(c.name||'Diver')+'</h3><span>Level '+lvl(sv.xp)+', '+sv.xp+' XP, '+hs.length+' dives</span></div>';const ok=hs.filter(h=>h.acc>=c.ga).map(h=>h.wpm),best=ok.length?Math.max(...ok):0;$('#goal').innerHTML='<b>Goal: '+c.gw+' WPM at '+c.ga+'% accuracy or better.</b> Best qualifying dive: '+best+' WPM.<div class="gauge"><i style="width:'+Math.min(100,best/c.gw*100)+'%"></i></div>'}
$('#sbtn').onclick=()=>{const c=st(),L=lvl(sv.xp);$('#s_th').value=c.theme;[...$('#s_th').options].forEach(o=>o.disabled=L<NEED[o.value]);$('#s_cu').value=c.cur;$('#s_sz').value=c.size;$('#s_dy').checked=c.dys;$('#s_pr').checked=c.press;$('#s_kb').checked=c.guide;$('#s_nm').value=c.name;$('#s_gw').value=c.gw;$('#s_ga').value=c.ga;$('#s_av').innerHTML=Z.filter(z=>sv.xp>=z[2]).map((z,i)=>'<option value="'+i+'">'+z[4]+' '+z[5]+'</option>').join('');$('#s_av').value=c.av;$('#s_msg').textContent='';$('#set').showModal()};
$('#set').addEventListener('change',e=>{if(e.target.id==='s_im')return;const c=st();Object.assign(c,{theme:$('#s_th').value,cur:$('#s_cu').value,size:+$('#s_sz').value||1.3,dys:$('#s_dy').checked,press:$('#s_pr').checked,guide:$('#s_kb').checked,name:$('#s_nm').value.slice(0,20),av:+$('#s_av').value||0,gw:Math.min(200,Math.max(10,+$('#s_gw').value||40)),ga:Math.min(100,Math.max(50,+$('#s_ga').value||95))});S.set('aq',sv);ap();prof()});
$('#s_ok').onclick=()=>$('#set').close();
$('#s_ex').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(sv)],{type:'application/json'}));a.download='aquatype-backup.json';a.click();$('#s_msg').textContent='Backup created. If nothing downloaded, your browser may be blocking downloads here.'};
$('#s_im').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(!o||typeof o.xp!=='number')throw 0;sv=o;S.set('aq',sv);ap();ui();dash();$('#s_msg').textContent='Backup restored.'}catch(x){$('#s_msg').textContent='That file is not a valid AquaType backup.'}};r.readAsText(f)};
document.addEventListener('keydown',e=>{const t=e.target;if(/INPUT|TEXTAREA|SELECT/.test(t.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='?'){e.preventDefault();$('#keys').showModal()}else if(e.key==='f')$('#foc').click();else if(e.key==='r')reset();else if(e.key==='s')$('#sbtn').click()});
/* ===== Ocean map: 7 zones, missions, pearls, themes, Long Descent ===== */
const ZN=[
['coral','Coral Paradise','🪸','0 to 50 m','Beginner','easy','A warm, sunlit reef where fish dart between soft corals.',['🪸','🐠','🐚'],[60,190,190],[10,80,110],'#6ff5de','#ffd88a','Coral Pioneer','Sunlit Reef','perf'],
['abyss','Blue Abyss','🐋','50 to 120 m','Beginner+','easy','Open blue water where the light fades and whale songs echo.',['🐋','🫧','🐟'],[30,90,190],[4,18,70],'#7fb2ff','#bcd6ff','Blue Voyager','Deep Blue','long'],
['atlantis','Lost Atlantis','🏛️','120 to 220 m','Intermediate','mid','Golden ruins and sunken columns guard forgotten secrets.',['🏛️','🔱','🐚'],[40,150,140],[8,44,56],'#f4d35e','#ffe9a8','Ruin Seeker','Golden Ruins','perf'],
['jelly','Jellyfish Garden','🪼','220 to 350 m','Intermediate+','mid','A glowing garden of drifting jellyfish and soft pink light.',['🪼','✨','🌸'],[170,80,190],[40,14,76],'#ff9af0','#ffd1f7','Glow Keeper','Neon Bloom','long'],
['wreck','Sunken Shipwreck','🚢','350 to 500 m','Advanced','mid','Rusted hulls, old anchors and crabs hiding in the dark.',['🚢','⚓','🦀'],[80,110,92],[14,28,24],'#9fd49a','#d4f0b0','Wreck Raider','Rusted Hull','perf'],
['frozen','Frozen Depths','🧊','500 to 750 m','Advanced+','hard','Icy water, drifting crystals and a deep, quiet cold.',['🧊','❄️','🐧'],[70,140,200],[12,40,86],'#bdeaff','#ffffff','Ice Breaker','Glacier Glow','long'],
['heart',"Ocean's Heart",'💠','750 m and below','Expert','hard','The pulsing core of the sea, where every current begins.',['💎','🫧','🐙'],[190,50,90],[40,6,24],'#ff7a9c','#ffc2d1','Heart of the Ocean','Heartbeat','deep']];
const DV=[3,4,5,5,6,6,7],WV=[15,22,28,34,40,46,52],AV=[90,92,93,94,95,96,97],DL={easy:'beginner',mid:'intermediate',hard:'advanced'},TC=i=>i?8+i*4:0;
const M4={perf:'Finish a dive with zero mistakes',long:'Complete a 60-second dive with 90%+ accuracy',deep:'Complete a flawless 60-second dive'};
const zp=()=>sv.zp=Object.assign({u:1,m:{},c:{},pe:0,th:{coral:1},eq:'',a:'coral',b:{},ld:{best:0,runs:0}},sv.zp||{});
const zms=i=>[['Complete '+DV[i]+' typing dives',DV[i]],['Reach '+WV[i]+' WPM in one dive (85%+ accuracy)',WV[i]],['Score '+AV[i]+'% accuracy in a dive of 60+ characters',AV[i]],[M4[ZN[i][14]],1]];
let zs=0;
function toast(t){const e=$('#toast');e.textContent=t;e.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.opacity=0,3500)}
function celeb(t,s,ic,col){$('#zct').textContent=t;$('#zcs').textContent=s;$('#zci').textContent=ic;const f=$('#zcf');f.innerHTML='';for(let k=0;k<36;k++){const e=document.createElement('i');e.className='cf';e.style.cssText='left:'+Math.random()*100+'%;background:'+['#6ff5de','#ffd88a','#ff8a78','#ffffff',col][k%5]+';animation-delay:'+(Math.random()*1.2)+'s';f.appendChild(e)}$('#zc').showModal()}
const ZT_VARS=['--glow','--glow-r','--glow-g','--glow-b','--gold','--surf','--surf2','--txt-dim','--ld-word'];
/* per-zone extra vars: [r, g, b, surf rgba top, surf rgba bot, txt-dim, ld-word] */
const ZT_EX={
 coral:[111,245,222,'rgba(14,124,134,.5)','rgba(7,58,86,.8)','#6f98a8','#9fc3d0'],
 abyss:[127,178,255,'rgba(10,40,110,.5)','rgba(4,14,50,.8)','#7090c8','#8090d4'],
 atlantis:[244,211,94,'rgba(60,100,20,.5)','rgba(20,40,8,.8)','#a8a060','#c0b870'],
 jelly:[255,154,240,'rgba(100,20,110,.5)','rgba(40,8,50,.8)','#b070b0','#c890d0'],
 wreck:[159,212,154,'rgba(30,60,20,.5)','rgba(10,24,8,.8)','#80a878','#90b888'],
 frozen:[189,234,255,'rgba(20,60,100,.5)','rgba(8,24,50,.8)','#88b0c8','#98c0d8'],
 heart:[255,122,156,'rgba(100,10,30,.5)','rgba(40,4,12,.8)','#c06080','#d07090']
};
function zt(id){const z=ZN.find(x=>x[0]===id),b=document.body.style;
 if(!z){ZT_VARS.forEach(v=>b.removeProperty(v));return}
 const h=new Date().getHours(),n=h<6||h>=19?.6:1;
 C0=[z[8].map(v=>Math.round(v*n)),z[9].map(v=>Math.round(v*n))];C1=[[2,8,16],[1,3,8]];
 const ex=ZT_EX[id]||ZT_EX.coral;
 b.setProperty('--glow',z[10]);b.setProperty('--glow-r',ex[0]);b.setProperty('--glow-g',ex[1]);b.setProperty('--glow-b',ex[2]);
 b.setProperty('--gold',z[11]);b.setProperty('--surf',ex[3]);b.setProperty('--surf2',ex[4]);
 b.setProperty('--txt-dim',ex[5]);b.setProperty('--ld-word',ex[6])}
const _ap=ap;ap=function(){_ap();zt(zp().eq)};
const _fin=finish;finish=function(){_fin();zdive()};
function zdive(){const Z0=zp(),i=ZN.findIndex(x=>x[0]===Z0.a);if(i<0||i>=Z0.u||g.cc<30||g.mode==='custom'||g.mode==='story'||g.diff!==ZN[i][5])return;const h=(sv.hist||[]).slice(-1)[0];if(!h||Date.now()-h.t>3000)return;
 const id=ZN[i][0],p=Z0.m[id]=Z0.m[id]||[0,0,0,0],ms=zms(i),was=p.map((v,k)=>v>=ms[k][1]),k4=ZN[i][14];
 p[0]=Math.min(ms[0][1],p[0]+1);if(h.acc>=85)p[1]=Math.max(p[1],h.wpm);if(g.cc>=60)p[2]=Math.max(p[2],h.acc);
 if((k4==='perf'&&g.errs==0&&g.cc>=25)||(k4==='long'&&h.dur>=60&&h.acc>=90)||(k4==='deep'&&h.dur>=60&&g.errs==0))p[3]=1;
 const ev=ms.filter((m,k)=>p[k]>=m[1]&&!was[k]);if(ev.length)toast('Mission complete: '+ev[0][0]);
 if(p.every((v,k)=>v>=ms[k][1])&&!Z0.b[id]){Z0.b[id]=1;if(i<6){Z0.u=Math.max(Z0.u,i+2);Z0.th[ZN[i+1][0]]=1;Z0.eq=ZN[i+1][0];ap();celeb('Zone unlocked!',ZN[i+1][1]+' is now open, with new missions and the '+ZN[i+1][13]+' theme.',ZN[i+1][2],ZN[i+1][10])}else{Z0.eq=ZN[6][0];ap();celeb("Ocean's Heart conquered!",'You completed every zone. Badge earned: '+ZN[6][12]+'.','🏆','#ffd88a')}}
 S.set('aq',sv);zrender()}
function zrender(){const Z0=zp(),pos=[[25,7],[70,21],[30,37],[72,52],[28,67],[68,81],[50,93]];$('#zpe').textContent=Z0.pe;$('#opl').setAttribute('points',pos.map(p=>p.join(',')).join(' '));
 $('#onodes').innerHTML=ZN.map((z,i)=>{const lk=i>=Z0.u,p=Z0.m[z[0]]||[0,0,0,0],ms=zms(i),dn=p.filter((v,k)=>v>=ms[k][1]).length;return '<button class="zn'+(lk?' lk':' on')+(i===zs?' sel':'')+'" data-i="'+i+'" style="left:'+pos[i][0]+'%;top:'+pos[i][1]+'%" aria-label="'+z[1]+(lk?', locked':', '+dn+' of 4 missions done')+'"><span class="e">'+(lk?'🔒':z[2])+'</span>'+z[1]+'<small>'+(lk?z[3]:dn+'/4 missions')+'</small></button>'}).join('');zdet();
 const b=ZN.map(z=>[z[12],'Complete every mission in '+z[1],!!Z0.b[z[0]]]).concat([['Deep Diver','Reach 100 m in Long Descent',Z0.ld.best>=100],['Abyss Walker','Reach 250 m in Long Descent',Z0.ld.best>=250]]);
 $('#zb').innerHTML=b.map(x=>'<div class="'+(x[2]?'':'x')+'"><span class="e">'+(x[2]?'🏅':'🔒')+'</span><b>'+x[0]+'</b><small>'+x[1]+'</small></div>').join('')}
function zdet(){const Z0=zp(),i=zs,z=ZN[i],lk=i>=Z0.u,p=Z0.m[z[0]]||[0,0,0,0],cl=Z0.c[z[0]]||{},ms=zms(i),own=Z0.th[z[0]],eq=Z0.eq===z[0],cost=TC(i),all=p.every((v,k)=>v>=ms[k][1]);
 let h='<div class="zh" style="background:linear-gradient(rgb('+z[8]+'),rgb('+z[9]+'))"><div class="fl" aria-hidden="true">'+[...Array(9)].map((_,k)=>'<i style="left:'+(k*11+2)+'%;animation-delay:'+(k*1.0)+'s">'+z[7][k%3]+'</i>').join('')+'</div><h3>'+z[2]+' '+z[1]+(lk?' (locked)':'')+'</h3><p>'+z[6]+'</p><p><b>Depth:</b> '+z[3]+'. <b>Difficulty:</b> '+z[4]+' ('+DL[z[5]]+' text).'+(!lk&&Z0.a===z[0]?' <b>Active zone.</b>':'')+'</p></div><div class="zb2">';
 if(lk){h+='<p class="note">Locked. Complete all four missions in '+ZN[i-1][1]+' to unlock this zone. Missions here will be:</p>'+ms.map(m=>'<p class="note">• '+m[0]+'</p>').join('')+'<p class="note">Exclusive theme: '+z[13]+'</p></div>'}
 else{h+='<p class="note">Missions count when this zone is active and you dive on '+DL[z[5]]+' difficulty (not Custom or Story mode).</p>'+ms.map((m,k)=>{const v=Math.min(p[k],m[1]),d=p[k]>=m[1];return '<div class="ms"><span>'+m[0]+'</span><span>'+(d?(cl[k]?'Claimed ✓':'<button class="btn s" data-cl="'+k+'">Claim 🦪'+(3+i)+' + '+(20+10*i)+' XP</button>'):v+'/'+m[1])+'</span><div class="gauge"><i style="width:'+v/m[1]*100+'%"></i></div></div>'}).join('');
  if(all)h+=cl.z?'<p class="msg">Zone reward claimed ✓ Badge: '+z[12]+'</p>':'<button class="btn p" data-zr="1">Claim zone reward 🦪'+(10+2*i)+' + '+(60+20*i)+' XP</button>';
  h+='<div class="tcard"><span class="tsw" style="background:linear-gradient(rgb('+z[8]+'),rgb('+z[9]+'))"></span><div><b>'+z[13]+' theme</b><br><small>'+(own?'Collected':'Costs '+cost+' pearls')+'</small></div><button class="btn s" data-pv="1">Preview</button>'+(own?'<button class="btn '+(eq?'p':'s')+'" data-eq="1">'+(eq?'Equipped (tap to remove)':'Equip')+'</button>':'<button class="btn p" data-bu="1"'+(Z0.pe<cost?' disabled':'')+'>Collect</button>')+'</div><button class="btn p" data-dv="1">Dive in this zone</button></div>'}
 $('#zdet').innerHTML=h}
$('#onodes').addEventListener('click',e=>{const b=e.target.closest('button');if(b){zs=+b.dataset.i;zrender()}});
$('#zdet').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const Z0=zp(),i=zs,z=ZN[i],cl=Z0.c[z[0]]=Z0.c[z[0]]||{},D=b.dataset;
 if(D.cl!==undefined){const k=+D.cl;if(!cl[k]){cl[k]=1;Z0.pe+=3+i;sv.xp+=20+10*i;toast('+'+(3+i)+' pearls and +'+(20+10*i)+' XP')}}
 else if(D.zr){if(!cl.z){cl.z=1;Z0.pe+=10+2*i;sv.xp+=60+20*i;toast('Zone reward: +'+(10+2*i)+' pearls and +'+(60+20*i)+' XP')}}
 else if(D.bu){const c=TC(i);if(Z0.pe>=c&&!Z0.th[z[0]]){Z0.pe-=c;Z0.th[z[0]]=1;toast('Theme collected: '+z[13])}}
 else if(D.eq){Z0.eq=Z0.eq===z[0]?'':z[0];ap()}
 else if(D.pv){zt(z[0]);clearTimeout(zdet.pt);zdet.pt=setTimeout(ap,5000);toast('Previewing '+z[13]+' for 5 seconds')}
 else if(D.dv){Z0.a=z[0];g.mode='free';g.diff=z[5];g.dur=30;[...$('#dif').children].forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===g.diff));[...$('#dur').children].forEach(x=>x.setAttribute('aria-pressed',x.dataset.v==30));[...$('#mod').children].forEach(x=>x.setAttribute('aria-pressed',x.dataset.v==='free'));$('#cw').hidden=true;$('#mn').textContent='Zone dive: '+z[1]+' missions count on '+DL[z[5]]+' difficulty.';reset();$('#play').scrollIntoView()}
 S.set('aq',sv);ui();dash();zrender()});
/* Long Descent */
const LD={on:0,d:0,o:100,w:'',p:0,k:'n',hz:100,n:0,c:0,t:0};
function ldr(){const z=ZN[Math.min(6,LD.d/100|0)];$('#ldd').textContent=Math.round(LD.d);$('#ldz').textContent=z[2]+' '+z[1];$('#ldo').style.width=Math.max(0,LD.o)+'%';$('#ldw').innerHTML=[...LD.w].map((c,k)=>'<span class="'+(k<LD.p?'ok':'')+'">'+c+'</span>').join('');$('#ldk').textContent=!LD.on?'':LD.k==='o'?'🫧 Oxygen word: finish it to refill air':LD.k==='h'?'🪼 Hazard! Finish it before the timer ends':'Type the word to dive deeper';$('#ldh').style.width=(LD.k==='h'?LD.hz:0)+'%';$('#ld').style.background='linear-gradient(rgb('+z[8]+'),rgb('+z[9]+'))'}
function ldNext(){const lv=Math.min(2,LD.d/150|0),a=WL.filter(x=>x.length>=3+lv&&x.length<=5+lv*2);LD.w=a[Math.random()*a.length|0]||'wave';LD.p=0;LD.k=LD.n%4==3?'o':LD.n%5==4?'h':'n';LD.n++;LD.hz=100;ldr()}
function ldKey(c){if(!LD.on)return;if(c===LD.w[LD.p]){LD.p++;if(LD.p>=LD.w.length){LD.d+=8+Math.min(6,LD.c>>1);LD.c++;if(LD.k==='o')LD.o=Math.min(100,LD.o+25);ldNext();return}}else{LD.o-=2;LD.p=0;LD.c=0}ldr()}
function ldTick(){LD.o-=.35+LD.d/2500;if(LD.k==='h'){LD.hz-=2.2+LD.d/300;if(LD.hz<=0){LD.o-=20;LD.c=0;ldNext()}}if(LD.o<=0)ldEnd();else ldr()}
function ldEnd(){if(!LD.on)return;LD.on=0;clearInterval(LD.t);const Z0=zp(),d=Math.round(LD.d),pe=Math.floor(d/40),xp=Math.floor(d/8),nb=d>Z0.ld.best;Z0.pe+=pe;sv.xp+=xp;Z0.ld.runs++;if(nb)Z0.ld.best=d;S.set('aq',sv);$('#ldr').textContent='Out of air at '+d+' m. +'+pe+' pearls, +'+xp+' XP.'+(nb?' New best depth!':' Best: '+Z0.ld.best+' m.');$('#ldgo').textContent='Dive again';$('#ldk').textContent='';ui();dash();zrender()}
$('#ldb').onclick=()=>{LD.w='';LD.p=0;ldr();$('#ldr').textContent='Best depth: '+zp().ld.best+' m';$('#ld').showModal()};
$('#ldgo').onclick=()=>{clearInterval(LD.t);Object.assign(LD,{on:1,d:0,o:100,n:0,c:0});$('#ldr').textContent='';ldNext();LD.t=setInterval(ldTick,100);$('#ldin').focus()};
$('#ldx').onclick=()=>$('#ld').close();$('#ld').addEventListener('close',ldEnd);
$('#ldin').addEventListener('beforeinput',e=>{e.preventDefault();if(e.inputType==='insertText'&&e.data)for(const c of e.data)ldKey(c.toLowerCase())});
zrender();
/* sea canvas */
const cv=$('#sea'),cx=cv.getContext('2d');let W,H,E=0,calm=matchMedia('(prefers-reduced-motion:reduce)').matches,t=0;
const bub=[],plk=[],jel=[];
let C0=[[26,166,183],[7,58,86]],C1=[[2,12,22],[1,4,9]];
const mix=(a,b,p)=>a.map((v,i)=>Math.round(v+(b[i]-v)*p));
function size(){W=cv.width=innerWidth;H=cv.height=innerHeight;plk.length=0;for(let i=0;i<70;i++)plk.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.8+.4,s:Math.random()*.3+.05});jel.length=0;for(let i=0;i<3;i++)jel.push({x:Math.random()*W,y:Math.random()*H,r:26+Math.random()*26,ph:Math.random()*6})}
function draw(){
 const mx=document.documentElement.scrollHeight-H,p=mx>0?Math.min(1,scrollY/mx):0;
 const top=mix(C0[0],C1[0],p),bot=mix(C0[1],C1[1],p);
 const gr=cx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgb('+top+')');gr.addColorStop(1,'rgb('+bot+')');cx.fillStyle=gr;cx.fillRect(0,0,W,H);
 if(calm)return;
 E+=((Math.min(1,g.combo/40))-E)*.05;
 cx.globalCompositeOperation='lighter';
 for(let i=0;i<5;i++){const x=W*(.1+i*.22)+Math.sin(t*.0004+i)*60;const rg=cx.createLinearGradient(x,0,x+120,H*.8);rg.addColorStop(0,'rgba(140,255,240,'+(.1+E*.12)*(1-p)+')');rg.addColorStop(1,'rgba(140,255,240,0)');cx.fillStyle=rg;cx.beginPath();cx.moveTo(x-30,0);cx.lineTo(x+30,0);cx.lineTo(x+200,H*.8);cx.lineTo(x+60,H*.8);cx.fill()}
 for(const q of plk){q.y-=q.s;q.x+=Math.sin(t*.001+q.y*.01)*.2;if(q.y<0){q.y=H;q.x=Math.random()*W}cx.fillStyle='rgba(200,255,250,.35)';cx.beginPath();cx.arc(q.x,q.y,q.r,0,7);cx.fill()}
 for(const j of jel){const k=Math.sin(t*.002+j.ph);j.y-=.25+k*.15;j.x+=Math.sin(t*.0007+j.ph)*.3;if(j.y<-120)j.y=H+120;const a=.16+E*.2;
  cx.strokeStyle='rgba(255,150,230,'+a+')';cx.fillStyle='rgba(255,150,230,'+a*.6+')';cx.lineWidth=2;
  cx.beginPath();cx.ellipse(j.x,j.y,j.r,j.r*(.7+k*.12),0,Math.PI,0);cx.fill();
  for(let n=-2;n<=2;n++){cx.beginPath();cx.moveTo(j.x+n*j.r*.4,j.y);for(let s=1;s<=6;s++)cx.lineTo(j.x+n*j.r*.4+Math.sin(t*.003+s+n)*5,j.y+s*j.r*.35);cx.stroke()}}
 if(Math.random()<.05+E*.5)bub.push({x:Math.random()*W,y:H+10,r:Math.random()*5+1.5,s:Math.random()*1.2+.6});
 cx.globalCompositeOperation='source-over';cx.lineWidth=1.2;
 for(let i=bub.length-1;i>=0;i--){const b=bub[i];b.y-=b.s*(1+E*2);b.x+=Math.sin(b.y*.03)*.5;if(b.y<-10){bub.splice(i,1);continue}cx.strokeStyle='rgba(220,255,255,.5)';cx.beginPath();cx.arc(b.x,b.y,b.r,0,7);cx.stroke()}
 if(E>.05){const gl=cx.createRadialGradient(W/2,H*.4,0,W/2,H*.4,W*.6);gl.addColorStop(0,'rgba(111,245,222,'+E*.12+')');gl.addColorStop(1,'rgba(111,245,222,0)');cx.fillStyle=gl;cx.fillRect(0,0,W,H)}
}
function loop(now){t=now;draw();requestAnimationFrame(loop)}
addEventListener('resize',()=>{size();draw()});addEventListener('scroll',()=>{if(calm)draw()},{passive:true});
$('#calm').addEventListener('click',e=>{calm=!calm;e.target.setAttribute('aria-pressed',calm);document.body.classList.toggle('calm',calm);draw()});
$('#calm').setAttribute('aria-pressed',calm);document.body.classList.toggle('calm',calm);
size();ap();reset();dqui();dash();requestAnimationFrame(loop);

if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0)navigator.serviceWorker.register('sw.js').catch(()=>{});
