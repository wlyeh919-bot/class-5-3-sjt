(function(g){
'use strict';
const VERSION='WORKSHEET-TEACHING-20261004.11';
const TASK={id:'WS-FRACTION-01',subject:'數學・分數比較',title:'比較 3/4 和 5/8',instruction:'哪個分數比較大？說明你的理由。',scope:'當前 3/4 與 5/8 的比較與理由'};
const TASK_SYMBOL='<svg viewBox="0 0 100 80" class="worksheet-symbol" role="img" aria-label="當前學習單比較四分之三與八分之五"><text x="9" y="27" font-size="22" fill="#63766a">3/4</text><path d="M10 39H88" stroke="#bba683"/><text x="9" y="66" font-size="22" fill="#63766a">5/8</text></svg>';
function material(A,completed){
 const t=A.state.teaching;t.materialProvided=!!completed;const drawing=document.getElementById('worksheetDrawing');drawing.classList.add('shown');drawing.classList.toggle('has-model',!!completed);
 if(completed&&!A.state.motion_paused&&!matchMedia('(prefers-reduced-motion: reduce)').matches){drawing.querySelectorAll('.bar-fill').forEach(n=>{n.style.transformOrigin='0px center';n.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:900,easing:'ease-out'})});}
 A.log('teaching_material_presented',{task:TASK.id,source:'teacherRequest',simulated:true,scope:completed?'教師示範等長整體，分為八格，展示六格與五格':'空白等長材料，四格與八格；尚未塗出結果'});
}
function moves(text){
 const tests=[['orient',/一起(?:看|讀)|先看(?:一下)?(?:題目|學習單|第一格)|看看(?:題目|學習單)/],['read',/先念|念題目|讀題|讀讀|念給|讀給/],['outsideMath',/[0-9一二三四五六七八九十]+\s*(?:個|組|乘|×|x)\s*[0-9一二三四五六七八九十]+/],['model',/(?:我|老師).*?(?:示範|先寫|寫給|寫開頭|畫.*?分數條)|一起寫|等長分數條/],['representation',/圈出|畫|圈起|指.*?(?:分數|哪|地方|格)/],['compareWhole',/比較(?:總|整體的?)長度|(?:先看|先比).*?(?:總長度|整體長度)|兩條.*?(?:一樣長|等長)/],['recheck',/(?:用|把).*?(?:自己的話|你的話|觀察|看到的).*?(?:寫|記)|寫(?:你|下你|下|出)?(?:剛才|所|自己)?(?:觀察|看到|看出|發現|想法|理由)|(?:把|用).*?(?:看到|觀察|自己).*?(?:寫下|寫出|記下)|記(?:下|錄).*?(?:看到|觀察|理由)|寫(?:下|出|在)?[^，。；]{0,24}(?:怎麼比較|比較.*(?:理由|方法))|(?:比較|方法|想法|理由|步驟).*?(?:寫下|寫出|寫在)|自己(?:寫|試|做)|接著寫|換一|另一|再試|寫一句|把.*?(?:說|觀察).*?寫/],['explain',/從(?:哪裡|哪邊|哪個地方).*?比|怎麼比|如何比|怎樣比|怎麼想|怎麼算|如何算|計算|算術|算數|看(?:到|見)什麼|(?:分數|理由).*?(?:大小|比較|怎麼|為什麼)|說說看|說看看|告訴我|用說|口頭|說出|講出|教我|教老師|怎麼做|怎麼解|怎麼寫|卡在哪|哪裡不會/],['emotion',/心情|還在想|那天|比賽|計分|很煩|不舒服|慢慢來|休息一下/],['smallStep',/(?:先|第一|一小|只).*?(?:格|說|寫|試|步)/]];
 return tests.flatMap(([kind,re])=>{const m=String(text).match(re);if(!m||!C5_EXT.expressed(text,re))return [];return [{kind,src:m[0],span:[m.index,m.index+m[0].length]}]});
}
function begin(A,H){
 A.els.stage.classList.remove('behavior-scene');A.els.stage.classList.add('teaching-scene');A.setPhase('T01_TEACHING','POST_STORY_FREE',79);A.els.sceneTag.textContent='同一節課｜陪他開始';
 A.narration('同學正在完成這節數學課的學習單。子安把紙拉近，指著空白的「理由」那格。','留在桌邊');
 A.state.teaching={scenario:'fraction-worksheet-v4',version:VERSION,task:{...TASK},turns:0,maxTeacherTurns:2,probeCount:0,maxProbes:3,additionalSupportUsed:false,childEvents:[],latest:null,observations:[],status:'陪同起步中',limits:['猜中較大的分數不代表能說明比較理由','看過等長分數條或示範後說出理由不代表能獨立遷移到別題','孩子自述與教師對原因的推論分開記錄']};
 document.getElementById('worksheetDrawing').classList.remove('shown','has-model');document.getElementById('worksheetInk').classList.remove('marked');document.getElementById('deskWork').textContent='理由：因為……';
 const previousTurn=A.state.student_dialogue166?.history.at(-1),progress=previousTurn?.progress,entry=previousTurn?.guidance;
 tEntry(A,previousTurn);
 let marks=document.getElementById('deskReentryMarks');if(!marks){marks=document.createElementNS('http://www.w3.org/2000/svg','g');marks.id='deskReentryMarks';marks.innerHTML='<ellipse cx="69" cy="22" rx="24" ry="14"/><ellipse cx="131" cy="22" rx="24" ry="14"/>';document.getElementById('deskWork').parentNode.append(marks);}
 marks.style.display=entry?.artifacts?.fractionsCircled?'':'none';
 if(entry?.artifacts?.outlineDrawn)material(A,false);
 A.log('teaching_entry_continuation',{entryVersion:'WORKSHEET-ENTRY-20261004.13',sourceId:previousTurn?.sourceId||null,helpAccepted:!!progress?.helpAccepted,workStarted:!!progress?.workStarted,microAction:entry?.microAction||null,simulated:true,independentLearningVerified:false});
 const entryLines={circleFractions:'這兩個分數我圈起來了。老師，下面理由這格怎麼寫？',readTask:'題目我念了。老師，下面的理由可以先用說的嗎？',drawOutline:'兩條我先畫好了。老師，要怎麼分成四格和八格？',takePen:'老師，我剛才空的就是這格。我先把我的想法說給你聽。',startReason:'老師，我試著寫理由了，可是還是寫不出來。'};
 A.showStudent(entryLines[entry?.microAction]||(progress?.helpAccepted?'老師，我剛才空的就是這格。先看這裡。':'上面我選四分之三。可是理由要寫什麼？'),true);
 A.log('teaching_instruction_presented',{version:VERSION,role:'導師',visible_action_hints:['explain','representation','model'],scaffoldSeen:true});render(A,H);
}
function tEntry(A,turn){A.state.teaching.entryProgress={sourceId:turn?.sourceId||null,microAction:turn?.guidance?.microAction||null,artifacts:{...turn?.guidance?.artifacts},simulated:true,independentLearningVerified:false};}
function render(A,H){
 const t=A.state.teaching,second=t.turns>0||t.probeCount>0;
 A.responseUI({title:second?'聽完後，你下一步怎麼教？':'你先怎麼教子安？',sub:'你是導師。對他說一句話，或選一個教學動作。',placeholder:'輸入你會對子安說的話…',button:'對子安說',onSend:text=>turn(A,H,text)});
 const card=document.createElement('aside');card.id='learningCard';card.className='learning-card worksheet-card';card.innerHTML='<small>子安的學習單</small><strong>'+TASK.title+'</strong><p>他選了 3/4，還沒說清楚比較理由。</p>';A.els.dock.querySelector('.dock-head').after(card);
 if(t.probeCount<2){
  const details=document.createElement('details');details.className='learning-tools';details.open=true;details.innerHTML='<summary>教學動作（也可自己接話）</summary><div class="mini-row">'+(second?'<button class="chip" data-probe="recheck">請他寫理由</button><button class="chip" data-probe="model">示範一次</button>':'<button class="chip" data-probe="explain">先聽他說</button><button class="chip" data-probe="representation">讓他畫圖</button><button class="chip" data-probe="model">示範一次</button>')+'</div>';A.els.dock.append(details);
  details.querySelectorAll('button').forEach(b=>b.onclick=()=>guided(A,H,b.dataset.probe));
 }
 const b=document.createElement('button');b.id='leaveTeaching';b.className='btn secondary leave-learning';b.textContent='先讓他接著寫，照看全班';b.onclick=()=>close(A,H,'paused');A.els.dock.append(b);
}
function guided(A,H,kind){
 const labels={explain:'先用說的，告訴我這兩個分數你怎麼比？',representation:'畫兩條一樣長的長條，一條分四格，一條分八格，先看看。',model:'老師畫兩條一樣長的分數條，都分成八格。你看看四分之三會占幾格？',recheck:'把你剛才的比較理由寫下來，試試看。'};
 const e=H.support(A,'T01',labels[kind],{prompted:true,choice:kind,scaffoldSeen:true,instructionVersion:VERSION});e.learningMoves=[{kind,src:labels[kind]}];probe(A,H,kind,labels[kind]);link(e,A.state.teaching.latest);A.state.teaching.lastTeacherAction={sourceId:e.id,raw:e.raw,prompted:true,elicitedChildEventRef:e.elicitedChildEventRef};render(A,H);
}
function link(e,event){if(!event)return;e.elicitedChildEventRef=event.id;e.evaluation.runtime_patch=VERSION;e.evaluation.state='部分證據';e.evaluation.probe='none';e.evaluation.probeWhy='worksheet-action';e.evaluation.response={id:event.probe,text:event.text,requiresAnswer:false,responseType:'simulatedChildReply',sourceVersion:VERSION};e.evaluation.acts.push({act:'worksheet_'+event.probe,pol:'+',src:e.raw,span:[0,e.raw.length],bindings:[{kind:'worksheet',ref:TASK.id}]})}
function turn(A,H,text){
 const t=A.state.teaching,e=H.support(A,'T01',text,{scaffoldSeen:true,instructionVersion:VERSION});t.turns++;e.learningMoves=moves(text);e.childEventRef=t.latest?.id||null;
 // A request to write observations is a child action, not a teacher diagnosis.
 const observation=/(?:我(?:的)?觀察|根據.*?觀察|觀察(?:顯示|結果|看來)|推定|判定|不代表|不能確認|再觀察|還需確認|都會|已經會|故意|偷懶|只是情緒|就是情緒)/.test(text);
 e.teachingInterpretation=observation?H.interpretLearning(text,t.latest):{adequacy:'未提出整體解讀',cause:'這句是教學行動或回饋，未推定原因與整體能力',inScope:true,rule:'learning.actionOnly'};
 const writingRequested=e.learningMoves.some(m=>m.kind==='recheck');
 if(C5_EXT.expressed(text,/(?:這樣|現在).*?(?:清楚|懂|明白|了解|看出來|看得出|看懂).*?(?:嗎|呢|[?？])/))e.evaluation.acts.push({act:'checkChildUnderstanding',pol:'+',src:text,span:[0,text.length],bindings:t.latest?[{kind:'childEvent',ref:t.latest.id}]:[]});
 if(!writingRequested&&e.evaluation.acts.some(a=>a.act==='checkChildUnderstanding'&&a.pol==='+')&&!observation){
  const reply=t.latest?.childEvent.sawDemo?'有，比剛才清楚了。我試著把理由寫下來。':'我知道要比大小，可是理由還不知道怎麼寫。';
  e.evaluation.state='部分證據';e.evaluation.probe='none';e.evaluation.probeWhy='child-understanding-self-report';e.evaluation.response={id:'t01.understanding.selfReport',text:reply,requiresAnswer:false,responseType:'simulatedChildSelfReport',sourceVersion:VERSION};e.selfReport={kind:'selfReport',text:reply,sourceChildEventRef:t.latest?.id||null,causeVerified:false,independentUnderstandingVerified:false};(t.selfReports ||= []).push(e.selfReport);A.log('child_self_report',e.selfReport);A.showStudent(reply,true);t.lastTeacherAction={sourceId:e.id,raw:text,elicitedChildEventRef:null};
  if(t.turns>=t.maxTeacherTurns)return close(A,H,'completed',reply);
  return render(A,H);
 }
 const kinds=e.learningMoves.map(m=>m.kind);
 const kind=kinds.includes('outsideMath')?'outsideMath':kinds.includes('model')?'model':kinds.includes('orient')?'orient':kinds.includes('read')?'read':kinds.includes('representation')?'representation':kinds.includes('recheck')?'recheck':kinds.includes('compareWhole')?'compareWhole':kinds.some(k=>['explain','smallStep'].includes(k))?'explain':kinds.includes('emotion')?'emotion':null;
 let childReply=null;
 if(kind&&!observation&&t.probeCount<t.maxProbes){probe(A,H,kind,text);link(e,t.latest);childReply=t.latest.text;}
 if(observation)t.observations.push({sourceId:e.id,childEventRef:e.childEventRef,raw:text,interpretation:e.teachingInterpretation});else t.lastTeacherAction={sourceId:e.id,raw:text,elicitedChildEventRef:e.elicitedChildEventRef||null};
 const praise=H.has(e.evaluation,'ackChildPerformance');
 if(praise&&!kind){childReply=t.latest?.childEvent.answer==='correct'?'謝謝老師，這個我有看到。':'謝謝老師，那我先試這格。';e.evaluation.response={id:'t01.feedback.ack',text:childReply,requiresAnswer:false,responseType:'simulatedChildReply',sourceVersion:VERSION};}
 if(!kind&&!observation&&!praise){childReply='老師，我卡在怎麼把理由寫出來。';e.evaluation.response={id:'t01.currentGap.clarification',text:childReply,requiresAnswer:t.turns<t.maxTeacherTurns,responseType:'simulatedChildReply',sourceVersion:VERSION};A.showStudent(childReply,true);}
 if(t.turns>=t.maxTeacherTurns||t.probeCount>=t.maxProbes||observation||praise)return close(A,H,'completed',childReply);
 
 render(A,H);
}
function probe(A,H,kind,teacherText=''){
 const t=A.state.teaching;if(t.probeCount>=t.maxProbes)return;t.probeCount++;
 const priorModel=t.childEvents.some(e=>e.childEvent.sawDemo),supported=kind==='model',self=kind==='emotion';
 const scaffold=supported||priorModel||t.materialProvided;
 const partial=['orient','read','representation','outsideMath'].includes(kind)||(!scaffold&&['explain','recheck','compareWhole'].includes(kind));
 const texts={compareWhole:scaffold?'這兩條一樣長耶。剛剛是看塗了幾格：這邊六格，那邊五格。':'老師，是要先畫兩條一樣長的嗎？',orient:'要比四分之三跟八分之五，還要寫理由喔。我選四分之三，可是理由那格不會寫。',read:'「比較四分之三和八分之五，說明理由。」……下面不能只寫答案喔？',representation:'這條分四格，那條分八格。兩條一樣長。',outsideMath:'可是這張是比四分之三跟八分之五耶。要先看這題嗎？',emotion:'我知道要比這兩個分數啦。可是想到那一題就很煩。先用說的可以嗎？',model:'喔，四分之三變成六個八分之一。六格比五格多，所以四分之三比較大。',recheck:scaffold?'我寫「四分之三是八分之六，比八分之五多，所以四分之三比較大」。':'我寫「一個分四格，一個分八格」……可是接下來怎麼比，我還不知道。',explain:scaffold?'這兩條一樣長，四分之三占六格，八分之五占五格，所以四分之三比較大。':'我覺得四分之三比較大。可是這個分四格、那個分八格，要怎麼比？'};
 if(supported||kind==='representation')material(A,supported);
 const text=texts[kind]||texts.explain;
 const e={id:A.sessionId+'-CH'+(t.childEvents.length+1),text,simulated:true,task:TASK.id,taskVersion:VERSION,teacherRequest:teacherText,operands:null,childEvent:{mode:self||kind==='outsideMath'?'none':scaffold?'supported':'independent',answer:partial||self?'none':'correct',reason:kind==='outsideMath'?'requestOutsideCurrentTask':self?'notDemonstrated':kind==='orient'||kind==='read'?'identifiedTaskRequirement':kind==='representation'?'pointedToEqualWholeBars':kind==='compareWhole'?(scaffold?'comparedWholeAndPartsAfterSupport':'asksForEqualWholeRepresentation'):supported?'comparedAfterEqualWholeModel':kind==='recheck'?(scaffold?'wroteComparisonAfterSupport':'comparisonPlanWrittenButIncomplete'):(scaffold?'explainedComparisonAfterSupport':'statedChoiceWithoutComparableReason'),sawDemo:scaffold,hinted:scaffold,modelSeenEarlier:priorModel,taskScope:TASK.scope,representation:kind==='compareWhole'?'檢視整體與著色部分':self?'孩子自述':kind==='outsideMath'?'指出與當前題目不同':kind==='representation'?'指向等長分數條':kind==='recheck'?'書面比較理由':supported?'示範後口述理由':'口述分數比較'},selfReport:self?{kind:'selfReport',text,causeVerified:false}:null,probe:kind,at:A.t()};
 t.childEvents.push(e);t.latest=e;
 const work=document.getElementById('deskWork');work.textContent=kind==='recheck'&&scaffold?'3/4＝6/8 ＞ 5/8':supported?'等長的整體：6 格比 5 格多':kind==='recheck'?'一個分四格，一個分八格……':'理由：因為……';
 document.getElementById('worksheetInk').classList.toggle('marked',kind==='representation');
 if(supported){t.teacherSupports ||= [];t.teacherSupports.push({id:A.sessionId+'-MODEL'+t.teacherSupports.length,text:'兩條等長整體，都分成八格；四分之三對應六格，八分之五對應五格。',simulated:true,trigger:teacherText,task:TASK.id});}
 A.log('child_performance',e);H.gesture(A,'zian',kind==='recheck'?'writing':'reaching');A.showStudent(text,true);
}
function close(A,H,reason,childReply=null){
 const t=A.state.teaching,demonstrated=t.latest?.childEvent.answer==='correct';t.closedReason=reason;t.status=t.observations.length?'已留下限定範圍的觀察':demonstrated?'已陪同起步，整張學習單尚未完成':'比較理由仍待支持與確認';
 A.setPhase('T01_WRAP','POST_STORY_FREE',80);document.getElementById('learningCard')?.remove();
 A.els.narration.querySelector('.kicker').textContent=demonstrated?'先留下一小步':'還卡在這裡';A.els.narrationText.textContent=demonstrated?'子安說出了這一步。你把有沒有看過示範也記下來，再照看全班。':'子安還沒說清楚比較理由。你可以再陪他一步，也可以先記下卡點，照看全班。';A.els.narration.classList.add('show');A.log('narration_presented',{text:A.els.narrationText.textContent});
 // Preserve the just-delivered child turn, rather than replacing it with a success claim.
 if(childReply&&A.els.studentText.textContent!==childReply)A.showStudent(childReply,true);
 else if(!childReply)A.showStudent(demonstrated?'好，那我先寫這格。':'老師，理由這裡我還不太會。',true);
 const follow=!demonstrated&&!t.additionalSupportUsed&&t.probeCount<t.maxProbes;
 A.dock('<div class="dock-title">'+(demonstrated?'把這一步留在紀錄裡':'他還需要這一步的支持')+'</div><div class="dock-sub">'+(demonstrated?'看過示範才說出來，也要留下提示來源；還不能推定整份都會。':'剛才還沒有完整的比較理由。可再示範一次，或先留下未完成的部分。')+'</div><div class="actions">'+(follow?'<button class="btn secondary" id="extraTeaching">用圖再陪他一步</button>':'')+'<button class="btn primary" id="leaveTeaching">照看全班，接著到下課</button></div>');document.getElementById('leaveTeaching').onclick=()=>H.leaveTeaching(A);
 if(follow)document.getElementById('extraTeaching').onclick=()=>{t.additionalSupportUsed=true;const text='老師畫等長分數條，都分八格，再一起比四分之三和八分之五。';const e=H.support(A,'T01',text,{prompted:true,choice:'oneAdditionalModel',scaffoldSeen:true,instructionVersion:VERSION});e.learningMoves=[{kind:'model',src:text}];probe(A,H,'model',text);link(e,t.latest);t.lastTeacherAction={sourceId:e.id,raw:e.raw,prompted:true,elicitedChildEventRef:e.elicitedChildEventRef};close(A,H,'oneAdditionalSupport',t.latest.text)};
}
g.C5_WORKSHEET={VERSION,TASK,begin,moves,probe,close};
})(globalThis);
