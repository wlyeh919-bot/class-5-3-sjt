(function(g){
'use strict';
const VERSION='DIALOGUE-ACTION-20261004.11';
const timers=new Set(),motions=new Set();
let idleTimer=null,idleBeat=0;
const $=s=>document.querySelector(s);
const enabled=A=>!A.state.motion_paused&&!A.state.completed&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
function later(fn,ms){const id=setTimeout(()=>{timers.delete(id);fn()},ms);timers.add(id);return id}
function move(A,node,frames,duration=1300){
 if(!node||!enabled(A))return;
 motions.forEach(a=>{if(a.effect?.target===node){a.cancel();motions.delete(a)}});
 const a=node.animate(frames,{duration,easing:'ease-in-out'});motions.add(a);a.onfinish=()=>motions.delete(a);
}
function positive(text,re){
 return String(text).split(/[，。；\n]/).some(c=>{const m=c.match(re);return m&&!/(?:不要|不用|不會|不想|不必|不能|假如|如果)/.test(m[0])&&!/(?:不要|不用|不會|不想|不必|不能|假如|如果)[^，。；]{0,16}$/.test(c.slice(0,m.index))});
}
function repairSupport(A,id,text,r){
 if(id==='M01'&&C5_EXT.expressed(text,/(?:(?:我們|大家|全班|同學).*?(?:繼續|一起|先|往下|剩下)|一起).*?(?:下一題|下[一ㄧ]題|下一頁|下頁|題目|練習|學習單|完成|做|寫)|(?:繼續|往下|先).*?(?:做|坐|作)?下[一ㄧ]題|(?:翻開|翻到|翻過|翻).*?(?:下一頁|下頁|第[0-9一二三四五六七八九十]+頁)|(?:繼續|接著|往下).*?(?:做|作|寫)(?:歐|喔|吧|哦|囉)?$/)){
  if(!(r.acts||[]).some(a=>a.act==='classTask'&&a.pol==='+'))r.acts.push({act:'classTask',pol:'+',span:[0,text.length],src:text,rule:'trace-class-task-20261004.8',bindings:[]});
  r.state='部分證據';r.probe='none';r.probeWhy='class-task-context';r.response={id:'m01.task.ack',text:'好，我們一起把剩下的題目完成。',requiresAnswer:false,informationAdded:[],responseType:'acknowledgement'};r.runtime_patch=VERSION;
 }
 if(id==='T01'&&positive(text,/(?:很棒|說得很清楚|說的很清楚|謝謝你.*?(?:說|試)|這一步.*?(?:清楚|做到了))/)){
  r.acts.push({act:'ackChildPerformance',pol:'+',span:[0,text.length],src:text,rule:'trace-task-praise-20261004.8',bindings:A.state.teaching?.latest?[{kind:'childEvent',ref:A.state.teaching.latest.id}]:[]});
  r.state='部分證據';r.probe='none';r.probeWhy='acknowledged-child-step';r.response={id:'t01.praise.ack',text:'嘿嘿，這個我有看到。',requiresAnswer:false,informationAdded:[],responseType:'acknowledgement'};r.runtime_patch=VERSION;
 }
 return r;
}
function colleagueIntent(text,e,H,previous={}){
 const question=/[?？嗎呢]|什麼|是否|有沒有|何時|哪(?:一天|一節|種|個|些)|怎麼|為什麼|為何/.test(text)&&!/(?:不要|不想|不用).*?問|^(?:子安|孩子|同學|他|家長)說[：:]?[「『“"]/.test(text);
 // Time words can modify any question; they do not by themselves ask about onset.
 const timeline=question&&/(?:什麼時候|何時).*?(?:開始|出現|變成|變得)|(?:從|開始).*?哪(?:一天|天)|(?:最近|這兩天|這幾天)才(?:這樣|有這|出現|發生|變得|開始這樣)|(?:只有|只是)(?:最近|這兩天|這幾天)/.test(text);
 const past=question&&/(?:以前|之前|原本|過去).*?(?:也|就|會|有|這樣|如此)|^(?:以前|之前|原本|過去)[?？嗎呢]*$/.test(text);
 const context=question&&/(?:什麼|哪些|哪種|哪個)(?:樣的|的)?(?:情況|活動|時候)|哪一節|小組|個人|個別/.test(text)&&(!timeline||/(?:什麼|哪些|哪種|哪個)(?:樣的|的)?(?:情況|活動)|哪一節|小組|個人|個別/.test(text));
 const process=question&&/(?:提醒|怎麼做|怎麼處理|反應|有沒有試|有試過)/.test(text);
 const change=question&&/(?:改善|好轉|有效|有用|效果|有(?:什麼)?變化|有差|還會|還是會|仍然)/.test(text);
 const why=question&&/(?:原因|為什麼|為何|怎麼會)/.test(text);
 const classPresence=question&&/(?:你|您|自然|自然科)(?:的)?課.*?(?:也|同樣|一樣).*?(?:這樣|如此|情況|狀況)|自然課.*?(?:也會|也是)/.test(text)&&!/(?:不用|不要|不想).*?問/.test(text);
 const teacherImpression=text.split(/[，,。；;]/).some(c=>C5_EXT.expressed(c,/(?:他|子安).*?(?:最近|這幾天|這兩天|幾天).*?(?:好像|似乎|看起來).*?(?:情緒|心情)|(?:他|子安).*?(?:心浮氣躁|浮躁|不耐煩|煩躁|悶悶|情緒不好|容易生氣)/)&&(!/[?？嗎呢]/.test(c)||/好像|似乎|看起來/.test(c))&&!/(?:不是|沒有|並不|不覺得|不認為)[^，。；]{0,8}(?:心浮|不耐|煩躁|悶悶|情緒不好|容易生氣)/.test(c));
 const plan=H.has(e.evaluation,'coordPlan')||C5_EXT.expressed(text,/(?:一起|我們|再|交換|明天).*?(?:留意|觀察|記錄|核對|交換|對一下|聯絡)|(?:老師|你|您|麻煩|請).*?(?:再|在)?(?:幫|多|加|繼續|留意|觀察).*?(?:觀察|留意|記錄)|(?:麻煩|請).*?(?:觀察|留意)/);
 const report=H.has(e.evaluation,'exchangeObs')||positive(text,/(?:我|我們班|國語|數學|上課|今天).*?(?:看到|發現|也有|練習|口頭|停筆|作業|情況)/);
 const ack=positive(text,/(?:謝謝|知道了|了解|辛苦|謝謝你)/);
 const temporalReport=!question&&positive(text,/(?:從|在).*?(?:兩天前|那天|星期|週|上次|那次).*?(?:比賽|競賽|之後|開始)/);
 const temporalAlignment=!question&&!/^(?:子安|孩子|他|同學)說[：:]?[「『“"]/.test(text)&&/(?:最近|這兩天|這幾天|開始|星期|週)/.test(previous.text||'')&&positive(text,/(?:我|我們|我們班).*?(?:也|同樣)(?:是|在|從)?(?:最近|這兩天|這幾天|這週|這星期)/);
 return {timeline,past,context,process,change,why,classPresence,teacherImpression,plan,report,ack,temporalReport,temporalAlignment};
}
function beginColleague(A,H){
 const choices=$('#colleagueChoices'),choiceHTML=choices?.outerHTML||'';
 const opening='跟你說一下，子安這兩天在我課堂上也比較容易跟旁邊同學起口角，提醒他的時候有點不耐煩。我想說你這邊是不是也有注意到。';
 A.state.colleague_interaction={version:'C01-COLLABORATION-20261004.11-CONTEXT',turns:0,maxTurns:2,clarificationUsed:false,history:[{role:'colleague',text:opening,source:'C01-OPENING',t_ms:A.t(),simulated:true}],status:'交流中',agreedPlan:null};
 function advance(){
  const s=A.state.colleague_interaction;s.status=s.unresolvedLastTurn?'仍有原話待釐清':s.agreedPlan?'已交換觀察，合作安排待執行':'已交換目前資訊，後續安排尚未明確';
  A.log('colleague_exchange_closed',{turns:s.turns,status:s.status});
  A.transition('放學後','家長來電',s.unresolvedLastTurn?'你留下已聽懂的觀察與尚待確認的原話，再聽聽家裡的情況。':'你把不同課堂的觀察分開記下，再聽聽家裡的情況。',A.begin167);
 }
 function render(){
  const s=A.state.colleague_interaction;
  if(s.turns<s.maxTurns){
   A.responseUI({title:s.turns?'聽完自然老師的觀察，你怎麼接？':'你會怎麼回應科任老師？',sub:s.turns?'可以問具體情況、說說班上的觀察，或約好一起留意。':'先回應她剛才說的事，再決定要了解什麼。',button:'回應科任老師',onSend:text=>reply(text)});
   if(!s.turns&&choiceHTML){const d=document.createElement('details');d.className='colleague-options';d.innerHTML='<summary>也可選一個交流起點</summary>'+choiceHTML;A.els.dock.append(d);d.querySelectorAll('button').forEach(b=>b.onclick=()=>reply(b.textContent,{prompted:true,choice:b.dataset.c}));}
  }else A.dock('<div class="dock-title">把這段交流帶回班上</div><div class="dock-sub">'+A.esc(s.unresolvedLastTurn?'最後一句仍待確認；原話會保留，之後再接著談。':s.agreedPlan?'你們已提出合作安排；接下來還要真的做、再交換。':'兩邊的觀察已分開留下，原因與後續安排仍可繼續確認。')+'</div>');
  if(s.turns){const b=document.createElement('button');b.id='toParentCall';b.className='btn secondary colleague-next';b.textContent=s.turns<s.maxTurns?'帶著目前觀察，繼續故事':'收好觀察，繼續故事';b.onclick=advance;A.els.dock.append(b);}
 }
 function reply(text,extra={}){
  const s=A.state.colleague_interaction;if(s.turns>=s.maxTurns)return;
  const previous=s.history.filter(x=>x.role==='colleague').at(-1),e=H.support(A,'C01',text,extra),intent=colleagueIntent(H.normalize(text),e,H,previous);s.turns++;
  if(extra.choice==='time')intent.context=true;if(extra.choice==='compare')intent.report=true;if(extra.choice==='watch')intent.plan=true;if(extra.choice==='note')intent.ack=true;
  const add=(act)=>{if(!e.evaluation.acts.some(x=>x.act===act&&x.pol==='+'))e.evaluation.acts.push({act,pol:'+',span:[0,text.length],src:text,rule:VERSION,bindings:[{kind:'visibleColleagueTurn',ref:s.history.at(-1).source||'C01'}]})};
  if(intent.temporalReport)add('exchangeTemporalObservation');if(intent.timeline)add('askColleagueTimeline');if(intent.past)add('askColleaguePastBaseline');if(intent.context)add('askColleagueContext');if(intent.process)add('askColleagueResponse');if(intent.change)add('askColleagueChange');if(intent.plan)add('coordPlan');if(intent.report)add('exchangeObs');if(intent.ack)add('ackColleague');
  const recognized=Object.values(intent).some(Boolean);
  s.unresolvedLastTurn=!recognized;
  if(!recognized&&s.turns===s.maxTurns&&!s.clarificationUsed){s.clarificationUsed=true;s.maxTurns=3;}
  let line='',rule='C01_CLARIFY_TARGET';
  const answers=[];
  if(intent.classPresence){answers.push({id:'C01_NATURAL_CLASS_CONFIRMATION',text:'對，自然課也有。這兩天小組討論，他會和旁邊同學爭誰先說；我提醒他先聽完，他停了一下，後來又插話。'});add('askColleagueClassPresence');}
  if(intent.teacherImpression){add('shareTeacherImpression');e.teacherImpression={raw:text,status:'教師初步感受，原因尚未確認'};}
  if(intent.timeline)answers.push({id:'C01_TIMELINE_WITH_LIMIT',text:'這兩天比較明顯，是我這幾節課才注意到的。之前沒有連續記錄，還不能確定從哪一天開始。'});
  if(intent.past)answers.push({id:'C01_PAST_BASELINE_WITH_LIMIT',text:'以前有沒有同樣的情況，我手邊沒有連續記錄可以核對，不能說以前都沒有。這兩天的插話和不耐煩，是我目前能具體說明的觀察。'});
  if(intent.context)answers.push({id:'C01_GROUP_INDIVIDUAL_CONTEXT',text:'在小組討論時比較明顯：他會和旁邊同學爭誰先說，提醒時顯得不耐煩。個別練習也有停筆，但我還沒記到每次的前後情況。'});
  if(intent.change)answers.push({id:'C01_CHANGE_AFTER_REMINDER',text:'提醒後，他當下停了一下，後來又插話。所以那次只有短暫停下，還不能說已經持續改善；需要再看後面幾次課的情況。'});
  else if(intent.process)answers.push({id:'C01_RESPONSE_TO_REMINDER',text:'我提醒他先聽同學說完；他當下停了一下，後來又插話。這只是一節課裡看到的反應，還不知道換個提醒方式會不會不同。'});
  if(intent.why)answers.push({id:'C01_CAUSE_UNCERTAIN',text:'我現在還不能確定原因。起口角和停筆是我看到的表現，不能直接當作他不會、故意，或只是在生氣。'});
  if(answers.length){line=answers.map(a=>a.text).join(' ');rule=answers.map(a=>a.id).join('+');}
  else if(intent.temporalAlignment){line='你也是這兩天注意到的啊。那我這邊再留意自然課的小組討論，有新的情況再跟你說。';rule='C01_SHARED_OBSERVATION_WINDOW';add('exchangeTemporalObservation');e.contextResolution={kind:'ellipticalTemporalAlignment',source:previous.source,sourceTeacherEventId:previous.respondingTo||null,sourceTimeMs:previous.t_ms,resolvedMeaning:'導師也是這兩天注意到狀況',causeVerified:false,sameBehaviorVerified:false};s.colleagueOffer={sourceId:e.id,text:'自然老師再留意小組討論，有新情況再告知',status:'科任提出，尚未執行；未推定雙方已約定'};}
  else if(intent.temporalReport){line='你這邊是在那次小組比賽後開始注意到的。我先記下時間點；是不是有關，還要再比對。';rule='C01_TEMPORAL_OBSERVATION_PENDING_CAUSE';}
  else if(intent.report){line='你這邊看到的情況，我也分開記下來。我看到的是小組討論時的插話與不耐煩，個別練習也有停筆；先比對發生在什麼活動，別急著把原因當成一樣。';rule='C01_COMPARE_OBSERVATIONS';}
  else if(intent.teacherImpression){line='你這邊也覺得他這兩天比較不耐煩啊。我看到的是小組討論插話、提醒時不耐煩，我們先各自記下當時的情況。';rule='C01_TEACHER_IMPRESSION_ACK';}
  else if(intent.plan){line='好，我們一起留意，先記當時在做什麼、孩子怎麼反應、提醒後有什麼變化，再交換。';rule='C01_COORDINATE_PENDING';}
  else if(intent.ack){line='謝謝你接住這件事。我先把這兩天看到的片段整理給你，沒有看到的部分先留白。';rule='C01_ACKNOWLEDGE';}
  else line='我想先確認，你剛才主要想問發生的時間、當時在做什麼，還是要補充你這邊看到的事？';
  if(!recognized&&s.clarificationUsed&&s.turns<s.maxTurns)line='你剛才說的，是要我再留意自然課的狀況，還是要補充你班上發生的事？';
  if(intent.plan){
   s.agreedPlan={sourceId:e.id,raw:text,status:'已提出合作安排，尚未執行',followUpSpecified:/明天|週|星期|下課|放學|午休|下次/.test(text)};
   if(rule!=='C01_COORDINATE_PENDING')line+=' 好，我會再留意他在哪些活動會停筆或不耐煩，有新的情況再跟你說。';
  }
  if(s.turns<s.maxTurns&&recognized)line+=intent.plan?' 你希望先留意哪一種情況，什麼時候再對一下？':intent.classPresence?' 你班上是寫學習單時比較明顯嗎？':intent.timeline&&!intent.context?' 你那邊也是這兩天才注意到嗎？':intent.report?' 你想怎麼把兩邊的觀察一起追蹤？':intent.temporalAlignment?' 你那邊主要是在什麼活動時看到的？':' 你這邊是在什麼活動時比較明顯？';
  if(!recognized&&s.turns===s.maxTurns){line='這句我還沒接明白。我先把你的原話記著，之後再跟你確認。';rule='C01_UNRESOLVED_RETAINED';}
  e.evaluation.state=recognized?'部分證據':'待釐清';e.evaluation.probe=s.turns<s.maxTurns?'colleagueContinuation':'none';e.evaluation.probeWhy=rule;e.evaluation.runtime_patch=VERSION;
  e.evaluation.response={id:rule,text:line,requiresAnswer:s.turns<s.maxTurns,informationAdded:[],responseType:'simulatedColleagueReply',sourceVersion:s.version,answeredQuestionIds:answers.map(a=>a.id)};
  e.learningSourceIds=(A.state.teaching?.childEvents||[]).map(x=>x.id);
  s.history.push({role:'teacher',text,source:e.id,t_ms:A.t(),prompted:e.prompted},{role:'colleague',text:line,source:rule,respondingTo:e.id,t_ms:A.t(),simulated:true});
  A.showColleague(line);render();
 }
 render();
}
function cue(A,who,text){
 if(!enabled(A))return;
 const setting=A.els.stage.dataset.setting;
 if(who==='teacher')g.C5_EXT.gesture(A,'teacher','reaching');
 if(who==='student'){
  g.C5_EXT.gesture(A,'zian',(A.state.phase==='T01_TEACHING'?['recheck'].includes(A.state.teaching?.latest?.probe):/寫|紙|步|張/.test(text))?'writing':'reaching');
  move(A,$('#zianHead'),[{rotate:'0deg'},{rotate:/分|舉手/.test(text)?'-9deg':'6deg',offset:.35},{rotate:'0deg'}],1500);
  if(setting==='desk')move(A,$('#deskPaperCorner'),[{transform:'scaleY(1)'},{transform:'scaleY(.62) rotate(-5deg)',offset:.45},{transform:'scaleY(1)'}],1400);
 }
 if(who==='colleague'){
  g.C5_EXT.gesture(A,'subjectTeacherActor','reaching');
  move(A,$('#colleagueNotebookPage'),[{transform:'scaleX(.15)'},{transform:'scaleX(1)',offset:.55},{transform:'scaleX(1)'}],1200);
  const node=$('#subjectTeacherActor');node.classList.add('speaking');later(()=>node.classList.remove('speaking'),Math.min(3400,text.length*65));
 }
 A.log('stage_action',{actor:who,setting,source_phase:A.state.phase,version:VERSION});
}
function phase(A,name){
 if(name==='166_STIMULUS')$('#childExercise').classList.remove('paper-open');
 if(name==='TEACHING_BRANCH'){
  $('#childExercise').classList.add('paper-open');
  move(A,$('#childExerciseCover'),[{transform:'scaleX(1)'},{transform:'scaleX(.06)'}],1200);
 }
 if(name==='COLLEAGUE_BRIDGE'&&enabled(A)){
  move(A,$('#subjectTeacherHotspot'),[{transform:'translate(875px,570px) scale(1.1)'},{transform:'translate(800px,570px) scale(1.1)'}],750);
  $('#subjectTeacherActor').classList.add('walking');later(()=>$('#subjectTeacherActor').classList.remove('walking'),950);
 }
}
function phoneSpeaker(A,role){
 g.C5_CAT?.speaker(A,role);
 const people=document.querySelectorAll('.call-person');people.forEach(n=>{n.classList.remove('active-speaker');n.querySelector('.call-status').textContent=n.classList.contains('is-drinking')?'喝口水':'聆聽中'});
 const active=$('.call-person.'+(role==='teacher'?'teacher-side':'parent-side'));
 if(!active||active.classList.contains('is-drinking'))return;active.querySelector('.call-status').textContent='正在說話';active.classList.add('active-speaker');
 if(enabled(A))move(A,active.querySelector('.call-avatar .head')||active.querySelector('.call-avatar svg'),[{rotate:'0deg'},{rotate:'-5deg',offset:.4},{rotate:'2deg',offset:.7},{rotate:'0deg'}],1700);
 later(()=>{active.classList.remove('active-speaker');active.querySelector('.call-status').textContent=active.classList.contains('is-drinking')?'喝口水':'聆聽中'},2600);
}
function idle(A){
 if(!enabled(A)||A.state.phase==='TRANSITION')return;idleBeat++;
 const scene=A.els.stage.dataset.setting;
 if(scene?.startsWith('classroom')){
  const id=['peerA','peerB','peerC','peerD'][idleBeat%4];g.C5_EXT.gesture(A,id,id==='peerC'?'reaching':'writing');
  if(idleBeat%3===0)move(A,$('#curtainVisual'),[{rotate:'0deg'},{rotate:'3deg',offset:.45},{rotate:'0deg'}],2100);
 }else if(scene==='desk'||scene==='desk-recess'){
  move(A,$('#deskPencil'),[{transform:'rotate(0deg)'},{transform:'rotate(-16deg)',offset:.3},{transform:'rotate(5deg)',offset:.6},{transform:'rotate(0deg)'}],1300);
 }else if(scene==='corridor'){
  g.C5_EXT.gesture(A,'teacher','reaching');move(A,$('#colleagueNotebookPage'),[{transform:'scaleX(1)'},{transform:'scaleX(.55)',offset:.4},{transform:'scaleX(1)'}],1700);
 }
}
function syncMotion(A){
 const stopped=A.state.motion_paused||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const world=$('#world');if(stopped)world.pauseAnimations();else world.unpauseAnimations();
 if(stopped){motions.forEach(a=>a.cancel());motions.clear();document.querySelectorAll('.active-speaker').forEach(n=>n.classList.remove('active-speaker'));}
}
function install(A){
 const teacherSVG=$('.teacher-side .call-avatar svg');teacherSVG.setAttribute('viewBox','23 0 104 115');
 document.querySelectorAll('.call-person-name').forEach(n=>{const s=document.createElement('span');s.className='call-status';s.textContent='聆聽中';n.after(s)});
 const parentSVG=$('.parent-side .call-avatar svg');parentSVG.querySelectorAll('circle').forEach((n,i)=>{if(i>0)n.classList.add('call-eye')});
 const parentMouth=parentSVG.querySelectorAll('path')[1];parentMouth.classList.add('call-parent-mouth');
 const NS='http://www.w3.org/2000/svg';
 const notebook=document.createElementNS(NS,'g');notebook.id='colleagueNotebookPage';notebook.innerHTML='<path d="M35 122H66V157H35Z" fill="#fff4d9" stroke="#806b50" stroke-width="1.4"/><path d="M40 130H61M40 137H61M40 144H55" stroke="#b1a085" stroke-width="1.2"/>';
 $('#subjectTeacherActor .arm-left').append(notebook);
 const exercise=document.createElementNS(NS,'g');exercise.id='childExercise';exercise.innerHTML='<path d="M32 116H67V158H32Z" fill="#fff4d9" stroke="#907b5f" stroke-width="1.4"/><path d="M38 126H61M38 134H61M38 142H56" stroke="#bcab8a" stroke-width="1.2"/><path id="childExerciseCover" d="M32 116H67V158H32Z" fill="#92b6b1" stroke="#647e7b" stroke-width="1.4"/>';
 $('#zian .arm-left').append(exercise);
 $('#deskMischief').onclick=()=>A.interact('桌邊橡皮擦','橡皮擦：「我只是伸個懶腰，沒有要翹課。」',()=>move(A,$('#deskEraser'),[{transform:'translate(0,0) rotate(0deg)'},{transform:'translate(-70px,-42px) rotate(-30deg)',offset:.4},{transform:'translate(-95px,0) rotate(10deg)',offset:.7},{transform:'translate(0,0) rotate(0deg)'}],1700));
 C5_DRINK.install(A);
 document.querySelectorAll('.call-avatar-button').forEach(b=>b.onclick=()=>A.interact(b.closest('.teacher-side')?'導師':'子安家長','隔著電話線也能點個頭，話還是好好說。',()=>move(A,b.querySelector('svg'),[{rotate:'0deg'},{rotate:'8deg',offset:.4},{rotate:'0deg'}],900)));
 $('#motionToggle').addEventListener('click',()=>syncMotion(A));
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>syncMotion(A));
 syncMotion(A);
 idleTimer=setInterval(()=>idle(A),3800);window.addEventListener('pagehide',()=>{clearInterval(idleTimer);timers.forEach(clearTimeout);motions.forEach(a=>a.cancel())});
}
g.C5_REFINE={VERSION,repairSupport,beginColleague,cue,phase,phoneSpeaker,install,syncMotion};
})(globalThis);
