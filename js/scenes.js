(function (g) {
'use strict';
let settlingTimer=null;
const settings={
 competition:{id:'classroom-competition',day:'星期二',place:'競賽後的教室',camera:'wide'},
 lesson:{id:'classroom-lesson',day:'星期四',place:'課堂中的教室',camera:'wide'},
 desk:{id:'desk',day:'星期四',place:'子安的桌邊',camera:'close'},
 recess:{id:'desk-recess',day:'星期二',place:'下課後的桌邊',camera:'close'},
 corridor:{id:'corridor',day:'星期四',place:'下課的走廊',camera:'twoTeachers'},
 office:{id:'office',day:'星期四',place:'放學後的辦公室',camera:'phone'}
};
function settingFor(phase){
 if(phase==='TRANSITION')return null;
 if(phase==='COMPLETE'||phase.startsWith('167_'))return settings.office;
 if(phase==='COLLEAGUE_BRIDGE')return settings.corridor;
 if(phase.startsWith('T01_'))return settings.desk;
 if(phase==='M01_RECESS')return settings.recess;
 if(phase.startsWith('166_')||phase==='TEACHING_BRANCH')return settings.lesson;
 return settings.competition;
}
function enter(A,phase){
 const next=settingFor(phase);if(!next||A.els.stage.dataset.setting===next.id)return;
 const previous=A.els.stage.dataset.setting||null;
 A.els.stage.dataset.setting=next.id;
 A.state.scene_history ||= [];
 const entry={t_ms:A.t(),phase,from:previous,...next,scene_version:'SCENE-20261004.8'};
 A.state.scene_history.push(entry);A.log('scene_changed',entry);
 document.getElementById('sceneLocation').textContent=next.day+'・'+next.place;
 A.els.stage.classList.remove('scene-arrival');void A.els.stage.offsetWidth;A.els.stage.classList.add('scene-arrival');
 // SVG actors, props and backgrounds share one coordinate system in every shot.
 // A separate close-up background avoids moving unrelated objects across the room.
 document.getElementById('world').setAttribute('viewBox','0 0 1200 800');
 document.getElementById('world').setAttribute('aria-label',next.day+'，'+next.place+'，可互動的水彩場景');
 A.els.stage.querySelectorAll('.scene-only').forEach(el=>{
  const visible=(el.dataset.settings||'').split(' ').includes(next.id);
  el.classList.toggle('hidden',!visible);
 });
 requestAnimationFrame(()=>g.C5_EXT.positionBubbles(A));
 clearTimeout(settlingTimer);settlingTimer=setTimeout(()=>g.C5_EXT.positionBubbles(A),950);
}
function animate(A,node,frames,duration){
 if(A.state.motion_paused||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 node.getAnimations().forEach(a=>a.cancel());node.animate(frames,{duration,easing:'ease-in-out'});
}
function install(A){
 for(const id of ['teacherHotspot','zianHotspot']){const actor=document.getElementById(id),frame=document.createElementNS('http://www.w3.org/2000/svg','g');frame.classList.add('actor-frame');actor.parentNode.insertBefore(frame,actor);frame.append(actor);}
 A.els.stage.addEventListener('transitionend',e=>{if(e.propertyName==='transform'&&e.target.id==='zianHotspot')g.C5_EXT.positionBubbles(A)});
 A.els.stage.addEventListener('animationend',e=>{if(e.target.id==='subjectTeacherActor')g.C5_EXT.positionBubbles(A)});

 document.getElementById('deskPlay').onclick=()=>A.interact('桌邊鉛筆','鉛筆轉了一圈，還是乖乖回到紙邊。',()=>animate(A,document.getElementById('deskPencil'),[{transform:'rotate(0deg)'},{transform:'rotate(95deg)',offset:.4},{transform:'rotate(-20deg)',offset:.7},{transform:'rotate(0deg)'}],1200));
 document.getElementById('leafPlay').onclick=()=>A.interact('走廊微風','風路過了，差點把便利貼也帶去上自然課。',()=>animate(A,document.getElementById('corridorLeaves'),[{transform:'translate(0,0)'},{transform:'translate(-32px,22px) rotate(-9deg)',offset:.45},{transform:'translate(0,0)'}],1800));
 document.getElementById('notePlay').onclick=()=>A.interact('走廊便利貼','便利貼差點先下班，老師一把把它請回來。',()=>{C5_EXT.gesture(A,'teacher','reaching');animate(A,document.getElementById('corridorNote'),[{transform:'translate(0,0) rotate(0deg)'},{transform:'translate(155px,90px) rotate(-20deg)',offset:.4},{transform:'translate(125px,85px) rotate(8deg)',offset:.65},{transform:'translate(0,0) rotate(0deg)'}],1200)});
}
function stop(A){clearTimeout(settlingTimer);A.els.stage.classList.add('scene-finished');}
g.C5_SCENES={enter,install,stop,settingFor};
})(globalThis);
