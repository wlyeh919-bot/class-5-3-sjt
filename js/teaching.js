/* T01 教學解讀適切性（封閉規則版，第一階段測試台）
 * 規格依據：第 T01 節〈教師教學判讀〉＋第 18 節驗收：封閉情境只有兩題
 *   3/4 對 5/8（等長整體，通分八等份：6/8 > 5/8）、遷移 5/6 對 7/9（十八等份：15/18 > 14/18）。
 * 本模組只回答「老師對孩子表現的解讀」與「孩子表現事件」是否相稱；動作／策略事件辨認由 engine.js 的 T01 詞庫負責，兩者分開報告。
 * 輸入的 childEvent 由系統事件記錄提供（不從老師原話猜）：{mode, answer, reason, sawDemo, hinted}。
 * 輸出 adequacy：適切｜不適切｜未提出解讀｜需另行複核；規則範圍外一律需另行複核，並標 inScope:false（＝實作缺口，不當成功能完成）。
 */
(function (root) {
  'use strict';
  const SJT = root.SJT = root.SJT || {};
  const R = s => new RegExp(s);

  // ---------- 老師原話中的「主張」 ----------
  const CLAIMS = [
    // 對孩子下的負面全稱診斷
    { t: 'N', re: R('(?:整個|全部|根本|完全|什麼都|連最基本的?)(?:分數)?(?:的?概念)?(?:都)?(?:沒有|不懂|不會)|從頭教|整個分數都不懂|分數(?:都|全)不(?:懂|會)') },
    { t: 'N', re: R('(?:他|你|這孩子)(?:根本|就是)?(?:不懂|不會)分數') },
    // 特質／長期推論
    { t: 'T', re: R('以後(?:分數)?(?:都)?不用擔心|數學很強|數學很好|(?:天生|本來就)(?:很)?(?:聰明|會)|每次都(?:這樣|是這樣)|總是這樣|一直都這樣|都是這樣') },
    // 遷移／進度過度推論
    { t: 'TR', re: R('(?:一定|肯定|也)會(?:通分)?[^，。；！？]{0,6}不用再(?:測|檢核|試)|直接(?:下一單元|進(?:入)?異分母|進度|往下)|可以進(?:入)?異分母|進異分母|直接進入') },
    // 否定「不會」＝斷言他會／斷言原因
    { t: 'K', re: R('不是(?:他)?不會，?只是|不是不會|他其實(?:都)?會|他(?:本來|其實)就會') },
    // 對不可觀察原因的斷言／推測（拒答時）
    { t: 'REFUSE_MISREAD', re: R('不想寫就是不會|不寫就是不會|(?:故意|在鬧|態度不好|擺爛|偷懶)') },
    { t: 'EXT', re: R('(?:家裡|心情|情緒|睡眠|身體)(?:可能|應該|大概)?[^，。；！？]{0,6}(?:有事|不好|沒調整|問題|不舒服)') },
    // 「懂了／會了／維持」之類的理解結論
    { t: 'U', re: R('(?:他|你|這題他|這邊他)?(?:自己)?(?:已經|就)?(?:懂了|會了|是會的|真的(?:理解|會|懂)|是真的理解|理解了|掌握了|已經會|沒問題|完全沒問題|都會了)|(?:我|這邊)?(?:不用|不必|沒有)(?:再)?(?:教|追加教學|補教)|(?:什麼都)?不用再做|維持原本(?:進度|課程)|已掌握') },
    // 具體迷思診斷
    { t: 'MIS_NUM', re: R('(?:只看|看的是|看(?:到)?|因為|就是|是覺得)?[^，。；！？]{0,6}分子(?:大|比較大|越大|愈大)?[^，。；！？]{0,6}(?:就|所以)?(?:選|覺得|比較|算)?(?:分子)?[^，。；！？]{0,4}(?:大|較大)|只看(?:上面|分子)|7 ?比 ?5 ?大|5 ?比 ?3 ?大|只看上面的數字') },
    { t: 'MIS_DEN', re: R('分母(?:大|越大|愈大|比較大)[^，。；！？]{0,6}(?:就|所以)?(?:大|較大|覺得大)|覺得分母大就大|只看分母|分母小[^，。；！？]{0,8}(?:一份|每一份)[^，。；！？]{0,3}(?:比較)?大') },
    // 正確的數學說明（描述事件或講道理）
    { t: 'MATH_COMMON', re: R('通分|換成(?:八|8|十八|18)|6\\/8|15\\/18|14\\/18|八等份|十八等份|切成八份|分成八|四份切半|一樣的分母|同分母') },
    { t: 'MATH_EQUAL', re: R('(?:整體|兩條|兩個)[^，。；！？]{0,5}(?:一樣|同樣)(?:大|長)|(?:一樣|同樣)(?:大|長)的(?:整體|紙條|兩條)|等長|畫成一樣長|畫一樣長|要一樣大') },
    { t: 'MATH_DENOM_RULE', re: R('分母愈大[^，。；！？]{0,3}每一份愈小|分母越大[^，。；！？]{0,3}每一份越小|每一份(?:愈|越)小') },
    // 數學錯誤的背書（老師把錯誤規則當對的）
    { t: 'MATH_ENDORSE_WRONG', re: R('(?<!覺得|以為|認為|是|想)(?:分子大分數就大|分子大就大|分母大就大)|想法其實沒什麼問題|他的想法沒(?:什麼)?問題|沒什麼問題啊') },
    // 保留／證據不足／有支援
    { t: 'HEDGE', re: R('先不(?:下結論|判斷)|還(?:不能|不太能|看不出|不確定|沒辦法)|不能算(?:他)?自己|不算(?:他)?自己的|還不算|沒有拿到|尚未|有支援的表現|記成有支援|有支援|等(?:他)?(?:講完|做完|再說)|再(?:確認|看看|檢核|核對)|可能|或許|也許|不一定|不能證明|只表示') },
    { t: 'SUPPORT_REC', re: R('提醒(?:了)?才|提示(?:之後|後|了)?(?:才)?|有支援|照我寫的|沿著我|是我(?:塗|寫|示範)') },
    { t: 'ASK_EVIDENCE', re: R('(?:說說看|講講看|怎麼想|怎麼選|為什麼|理由)') },
    // 理論／其他算法／其他學習特質（範圍外）
    { t: 'FREE', re: R('皮亞傑|具體運思|認知(?:發展|理論)|學習風格|視覺空間|空間型|小數|百分比|數感|多元智能|建構主義|鷹架|近側發展|動機理論') }
  ];

  // 嘗試把原話切成句，標出每一個主張出現的位置
  function extract(text) {
    const claims = [];
    for (const c of CLAIMS) {
      const re = new RegExp(c.re.source, 'g'); let m;
      while ((m = re.exec(text))) { if (m[0] === '') { re.lastIndex++; continue; } claims.push({ t: c.t, src: m[0], at: m.index }); }
    }
    return claims;
  }

  // 否定／條件的處理：『如果…我才會說他懂』『不是…』會讓緊鄰的 U 主張變成條件，不算斷言
  function conditionalAround(text, at) {
    const pre = text.slice(Math.max(0, at - 14), at);
    const post = text.slice(at, at + 10);
    return /如果|要是|若|除非|才會說|才算|才能說|才敢說/.test(pre + post);
  }
  function negatedAround(text, at, src) {
    const pre = text.slice(Math.max(0, at - 4), at);
    return /(?:還?不能說|不是說|不代表|並不是|沒辦法說|不能說)[^，。]{0,3}$/.test(pre) || /^(?:還不|不算)/.test(src);
  }

  // ---------- 孩子表現事件 → 證據強度 ----------
  function evidenceOf(ev) {
    ev = ev || {};
    const reasonValid = ['commonDenom', 'equalWhole'].includes(ev.reason);
    const supported = ev.mode === 'supported' || !!ev.sawDemo || !!ev.hinted;
    const strongCorrect = ev.mode === 'independent' && ev.answer === 'correct' && reasonValid && !supported;
    return { reasonValid, supported, strongCorrect, correct: ev.answer === 'correct', wrong: ev.answer === 'wrong', none: ev.mode === 'none' || ev.answer === 'none' || !ev.answer };
  }

  function interpret(input) {
    const text = String(input.text || '').trim();
    const ev = input.childEvent || {};
    const E = evidenceOf(ev);
    const all = extract(text);
    const claims = all.map(c => ({ ...c, cond: conditionalAround(text, c.at), neg: (['U','MIS_NUM','MIS_DEN','N','T','TR'].includes(c.t)) && negatedAround(text, c.at, c.src) }));
    const live = t => claims.filter(c => c.t === t && !c.cond && !c.neg);
    const has = t => live(t).length > 0;
    const out = { claims: claims.map(c => ({ t: c.t, src: c.src, cond: c.cond, neg: c.neg })), adequacy: null, cause: null, inScope: true, rule: null };
    const done = (adequacy, cause, rule, inScope) => { out.adequacy = adequacy; out.cause = cause; out.rule = rule; if (inScope === false) out.inScope = false; return out; };

    if (!text) return done('未提出解讀', 'blank', 'i.blank');

    // 沒有可核對的孩子事件，不能把老師的主張自動判成適切或不適切。
    if (!['independent', 'supported', 'none'].includes(ev.mode) || !['correct', 'wrong', 'none'].includes(ev.answer) || !ev.reason) return done('需另行複核', 'missingChildEvent', 'i.event.missing', false);

    // 1) 範圍外：理論、其他算法、外部原因（有保留語氣的外部歸因）。先看，避免被後面的規則誤吃
    if (has('FREE')) return done('需另行複核', 'outOfScope', 'i.free', false);
    if (has('EXT') && E.none && !has('K') && !has('REFUSE_MISREAD')) return done('需另行複核', 'outOfScope', 'i.ext', false);

    // 2) 明確不適切
    if (has('MATH_ENDORSE_WRONG')) return done('不適切', 'mathError', 'i.math.endorse');
    if (has('K') && E.none) return done('不適切', 'overclaimKnows', 'i.K.refusal');
    if (has('REFUSE_MISREAD')) return done('不適切', 'refusalMisread', 'i.refuse.misread');
    if (has('EXT') && E.none) return done('不適切', 'overclaimCause', 'i.ext.assert');
    if (has('N')) return done('不適切', 'overclaimNotKnow', 'i.N');
    if (has('TR')) return done('不適切', 'overclaimTransfer', 'i.TR');
    if (has('T')) {
      // 『他每次都只看上面的數字』是跨次推論；若是具體迷思描述且僅說這次，不在此條
      return done('不適切', 'overgeneralizeBeyondEvidence', 'i.T');
    }

    // 3) 有保留／承認證據限制 → 與事件相稱即適切
    const hedged = has('HEDGE');
    const asksMore = has('ASK_EVIDENCE');
    const uClaims = live('U');
    if (uClaims.length) {
      if (E.strongCorrect) return done('適切', 'evidenceCited', 'i.U.strong');
      // 別句的「可能／再確認」不能洗掉眼前未有依據的理解斷言。
      if (hedged) return done('需另行複核', 'claimScopeUnresolved', 'i.U.hedged.scope', false);
      if (E.supported && ev.mode !== 'none') return done('不適切', ev.hinted && !ev.sawDemo ? 'ignoresHint' : 'supportedAsIndependent', 'i.U.supported');
      if (E.none) return done('不適切', 'nodAsUnderstanding', 'i.U.noEvidence');
      return done('不適切', E.correct ? 'guessAsKnow' : 'overclaimUnderstood', 'i.U.weak');
    }

    // 4) 具體迷思診斷：只在事件理由吻合時適切
    const misNum = has('MIS_NUM'), misDen = has('MIS_DEN');
    if (misNum || misDen) {
      const matches = (misNum && ev.reason === 'numeratorOnly') || (misDen && ev.reason === 'denominatorOnly');
      if (matches || hedged) return done('適切', 'evidenceCited', 'i.mis.match');
      return done('不適切', 'specificMisconceptionNoEvidence', 'i.mis.nomatch');
    }

    // 5) 描述性的正確數學說明：需與事件吻合（老師說的事實不得與紀錄不符）
    const mc = has('MATH_COMMON'), me = has('MATH_EQUAL'), md = has('MATH_DENOM_RULE');
    if (md) return done('適切', 'evidenceCited', 'i.math.denomRule');
    if (mc || me) {
      const reasonOK = (mc && ['commonDenom'].includes(ev.reason)) || (me && ['equalWhole', 'commonDenom', 'other'].includes(ev.reason));
      if (reasonOK || hedged) return done('適切', 'evidenceCited', 'i.math.match');
      return done('不適切', 'factMismatch', 'i.math.mismatch');
    }

    // 6) 只有保留／只記錄、沒有其他主張
    if (hedged && (E.none || !E.strongCorrect)) return done('適切', E.none ? 'noEvidenceRecorded' : 'hedgedAndChecks', 'i.hedge.only');
    if (hedged) return done('適切', 'hedgedAndChecks', 'i.hedge.only2');

    // 7) 沒有任何解讀：只有動作（請孩子說明、出新題、調整形式）
    const actionish = /(?:你|請|讓他|請他|讓你)?[^，。]{0,10}(?:試試看|說說看|講講看|畫(?:看看|一次)|用說的|做做看|寫給我|再(?:出|做)|換(?:你|這題)|請全班|小白板|先(?:畫|寫|說|試))/.test(text);
    if (actionish || asksMore) return done('未提出解讀', 'noInterpretation', 'i.action.only');

    // 8) 其餘：規則沒涵蓋 → 需另行複核（實作缺口）
    return done('需另行複核', 'noRule', 'i.fallback', false);
  }

  function level(r, eventActs, childEvent) {
    // 新編錨點的程式化對應（僅示範，不在第一階段驗收）：適切性不明或範圍外 → 不給等級
    if (!r || r.adequacy === '需另行複核') return null;
    // 動作辨認可能只是教師計畫；缺少實際孩子事件時，不生成示範等級。
    if (!childEvent || !['independent', 'supported', 'none'].includes(childEvent.mode)) return null;
    if (r.adequacy === '不適切') return r.cause === 'overclaimNotKnow' || r.cause === 'refusalMisread' ? 1 : 2;
    if (r.adequacy === '未提出解讀') return 2;
    const hasCheck = (eventActs || []).some(a => ['askChildExplain', 'selfCheckItem', 'classCheck'].includes(a));
    return hasCheck && evidenceOf(childEvent).strongCorrect ? 4 : 3;
  }

  SJT.t01interp = { interpret, extract, level, evidenceOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = SJT.t01interp;
})(typeof globalThis !== 'undefined' ? globalThis : this);
