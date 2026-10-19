(() => {
  const exprEl = document.getElementById('expr');
  const resEl = document.getElementById('result');
  const keys = document.getElementById('keys');
  const histList = document.getElementById('histList');
  const clearHist = document.getElementById('clearHist');

  let expr = '';
  let justEvaluated = false;
  let lastResult = '';          // last successful result text ('' after an error)
  const history = [];

  const OPS = '+-*/%';

  // A value the parser can read back in: plain decimal, optional leading minus.
  // Rejects "Error", "Cannot ÷ 0" and exponential forms such as "1e+21".
  function isPlainNumber(s) {
    return /^-?\d+(\.\d+)?$/.test(s);
  }

  function pretty(s) {
    return s.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−');
  }

  function render() {
    exprEl.textContent = expr ? pretty(expr) : '\u00A0';
    resEl.classList.remove('error');
    if (!justEvaluated) {
      resEl.textContent = expr === '' ? '0' : lastToken(expr);
    }
  }

  function lastToken(s) {
    const m = s.match(/[\d.]+$/);
    return m ? m[0] : s.slice(-1);
  }

  function append(v) {
    const isOp = OPS.includes(v);

    // Leave the "just evaluated" state first, so everything below
    // sees the real current expression.
    if (justEvaluated) {
      if (v === ')') return;                       // nothing to close
      justEvaluated = false;
      if (isOp && isPlainNumber(lastResult)) {
        expr = lastResult;                         // continue from a valid result
      } else {
        expr = '';                                 // fresh start (also after errors)
      }
      if (isOp && expr === '' && v !== '-') {      // operator with nothing to act on
        render();
        return;
      }
    }

    const last = expr.slice(-1);                   // computed AFTER the reset

    if (isOp) {
      if (expr === '' && v !== '-') return;
      if (last === '(' && v !== '-') return;
      if (OPS.includes(last)) {
        expr = expr.slice(0, -1);
        if (expr === '' && v !== '-') { render(); return; }
      }
    }
    if (v === '.') {
      const m = expr.match(/[\d.]*$/)[0];
      if (m.includes('.')) return;
      if (m === '') v = '0.';
    }
    if (v === ')') {
      const open = (expr.match(/\(/g) || []).length;
      const close = (expr.match(/\)/g) || []).length;
      if (open <= close || OPS.includes(last) || last === '(') return;
    }
    if (v === '(' && /[\d.)]$/.test(expr)) expr += '*';
    if (/^\d$/.test(v) && last === ')') expr += '*';
    expr += v;
    render();
  }

  function backspace() {
    if (justEvaluated) { clearAll(); return; }
    expr = expr.slice(0, -1);
    render();
  }

  function clearAll() {
    expr = '';
    justEvaluated = false;
    lastResult = '';
    render();
  }

  // ---- Safe recursive-descent parser (no eval) ----
  function evaluate(src) {
    let i = 0;
    const peek = () => src[i];
    function fail() { throw new Error('Syntax'); }

    function parseExpr() {
      let v = parseTerm();
      while (peek() === '+' || peek() === '-') {
        const op = src[i++];
        const r = parseTerm();
        v = op === '+' ? v + r : v - r;
      }
      return v;
    }
    function parseTerm() {
      let v = parseUnary();
      while (peek() === '*' || peek() === '/') {
        const op = src[i++];
        const r = parseUnary();
        if (op === '/') {
          if (r === 0) throw new Error('Div0');
          v /= r;
        } else v *= r;
      }
      return v;
    }
    function parseUnary() {
      if (peek() === '-') { i++; return -parseUnary(); }
      if (peek() === '+') { i++; return parseUnary(); }
      return parsePostfix();
    }
    function parsePostfix() {
      let v = parsePrimary();
      while (peek() === '%') { i++; v = v / 100; }
      return v;
    }
    function parsePrimary() {
      if (peek() === '(') {
        i++;
        const v = parseExpr();
        if (peek() !== ')') fail();
        i++;
        return v;
      }
      const m = src.slice(i).match(/^(\d+\.?\d*|\.\d+)/);
      if (!m) fail();
      i += m[0].length;
      return parseFloat(m[0]);
    }

    const v = parseExpr();
    if (i !== src.length) fail();
    return v;
  }

  function format(n) {
    if (!isFinite(n)) throw new Error('Range');
    const r = parseFloat(n.toPrecision(12));
    let s = String(r);
    if (s.length > 16) s = r.toExponential(8);
    return s;
  }

  function equals() {
    if (!expr || justEvaluated) return;
    let src = expr;
    const open = (src.match(/\(/g) || []).length - (src.match(/\)/g) || []).length;
    if (open > 0) src += ')'.repeat(open);
    src = src.replace(/[+\-*/]+$/, '');
    try {
      const out = format(evaluate(src));
      addHistory(src, out);
      exprEl.textContent = pretty(src) + ' =';
      resEl.textContent = out;
      resEl.classList.remove('error');
      expr = src;
      lastResult = out;
      justEvaluated = true;
    } catch (e) {
      resEl.textContent = e.message === 'Div0' ? 'Cannot ÷ 0' : 'Error';
      resEl.classList.add('error');
      expr = '';
      lastResult = '';
      justEvaluated = true;
    }
  }

  function addHistory(e, r) {
    history.unshift({ e, r });
    if (history.length > 20) history.pop();
    renderHistory();
  }

  function renderHistory() {
    histList.innerHTML = '';
    history.forEach(h => {
      const li = document.createElement('li');
      const a = document.createElement('span');
      const b = document.createElement('span');
      a.textContent = pretty(h.e);
      b.textContent = '= ' + h.r;
      li.append(a, b);
      li.title = 'Click to reuse result';
      li.addEventListener('click', () => {
        if (!isPlainNumber(h.r)) return;   // e.g. exponential form can't be parsed
        expr = h.r;
        justEvaluated = false;
        render();
      });
      histList.appendChild(li);
    });
  }

  clearHist.addEventListener('click', () => { history.length = 0; renderHistory(); });

  keys.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'clear') clearAll();
    else if (act === 'back') backspace();
    else if (act === 'equals') equals();
    else if (btn.dataset.v) append(btn.dataset.v);
  });

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    let btn = null;
    if (/^[0-9]$/.test(k) || (k.length === 1 && '+-*/%.()'.includes(k))) {
      if (k === '/') e.preventDefault();   // stop Firefox quick-find
      append(k);
      btn = keys.querySelector(`[data-v="${CSS.escape(k)}"]`);
    } else if (k === 'Enter' || k === '=') {
      e.preventDefault(); equals();
      btn = keys.querySelector('[data-act="equals"]');
    } else if (k === 'Backspace') {
      backspace();
      btn = keys.querySelector('[data-act="back"]');
    } else if (k === 'Escape' || k === 'Delete') {
      clearAll();
      btn = keys.querySelector('[data-act="clear"]');
    } else return;
    if (btn) { btn.classList.add('press'); setTimeout(() => btn.classList.remove('press'), 100); }
  });

  render();
})();
