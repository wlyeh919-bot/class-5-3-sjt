/* 語意理解引擎（離線、規則式、可檢視）。流程對應規格第 13 節：
 *   parse → bind → checkConflict → classify(狀態/類別/等級) → chooseProbe → renderResponse → recordOutcome
 * 設計原則：
 *  - 保留原文與座標（正規化只做單字元對應，所以 raw 與 normalized 的字元位置一一對應）。
 *  - 先標引述與否定，再標條件與行動，最後才用前文綁定省略對象。
 *  - 前文不支持就保留 unresolved，不用預期答案代填；不依單一字詞決定等級。
 *  - 不輸出任何能力總分。
 */
(function (g) {
  const LX = g.SJT.lexicon;
  const { L, CL } = LX;

  /* ---------- 1. 正規化（單字元對應，座標不變） ---------- */
  const CHAR_MAP = { 'ㄧ': '一', '臺': '台', '她': '他', '妳': '你', '牠': '他', '祂': '他', '納': '那' };
  function normalize(raw) {
    let out = '';
    for (const ch of raw) {                       // 注意：for..of 以碼點迭代；中文字皆為 BMP，長度一致
      let c = ch;
      if (/[Ａ-Ｚａ-ｚ０-９]/.test(ch)) c = ch.normalize('NFKC');   // 只轉全形英數；標點保留原樣，詞典同時認得全形與半形
      if (c.length !== ch.length) c = ch;
      out += CHAR_MAP[c] || c;
    }
    return out;
  }

  /* ---------- 2. 子句與引述 ---------- */
  function segment(s) {
    const clauses = [];
    let start = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      const strong = '。！？!?；;\n'.includes(c);
      const weak = '，,、'.includes(c);
      if (strong || weak) {
        if (i > start) clauses.push({ s: start, e: i, strong });
        start = i + 1;
      }
    }
    if (start < s.length) clauses.push({ s: start, e: s.length, strong: true });
    return clauses.map((c, i) => ({ ...c, i, text: s.slice(c.s, c.e) }));
  }

  const Q_PAIRS = [['「', '」'], ['『', '』'], ['“', '”'], ['"', '"']];
  function findQuotes(s) {
    const q = [];
    for (const [o, c] of Q_PAIRS) {
      let from = 0;
      for (;;) {
        const a = s.indexOf(o, from);
        if (a < 0) break;
        const b = s.indexOf(c, a + 1);
        if (b < 0) break;
        const before = s.slice(Math.max(0, a - 12), a);
        let kind = 'unknown';
        if (/(?:我|老師|導師)(?:會|要|想|可能|先|再)?(?:對|跟|向|和|告訴)?[^，。；]{0,6}(?:說|講|問|告訴|回答|表示)[：:，,]?$/.test(before)) kind = 'teacher';
        else if (/(?:他|孩子|學生|子安|同學|他們|佳恩|媽媽|家長|大家)(?:說|講|喊|提到|表示|認為|覺得|問)[：:，,]?$/.test(before) || /(?:因為他說|聽到他說|聽他說|他說)[：:，,]?$/.test(before)) kind = 'child';
        q.push({ s: a, e: b + 1, kind, text: s.slice(a + 1, b) });
        from = b + 1;
      }
    }
    return q.sort((x, y) => x.s - y.s);
  }
  function maskChildQuotes(s, quotes) {
    let m = s.split('');
    for (const q of quotes) if (q.kind !== 'teacher') for (let i = q.s; i < q.e; i++) m[i] = '　';
    return m.join('');
  }

  /* ---------- 3. 否定／條件／時間／對象 ---------- */
  function clauseOf(clauses, pos) {
    return clauses.find(c => pos >= c.s && pos < c.e) || clauses[clauses.length - 1] || { s: 0, e: 0, i: 0 };
  }
  // 否定：作用範圍＝從否定詞到同一子句結尾；「不是A，是B」中 B 為肯定
  function polarityAt(norm, clauses, m) {
    const cl = clauseOf(clauses, m.s);
    const pre = norm.slice(cl.s, m.s);
    const preFull = norm.slice(cl.s, m.e);
    // 「不會因為X就Y」「不要因為X就Y」：X 是被引用的前提，不是教師採取的行動
    const prem = /(?:不會|不要|不能|不可以|不是|別)因為([^就而才]*)(?:就|而|才)/.exec(norm.slice(cl.s, cl.e));
    if (prem) {
      const a = cl.s + prem.index, b = a + prem[0].length;
      const innerS = a + prem[0].indexOf('因為');
      const premiseEnd = b - 1; // 「就」之前
      if (m.s >= innerS && m.e <= premiseEnd) return { pol: '+', negCue: null, premise: true };
    }
    const negRe = new RegExp(LX.NEG.source, 'g');
    let hit = null, mm;
    while ((mm = negRe.exec(preFull)) && mm.index < pre.length) hit = mm;
    if (hit) {
      // 「不是 … ，而是 …」「…，而是」：匹配在 而是 之後則為肯定
      if (/(?:而是|但是|反而|改為|改成)/.test(pre.slice(hit.index + hit[0].length))) return { pol: '+', negCue: null };
      return { pol: '-', negCue: hit[0] };
    }
    return { pol: '+', negCue: null };
  }
  // 條件：條件詞出現在匹配之前（同一句）或同一子句內，視為有條件
  function conditionAt(norm, clauses, m) {
    const cl = clauseOf(clauses, m.s);
    // 同一句（到前一個強標點）內，匹配之前所有文字
    let sentStart = 0;
    for (const c of clauses) if (c.strong && c.e <= cl.s) sentStart = c.e + 1;
    const pre = norm.slice(sentStart, m.s);
    const post = norm.slice(m.e, cl.e);
    const re = new RegExp(LX.COND.source);
    if (re.test(pre) || /^[^，。；]{0,4}(?:的話|再說)/.test(post)) {
      return true;
    }
    return false;
  }
  function timeFromClause(text, dflt) {
    if (/下課|課間|休息時間/.test(text)) return 'recess';
    if (/放學|午休|明天|改天|下午|晚上|週[一二三四五六日]|星期[一二三四五六日]|下週|隔天/.test(text)) return 'later';
    if (/班會|週會|晨會/.test(text)) return 'classMeeting';
    if (/立刻|馬上|現在|當下|立即/.test(text)) return 'now';
    if (/等一下|待會|稍後|晚點|之後|找時間|有空|另外找時間|找個時間|安排一個時間/.test(text)) return 'unspecified';
    return dflt || null;
  }
  function purposeFrom(text) {
    const cls = /大家|全班|同學|我們一起|一起|共同|班上/.test(text);
    const ind = /跟他|和他|找他|子安|私下|單獨|個別|你(?!們)/.test(text);
    if (cls && !ind) return 'class';
    if (ind && !cls) return 'individual';
    if (/一起|大家|全班|共同/.test(text)) return 'class';
    return 'unresolved';
  }

  /* ---------- 4. parse：跑詞典，得到候選行動 ---------- */
  function runLexicon(decision, norm, masked, clauses, quotes, frame) {
    const rules = L[decision] || [];
    const cands = [];
    for (const r of rules) {
      const re = new RegExp(r.re.source, r.re.flags.includes('g') ? r.re.flags : r.re.flags + 'g');
      let m;
      while ((m = re.exec(masked))) {
        if (m[0] === '') { re.lastIndex++; continue; }
        const c = { act: r.act, rule: r.id, s: m.index, e: m.index + m[0].length, src: m[0], r };
        cands.push(c);
      }
    }
    return cands;
  }

  /* ---------- 5. bind：否定、條件、時間、對象、前文綁定 ---------- */
  function bind(decision, norm, clauses, quotes, cands, frame) {
    const acts = [], unresolved = [], contextRefs = [];
    const hePool = (frame.hePool && frame.hePool.length) ? frame.hePool : (decision === 'M01' ? [] : ['子安']);
    const shown = new Set(frame.shown || []);
    const lq = frame.lastQuestion || 'none';

    // 先去除被較長、同 act 的匹配完全包含的重複
    cands.sort((a, b) => (a.s - b.s) || ((b.e - b.s) - (a.e - a.s)));
    const kept = [];
    for (const c of cands) {
      if (kept.some(k => k.act === c.act && k.r.slot === c.r.slot && k.s <= c.s && k.e >= c.e)) continue;
      kept.push(c);
    }
    // weak 規則：若同一 act 已有非 weak 匹配則略過
    const strongActs = new Set(kept.filter(c => !c.r.weak).map(c => c.act));
    let cands2 = kept.filter(c => !c.r.weak || !strongActs.has(c.act));
    // 未綁定任務句與明確行動重疊：明確行動較長就用明確行動；相同或被未綁定句包住，則交給前文綁定
    const TASKACTS = new Set(['classTask', 'nextStep', 'demand']);
    const unbound = cands2.filter(c => c.act === 'taskUnbound');
    cands2 = cands2.filter(c => {
      if (c.act === 'taskUnbound') return !cands2.some(o => TASKACTS.has(o.act) && o.s <= c.s && o.e >= c.e && (o.e - o.s) > (c.e - c.s));
      if (TASKACTS.has(c.act)) return !unbound.some(u => u.s <= c.s && u.e >= c.e && (u.e - u.s) >= (c.e - c.s) && !cands2.some(o => TASKACTS.has(o.act) && o.s <= u.s && o.e >= u.e && (o.e - o.s) > (u.e - u.s)));
      return true;
    });

    for (const c of cands2) {
      const r = c.r;
      const cl = clauseOf(clauses, c.s);
      const clText = norm.slice(cl.s, cl.e);
      let act = c.act;
      const out = { act, rule: r.id, span: [c.s, c.e], src: c.src, pol: '+', target: r.target || null, time: null, purpose: null, cond: null, bindings: [] };

      // 需要特定前文的省略句
      if (r.ellipsis && r.needsLastQuestion && lq !== r.needsLastQuestion) {
        unresolved.push({ reason: 'ellipsis-no-frame', span: [c.s, c.e], text: c.src, need: r.needsLastQuestion, rule: r.id });
        continue;
      }
      if (r.ellipsis && r.needsLastQuestion) {
        out.bindings.push({ kind: 'lastQuestion', ref: lq, note: '緊接孩子提問，綁定肯定承諾；不新增時間或效果' });
        contextRefs.push({ kind: 'lastQuestion', ref: lq, for: r.id });
      }
      // 需要「前文已呈現事實」
      if (r.needsFrame) {
        const missing = r.needsFrame.filter(f => !shown.has(f));
        if (missing.length) {
          unresolved.push({ reason: 'needs-frame', span: [c.s, c.e], text: c.src, missing, rule: r.id });
          continue;
        }
        out.bindings.push({ kind: 'shown', ref: r.needsFrame.slice(), note: '前文已呈現兩件事，才支持區分' });
        contextRefs.push({ kind: 'shown', ref: r.needsFrame.slice(), for: r.id });
      }
      // 未綁定任務句：依前文決定對象與行動
      if (act === 'taskUnbound') {
        const explicitInd = /(?:你|他|子安|孩子)/.test(clText.replace(/其他|另外|其它/g, ''));
        if (decision === 'M01') {
          if (r.ellipsis && lq === 'none') { unresolved.push({ reason: 'ellipsis-no-frame', span: [c.s, c.e], text: c.src, need: 'classWhatNow', rule: r.id }); continue; }
          if (explicitInd) { out.act = 'demand'; out.target = '子安'; }
          else if (lq === 'classWhatNow' || lq === 'none' || !r.ellipsis) { out.act = 'classTask'; out.target = '全班'; out.bindings.push({ kind: 'lastQuestion', ref: lq, note: '佳恩詢問全班現在做什麼，綁定為全班任務' }); contextRefs.push({ kind: 'lastQuestion', ref: lq, for: r.id }); }
          else if (lq === 'childMustIWrite' || lq === 'childWhichPart') { out.act = 'demand'; out.target = '子安'; }
          else { unresolved.push({ reason: 'ellipsis-no-frame', span: [c.s, c.e], text: c.src, rule: r.id }); continue; }
        } else if (decision === 'S166') {
          if (r.ellipsis && lq === 'none') { unresolved.push({ reason: 'ellipsis-no-frame', span: [c.s, c.e], text: c.src, rule: r.id }); continue; }
          const concrete = /第一題|這一題|這部分|一小部分|黑板|會的/.test(c.src);
          if (lq === 'childWhichPart' || concrete) { out.act = 'nextStep'; out.target = '子安'; }
          else if (lq === 'childMustIWrite') { out.act = 'demand'; out.target = '子安'; }
          else { out.act = 'nextStep'; out.target = '子安'; }
          out.bindings.push({ kind: 'lastQuestion', ref: lq, note: '孩子正在問，綁定為對子安本人的安排' });
          contextRefs.push({ kind: 'lastQuestion', ref: lq, for: r.id });
        }
        act = out.act;
      }
      // 代名詞「他」：M01 需唯一指涉
      if (/他/.test(c.src) && r.act !== 'classTask' && decision === 'M01' && /(?:去|問|找|聽|看|聊|談|陪)/.test(c.src)) {
        if (/子安/.test(c.src)) { /* 明指 */ }
        else if (hePool.length === 1) { out.bindings.push({ kind: 'pronoun', ref: hePool[0], note: '他＝唯一相關角色' }); contextRefs.push({ kind: 'pronoun', ref: hePool[0], for: r.id }); out.target = hePool[0]; }
        else { unresolved.push({ reason: 'ambiguous-he', span: [c.s, c.e], text: c.src, pool: hePool.slice(), rule: r.id }); out.target = null; out.targetUnresolved = true; }
      }
      if (act === 'askStudent' && !out.target && !out.targetUnresolved) out.target = '子安';
      if (r.needsAddressee) { /* 「我想聽你說」：你＝眼前提問者，M01 中可能是佳恩，需確認 */
        if (decision === 'M01' && frame.lastQuestion === 'classWhatNow') { unresolved.push({ reason: 'ambiguous-you', span: [c.s, c.e], text: c.src, rule: r.id }); out.targetUnresolved = true; }
      }
      if (r.target === 'addressee') {
        if (/(?:你|他|子安|孩子)/.test(clText)) out.target = /你/.test(clText) ? '子安' : '子安'; else out.target = decision === 'M01' ? '未明' : '子安';
      }

      // 否定、條件
      if (r.brief) out.brief = true;
      const { pol, negCue, premise } = polarityAt(norm, clauses, { s: c.s, e: c.e });
      if (premise) { contextRefs.push({ kind: 'premise', ref: c.src, for: r.id, note: '否定句中的「因為…就」前提，不算教師行動' }); continue; }
      // 規則本身含雙重否定（不能不寫）時，否定詞已在匹配內，不再受匹配前的否定影響
      out.pol = pol; if (negCue) out.negCue = negCue;
      if (!r.selfNeg && new RegExp(LX.NEG.source).test(c.src)) {
        if (act === 'classTask') continue;          // 「大家就都不用寫」不是安排全班任務
        out.pol = '-'; out.negCue = 'in-match';
      }
      out.cond = conditionAt(norm, clauses, { s: c.s, e: c.e }) ? 'conditional' : null;

      // 時間、對象、目的
      if (['askStudent', 'commitTalk', 'laterDiscussion'].includes(act)) {
        const tc = timeFromClause(clText, null);
        out.time = tc || r.time || r.timeDefault || null;
        if (r.timeDefault && tc) out.time = tc;
      }
      if (act === 'laterDiscussion') {
        const sentence = sentenceText(norm, clauses, cl);
        out.purpose = purposeFrom(clText);   // v3：先看這一分句本身；整句裡的『大家先寫』是全班任務，不是討論對象
        if (r.id === 'm01.later.slot' || r.id === 'm01.later.after') {
          const hasMeeting = /班會|週會|晨會/.test(sentence);
          out.time = hasMeeting ? 'classMeeting' : (timeFromClause(clText, 'unspecified'));
          if (out.purpose === 'individual') out.target = '子安';
        }
      }
      // 個別詢問若明講較晚才談（下課、放學、班會…），屬於「後續討論」而不是當下詢問
      if (act === 'askStudent') {
        const tc = timeFromClause(clText, null);
        const movement = r.id === 'm01.ask.go' || r.id === 'm01.ask.besides';
        if (tc && tc !== 'now' && !(tc === 'unspecified' && movement)) { out.act = 'laterDiscussion'; out.purpose = 'individual'; out.time = tc; out.target = '子安'; out.bindings.push({ kind: 'time', ref: tc, note: '個別詢問被安排在較晚時點' }); }
      }
      if (r.needsCond && out.cond !== 'conditional') continue;
      if (act === 'verifyRecord') out.audience = r.audience;
      if (r.risk) out.risk = true;
      if (r.slot) out.slot = r.slot;
      acts.push(out);
    }
    const explicitDist = acts.some(a => a.act === 'distinguish' && a.rule !== 's166.two.generic' && a.pol === '+');
    const unres2 = explicitDist ? unresolved.filter(u => !(u.reason === 'needs-frame')) : unresolved;
    return { acts, unresolved: unres2, contextRefs };
  }
  function sentenceText(norm, clauses, cl) {
    let a = cl.i, b = cl.i;
    while (a > 0 && !clauses[a - 1].strong) a--;
    while (b < clauses.length - 1 && !clauses[b].strong) b++;
    return norm.slice(clauses[a].s, clauses[b].e);
  }

  /* ---------- 6. 衍生行動：分工、時序、情緒、示範 ---------- */
  function derive(decision, norm, acts, clauses, frame) {
    frame = frame || {};
    const out = acts.filter(a => !['coordCue', 'emotionCue', 'demo'].includes(a.act));
    const have = a => out.some(x => x.act === a && x.pol === '+');
    if (decision === 'C01') {
      const slots = new Set(acts.filter(a => a.act === 'coordCue' && a.pol === '+').map(a => a.slot));
      const hasWho = slots.has('who'), hasObj = slots.has('obj'), hasWhen = slots.has('when');
      const n = [hasWho, hasObj, hasWhen].filter(Boolean).length;
      const lqC = frame.lastQuestion || 'none';
      const filled = lqC === 'colleagueWhichObservation' && (hasObj || hasWhen) && !out.some(a => a.act === 'coordPlan');
      if (lqC === 'colleagueWhatAbnormal' && /沒開始|不動筆|沒動筆|插話|發呆|分心|不專心|情緒|哭|生氣|不交|缺交|不寫|沒寫|一直/.test(norm) && !out.some(a => a.act === 'conditionalReport' && a.pol === '+')) {
        out.push({ act: 'conditionalReport', rule: 'c01.cond.filled', span: [0, norm.length], src: norm, pol: '+', bindings: [{ kind: 'lastQuestion', ref: lqC, note: '回答陳老師「異常指什麼」' }], time: null });
      }
      if (filled) {
        out.push({ act: 'coordPlan', rule: 'c01.coord.filled', span: [0, norm.length], src: norm, pol: '+', target: '科任', slots: { who: hasWho, what: hasObj, when: hasWhen }, time: null, bindings: [{ kind: 'lastQuestion', ref: lqC, note: '補上觀察對象或回訪時間' }] });
      } else if (n >= 2 && (hasObj || hasWhen)) {
        out.push({ act: 'coordPlan', rule: 'c01.coord.derived', span: [0, norm.length], src: norm, pol: '+', target: '科任', slots: { who: hasWho, what: hasObj, when: hasWhen }, time: null, bindings: [] });
        for (let i = out.length - 1; i >= 0; i--) if (out[i].act === 'observe') out.splice(i, 1);   // 已形成分工，單純「觀察」被包含
      }
    }
    if (decision === 'S167') {
      const hasEvent = LX.EVENT_WORDS.test(norm);
      const emo = acts.some(a => a.act === 'emotionCue' && a.pol === '+');
      const nseq = LX.TIME_MARKS.filter(t => norm.includes(t)).length;
      const phrase = out.find(a => a.act === 'chronology');
      const eventStart = norm.search(LX.EVENT_WORDS);
      const timeStarts = LX.TIME_MARKS.map(t => norm.indexOf(t)).filter(i => i >= 0);
      const chronologyStart = timeStarts.length ? Math.min(...timeStarts) : eventStart;
      if (!phrase && hasEvent && nseq >= 2) out.push({ act: 'chronology', rule: 's167.chron.seq', span: [chronologyStart, norm.length], src: norm.slice(chronologyStart), pol: '+', partial: false, bindings: [], time: null });
      else if (!phrase && hasEvent && /因為|由於|起因|在乎|在意|疑慮|不滿/.test(norm)) out.push({ act: 'chronology', rule: 's167.chron.cause', span: [eventStart, norm.length], src: norm.slice(eventStart), pol: '+', partial: true, bindings: [], time: null });
      else if (phrase) { const strong = /經過|始末|來龍去脈|依序|依照時間|按照順序|按順序|從頭說/.test(phrase.src); phrase.partial = strong ? false : (nseq < 2 && !(/後來|接著|然後|之後|影響|所以/.test(norm))); }
      const other = out.some(a => a.pol === '+' && !['greeting', 'emotionOnly'].includes(a.act));
      if (other) { for (let i = out.length - 1; i >= 0; i--) if (out[i].act === 'greeting') out.splice(i, 1); }
      if (emo && !hasEvent && !other) out.push({ act: 'emotionOnly', rule: 's167.emotion.only', span: [0, norm.length], src: norm, pol: '+', bindings: [], time: null });
      if ((frame.lastQuestion === 'momWhenStart') && hasEvent && /從|開始|自從|上次|上週|那次|之後|起因/.test(norm) && !out.some(a => a.act === 'chronology')) out.push({ act: 'chronology', rule: 's167.chron.filled', span: [0, norm.length], src: norm, pol: '+', partial: false, bindings: [{ kind: 'lastQuestion', ref: 'momWhenStart', note: '回答媽媽「從哪件事開始」' }], time: null });
      if (out.some(a => a.act === 'chronology' && a.pol === '+' && !a.partial) === false && out.some(a => a.act === 'chronology' && a.partial)) { /* 部分時序 */ }
    }
    if (decision === 'T01') {
      // v3：老師在『描述孩子剛才的表現／下解讀』（第三人稱、已發生、沒有要孩子做什麼的指令）不是新的教學動作
      const REPORT_HEAD = /^[，,、\s]*(?:所以|那|就|而且|可是|但是|但|然後|其實|結果)?(?:他|她|孩子|這孩子|這個孩子|子安|他的)/;
      const REPORT_BODY = /了|是|有|把|覺得|因為|選|看的是|想到|算錯|畫對|知道|會|不會|懂/;
      const DIRECTIVE = /請|讓|叫|吧|試試|看看|先(?!不)|再|一下|你|等一下|晚點|我來|我(?:想)?(?:請|讓)|換/;
      const isReport = a => {
        const cl = clauseOf(clauses, (a.span || [0])[0]);
        const t = cl.text || '';
        return REPORT_HEAD.test(t) && REPORT_BODY.test(t) && !DIRECTIVE.test(t);
      };
      for (let i = out.length - 1; i >= 0; i--) if (out[i].span && !['demo'].includes(out[i].act) && isReport(out[i])) out.splice(i, 1);
      if (!out.length && /舉手|眼花|選錯|誰先|計分|得分|競賽|比賽/.test(norm)) out.push({ act: 'offTopic', rule: 't01.off.derived', span: [0, norm.length], src: norm, pol: '+', bindings: [], time: null });
      const child = ['askChildExplain', 'selfCheckItem', 'drawTogether', 'adaptStep'].some(have);
      const demo = acts.some(a => a.act === 'demo' && a.pol === '+');
      if (demo && !child) out.push({ act: 'teacherDemoOnly', rule: 't01.demo.only', span: [0, norm.length], src: norm, pol: '+', bindings: [], time: null });
      if (acts.some(a => a.act === 'demo' && a.pol === '-')) out.push({ act: 'teacherDemoOnly', rule: 't01.demo.neg', span: [0, norm.length], src: norm, pol: '-', bindings: [], time: null });
    }
    return out;
  }

  /* ---------- 7. checkConflict ---------- */
  function checkConflict(decision, norm, acts) {
    const conflicts = [];
    const has = (a, pol) => acts.some(x => x.act === a && x.pol === (pol || '+'));
    if (LX.IRONY.test(norm)) conflicts.push({ kind: 'irony', note: '出現可能反諷的語氣詞，不按字面評分' });
    for (const a of new Set(acts.map(x => x.act))) if (has(a, '+') && has(a, '-')) conflicts.push({ kind: 'polarity', act: a, note: '同一行動同時被肯定與否定' });
    if (has('classTask') && has('haltAll')) conflicts.push({ kind: 'contradiction', note: '同時安排全班繼續與要求全班等待' });
    return conflicts;
  }

  /* ---------- 8. 訊息類型 ---------- */
  const FIRST_Q = new Set(['none', 'classWhatNow', 'childVagueUnfair', 'childMustIWrite', 'momWhatHappened']);
  const FOLLOW_SCAFFOLD = new Set(['childWillYouTalkAgain']);
  const FOLLOW_GAP = new Set(['childWhichPart', 'colleagueWhichObservation', 'colleagueWhatAbnormal', 'momWhenStart']);
  function lastSystemTurn(frame) {
    const h = frame.history || [];
    for (let i = h.length - 1; i >= 0; i--) if (h[i].who !== 'player') return h[i];
    return null;
  }
  function classifyMsgType(norm, frame, hasStrategyActs) {
    const lq = frame.lastQuestion || 'none';
    const sys = lastSystemTurn(frame);
    const followContext = !FIRST_Q.has(lq) || !!(sys && (sys.probeType || sys.type));
    // 角色被允許拒答不等於玩家拒答；先辨認拒答主體。
    const playerRefusal = (LX.REFUSAL.test(norm)||/(?:我(?:會|要|想)?(?:拒絕|不願)(?:作答|回答)|^(?:拒絕|不願)(?:作答|回答))/.test(norm)) && !/(?:你|他|子安|孩子)(?:現在|還是)?不想(?:講|談|說|回答)/.test(norm) && !/(?:如果|若|要是)(?:(?:你|他|子安|孩子))?(?:現在|還是)?不想(?:講|談|說|回答)/.test(norm);
    if (playerRefusal) return '異議';
    if (LX.OBJECTION.test(norm) && (followContext || (frame.history || []).some(x => x.who === 'player'))) return '異議';
    if (LX.NOT_UNDERSTAND.test(norm)) return followContext ? '異議' : '初答';
    // 新接入端用實際追問功能，不只用問題名稱猜；缺少 metadata 時保守沿用舊標記。
    if (frame.promptMetadata) {
      if (frame.promptMetadata.scaffoldSeen) return '提示後修訂';
      if ((frame.promptMetadata.informationAdded || []).length) return '新事實';
      if (frame.promptMetadata.responseType === 'clarification') return '澄清';
    }
    if (!frame.promptMetadata && FOLLOW_SCAFFOLD.has(lq)) return '提示後修訂';
    if (sys && sys.scaffold) return '提示後修訂';
    if (sys && sys.probeType === 'newfact') return '新事實';
    if (FOLLOW_GAP.has(lq) || lq === 'asksWhoIsHe') return '澄清';
    if (sys && sys.probeType) return '澄清';
    return '初答';
  }

  /* ---------- 9. 分類：狀態、參照類別、等級 ---------- */
  const CAT = {
    S165: { inviteExplain: '✓', ruleNextTime: '△', sportsmanship: '△', referParent: '✗' },
    S166: { distinguish: '✓', counselor: '△', referParent: '△', punishEscalate: '✗' },
    S167: { chronology: '✓', pastHistory: '△', learningStatus: '△', showRecords: '✗' }
  };
  const PRIMARY = { S165: ['inviteExplain'], S166: ['distinguish'], S167: ['chronology'], T01: ['askChildExplain', 'selfCheckItem'], C01: ['coordPlan'] };
  const RISK_ACTS = new Set(['publicShame', 'collectivePunish', 'haltAll', 'punishEscalate', 'blame']);

  function classify(decision, norm, acts, unresolved, conflicts, msgType, frame) {
    const pos = acts.filter(a => a.pol === '+' && !a.targetUnresolved);
    const posAll = acts.filter(a => a.pol === '+');
    const res = { state: null, refCat: null, level: null, strategies: [], risk: [], gaps: [], flags: [], mixed: false };
    const names = new Set(pos.map(a => a.act));
    res.risk = posAll.filter(a => (RISK_ACTS.has(a.act) || a.risk) && !(a.act === 'haltAll' && a.brief)).map(a => a.act);
    const catMap = CAT[decision];

    // 策略清單（保留原句座標與順序，不擇一）
    const ordered = [...pos].sort((a, b) => a.span[0] - b.span[0]);
    const strategies = ordered.map((a, i) => ({ act: a.act, order: i + 1, cat: catMap && catMap[a.act] ? catMap[a.act] : null, cond: a.cond || null, time: a.time || null, purpose: a.purpose || null, span: a.span, text: a.src }));
    res.strategies = strategies;

    // 衝突先於任何「補齊追問」快捷判定；肯定與否定並存不得得到候選類別或等級。
    if (conflicts.length) { res.state = '需另行複核'; res.flags.push('conflict'); return res; }

    // 沒有可用行動
    if (!posAll.length) {
      if (acts.some(a => a.pol === '-')) { res.state = '部分證據'; res.flags.push('only-negated'); return res; }
      res.state = '系統理解失敗';
      return res;
    }
    if (!pos.length) { // 有行動但對象未能綁定
      res.state = '部分證據';
      res.flags.push('target-unresolved');
      return res;
    }

    // 追問回答：只有「補上了追問所問的缺口」才算補齊；沒補上就照一般流程（缺口仍在）
    const FILLS = { childWillYouTalkAgain: ['commitTalk'], childWhichPart: ['nextStep', 'demand'], colleagueWhatAbnormal: ['conditionalReport'], momWhenStart: ['chronology'], asksWhoIsHe: [] };
    if (msgType !== '初答') {
      const lqq = frame.lastQuestion || 'none';
      const fillAct = (FILLS[lqq] || []).find(a => pos.some(x => x.act === a && !(a === 'chronology' && x.partial)));
      if (fillAct && !pos.some(a => a.cond === 'conditional') && !pos.some(a => RISK_ACTS.has(a.act) || a.risk)) { res.state = '可判讀'; res.flags.push('followup-filled'); res.refCat = null; res.level = null; return res; }
    }
    if (decision === 'M01') {
      const cls = pos.find(a => a.act === 'classTask');
      const indiv = pos.find(a => a.act === 'askStudent');
      const later = pos.find(a => a.act === 'laterDiscussion');
      const verify = pos.find(a => a.act === 'verifyFacts');
      if (res.risk.length) { res.state = '可判讀'; res.level = 1; res.flags.push('risk'); return res; }
      if (pos.some(a => a.cond === 'conditional' && ['askStudent', 'laterDiscussion', 'classTask'].includes(a.act))) {
        res.state = '需另行複核'; res.flags.push('conditional'); res.level = null; res.gaps.push('conditional-arrangement'); return res;
      }
      const disputeSide = indiv || later || verify;
      if (cls && disputeSide) {
        const timed = indiv ? !!(indiv.time && indiv.time !== 'unspecified') : !!(later && later.purpose === 'individual' && later.time && later.time !== 'unspecified');
        const unclearMeeting = later && later.purpose === 'unresolved' && later.time === 'classMeeting';
        res.level = (timed && !unclearMeeting) ? 4 : 3;
        res.state = unclearMeeting ? '部分證據' : '可判讀';
        if (unclearMeeting) res.gaps.push('meeting-purpose');
        if (!timed && !unclearMeeting) res.flags.push('timing-missing');
      } else if (cls || disputeSide) {
        res.state = '部分證據'; res.level = 2;
        res.gaps.push(cls ? 'individual-arrangement' : 'class-task');
      } else { res.state = '部分證據'; res.gaps.push('class-task', 'individual-arrangement'); }
      return res;
    }

    if (catMap) {
      // 原題三題：依原選項類別。複合策略不擇一，ᵗ✗ 與他者並存需複核
      let cats = strategies.filter(s => s.cat);
      // S167：紀錄若在事件說明之後，視為補充；在之前則為混合
      if (decision === 'S167') {
        const chron = strategies.find(s => s.act === 'chronology');
        const rec = strategies.find(s => s.act === 'showRecords');
        const completeChronology = pos.find(a => a.act === 'chronology' && !a.partial);
        if (chron && completeChronology && rec && chron.order < rec.order) cats = cats.filter(s => s.act !== 'showRecords');
      }
      // 部分時序（只有起因）不給 ✓
      const chronAct = pos.find(a => a.act === 'chronology');
      if (chronAct && chronAct.partial) { cats = cats.filter(s => s.act !== 'chronology'); res.flags.push('chronology-partial'); }
      // 否定處罰升級、條件式支持在 pol/cond 已處理
      if (decision === 'S165') {
        const rp = cats.find(s => s.act === 'referParent' && s.cond === 'conditional');
        if (rp) { cats = cats.filter(s => s !== rp); res.flags.push('conditional-parent'); }
      }
      const set = new Set(cats.map(s => s.cat));
      if (conflicts.length) { res.state = '需另行複核'; res.flags.push('conflict'); res.mixed = false; return res; }
      const condStrat = pos.filter(a => a.cond === 'conditional' && catMap[a.act]);
      if (condStrat.length) { res.state = '需另行複核'; res.flags.push('conditional'); res.refCat = null; return res; }
      if (set.size === 0) { res.state = '部分證據'; return res; }
      if (set.has('✗') && set.size > 1) { res.state = '需另行複核'; res.mixed = true; res.flags.push('mixed-with-worse'); return res; }
      res.state = '可判讀';
      res.refCat = set.size === 1 ? [...set][0] : null;
      if (set.size > 1) res.flags.push('multi-strategy');
      return res;
    }

    if (decision === 'T01') {
      // 動作與策略事件辨認；教學解讀適切性另行處理（見 interpretT01）
      const events = [...names].filter(a => a !== 'offTopic');
      res.state = events.length ? '可判讀' : '部分證據';
      const childPerf = names.has('askChildExplain') || names.has('selfCheckItem');
      if (!childPerf && (names.has('drawTogether') || names.has('adaptStep') || !events.length)) res.gaps.push('child-performance');
      res.flags.push(childPerf ? 'child-performance-event' : 'no-child-performance-yet');
      return res;
    }

    if (decision === 'C01') {
      if (names.has('punishTogether')) { res.state = '需另行複核'; res.flags.push('punish-ambiguous'); res.gaps.push('punish-ambiguous'); return res; }
      const plan = pos.find(a => a.act === 'coordPlan');
      const exch = names.has('exchangeObs') || names.has('askCause');
      const condRep = pos.find(a => a.act === 'conditionalReport' && a.cond === 'conditional');
      if (condRep) { res.state = '需另行複核'; res.flags.push('conditional'); res.gaps.push('conditional-report'); return res; }
      if (plan) {
        const sl = plan.slots || {};
        const n = [sl.who, sl.what, sl.when].filter(Boolean).length;
        if (n >= 2) { res.state = '可判讀'; res.level = n === 3 ? 4 : 3; }
        else { res.state = '部分證據'; res.level = 2; res.gaps.push('coordination'); }
      } else if (exch) {
        res.state = '可判讀'; res.level = 2;                      // 提出瞭解或交流觀察：新編錨點2，合作內容仍含糊
      } else {
        res.state = '部分證據'; res.level = 2; res.gaps.push('coordination');
      }
      return res;
    }
    res.state = '部分證據';
    return res;
  }

  /* ---------- 10. chooseProbe ---------- */
  function chooseProbe(decision, ctx) {
    const { norm, acts, unresolved, conflicts, msgType, cls, blank } = ctx;
    if (blank) return { probe: 'none', why: 'blank' };
    if (msgType === '異議') return { probe: 'ack', why: 'objection' };
    if (cls.state === '系統理解失敗') {
      if (LX.NOT_UNDERSTAND.test(norm)) return { probe: 'restate', why: 'player-not-understand' };
      if (unresolved.length) return { probe: 'neutral', why: unresolved[0].reason, quote: unresolved[0].text };
      if (ctx.fragment) return { probe: 'neutral', why: 'fragment-no-frame', quote: norm.trim() };
      return { probe: 'restate', why: 'no-recognizable-strategy' };
    }
    if (conflicts.some(c => c.kind === 'irony' || c.kind === 'polarity' || c.kind === 'contradiction')) return { probe: 'neutral', why: conflicts[0].kind };
    if (unresolved.length) {
      const u = unresolved[0];
      return { probe: 'neutral', why: u.reason, quote: u.text };
    }
    if (acts.some(a => a.targetUnresolved)) return { probe: 'neutral', why: 'target-unresolved' };
    if (cls.gaps.includes('meeting-purpose')) return { probe: 'neutral', why: 'meeting-purpose', quote: (acts.find(a => a.act === 'laterDiscussion') || {}).src };
    if (cls.state === '需另行複核') {
      if (cls.flags.includes('conditional') || cls.flags.includes('mixed-with-worse') || cls.gaps.includes('punish-ambiguous')) return { probe: 'gap', why: cls.flags.includes('conditional') ? 'conditional-unresolved' : 'order-and-responsibility' };
      return { probe: 'none', why: 'review-flag' };
    }
    if (cls.flags.includes('followup-filled')) return { probe: 'none', why: 'followup-recorded' };
    // 主要策略缺口 → 角色詢問缺口
    const pos = new Set(acts.filter(a => a.pol === '+').map(a => a.act));
    if (decision === 'M01') {
      if (cls.level === 1) return { probe: 'none', why: 'risk-recorded' };
      if (cls.gaps.length) return { probe: 'gap', why: cls.gaps[0] };
      return { probe: 'none', why: 'complete' };
    }
    if (decision === 'T01') {
      if (cls.gaps.includes('child-performance') && !acts.some(a => a.pol === '+' && a.act === 'offTopic') ) return { probe: 'gap', why: 'child-performance' };
      if (acts.some(a => a.pol === '+' && a.act === 'offTopic') && !acts.some(a => a.pol === '+' && a.act !== 'offTopic')) return { probe: 'gap', why: 'offtopic' };
      return { probe: 'none', why: 'complete' };
    }
    if (decision === 'C01') {
      if (cls.gaps.length) return { probe: 'gap', why: cls.gaps[0] };
      return { probe: 'none', why: 'complete' };
    }
    const prim = PRIMARY[decision] || [];
    const hasPrim = prim.some(a => pos.has(a));
    if (decision === 'S167' && cls.flags.includes('chronology-partial')) return { probe: 'gap', why: 'chronology-partial' };
    if (!hasPrim) return { probe: 'gap', why: 'primary-missing:' + prim.join('|') };
    return { probe: 'none', why: 'complete' };
  }

  /* ---------- 11. renderResponse：只給出承接型態與模板，不替玩家增加內容 ---------- */
  function renderResponse(decision, probe, ctx) {
    const q = probe.quote ? `「${probe.quote}」` : '';
    switch (probe.probe) {
      case 'neutral':
        if (probe.why === 'ambiguous-he') return { id: 'neutral.pronoun', text: `這裡的「他」是指誰？` };
        if (probe.why === 'meeting-purpose') return { id: 'neutral.meeting', text: `你說${q}，是要和誰談？` };
        if (probe.why === 'needs-frame') return { id: 'neutral.frame', text: `你說${q}，指的是哪兩件事？` };
        if (probe.why === 'irony' || probe.why === 'polarity' || probe.why === 'contradiction') return { id: 'neutral.tone', text: `我想先確認你的意思，你實際打算怎麼做？` };
        return { id: 'neutral.ellipsis', text: `你說${q}，是在回答哪一件事？` };
      case 'restate': return { id: 'restate', text: `我還不確定怎麼理解你這句話。你願意換個說法嗎？也可以先保留原話繼續。` };
      case 'ack': return { id: 'ack', text: `已保留你的原話，不會再用同樣的方式追問。你可以保留這段並繼續，也可以自行補充。` };
      case 'gap': return { id: 'gap.' + decision, text: null };
      default: return { id: 'none', text: null };
    }
  }

  /* ---------- 12. 總流程 ---------- */
  function analyze(input) {
    const decision = input.decision;
    const raw = input.text == null ? '' : String(input.text);
    const frame = input.frame || {};
    const norm = normalize(raw);
    const blank = /^[\s　。，、,.!?！？…]*$/.test(norm) && !/[一-鿿A-Za-z0-9]/.test(norm);
    const base = { decision, raw, normalized: norm, ruleVersion: 'sjt-review-20261004.1', stages: ['parse', 'bind', 'checkConflict', 'classify', 'chooseProbe', 'renderResponse', 'recordOutcome'] };
    if (blank) {
      return { ...base, clauses: [], quotes: [], acts: [], unresolved: [], conflicts: [], msgType: '初答', state: '未作答', refCat: null, level: null, strategies: [], risk: [], flags: [], probe: 'none', probeWhy: 'blank', response: { id: 'none', text: null }, contextRefs: [] };
    }
    // parse
    const clauses = segment(norm);
    const quotes = findQuotes(norm);
    const masked = maskChildQuotes(norm, quotes);
    const cands = runLexicon(decision, norm, masked, clauses, quotes, frame);
    // bind
    const b = bind(decision, norm, clauses, quotes, cands, frame);
    // 衍生行動也須遮掉被引用的角色話語，不能只在詞典階段遮罩。
    const acts = derive(decision, masked, b.acts, clauses, frame);
    // checkConflict
    const conflicts = checkConflict(decision, masked, acts);
    const msgType = classifyMsgType(masked, frame, acts.some(a => a.pol === '+'));
    let cls = classify(decision, norm, acts, b.unresolved, conflicts, msgType, frame);
    // 異議／拒答：不產生能力判定
    let objection = false;
    if (msgType === '異議') { objection = true; cls = { ...cls, state: '需另行複核', refCat: null, level: null, strategies: [], flags: [...cls.flags, 'objection'], gaps: [] }; }
    else if (LX.NOT_UNDERSTAND.test(norm) && !acts.some(a => a.pol === '+')) { cls = { ...cls, state: '系統理解失敗' }; }
    if (!objection && decision === 'T01' && !acts.some(a => a.pol === '+' || a.pol === '-') && LX.T01_INTERP.test(norm)) {
      cls = { ...cls, state: '需另行複核', flags: [...cls.flags, 'free-interpretation'], gaps: [] };   // 自由解讀：超出封閉規則，不給等級，也不算功能完成
    }
    if (!objection && conflicts.some(c => c.kind === 'irony') ) { cls = { ...cls, state: '需另行複核', refCat: null, level: null, flags: [...cls.flags, 'irony'] }; }
    const compact = norm.replace(/[\s，。,.!?！？、；;]/g, '');
    const fragment = !acts.length && compact.length <= 12;
    const pr = chooseProbe(decision, { norm, acts, unresolved: b.unresolved, conflicts, msgType, cls, blank, fragment, compact });
    const response = renderResponse(decision, pr, { norm });
    // gap 僅是候選取證目的；尚未審查實際問句時，不得當成純澄清。
    response.requiresAnswer = ['neutral', 'gap', 'restate'].includes(pr.probe);
    response.scaffoldSeen = pr.probe === 'gap';
    response.informationAdded = [];
    response.responseType = pr.probe === 'gap' ? 'strategy_gap_candidate' : pr.probe;
    response.requiresTemplateReview = pr.probe === 'gap';
    // recordOutcome：保留原話、座標、規則、前文引用與未解析原因；不寫入分數
    return {
      ...base, clauses: clauses.map(c => ({ s: c.s, e: c.e, text: c.text })), quotes,
      acts, unresolved: b.unresolved, conflicts, contextRefs: b.contextRefs,
      msgType, state: cls.state, refCat: cls.refCat, level: cls.level, strategies: cls.strategies,
      risk: cls.risk, flags: cls.flags, gaps: cls.gaps, mixed: cls.mixed,
      probe: pr.probe, probeWhy: pr.why, response
    };
  }

  g.SJT.engine = { analyze, normalize, segment, findQuotes, CAT, PRIMARY };
})(typeof globalThis !== 'undefined' ? globalThis : window);
