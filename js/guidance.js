(function(g){
'use strict';
const VERSION='CLASSROOM-REENTRY-20261004.13';
const normalize=t=>String(t).replace(/妳/g,'你').replace(/ㄧ/g,'一');
const clauses=t=>normalize(t).replace(/[「『“"][^」』”"]*[」』”"]/g,'').split(/[，,。；;？?！!\n]/).map(c=>c.trim());
function matches(text,re,{negativeAction=false,reduction=false}={}){
 return clauses(text).filter(c=>{
  if(/^(?:如果|假如|假設|萬一)/.test(c))return false;
  const m=c.match(re);if(!m)return false;
  const prefix=c.slice(0,m.index),body=m[0].replace(/要不要/g,'是否要');
  if(/(?:不要|不用|不必|不想|不會|不能)[^，。；]{0,12}$/.test(prefix))return false;
  if(!negativeAction&&/(?:不要|不用|不必|不想|不會|不能)/.test(body)&&!(reduction&&/不用(?:一次|全部)/.test(body)))return false;
  // A future offer is retained as a commitment, not present accompaniment.
  if(/(?:下課|之後|明天|放學)/.test(c)&&/(?:陪|一起)/.test(body))return false;
  return true;
 });
}
function techniques(text){
 const patterns={
  validation:/(?:我|老師).*?(?:知道|理解|明白|聽到|聽得出).*?(?:煩|悶|生氣|難過|在意|委屈|失望|努力|感受)|(?:你|這件事).*?(?:很煩|很悶|委屈|不舒服|失望).*?(?:是嗎|對嗎)|(?:生氣|難過|在意).*?(?:可以|沒關係)/,
  settling:/(?:先|一起|慢慢).*?(?:深呼吸|呼吸|休息一下|停一下|緩一下)/,
  choice:/(?:先|你|想|可以|要).*?(?:用說的|念題目|畫圖|圈|讀|看|寫).*?(?:還是|或是|或).*?(?:說|畫|圈|讀|看|寫)/,
  smallStep:/(?:先|只|就|不用一次|不用全部).*?(?:這一題|這一格|一題|一格|一小步|一句|一行|一個|圈|念|讀|畫)|(?:把|請).*?(?:分數|題目).*?(?:圈起|圈出|讀出)/,
  reentry:/(?:課堂|上課|現在|眼前|這節課).*?(?:該做|先|回來|完成|做|寫)|(?:先|一起|我們|把|繼續|接著).*?(?:看|讀|寫|做|完成).*?(?:題目|這張|這題|這格|學習單|作業)|(?:先|一起|我們|把|繼續|接著).*?(?:題目|這張|這題|這格|學習單|作業).*?(?:看|讀|寫|做|完成)/,
  accompaniment:/(?:老師|我|我們).*?(?:陪你|跟你一起|和你一起|帶你|一起).*?(?:寫|做|看|讀|題目|這格)/,
  followup:/(?:下課|之後|等一下|放學).*?(?:聊|談|聽你說|處理|說清楚)/,
  pressure:/(?:下次|比賽|搶答).*?(?:怎麼|如何|才能).*?(?:得分|答對|搶答|辦)|(?:沒學會|沒在聽).*?(?:比賽|搶答|分數)/,
  dismissal:/(?:別|不要|不用).*?(?:生氣|想那件事|想分數)|(?:有什麼|有甚麼).*?(?:好煩|好氣)|(?:只要|乖乖|不准).*?(?:寫|做)|(?:再不|不寫).*?(?:扣分|罰|處罰)/
 };
 const evidence=Object.entries(patterns).flatMap(([technique,re])=>matches(text,re,{negativeAction:technique==='dismissal',reduction:technique==='smallStep'}).map(clause=>({technique,clause})));
 return {...Object.fromEntries(Object.keys(patterns).map(k=>[k,evidence.some(e=>e.technique===k)])),evidence};
}
function respond(text,context,legacy){
 const history=context.history||[],previous=history.at(-1),prior=previous?.guidance||{affect:'tense',attention:previous?.progress?.workStarted?'worksheet':previous?.progress?.helpAccepted?'worksheet':'scoreConcern',engagement:previous?.progress?.workStarted?'participating':previous?.progress?.helpAccepted?'oriented':'notStarted',microAction:previous?.progress?.workStarted?'takePen':previous?.progress?.helpAccepted?'bringPaper':null};
 const t=techniques(text);const unacted=!t.evidence.length&&/(?:如果|假如|假設|說[：:]?[「『“"])/.test(text);if(!unacted&&['distinguishAndWork','currentDuty','startCurrentWork','workAndConversation'].includes(legacy.intent)&&!t.reentry){t.reentry=true;t.evidence.push({technique:'reentry',clause:normalize(text),contextResolved:true,source:'S166 visible worksheet'});}const next={affect:prior.affect,attention:prior.attention,engagement:prior.engagement,microAction:prior.microAction,artifacts:{...prior.artifacts},newAction:null,version:VERSION,simulated:true,teacherTechniques:t,emotionResolved:false,independentLearningVerified:false};
 if(unacted)return {...legacy,intent:'clarifyCurrentTurn',focus:previous?.focus||'currentWork',text:'老師，這是你要我現在做的事，還是在說剛才的情況？',progress:{...legacy.progress,helpAccepted:history.some(x=>x.progress?.helpAccepted),workStarted:history.some(x=>x.progress?.workStarted)},guidance:next};
 const done=(intent,line,action=null,focus=legacy.focus)=>({...legacy,intent,text:line,focus,guidance:{...next,microAction:action||prior.microAction,newAction:action!==prior.microAction?action:null,artifacts:{...next.artifacts,...(action==='circleFractions'?{fractionsCircled:true}:action==='drawOutline'?{outlineDrawn:true}:['takePen','startReason'].includes(action)?{penPickedUp:true}:action==='readTask'?{taskRead:true}:{})}},progress:{...legacy.progress,helpAccepted:legacy.progress.helpAccepted||t.accompaniment,workStarted:legacy.progress.workStarted||['circleFractions','takePen','startReason','readTask','drawOutline'].includes(action),kind:'simulatedNarrativeProgress'}});
 if(['reasonInquiry','earlierReasonInquiry','contrastInquiry','inquiryWithAccompaniment','writtenFeelings','writtenFollowUp'].includes(legacy.intent)){
  if(t.accompaniment){next.affect='easing';next.attention='worksheet';next.engagement='oriented';return done(legacy.intent,'上面選答案我會，下面理由不知道怎麼寫。好，老師你陪我看這格。','bringPaper');}
  return {...legacy,guidance:next};
 }
 // Pressure takes precedence over supportive keywords in the same utterance.
 if(t.dismissal){next.affect='tense';next.engagement=prior.attention==='worksheet'?'hesitant':'notStarted';return done('pressuredCompliance',prior.microAction?'我有在看這張了……可是理由這格還是不知道怎麼寫。':'我知道要寫啦……可是現在不知道怎麼開始。');}
 if(t.pressure)return done('learningValueReframe',prior.attention==='worksheet'?'我也想答得出來啦。我先把眼前這一題看完，可以嗎？':'我也怕下次又答不出來啊……可以先陪我看一小格嗎？');
 if(t.settling&&!t.reentry&&!t.smallStep&&!t.choice){next.affect='easing';next.engagement='available';return done('settleBeforeWork','好……我先停一下。等一下先做一題就好嗎？','settle');}
 if(t.accompaniment&&!t.choice&&!t.smallStep&&!matches(text,/(?:一起|陪你).*?(?:寫|做)/).length){
  next.affect='easing';next.attention='worksheet';next.engagement='oriented';return done(legacy.intent,legacy.intent==='offerHelp'?'要。這題我選四分之三，可是理由不知道怎麼寫。老師可以陪我看一下嗎？':prior.microAction?'好，我把紙拉近一點。先看我空著的這格。':'好，那先看這題。你陪我看，我把紙拿過來。','bringPaper');
 }
 if(t.choice||t.smallStep||t.reentry){
  const supported=t.validation||t.settling||t.accompaniment||prior.affect==='easing';next.affect=supported?'easing':prior.affect;next.attention='worksheet';next.engagement='participating';
  // Acting out an offered entry step does not supply a solution or invent a task.
  const live=t.evidence.filter(e=>['choice','smallStep','reentry'].includes(e.technique)).map(e=>e.clause).join('，');
  let action=/圈/.test(live)?'circleFractions':/(?:用說的|念|讀)/.test(live)?'readTask':/畫/.test(live)?'drawOutline':/(?:一句|理由|這格).*?寫|寫.*?(?:一句|理由|這格)/.test(live)?'startReason':'takePen';
  const same=prior.microAction===action;
  const lines={circleFractions:same?'我圈好了。下一步理由怎麼寫？':'好，我先圈出這兩個分數。先做這一題。',readTask:same?'要比較大小，還要寫理由。那理由可以先用說的嗎？':'那我先念題目：「比較四分之三和八分之五，說明理由。」',drawOutline:same?'我先畫了兩條。接下來要怎麼分？':'那我先畫兩條。要畫一樣長，對吧？',startReason:same?'我正在試這格，可是理由還寫不出來。':'我先試理由這格……可以先把我的想法說給你聽嗎？',takePen:same?'我正在試上面會的部分。下面這格先空著，等你陪我看。':'好，我先寫上面會的。下面理由這格，等一下再請你幫我看。'};
  let line=lines[action];if(!supported&&!same)line='我還是有點悶……'+line.replace(/^好，/,'');
  if(t.followup)line+='下課再跟你說那件事。';
  return done(t.choice?'chooseEntryStep':same?'continueCurrentStep':['startCurrentWork','distinguishAndWork','currentDuty','workAndConversation','accompanyWriting'].includes(legacy.intent)?legacy.intent:'guidedReentry',line,action,'currentWork');
 }
 if(t.accompaniment||(legacy.intent==='offerHelp'&&!/(?:下課|之後|明天)/.test(text))){
  next.affect='easing';next.attention='worksheet';next.engagement='oriented';return done(legacy.intent,legacy.intent==='offerHelp'?'要。這題我選四分之三，可是理由不知道怎麼寫。老師可以陪我看一下嗎？':prior.microAction?'好，我把紙拉近一點。先看我空著的這格。':'好，那先看這題。你陪我看，我把紙拿過來。','bringPaper');
 }
 if(t.validation){next.affect='easing';next.engagement='available';return done('emotionAcknowledged',t.followup?'好，下課你再聽我說。那現在先做一題就好嗎？':'嗯……你知道我在意什麼就好。那我先試一題，好嗎？');}
 // Preserve specific promises and distinctions, including future support.
 return {...legacy,guidance:next};
}
function render(A,resolution,presentAction=false){
 const scoped=/^(?:166_|TEACHING_BRANCH|T01_)/.test(A.state.phase),s=resolution?.guidance||{affect:'tense',attention:'scoreConcern',engagement:'notStarted'};
 A.els.stage.dataset.regulation=scoped?s.affect:'';A.els.stage.dataset.attention=scoped?s.attention:'';A.els.stage.dataset.penHeld=scoped&&!!(s.artifacts?.penPickedUp||s.artifacts?.fractionsCircled||s.artifacts?.outlineDrawn)?'true':'false';
 let paper=document.getElementById('reentryPaper');
 if(!paper){paper=document.createElement('div');paper.id='reentryPaper';paper.className='reentry-paper';paper.innerHTML='<small>子安的學習單</small><svg viewBox="0 0 200 100" role="img" aria-label="這一題比較四分之三和八分之五，理由尚未完成"><text x="25" y="32">3/4</text><text x="110" y="32">5/8</text><g class="reentry-circles"><ellipse cx="44" cy="27" rx="29" ry="18"/><ellipse cx="130" cy="27" rx="29" ry="18"/></g><g class="reentry-outline"><path d="M15 47H180V59H15ZM15 65H180V77H15Z"/></g><text x="12" y="94" class="reentry-reason">理由：＿＿＿＿＿</text></svg>';A.els.stage.append(paper);}
 const visible=scoped&&!A.state.phase.startsWith('T01_')&&!!s.microAction&&s.microAction!=='settle';paper.classList.toggle('show',visible);paper.classList.toggle('circled',!!s.artifacts?.fractionsCircled);paper.classList.toggle('outlined',!!s.artifacts?.outlineDrawn);paper.classList.toggle('taking-pen',!!s.artifacts?.penPickedUp);
 if(visible){const sr=A.els.stage.getBoundingClientRect(),ar=A.els.zian.getBoundingClientRect(),pw=paper.offsetWidth,ph=paper.offsetHeight;paper.style.left=Math.max(8,Math.min(sr.width-pw-9,ar.left-sr.left+ar.width*.5-pw*.5))+'px';paper.style.bottom='auto';paper.style.top=Math.max(50,Math.min(sr.height-ph-48,ar.top-sr.top+ar.height*.68))+'px';}
 if(!A.state.guidanceResizeBound){A.state.guidanceResizeBound=true;new ResizeObserver(()=>render(A,A.state.student_dialogue166?.history.at(-1))).observe(A.els.stage);}
 if(!scoped)return;
 const mouth=A.els.zian.querySelector('.mouth');if(mouth)mouth.setAttribute('d',s.affect==='easing'?'M66 70q8 3 15 0':'M66 74q8-5 15 0');
 if(presentAction&&s.newAction&&resolution&&!resolution.guidance.actionPresented){
  resolution.guidance.actionPresented=true;A.log('guided_reentry_action',{version:VERSION,sourceId:resolution.sourceId,action:s.microAction,attention:s.attention,affect:s.affect,simulated:true,learningVerified:false});
  g.C5_EXT.gesture(A,'zian',['circleFractions','takePen','startReason','drawOutline'].includes(s.microAction)?'writing':'reaching');
  if(visible&&!A.state.motion_paused&&!matchMedia('(prefers-reduced-motion: reduce)').matches){paper.animate([{transform:'translateY(18px) rotate(-6deg)',opacity:.2},{transform:'translateY(0) rotate(-3deg)',opacity:1}],{duration:750});}
 }
}
const LABELS={validation:'接住感受',settling:'留緩衝',choice:'提供起步選擇',smallStep:'縮小眼前任務',reentry:'接回課堂',accompaniment:'陪同起步',followup:'約定後續談話',pressure:'以競賽結果提醒',dismissal:'否定感受或施壓'};
function resultPanel(A){
 const rows=A.state.student_dialogue166?.history||[];if(!rows.length)return '';
 return '<details class="guidance-evidence"><summary>情緒引導與回到課堂｜查看原話、策略與模擬反應</summary><p>策略依教師原話辨認；子安的動作是劇情模擬，不代表已平復或獨立學會。</p>'+rows.map(r=>'<article class="support-record"><small>'+A.esc(r.recordStage)+' · '+A.esc(r.sourceId)+'</small><blockquote>'+A.esc(r.respondingTo)+'</blockquote><p>'+r.guidance.teacherTechniques.evidence.map(e=>A.esc(LABELS[e.technique])).filter((x,i,a)=>a.indexOf(x)===i).join('、')+'</p><small>子安：'+A.esc(r.text)+'</small></article>').join('')+'</details>';
}
g.C5_GUIDANCE={VERSION,techniques,respond,render,resultPanel};
})(globalThis);
