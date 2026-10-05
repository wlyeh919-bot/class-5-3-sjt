(function(g){
'use strict';
let current=null;
function install(A){
 const NS='http://www.w3.org/2000/svg',svg=document.querySelector('.teacher-side .call-avatar svg');
 const arm=document.createElementNS(NS,'g');arm.id='teacherSipArm';arm.innerHTML='<path d="M54 101Q58 113 78 104L92 85" fill="none" stroke="#403c35" stroke-width="6" stroke-linecap="round"/><circle cx="92" cy="85" r="4" fill="#fcf1d8" stroke="#403c35" stroke-width="2"/>';svg.append(arm);
 const mark=document.createElement('i');mark.className='sip-contact';mark.setAttribute('aria-hidden','true');document.querySelector('.office-life .mug').append(mark);
 document.getElementById('officeSip').onclick=()=>A.interact('老師的水杯','老師拿起水杯喝了一口，再放回桌上。水杯：「咕嚕，換我說完了。」',()=>sip(A));
 document.getElementById('motionToggle').addEventListener('click',()=>{if(A.state.motion_paused)current?.cancel()});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)current?.cancel()});
 addEventListener('resize',()=>current?.cancel());addEventListener('pagehide',()=>current?.cancel());
}
function mouthPoint(){
 const mouth=document.querySelector('.teacher-side .call-avatar .mouth'),matrix=mouth.getScreenCTM();return new DOMPoint(74,73).matrixTransform(matrix);
}
function sip(A){
 if(current||A.state.motion_paused||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const person=document.querySelector('.teacher-side'),svg=person.querySelector('svg'),mug=document.querySelector('.office-life .mug');
 [svg,svg.querySelector('.head')].forEach(n=>n.getAnimations().forEach(a=>a.cancel()));
 const contact=mug.querySelector('.sip-contact').getBoundingClientRect(),mouth=mouthPoint(),dx=mouth.x-contact.x,dy=mouth.y-contact.y;
 person.classList.add('is-drinking');mug.classList.add('at-mouth');A.state.drinking=true;person.querySelector('.call-status').textContent='喝口水';
 A.log('drink_action_started',{actor:'teacher',source:'officeSip',version:'DRINK-20261004.8'});
 const lifted='translate('+dx+'px,'+dy+'px)';
 current=mug.animate([{transform:'translate(0,0) rotate(0deg)',offset:0},{transform:lifted+' rotate(-12deg)',offset:.38},{transform:lifted+' rotate(-21deg)',offset:.5},{transform:lifted+' rotate(-12deg)',offset:.65},{transform:'translate(0,0) rotate(0deg)',offset:1}],{duration:2700,easing:'ease-in-out'});
 const a=current;let finished=false;
 function cleanup(completed){if(finished)return;finished=true;person.classList.remove('is-drinking');mug.classList.remove('at-mouth');A.state.drinking=false;person.querySelector('.call-status').textContent=person.classList.contains('active-speaker')?'正在說話':'聆聽中';current=null;A.log('drink_action_finished',{actor:'teacher',completed,version:'DRINK-20261004.8'})}
 a.onfinish=()=>cleanup(true);a.oncancel=()=>cleanup(false);
}
g.C5_DRINK={install,sip,mouthPoint};
})(globalThis);
