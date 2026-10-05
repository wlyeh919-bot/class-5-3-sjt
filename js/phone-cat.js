(function(g){
'use strict';
const VERSION='PHONE-CAT-20261004.8',motions=new Set();
let observer=null;
function anchor(){
 const cat=document.getElementById('phoneCat'),phone=document.querySelector('.call-phone'),stage=document.getElementById('callStage');
 if(!cat||!phone||!stage||!phone.getBoundingClientRect().width)return;
 const p=phone.getBoundingClientRect(),s=stage.getBoundingClientRect(),c=cat.getBoundingClientRect();
 cat.style.left=(p.right-s.left-c.width*1.1)+'px';cat.style.top=Math.max(5,p.top-s.top-c.height*.74)+'px';
}
function stop(){motions.forEach(a=>a.cancel());motions.clear();}
function speaker(A,role){
 const cat=document.getElementById('phoneCat');if(!cat)return;
 cat.dataset.look=role;cat.setAttribute('aria-label','旁聽貓：看向'+(role==='teacher'?'導師':'子安家長')+'，點一下摸摸牠');anchor();
 A.log('phone_cat_look',{event_type:'ambient_interaction',role,version:VERSION});
}
function install(A){
 const cat=document.createElement('button');cat.id='phoneCat';cat.className='phone-cat';cat.type='button';cat.dataset.look='parent';cat.setAttribute('aria-label','摸摸電話旁聽貓');
 cat.innerHTML='<svg viewBox="0 0 132 78" aria-hidden="true"><g stroke="#65564b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path class="cat-tail" d="M20 54Q-3 57 9 38Q19 25 24 38" fill="none" stroke="#b69774" stroke-width="8"/><ellipse cx="53" cy="53" rx="37" ry="15" fill="#dfc5a2"/><path d="M34 44Q43 34 51 44M57 42l7 9M70 44l5 8" fill="none" stroke="#b79873" stroke-width="4"/><g class="cat-head"><path d="M70 28L69 8 82 19M93 18L108 8 106 30" fill="#dfc5a2"/><ellipse cx="89" cy="32" rx="21" ry="20" fill="#ead4b6"/><path d="M77 19L75 13 80 19M98 18l5-5-1 9" fill="#d9a69c" stroke="none"/><path d="M85 14l1 8M94 15l-2 7" stroke="#ba9975" stroke-width="3"/><g class="cat-eyes"><ellipse cx="79" cy="32" rx="4" ry="5" fill="#fff8e8" stroke="none"/><ellipse cx="99" cy="32" rx="4" ry="5" fill="#fff8e8" stroke="none"/><g class="cat-pupils" fill="#554b42" stroke="none"><ellipse cx="79" cy="32" rx="2.2" ry="3.5"/><ellipse cx="99" cy="32" rx="2.2" ry="3.5"/></g></g><path d="M86 40l3 2 3-2z" fill="#b87b70" stroke="none"/><path d="M89 42q-4 6-7 1m7-1q4 6 7 1" fill="none" stroke-width="1.4"/><path d="M74 39l-10-2m11 6-11 1m38-5 10-2m-11 6 11 1" stroke-width="1.4"/></g><path class="cat-paw" d="M51 56q-6 18 4 17q10 0 8-16M73 55q-3 18 7 17q9-2 5-16" fill="#ead4b6"/><path d="M53 69v3m5-3v3m20-4v3m4-4v3" stroke-width="1.1"/></g></svg>';
 document.getElementById('callStage').append(cat);
 cat.onclick=()=>A.interact('電話旁聽貓','貓：「喵，我只旁聽，沒有替誰回答喔。」',()=>{
  if(A.state.motion_paused||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  stop();const a=cat.querySelector('.cat-tail').animate([{rotate:'0deg'},{rotate:'-22deg',offset:.3},{rotate:'12deg',offset:.65},{rotate:'0deg'}],{duration:1000,easing:'ease-in-out'});motions.add(a);a.onfinish=()=>motions.delete(a);
 });
 observer=new ResizeObserver(anchor);observer.observe(document.querySelector('.call-phone'));observer.observe(document.getElementById('callStage'));
 document.getElementById('motionToggle').addEventListener('click',()=>{if(A.state.motion_paused)stop()});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)stop()});
 addEventListener('pagehide',()=>{stop();observer?.disconnect()});anchor();
}
g.C5_CAT={VERSION,install,speaker,anchor};
})(globalThis);
