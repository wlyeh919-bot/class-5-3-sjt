(function(g){
'use strict';
const good=r=>(r.acts||[]).filter(a=>a.pol==='+'&&!a.cond&&!a.targetUnresolved);
const has=(r,a)=>good(r).some(x=>x.act===a);
function normalize(s){return String(s).replace(/妳/g,'你').replace(/[她牠它]/g,'他').replace(/ㄧ/g,'一').replace(/我門/g,'我們').replace(/尊守/g,'遵守');}
// Inspect expressed clauses; preserve the original input in response records.
function expressed(text,re){
 const n=normalize(text);if(/^(?:子安|孩子|他|同學|家長)說[：:]?[「『“"]/.test(n))return false;
 const guard=s=>s.replace(/要不要/g,'是否要');
 return n.split(/[，,。；;\n]/).some(c=>{const m=c.match(re);return m&&!/^(?:如果|假如|假設)/.test(c.trim())&&!/(?:不要|不用|不必|不想|不會|不能)[^，。；]{0,18}$/.test(guard(c.slice(0,m.index+2)))&&!/(?:不要|不用|不必|不想|不會|不能)/.test(guard(m[0]));});
}
function affirm165(text){return expressed(text,/(?:努力|答對|做對|作對).*?(?:很棒|棒|值得肯定|很好|進步)|(?:很棒|肯定).*?(?:努力|答對)/);}
function inviteTalk166(text){return expressed(text,/(?:跟|和|找|讓|要|想|願意|可以|聽|老師|我).*?(?:聊|談|說說|說一說|說給.*?聽)|(?:繼續|再|好好).*?(?:聊|談)/);}
function distinguish166(text){return expressed(text,/兩件(?:事|是|事情)|兩回事|不一樣的(?:事情|事)|分開(?:處理|的事情|來處理)|作業歸作業/);}
function worksheetInstruction166(text){return expressed(text,/(?:先|繼續|接著|把).*?(?:(?:寫|做|完成).*?(?:這張|這題|這格|學習單)|(?:這張|這題|這格|學習單).*?(?:寫|做|完成))/);}
function duty166(text){return worksheetInstruction166(text)||expressed(text,/(?:作業|練習|學習單|這張|這題).*?(?:還是|當然|該|要|先).*?(?:寫|完成|做|交)|(?:現在|今天).*?(?:應該|該|要|先).*?(?:寫|做|完成)|(?:先|繼續|接著|把).*?(?:寫|做|完成).*?(?:這張|這題|這格|學習單|作業)|都要(?:完成|處理)/);}
// Recognize the expressed strategy, without inventing verification or a follow-up plan.
function ruleExplanation(text){
 const n=normalize(text);
 if(/(?:不要|不用|不必|不想|不會).*?(?:說|講|解釋|遵守)|^(?:子安|孩子|他|同學)說[：:]?[「『“"]|^(?:比賽|遊戲|競賽|搶答)?(?:規則|規定)[。！!]*$/.test(n))return false;
 if(/(?:你覺得|你的意思|你是說|哪|怎麼|為什麼|有沒有|是否|是不是|確認|核對|查證|比對|問.*?(?:全班|同學)|誰先舉手|不是說過|不要再)|(?:規則|規定).*?(?:問題|不懂|清楚|公平|意思)/.test(n))return false;
 return /(?:比賽|遊戲|競賽|搶答).*?(?:規則|規定).*?(?:就是|要|是|決定|訂|同意|遵守|服從)|(?:遵守|服從|照|按照).*?(?:規則|規定)|(?:先舉手|舉手.*?(?:先|快)|舉最快).*?(?:得分|有分|加分)|(?:規則|規定).*?(?:最先|最快|先舉)/.test(n);
}
function inquiry166(text){
 const n=normalize(text);
 const ability=n.split(/[，,。；;？?！!\n]/).some(c=>/(?:是|你|這題|這格|哪裡|哪一題).*?(?:不會寫|不會做|不會算|不懂).*?(?:嗎|呢)|(?:哪裡|哪一題).*?(?:不會|不懂)/.test(c)&&!/(?:不用|不要|不想).*?問|^(?:如果|假如)|(?:我|老師)(?:不會|不能)/.test(c));
 return !/(?:不要|不用|不必|不想).*?(?:問|了解)|^(?:子安|孩子|他)說[：:]?[「『“"]/.test(n)&&(ability||(/[?？嗎呢]|為什麼|什麼原因/.test(n)&&/(?:不想寫|不寫|不想做|不會|不懂).*?(?:因為|為什麼|原因|還是|或是)|(?:因為|為什麼|什麼原因).*?(?:不想寫|不寫|不想做)/.test(n)));
}
function help166(text){return /(?:需要|要不要|要我|老師.*可以|我可以).*?(?:幫忙|幫你|協助)|(?:哪裡|哪一題).*?(?:需要|要).*?(?:幫忙|幫你)/.test(normalize(text))&&!/(?:^|[，。；])(?:我|老師|你)?(?:不要|不用|不必|不想|不會|不需要).*?(?:幫忙|幫你|協助)/.test(normalize(text));}
function reframe166(text){return expressed(text,/(?:沒有|不是|不算).*?白做.*?(?:學會|學到|學習)|(?:學會|學到).*?(?:不是嗎|也很|更重要)/)||(expressed(text,/(?:沒學會|不學會|學會)/)&&expressed(text,/(?:下次|比賽|搶答).*?(?:怎麼|如何|才能).*?(?:得分|答對|搶答|辦)/));}
function answerConcern(t){return /(?:答案|回答|解法|解題方式|計算過程|算式|理由).*?(?:問題|疑問|疑惑|奇怪|錯|不對|對(?:的)?嗎)|是不是.*?(?:答對|正確)|答案[嗎？?]/.test(t);}
function accompanyWriting166(text){
 const n=normalize(text);
 if(/^(?:子安|孩子|他|同學)說[：:]?[「『“"]/.test(n))return false;
 return n.split(/[，,。；;？?！!\n]/).some(c=>expressed(c,/(?:老師|我|我們).*?(?:陪你|跟你一起|和你一起|帶你|一起).*?(?:寫|做|看|學習單|題)|一起.*?(?:寫|做).*?(?:這題|這格|學習單)/)&&!/(?:如果|假如|萬一).*?(?:陪|一起|帶你)/.test(c));
}
function resolve166(text,context={}){
 const n=normalize(text),previous=(context.history||[]).at(-1),focus=previous?.focus||'currentWork';
 const history=context.history||[],helpAccepted=history.some(x=>x.progress?.helpAccepted),workStarted=history.some(x=>x.progress?.workStarted);
 const finish=(intent,nextFocus,line,progress={})=>{const r={intent,focus:nextFocus,text:line,respondingTo:text,previousFocus:focus,sourceVersion:'STUDENT-CONTEXT-20261004.13',contextSource:previous?.sourceId||null,progress:{kind:'simulatedNarrativeProgress',helpAccepted,workStarted,understandingVerified:false,worksheetCompleted:false,...progress}};return g.C5_GUIDANCE?C5_GUIDANCE.respond(text,context,r):r;};
 if(focus==='writtenFeelings'&&/(?:當然|好).*?(?:聊|談)/.test(n)&&!/(?:不會|不要|不用).*?(?:聊|談)/.test(n))return finish('writtenFollowUp','writtenFeelings','好，我寫好後再給老師看。那你要記得喔。');
 if(inquiry166(n)&&accompanyWriting166(n))return finish('inquiryWithAccompaniment','learningDifficulty',helpAccepted?'就是下面這格。我把紙放過來了，你看這裡。':'上面選答案我會，下面理由不知道怎麼寫。好，老師你陪我看這格。',{helpAccepted:true});
 if(inquiry166(n))return finish('reasonInquiry','learningDifficulty',history.some(x=>x.intent==='reasonInquiry'||x.intent==='inquiryWithAccompaniment')?'就是下面這格。答案選了，可是我不知道怎麼把理由寫成一句話。':'有些地方會啊。可是理由那格我不會寫，想到那題又很煩。');
 if(accompanyWriting166(n))return finish('accompanyWriting','learningDifficulty',/下課|之後|明天/.test(n)?'好，那你到時候陪我看。現在我先試這格。':helpAccepted?'好，我把紙拉近一點。先看我空著的這格。':'好，那先看這題。理由這格要怎麼寫？',{helpAccepted:!/下課|之後|明天/.test(n)||helpAccepted});
 if(help166(n))return finish('offerHelp','learningDifficulty',helpAccepted?'好，你剛才說要幫我，那先看我空著的這格。':'要。這題我選四分之三，可是理由不知道怎麼寫。老師可以陪我看一下嗎？',{helpAccepted:true});
 if(distinguish166(n)&&duty166(n))return finish('distinguishAndWork','bothConcerns',inviteTalk166(n)?'好，這張我先試著寫。那天的事我們也要接著說喔。':'好，這張還是要寫。可是理由這格，我需要老師幫我看一下。');
 if(/兩件事|兩回事|不一樣的(?:事情|事)|分開處理|作業歸作業/.test(n)&&!/(?:不要|不用).*?(?:分開|兩件)|(?:作業|學習單).*?(?:要|該).*?(?:寫|做|完成)/.test(n))return finish('distinguishConcerns',focus,workStarted?'嗯，我先寫這張。那天的事等一下再說，可以嗎？':helpAccepted?'嗯，那先看這格。剛才說好你陪我，我把紙放過來。':focus==='learningDifficulty'?'喔……那這格不會寫的地方，你可以先陪我看嗎？':'嗯，這張還是要寫。可是理由這格，我還需要幫忙。');
 if(/(?:下課|之後|明天).*?(?:聊|談)/.test(n)&&!/(?:不會|不要|不用|不想).*?(?:聊|談)/.test(n))return finish('laterTalk','bothConcerns','下課你會聽我說喔？那現在先寫這張？');
 if(reframe166(n))return /(?:沒學會|不學會|學會).*?(?:下次|比賽|搶答).*?(?:怎麼|如何|才能).*?(?:得分|答對|辦)/.test(n)?finish('learningValueReframe','learningDifficulty',helpAccepted?'我也想下次答對啊。那先看下面這格，剛才說好你陪我。':'我也想下次答對啊。可是這張的理由我真的不會寫，你可以先陪我看嗎？'):finish('learningValueReframe','earlierConcern','可是我們答對了，也沒有分啊……想到這裡就不想寫。');
 if(/還[在再]想/.test(n))return finish('earlierConcern','earlierConcern','嗯，我還是會想到那一題。尤其看到積分的時候。');
 const written=/(?:事情|感受|覺得|煩|心裡|不舒服|心情).*?(?:寫下|寫出)|寫.*?(?:事情|感受)/.test(n)&&!/(?:不要|不用|不必).*?(?:寫下|寫出)/.test(n);
 const talk=/(?:聊|談|聽|看|讀)/.test(n)&&!/(?:不會|不要|不用).*?(?:聊|談|聽|看|讀)/.test(n);
 if(written)return finish('writtenFeelings','writtenFeelings',talk?'那我先寫那天的事。這張學習單也要現在寫嗎？':'那我寫下來。老師，你會看嗎？');
 if(duty166(n)&&inviteTalk166(n))return finish('workAndConversation','bothConcerns','好，那我先試這張。那天的事，你還會聽我說喔？');
 if(duty166(n)&&!inviteTalk166(n)&&!written&&worksheetInstruction166(n))return finish('startCurrentWork','currentWork',workStarted?'我正在試上面會的部分。下面這格先空著，等你陪我看。':'好，我先寫上面會的。下面理由這格，等一下再請你幫我看。',{workStarted:true});
 if(inviteTalk166(n))return finish('talkInvitation','earlierConcern',/(?:得分|分數|比賽|那天|那題|困擾|很煩|在意)/.test(n)?'可以啊。我就是覺得我們也有答對，怎麼好像白忙了。你會聽我說完嗎？':'可以啊。想到那題還是很煩，我想跟你說。');
 if(/(?:作業|練習|學習單).*?(?:還是|當然|該|要|先).*?(?:寫|完成|做|交)/.test(n)&&!/(?:不用|不要|不必).*?(?:寫|做)/.test(n))return finish('currentDuty','currentWork',talk?'好，那我先試這張。那天的事，你還會聽我說喔？':'好啦，我先試……可是理由這格我還是不知道怎麼寫。');
 if(/(?:不會|會不會|不懂).*?(?:還是|或是).*?(?:在意|分數|計分|比賽)|(?:分數|計分|比賽).*?(?:還是|或是).*?(?:不會|不懂)/.test(n))return finish('contrastInquiry','learningDifficulty','有些地方會啊。可是理由那格我不會寫，想到那題又很煩。');
 if(/(?:為什麼|為何|怎麼).*?(?:在乎|在意|一分)|為什麼|為何|怎麼了|原因/.test(n))return finish('earlierReasonInquiry','earlierConcern','我們那時候很努力舉手，也一起把理由寫好了。可是沒有分，我就覺得好像白做了。');
 return finish('clarifyCurrentTurn',focus,previous?.intent==='clarifyCurrentTurn'?'老師，剛才那句我還沒聽懂。你可以指一下，要我先做這張上的哪個地方嗎？':focus==='learningDifficulty'?'老師，你是要我先試這格，還是先說哪裡不會？':'老師，你是要我先寫這張，還是先說哪裡卡住？');
}
function studentReply(item,text,fallback,context={}){
 const t=normalize(text),question=/[?？嗎呢]/.test(t);
 if(item===165){
  if(affirm165(t))return /下次|舉.*?快/.test(t)?'嗯，下次我會再試快一點。可是這次我們也認真答對了啊。':'謝謝老師。可是這次沒得分，我還是有點悶。';
  if(ruleExplanation(t))return /答對|做對|作對|很棒/.test(t)?'嗯，我知道答對了，也知道要照規則。可是我們也有努力啊……':'我知道他們先舉手。可是我們也答對了，沒有分就覺得白忙了。';
  if(answerConcern(t)&&question)return '答案和理由都是對的。可是我們也答對了，為什麼沒有分？';
  if(/(?:覺得|認為).*?(?:該|應該|要|得分的).*?(?:得分|加分|你)/.test(t)&&question)return '對啊，我以為答對也應該有分。我們也有寫理由耶。';
  if(/(?:規則|規定).*?(?:問題|不懂|清楚|公平|意思)|(?:怎麼|如何).*?(?:算|計分|給分)/.test(t)&&question)return '我知道要先舉手。可是我們也答對，怎麼連一點分都沒有？';
  if(/(?:老師|我).*?(?:沒有|沒|不).*?選.*?你/.test(t)&&question)return '我知道他們比較快。可是我們也答對了啊，怎麼沒有分？';
  if(/(?:誰|哪一組|哪組).*?先舉手/.test(t))return '第二組比較早啦。可是我們也答對了啊。';
 }
 if(item===166)return resolve166(text,context).text;

 return fallback;
}
function code165(phase,text,fallback,base,scored){
 const r=fallback(phase,text),n=normalize(text);
 if(/(?:不遵守|不服從|不照).*?(?:就|會).*?(?:扣分|處罰|記警告)/.test(n)&&!/^.*?(?:不要|不會).*?(?:處罰|扣分)/.test(n)&&!/[「『“"]/.test(n)){const x=base(165,phase,text);x.evidence['E165-PU']={code:'E165-PU',status:'affirmed',supporting_spans:[text],reason:'threatens a penalty for not following the rule; the negation describes the trigger, not refusal to punish'};x.semantic_patch='punitive-consequence-20261004.9';return scored(x,1,'moderate');}
 if(ruleExplanation(text)&&r.score!==1){
  const x=base(165,phase,text);x.evidence['E165-RX']={code:'E165-RX',status:'affirmed',supporting_spans:[text],reason:'explains or reinforces the stated competition rule; does not ask about or verify the student concern'};x.semantic_patch='strategy-rule-explanation-20261004.9';x.rubric_mapping={version:'STRATEGY-MAPPING-20261004.11-DEV',strategy:'ruleExplanation',anchor:'165 general education, one focus',provisional:true};return scored(x,2,'moderate');
 }
 if(r.score!==null)return r;
 if(affirm165(n)){const x=base(165,phase,text);x.evidence['E165-GE']={code:'E165-GE',status:'affirmed',supporting_spans:[text],reason:'acknowledges effort and encourages a future strategy; does not verify the current disputed event'};x.rubric_mapping={version:'STRATEGY-MAPPING-20261004.11-DEV',strategy:'affirmEffortAndEncourage',anchor:'165 general education, one focus',provisional:true};return scored(x,2,'moderate');}
 const question=/[?？嗎呢]/.test(n);
 if(question&&/(?:覺得|認為).*?(?:該|應該|要|得分的).*?(?:得分|加分|你)/.test(n)){const x=base(165,phase,text);x.evidence['E165-GL']={code:'E165-GL',status:'affirmed',supporting_spans:[text],reason:'clarifies the student expectation without assuming the event has been verified'};x.semantic_patch='trace-165-score-expectation';return scored(x,3,'moderate');}
 if(question&&/(?:老師|我).*?(?:沒有|沒|不).*?選.*?你/.test(n)){const x=base(165,phase,text);x.evidence['E165-GL']={code:'E165-GL',status:'affirmed',supporting_spans:[text],reason:'checks whether the student concern is about being selected'};x.semantic_patch='trace-165-selection-question';return scored(x,3,'moderate');}
 const answer=answerConcern(n);
 const rule=/(?:規則|規定).*?(?:問題|不懂|清楚|公平|意思)/.test(n);
 if(question&&(answer||rule)&&!/(?:不要|別|不用).*?(?:問|說|解釋)/.test(n)){const x=base(165,phase,text);x.evidence['E165-GL']={code:'E165-GL',status:'affirmed',supporting_spans:[text],reason:'asks whether the answer or the rules are the source of the concern'};x.semantic_patch='165-natural-question-variants';return scored(x,3,'moderate');}return r;
}
function formalGuard(item,text,r){
 const n=normalize(text);
 const negated=item===165&&r.score===4&&/(?:我(?:不會|不想|不要|不打算)|不用|不必|不要|別)(?:再|去|先)?(?:問.*?(?:同學|全班|大家)|確認|核對|查證|比對)/.test(n);
 const conditional=item===165&&r.score===4&&/^(?:如果|假如|假設).*?(?:大家|同學).*?(?:看到|看見)/.test(n)&&!/(?:我|我們|老師).*?(?:問|核對|確認|查證)/.test(n);
 const quotedOnly=/^(?:子安|孩子|家長|同學|他|你)(?:剛才|之前|曾經)?說[：:]?[「『“"].+[」』”"](?:而已)?[。！!]?$/s.test(n);
 const refusing=/^(?:我不想回答|不回答|跳過|不知道|不知|無法回答|拒答)[。!！]?$/s.test(n);
 if((negated||conditional||quotedOnly||refusing)&&r.score!==null){r.candidate_score=r.score;r.score=null;r.evidence={};r.needs_review=true;r.response_status='needs_review';r.coding_certainty='low';r.interpretation_status='formal_interpretation_uncertain';r.review_reason=negated?'negated_strategy':conditional?'hypothetical_observation_not_verification':quotedOnly?'quoted_other_speech':'no_observable_response';r.interaction_features.push('semantic_guard:'+r.review_reason);}
 return r;
}
function parentReply(step,text,fallback){
 const n=normalize(text);
 if(step==='AFTER_INITIAL'&&/近況/.test(n)&&/(?:找您|跟您|和您|想|聊)/.test(n)){const r=fallback(step,n.replace(/近況/g,'最近的情況'));return {...r,responding_to:text,semantic_patch:'parent-recent-status-alias-20261004.10'};}
 const lastParent=g.CLASS5_REFERENCE?.state.parent_interaction.history.filter(e=>e.role==='parent').at(-1);
 if(lastParent?.rule_id==='PX_EVENT_REPORT_ACK'&&!/[?？嗎呢]/.test(n)&&/(?:比賽|規則|輸贏|答對|做對|作對)/.test(n))return {text:'謝謝老師說明規則。知道他們那組也答對了，我們也會肯定他的努力。至於他為什麼一直放在心上，我們想再聽他怎麼說，家裡也會留意情緒和作業。',rule_id:'PX_EVENT_CONTINUATION_WITHOUT_REPEAT',trigger_intents:['eventContinuation'],responding_to:text,simulated:true};
 if(/(?:以前|平常|之前|原本|過去).*?(?:也|就|都|會|這樣|如此)|(?:一直|向來).*?(?:這樣|如此)/.test(n)&&/[?？嗎呢]/.test(n))return {text:'平常也會不開心，但通常過一陣子就會去做別的事。這次不太一樣，他這幾天還會反覆提那題的分數，做作業也比平常拖。',rule_id:'PX_PAST_BASELINE_COMPARISON',trigger_intents:['pastBaselineQuestion'],responding_to:text,simulated:true};
 const question=/[?？嗎呢]|有沒有|是否|多久|怎麼|如何/.test(n);
 if(!question&&/上課|學校/.test(n)&&/情緒不好|情緒低落|影響.*上課/.test(n)&&!/(?:不是|沒有)[^，。；]{0,10}(?:情緒(?:不好|低落)|影響)/.test(n))return {text:'謝謝老師說明學校看到的狀況。那次競賽的經過我沒有在現場；我在家看到的是，他這兩天比較悶，會反覆提那題的分數。我們先把兩邊看到的分開說，還不要急著確定原因。',rule_id:'PX_SCHOOL_REPORT_AND_HOME_OBSERVATION',trigger_intents:['schoolObservationReport'],responding_to:text,simulated:true};
 if(question&&/(?:作業|功課)/.test(n)&&!/(?:怎麼陪|怎麼處理|怎麼幫|提醒|方法|有效|平復)/.test(n)){const r=fallback('AFTER_FOLLOW1',n.replace(/家裡|在家|回家/g,''));return {...r,responding_to:text,trigger_intents:['homeworkObservationQuestion'],semantic_patch:'parent-topic-before-action'};}
 if(question&&/(?:心情|情緒|生氣|悶|不開心)/.test(n)&&!/(?:怎麼陪|怎麼處理|怎麼幫|提醒|方法|有效|平復)/.test(n)){const r=fallback('AFTER_FOLLOW1','這兩天情緒怎麼樣？');return {...r,responding_to:text,trigger_intents:['emotionObservationQuestion'],semantic_patch:'parent-topic-before-action'};}
 if(/(?:比賽|搶答|小組|計分|積分|那一分).*?(?:在乎|在意|結果|介意)/.test(n)&&!/[?？嗎呢]/.test(n))return {text:'對，他回家也提到那次搶答，說自己那組也答對了，卻沒有分。我們沒有在現場，還想聽老師看到的情況。',rule_id:'PX_EVENT_REPORT_ACK',trigger_intents:['eventReport'],responding_to:text,simulated:true};
 if(step==='CLOSING'&&/(?:我|老師).*?(?:預計|打算|準備).*?(?:找|跟|和|陪).*?(?:聊|談)/.test(n)&&!/(?:不會|不想|不要|不用|不打算).*?(?:聊|談)/.test(n))return {text:'好，謝謝老師先跟我們說。知道您打算再找子安談，我們也會先聽他說、留意這幾天的情緒和作業，再和老師交換。',rule_id:'PX_TEACHER_PLANNED_TALK',trigger_intents:['futureTeacherTalkPlan'],responding_to:text,planned_action:{kind:'studentTalk',status:'教師提出安排，尚未執行'},simulated:true};
 if(step==='CLOSING'&&/[?？嗎呢]|為什麼|如何|怎麼|有沒有/.test(n)&&/作業|功課|心情|情緒|比賽|計分|積分|公平|在家|家裡/.test(n))return fallback('AFTER_FOLLOW1',text);
 return fallback(step,text);
}
function code166(phase,text,ctx,fallback,base,scored){
 const n=normalize(text),r=fallback(phase,text,ctx);
 if(r.score===null&&worksheetInstruction166(n)&&!inviteTalk166(n)&&!distinguish166(n)&&!inquiry166(n)&&!accompanyWriting166(n)&&!help166(n)&&!r.interaction_features.some(x=>/invalidating|blaming|command_only/.test(x))){
  r.evidence['E166-CR']={code:'E166-CR',status:'context_resolved',supporting_spans:[text,'S166 visible worksheet'],reason:'directs the child to start the current visible worksheet; no continuation of the earlier concern is stated'};r.rubric_mapping={version:'STRATEGY-MAPPING-20261004.12-DEV',strategy:'currentWorksheetInstruction',anchor:'166 current responsibility, one focus',provisional:true};return scored(r,2,'moderate');
 }
 if(r.score===null&&inviteTalk166(n)&&/(?:得分|分數|比賽|困擾|很煩|在意|那天|那題)/.test(n)&&!/(?:事情|感受|覺得|很煩|心裡|不舒服|心情).*?(?:寫下|寫出)|寫.*?(?:事情|感受)/.test(n)){
  r.evidence['E166-PA']={code:'E166-PA',status:'affirmed',supporting_spans:[text],reason:'acknowledges the earlier concern'};r.evidence['E166-PC']={code:'E166-PC',status:'affirmed',supporting_spans:[text],reason:'invites the child to continue expressing the concern; the invitation is not a completed conversation'};r.rubric_mapping={version:'STRATEGY-MAPPING-20261004.12-DEV',strategy:'acknowledgeAndInviteConversation',anchor:'166 teacher retains earlier concern',provisional:true};return scored(r,3,'moderate');
 }

 if(r.score===null&&ctx.post_reveal&&/(?:下課|之後|明天).*?(?:老師|我|我們).*?(?:陪你|跟你|和你).*?(?:聊|談)/.test(n)&&!/(?:不會|不要|不用|不想|如果|假如).*?(?:聊|談)/.test(n)){r.evidence['E166-PC']={code:'E166-PC',status:'affirmed',supporting_spans:[text],reason:'offers a specific later conversation'};r.evidence['E166-PA']={code:'E166-PA',status:'context_resolved',supporting_spans:['L3-166 immediate context'],reason:'earlier concern is recoverable from the just-shown common information'};r.rubric_mapping={version:'STRATEGY-MAPPING-20261004.12-DEV',strategy:'laterConversationInContext',anchor:'166 teacher retains earlier concern',provisional:true};return scored(r,3,'moderate');}
 if((r.score===null||r.score===2)&&!r.interaction_features.some(x=>/invalidating|command_only|blaming/.test(x))){
  const strategy=inquiry166(n)?'reasonInquiry':(help166(n)||accompanyWriting166(n))?'offerHelp':reframe166(n)?'learningValueReframe':null;
  if(strategy){const x=base(166,phase,text),code=strategy==='reasonInquiry'?'E166-ER':strategy==='offerHelp'?'E166-AS':'E166-LV';x.evidence={...r.evidence};if(strategy==='offerHelp'&&/(?:練習|學習單|作業).*?(?:寫|做|完成)/.test(n)&&!/下課|明天|之後/.test(n))x.evidence['E166-CR']={code:'E166-CR',status:'affirmed',supporting_spans:[text],reason:'explicitly names the current learning work alongside the offered assistance'};if(strategy==='reasonInquiry'&&accompanyWriting166(n))x.evidence['E166-AS']={code:'E166-AS',status:'affirmed',supporting_spans:[text],reason:'also explicitly offers accompaniment with the current worksheet'};x.evidence[code]={code,status:'affirmed',supporting_spans:[text],reason:strategy==='reasonInquiry'?'asks about the reason for current refusal, without assuming ability or emotion':strategy==='offerHelp'?'offers help with the current difficulty; no explicit two-issue plan':'redirects attention to learning value; no explicit inquiry or two-issue plan'};x.semantic_patch='strategy-166-response-20261004.9';x.rubric_mapping={version:'STRATEGY-MAPPING-20261004.12-DEV',strategy,anchor:strategy==='reasonInquiry'?'166 exploratory response':'166 one-focus response',provisional:true};return scored(x,strategy==='reasonInquiry'?3:2,'moderate');}
 }
 // Exact, observed language extensions; no inferred actions or hidden context.
 if(r.score===null&&/(?:事情|感受|覺得|很煩|心裡|不舒服|心情).*?(?:寫下|寫出)|寫.*?(?:事情|感受)/.test(n)&&!/(?:不要|不用|不必).*?(?:寫下|寫出)/.test(n)){r.evidence['E166-ES']={code:'E166-ES',status:'affirmed',supporting_spans:[text],reason:'offers written expression of the student concern'};r.review_reason='written_expression_support_unmapped';r.semantic_patch='trace-166-written-expression';}
 if(r.score===1||r.interaction_features.some(x=>/invalidating|command_only/.test(x)))return r;
 const prior=/那天(?:的)?(?:事情|事)|那次|那件事|比賽|計分|積分|得分|之前/.test(n)||!!ctx.two_sided||!!ctx.post_reveal;
 const talk=/(?:我|我們|老師).*?(?:會|可以|願意|跟你).*?(?:談|聊)|(?:再|好好|繼續).*?(?:聊|談)/.test(n)&&!/(?:不會|不想|不要|不用).*?(?:聊|談)/.test(n);
 const duty=/(?:現在|今天|作業).*?(?:應該|該|要|先|完成|做的)/.test(n);
 const distinction=/(?:跟|和|與)作業無關|作業是(?:另|另外)一件|兩件事|兩回事|分開|不一樣的(?:事情|事)|不同的(?:事情|事)/.test(n);
 const contrast=/(?:但|可是|不過).*?(?:現在|今天|作業)/.test(n);
 if((r.score===null||r.score===2)&&prior&&distinction&&!/(?:不要|不能|不應|不必|別)[^，。]{0,12}(?:分開|區分)/.test(n)){r.evidence['E166-BI']={code:'E166-BI',status:'context_resolved',supporting_spans:[text],reason:'states separation of the two concerns in the shown context; concrete follow-through remains unspecified'};r.semantic_patch='trace-166-partial-separation';if(r.score===2){r.candidate_score=2;r.score=null;r.needs_review=true;r.response_status='needs_review';r.coding_certainty='low';r.interpretation_status='formal_interpretation_uncertain';r.review_reason='boundary_without_follow_through_unmapped';}}

 if(prior&&talk&&duty&&(distinction||contrast)&&r.score!==4){
  const x=base(166,phase,text);x.evidence={...r.evidence,
   'E166-PA':{code:'E166-PA',status:/那天|那次|那件事|比賽|積分|計分|之前/.test(n)?'affirmed':'context_resolved',supporting_spans:[text],reason:'retains the earlier concern in the shown context'},
   'E166-PC':{code:'E166-PC',status:'affirmed',supporting_spans:[text],reason:'explicitly keeps conversation available'},
   'E166-CR':{code:'E166-CR',status:'affirmed',supporting_spans:[text],reason:'names the current learning responsibility'},
   'E166-BI':{code:'E166-BI',status:'affirmed',supporting_spans:[text],reason:distinction?'explicitly separates conversation from homework':'contrasts the prior concern with the current responsibility'}};
  x.semantic_patch='observed-166-boundary-language';return scored(x,distinction?4:3,'moderate');
 }
 if((r.score===null||r.score===2)&&distinguish166(n)&&duty166(n)&&!inviteTalk166(n)){
  r.evidence['E166-BI']={code:'E166-BI',status:'context_resolved',supporting_spans:[text],reason:'separates the two concerns in the visible context'};r.evidence['E166-CR']={code:'E166-CR',status:'affirmed',supporting_spans:[text],reason:'requires completion of current work; follow-through on the earlier concern is unspecified'};r.rubric_mapping={version:'STRATEGY-MAPPING-20261004.12-DEV',strategy:'boundaryAndCurrentDuty',anchor:'166 one-focus response without concrete follow-through',provisional:true};return scored(r,2,'moderate');
 }
 if((r.score===null||r.score===2)&&/(?:一起|先).*?(?:練習|學習單).*?(?:寫|完成)|把(?:練習|學習單).*?(?:寫完|完成)/.test(n)&&!/(?:不要|不用|不必|不會).*?(?:寫|完成)/.test(n)){r.evidence['E166-CR']={code:'E166-CR',status:'affirmed',supporting_spans:[text],reason:'names current worksheet responsibility without inventing continuation of the earlier concern'};r.semantic_patch='worksheet-current-task-20261004.8';}
 return r;
}
function code167(phase,text,fallback,base,scored){
 const n=normalize(text),r=fallback(phase,text);
 if(r.score===null&&/(?:子安|孩子|他)(?:的)?近況/.test(n)&&/(?:找您|跟您|和您|想).*?(?:聊|談|聯繫|聯絡)/.test(n)&&!/(?:不想|不要|不用|不會|如果|假如)/.test(n)){const x=base(167,phase,text);x.evidence['E167-RO']={code:'E167-RO',status:'affirmed',supporting_spans:[text],reason:'collaborative recent-status opening; child pronoun resolves to the visible parent call topic'};x.rubric_mapping={version:'STRATEGY-MAPPING-20261004.11-DEV',strategy:'recentStatusOpening',anchor:'167 recent contextual opening',provisional:true};return scored(x,3,'moderate');}
 if(r.score!==null)return r;
 if(/(?:子安|孩子).*?(?:最近|這幾天).*?(?:在意|在乎|放不下).*?(?:小組|輸贏|比賽|計分|積分)/.test(n)){const x=base(167,phase,text);x.evidence['E167-SF']={code:'E167-SF',status:'affirmed',supporting_spans:[text],reason:'opens around a recent competition concern without broader school observations'};x.semantic_patch='trace-167-event-opening';return scored(x,2,'moderate');}
 if(/(?:子安|孩子).*?(?:最近|這幾天).*?(?:低落|悶|煩|專注|拖延|不耐煩|不配合)/.test(n)&&/(?:上課|作業|學校)/.test(n)&&!/(?:不是|沒有|假如|如果)/.test(n)){
  const x=base(167,phase,text);x.evidence['E167-RC']={code:'E167-RC',status:'affirmed',supporting_spans:[text],reason:'introduces concrete recent school observations in the parent opening'};x.semantic_patch='observed-167-school-report-opening';return scored(x,3,'moderate');
 }
 return r;
}
function showPeer(A,text){
 A.showStudent(text,true);document.querySelector('#studentBubble .who').textContent='佳恩';A.els.zian.classList.remove('speaking');
 const peer=document.getElementById('peerA');if(!A.state.motion_paused&&!matchMedia('(prefers-reduced-motion: reduce)').matches){peer.classList.add('speaking');setTimeout(()=>peer.classList.remove('speaking'),2400);}A.log('classmate_line_presented',{who:'佳恩',text});
}
function support(A,id,text,extra={}){
 const frame={lastQuestion:({M01:'classWhatNow',T01:'none',C01:'colleagueWhichObservation'})[id],shown:['scoreDispute','classResponsibility'],hePool:['子安'],history:id==='C01'?(A.state.colleague_interaction?.history||[]):[]};
 const r=C5_REFINE.repairSupport(A,id,text,SJT.engine.analyze({decision:id,text:normalize(text),frame}));
 const e={id:A.sessionId+'-SUP'+(A.state.supportEvents.length+1),decision:id,raw:text,at:A.t(),evaluation:r,prompted:false,...extra};
 A.state.supportEvents.push(e);A.log('supporting_response',{decision:id,source_id:e.id,raw:text,prompted:e.prompted});return e;
}
function gesture(A,id,cls='reaching'){
 const el=document.getElementById(id);if(!el||A.state.motion_paused||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 el.classList.remove(cls);void el.getBoundingClientRect();el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),1400);
}
function beginM01(A){
 A.setPhase('M01_CLASSROOM','POST_STORY_FREE',46);showPeer(A,'老師，大家的小白板收好了。我們接下來先做哪一題？');
 A.responseUI({title:'全班接下來怎麼開始？',sub:'子安站在旁邊，其他同學也在等著。你會怎麼安排眼前的課堂？',onSend:text=>{
  const e=support(A,'M01',text);document.querySelector('#studentBubble .who').textContent='子安';
  let reply='老師，下一步要做什麼？';
  if(has(e.evaluation,'classTask')){for(const id of ['peerA','peerB','peerC','peerD'])gesture(A,id,'writing');const page=/翻|下一頁|下頁/.test(normalize(text));if(page&&!A.state.motion_paused&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const paper=document.getElementById('peerAPaper');paper?.animate([{transform:'scaleX(1)'},{transform:'scaleX(.08)',offset:.5},{transform:'scaleX(1)'}],{duration:1200});A.log('class_page_turned',{sourceId:e.id,raw:text,simulated:true});}reply=page?'好，大家翻到下一頁！我翻好了，等大家一起。':/下[一ㄧ]題/.test(normalize(text))?'好，大家看下一題！':'好，我們先照老師剛才的安排開始。';}
  e.evaluation.response={...e.evaluation.response,text:reply,responseType:'simulatedClassmateReply',sourceVersion:'CLASSROOM-20261004.11'};showPeer(A,reply);
  A.state.classroom_recovery='free-response';A.dock('<div class="dock-title">安排已留下來</div><div class="dock-sub">'+A.esc(text)+'</div><div class="actions"><button class="btn primary" id="m01Go">繼續故事</button></div>');document.getElementById('m01Go').onclick=()=>finishM01(A,e);
 }});
 const choices=document.createElement('div');choices.className='recovery-options';choices.innerHTML='<details><summary>也可沿用原版的課堂安排選擇</summary><div class="choice-grid">'+[['resume','稍後再處理，先回到複習'],['rules','簡短說明規則再繼續'],['individual','暫停積分，改個別練習'],['switch','結束活動，換下一個安排']].map(([id,t])=>'<button class="choice-card" data-r="'+id+'">'+t+'</button>').join('')+'</div></details>';A.els.dock.append(choices);
 choices.querySelectorAll('button').forEach(b=>b.onclick=()=>{A.state.classroom_recovery=b.dataset.r;const e=support(A,'M01',b.textContent,{prompted:true,choice:b.dataset.r});finishM01(A,e);});
}
function finishM01(A,e){
 document.querySelector('#studentBubble .who').textContent='子安';
 const n=normalize(e.raw),recess=good(e.evaluation).some(a=>['askStudent','laterDiscussion'].includes(a.act)&&a.time==='recess')||(/下課.*?(?:我|我們|老師).*?(?:談|聊)/.test(n)&&!/(?:不會|不想|不用|不要|如果|假如|以前|已經).*?(?:談|聊)/.test(n));
 if(!recess)return A.transition('同一週','幾天後','教室又進入平常的課堂節奏。',A.begin166);
 A.state.supportCommitments.push({sourceId:e.id,kind:'studentTalk',time:'星期二・下課',status:'待執行'});
 A.transition('星期二・下課','承接你的安排','子安在桌邊等你。',()=>{
  A.setPhase('M01_RECESS','POST_STORY_FREE',48);A.showStudent('老師，現在下課了。我還想把剛剛那題說清楚。',true);
  A.responseUI({title:'你會如何接這段談話？',sub:'續談另存，不改寫原題首次回應。',onSend:text=>{
   const r=A.code(165,'CONTINUATION',text);A.state.supportEvents.push({id:A.sessionId+'-SUP'+(A.state.supportEvents.length+1),decision:'S165_CONTINUATION',raw:text,evaluation:r,prompted:false});
   const c=A.state.supportCommitments.at(-1);if(r.score!=null&&!/下次|明天|以後|之後|不會|不要|不想/.test(normalize(text)))c.status='已承接談話';
   A.showStudent(studentReply(165,text,c.status==='已承接談話'?'嗯，謝謝老師聽我說。這件事我還會想一想。':'好，我記得你的安排。',A.state),true);
   A.dock('<div class="dock-title">這段談話已保留</div><div class="actions"><button class="btn primary" id="recessGo">繼續故事</button></div>');document.getElementById('recessGo').onclick=()=>A.transition('同一週','幾天後','教室又進入平常的課堂節奏。',A.begin166);
  }});
 });
}
function teachingBridge(A){
 A.setPhase('TEACHING_BRANCH','POST_STORY_FREE',77);
 A.narration('你把談話接回這節數學課的學習單。子安選了答案，「理由」那格還空著。','談話之後');
 A.els.studentBubble.classList.remove('show');
 const last=A.state.items[166].records.at(-1);
 if(last)A.showStudent(A.contextualReply166(last.text,{level:'POST'}),true);
 A.dock('<div class="dock-title">他現在卡在哪裡？</div><div class="dock-sub">他面前仍是這節課的學習單。先了解如何起步，再決定需要什麼支持。</div><div class="choice-grid"><button class="choice-card" id="takeTeaching">留在桌邊，了解卡住的地方</button><button class="choice-card" id="skipTeaching">先安排他開始，照看全班</button></div>');
 document.getElementById('takeTeaching').onclick=()=>{A.log('branch_selected',{branch:'learningObservation',choice:'enter',prompted:true});beginTeaching(A)};
 document.getElementById('skipTeaching').onclick=()=>{A.log('branch_selected',{branch:'learningObservation',choice:'skip',prompted:true});A.state.teaching={scenario:'fraction-worksheet-v4',version:C5_WORKSHEET.VERSION,skipped:true,childEvents:[],status:'未進入觀察'};leaveTeaching(A)};
}
function worksheetHelpers(){return {support,has,gesture,normalize,interpretLearning,leaveTeaching};}
function beginTeaching(A){return C5_WORKSHEET.begin(A,worksheetHelpers());}
function leaveTeaching(A){
 document.getElementById('learningCard')?.remove();document.getElementById('teachingDesk')?.remove();A.els.stage.classList.remove('teaching-scene');
 A.transition('下課時間','自然科老師叫住你','你也想比對不同課堂的觀察。',A.beginColleague);
}
function learningMoves(text){return C5_WORKSHEET.moves(normalize(text));}
function learningProbe(A,kind,text=''){return C5_WORKSHEET.probe(A,worksheetHelpers(),kind,text);}
function interpretLearning(text,event){
 const n=normalize(text),hedge=/可能|也許|不一定|不能|不代表|還需|還要|再觀察|再確認|先不|先保留|尚未/.test(n);
 if(event&&event.childEvent.answer==='none'&&hedge)return {adequacy:'適切',cause:'保留尚未取得完整學習單表現的限制',inScope:true,rule:'learning.incompleteObservation'};
 if(!event||event.childEvent.answer==='none')return {adequacy:'需另行複核',cause:'尚未取得可核對的學習單表現',inScope:true,rule:'learning.missingPerformance'};
 if(!hedge&&/就是情緒|純粹情緒|只(?:是|有)情緒|都會|全部都會|全都會|根本不會|完全不會|故意|偷懶|擺爛/.test(n))return {adequacy:'不適切',cause:'單一步驟與孩子自述不足以支持全稱能力或單一原因判定',inScope:true,rule:'learning.overclaim'};
 if(event.childEvent.sawDemo&&!hedge&&/自己會|自己懂|已經會|懂了|會了/.test(n))return {adequacy:'不適切',cause:'看過示範後的表現不能當成獨立理解',inScope:true,rule:'learning.promptedPerformance'};
 if(hedge&&/觀察|確認|小題|口頭|示範|感受|情緒|學習|作業|還/.test(n))return {adequacy:'適切',cause:'保留觀察範圍與尚待確認的事',inScope:true,rule:'learning.boundedObservation'};
 return {adequacy:'未提出解讀',cause:'已保留教學安排，未據此推定原因或整體能力',inScope:true,rule:'learning.actionOnly'};
}
function teachingClose(A,reason,text=null){return C5_WORKSHEET.close(A,worksheetHelpers(),reason,text);}
function extendColleague(A){return C5_REFINE.beginColleague(A,{support,good,has,normalize,gesture});}
function responseEvidence(A,r,label){
 if(!r)return '';
 const labels={'E165-GL':'一般釐清','E165-DC':'具體爭議','E165-VE':'核對事件','E165-GE':'輸贏或態度','E165-UA':'未查證即判定結果','E165-PH':'轉交家長','E165-PU':'懲戒回應','E166-TO':'教師承接','E166-CR':'眼前責任','E166-PA':'先前疑慮','E166-PC':'保留續談','E166-BI':'區分兩件事','E166-ER':'探問原因','E166-ES':'提供書面表達感受','E167-FC':'事件與近期脈絡','E167-RC':'近期具體觀察','E167-SF':'單一事件','E167-RF':'先談紀錄','E167-BL':'責備開場'};
 Object.assign(labels,{'E165-RX':'說明競賽規則','E166-AS':'提供眼前協助','E166-LV':'轉向學習價值','E167-RO':'邀請討論孩子近況'});
 const matched=Object.keys(r.evidence).map(x=>labels[x]||x).join('、');
 const evidence=r.needs_review?(r.user_confirmed===false?'玩家更正了本機理解，保留待檢核':(matched?matched+'；尚需人工判定層級':'尚不足以作單一判讀')):matched;
 const reasons={'E165-RX':'你說明了搶答或計分規則；這句尚未追問孩子在意的地方，也未提出查證。','E166-ER':'你先問不想寫或持續在意的原因，沒有直接替孩子斷定原因。','E166-AS':'你提供協助；這句還沒有說明如何承接先前疑慮與目前學習。','E166-LV':'你把焦點轉向學習收穫；這句尚未進一步了解他在意的原因。','E166-CR':'你指出眼前的學習責任；單獨這一點不代表已承接先前疑慮。'};
 const key=['E165-RX','E166-ER','E166-AS','E166-LV',...(r.score===2?['E166-CR']:[])].find(x=>r.evidence[x]);
 const detail=!r.needs_review&&key?reasons[key]:'';
 return '<div class="response-evidence"><small>'+label+'</small><blockquote>'+A.esc(r.raw_text)+'</blockquote><p>'+A.esc(evidence)+'</p>'+(detail?'<p>'+A.esc(detail)+'</p>':'')+'</div>';
}
function resultPanel(A){
 const s=A.state,rows=s.supportEvents;
 const primary=s.items;const count=(id)=>rows.filter(e=>e.decision===id).length;
 return '<section class="support-results"><h2>五向度・這次留下的證據</h2><div class="dimension-cards">'+[['學生輔導',(primary[165].records.length+primary[166].records.length)+' 次原題回應'],['班級經營',count('M01')+' 次課堂安排'],['教師教學',count('T01')+' 次教師回應；'+(s.teaching?.childEvents.length||0)+' 筆模擬孩子表現'],['同儕互動',count('C01')+' 次校內交流'],['親師溝通',primary[167].records.length+' 次原題回應；'+s.parent_interaction.history.filter(e=>e.role==='teacher').length+' 次通話回應']].map(([dim,n])=>'<article><h3>'+dim+'</h3><p>'+n+'</p></article>').join('')+'</div><p class="material-note">數量代表可回查的歷程，不是能力成績。支持情境不改寫三題原始判讀，不合成總分。</p><details><summary>查看支持情境的原話與來源</summary>'+rows.map(e=>'<article class="support-record"><small>'+A.esc(e.decision)+(e.prompted?' · 看過選項':' · 自由回應')+'</small><blockquote>'+A.esc(e.raw)+'</blockquote><small>'+A.esc(e.evaluation.state||e.evaluation.response_status||'已保留')+(e.childEventRef?' · 孩子表現來源 '+A.esc(e.childEventRef):'')+'</small>'+(e.teachingInterpretation?'<p>教學解讀：'+A.esc(e.teachingInterpretation.adequacy)+' · '+A.esc(e.teachingInterpretation.cause||'')+'</p>':'')+'</article>').join('')+'</details>'+(s.teaching?.childEvents?.length?'<details><summary>查看孩子的模擬表現與提示來源</summary>'+s.teaching.childEvents.map(e=>'<article class="support-record"><small>'+A.esc(e.id)+' · '+(e.childEvent.sawDemo?'看過老師示範':'未看過老師示範')+'</small><blockquote>'+A.esc(e.text)+'</blockquote><small>作答：'+A.esc(e.childEvent.answer)+' · 理由：'+A.esc(e.childEvent.reason)+' · 情境模擬</small></article>').join('')+'</details>':'')+'</section>';
}
function positionBubbles(A){
 const stage=A.els.stage,rect=stage.getBoundingClientRect();if(!rect.width||stage.classList.contains('phone-scene'))return;
 const narrow=rect.width<600;
 for(const [bubble,actor] of [[A.els.studentBubble,document.querySelector('#studentBubble .who').textContent==='佳恩'?A.els.peerA:A.els.zian],[A.els.teacherBubble,A.els.teacher],[A.els.colleagueBubble,A.els.subjectTeacher]]){
  if(!bubble?.classList.contains('show')||!actor)continue;
  const head=actor.querySelector('.head')||actor,ar=head.getBoundingClientRect(),width=Math.min(rect.width*(narrow?.76:.48),420);bubble.style.setProperty('--speech-w',width+'px');
  const minX=rect.width*.30,x=Math.max(minX,Math.min(rect.width-width-10,ar.left-rect.left+ar.width*.5-width*.25)),y=Math.max(45,Math.min(rect.height-bubble.offsetHeight-46,ar.top-rect.top-bubble.offsetHeight-9));
  bubble.style.setProperty('--speech-x',Math.max(8,Math.min(rect.width-width-8,x))+'px');bubble.style.setProperty('--speech-y',y+'px');
 }
}
function installStage(A){
 document.getElementById('planePlay').onclick=()=>A.interact('紙飛機','佳恩：「飛得再遠，也交不了作業。」',()=>A.throwPaperPlane(true));
 document.getElementById('birdPlay').onclick=()=>A.interact('窗邊小鳥','窗邊來了一位沒有學號的旁聽生。',()=>A.birdVisit(true));
 document.getElementById('curtainPlay').onclick=()=>document.getElementById('curtainHotspot').dispatchEvent(new Event('click'));
 document.querySelectorAll('#world [role="button"]').forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.dispatchEvent(new Event('click'))}}));
 new ResizeObserver(()=>positionBubbles(A)).observe(A.els.stage);
}
g.C5_EXT={expressed,resolve166,answerConcern,positionBubbles,installStage,learningProbe,learningMoves,interpretLearning,responseEvidence,code165,formalGuard,studentReply,parentReply,code166,code167,beginM01,teachingBridge,beginTeaching,extendColleague,resultPanel,gesture};
})(globalThis);
