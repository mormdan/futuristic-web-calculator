# make a web based calculator in a futuristic layout

> make a web based calculator in a futuristic layout

Project: futuristic-web-calculator

# Futuristic Web Calculator (v2, QA fixes applied)

This is a calculator built with plain HTML, CSS and JavaScript. It has no libraries and no build step. Save the three files in one folder and open `index.html`. Only `script.js` changed from the previous draft. `index.html` and `style.css` are repeated unchanged so the project is complete.

## What was fixed in `script.js`
1. **Stale `last` in `append()`.** `last` is now read after the post-evaluation reset. `(2+3)=` followed by `5` now gives `5`, not `*5`.
2. **Carrying a result forward.** A result is reused as the start of a new expression only if it matches a plain number (`/^-?\d+(\.\d+)?$/`). This is checked by the new `isPlainNumber()`. After `Error`, `Cannot ÷ 0`, or an exponential result like `1e+21`, pressing an operator starts from an empty expression. The display resets to `0`, and the operator is ignored unless it is `-`.
3. **Same guard for history.** Clicking a history entry reuses its result only if it is a plain number. This stops exponential results from breaking the next evaluation.
4. **Cleanup.** A stray `)` right after `=` is now ignored without clearing the result. I also added parentheses to the keyboard condition, which was correct but hard to read.

**Not tested in a browser.** I traced these paths by reading the code:
- `(2+3)=` then `5`
- `1/0=` then `+`
- `1/0=` then `-`
- `1/0=` then `7`
- `50%` followed by `=`
- `-` as the first key
- `)` after `=`

I did not run them. Please try those cases yourself, and check the layout and glass blur on your own screens.

File: index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NEON-CALC // Futuristic Calculator</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="grid-bg"></div>
<main class="calc" aria-label="Calculator">
  <header class="calc-head">
    <span class="logo">NEON<b>CALC</b></span>
    <span class="status"><i></i> ONLINE</span>
  </header>

  <section class="screen">
    <div class="expr" id="expr" aria-live="off">&nbsp;</div>
    <div class="result" id="result" aria-live="polite">0</div>
  </section>

  <section class="keys" id="keys">
    <button data-act="clear" class="fn">AC</button>
    <button data-act="back" class="fn">⌫</button>
    <button data-v="%" class="fn">%</button>
    <button data-v="/" class="op">÷</button>

    <button data-v="7">7</button>
    <button data-v="8">8</button>
    <button data-v="9">9</button>
    <button data-v="*" class="op">×</button>

    <button data-v="4">4</button>
    <button data-v="5">5</button>
    <button data-v="6">6</button>
    <button data-v="-" class="op">−</button>

    <button data-v="1">1</button>
    <button data-v="2">2</button>
    <button data-v="3">3</button>
    <button data-v="+" class="op">+</button>

    <button data-v="(" class="fn">(</button>
    <button data-v="0">0</button>
    <button data-v=".">.</button>
    <button data-v=")" class="fn">)</button>

    <button data-act="equals" class="eq wide">=</button>
  </section>

  <section class="history">
    <div class="h-head"><span>HISTORY</span><button id="clearHist" class="link">purge</button></div>
    <ul id="histList"></ul>
  </section>
</main>
<script src="script.js"></script>
</body>
</html>
```

File: style.css
```css
:root {
  --bg: #05070f;
  --cyan: #00e5ff;
  --magenta: #ff2bd6;
  --panel: rgba(14, 20, 40, 0.65);
  --line: rgba(0, 229, 255, 0.25);
  --text: #d8f6ff;
}
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  background: radial-gradient(ellipse at 50% 0%, #10183a 0%, var(--bg) 70%);
  color: var(--text);
  font-family: "Segoe UI", "Orbitron", system-ui, sans-serif;
  display: flex; align-items: center; justify-content: center;
  padding: 16px; overflow-x: hidden;
}
.grid-bg {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image:
    linear-gradient(var(--line) 1px, transparent 1px),
    linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 48px 48px;
  opacity: .35;
  mask-image: radial-gradient(circle at center, #000 20%, transparent 75%);
  -webkit-mask-image: radial-gradient(circle at center, #000 20%, transparent 75%);
  animation: drift 12s linear infinite;
}
@keyframes drift { to { background-position: 48px 48px; } }

.calc {
  position: relative; z-index: 1;
  width: 100%; max-width: 380px;
  padding: 18px;
  background: var(--panel);
  border: 1px solid var(--cyan);
  border-radius: 20px;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 0 25px rgba(0,229,255,.35), 0 0 80px rgba(255,43,214,.15), inset 0 0 25px rgba(0,229,255,.08);
}
.calc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13px; letter-spacing: 3px; }
.logo b { color: var(--magenta); text-shadow: 0 0 8px var(--magenta); }
.status { font-size: 11px; color: var(--cyan); display: flex; align-items: center; gap: 6px; }
.status i { width: 8px; height: 8px; border-radius: 50%; background: #39ff88; box-shadow: 0 0 8px #39ff88; animation: pulse 1.6s infinite; }
@keyframes pulse { 50% { opacity: .3; } }

.screen {
  background: rgba(0,0,0,.45);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 16px;
  text-align: right;
  margin-bottom: 14px;
  box-shadow: inset 0 0 20px rgba(0,229,255,.1);
  min-height: 98px;
}
.expr { font-size: 15px; color: rgba(216,246,255,.55); min-height: 22px; overflow-x: auto; white-space: nowrap; font-family: Consolas, monospace; }
.result {
  font-family: Consolas, "Courier New", monospace;
  font-size: 44px; color: var(--cyan);
  text-shadow: 0 0 12px var(--cyan);
  overflow-x: auto; white-space: nowrap; margin-top: 6px;
}
.result.error { color: var(--magenta); text-shadow: 0 0 12px var(--magenta); }

.keys { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.keys button {
  height: 56px; font-size: 20px; color: var(--text);
  background: rgba(20, 30, 60, .7);
  border: 1px solid var(--line);
  border-radius: 12px; cursor: pointer;
  transition: transform .08s, box-shadow .2s, border-color .2s, background .2s;
  font-family: inherit;
}
.keys button:hover { border-color: var(--cyan); box-shadow: 0 0 14px rgba(0,229,255,.5); }
.keys button:active, .keys button.press { transform: scale(.94); background: rgba(0,229,255,.25); }
.keys button:focus-visible { outline: 2px solid var(--magenta); outline-offset: 2px; }
.keys .op { color: var(--magenta); border-color: rgba(255,43,214,.4); }
.keys .op:hover { border-color: var(--magenta); box-shadow: 0 0 14px rgba(255,43,214,.6); }
.keys .fn { color: var(--cyan); }
.keys .eq {
  background: linear-gradient(90deg, rgba(0,229,255,.35), rgba(255,43,214,.35));
  border-color: var(--cyan); font-weight: 700;
}
.keys .wide { grid-column: span 4; }

.history { margin-top: 14px; font-size: 12px; }
.h-head { display: flex; justify-content: space-between; letter-spacing: 3px; color: rgba(216,246,255,.6); margin-bottom: 6px; }
.link { background: none; border: 0; color: var(--magenta); cursor: pointer; font-size: 11px; letter-spacing: 1px; }
#histList { list-style: none; margin: 0; padding: 0; max-height: 110px; overflow-y: auto; font-family: Consolas, monospace; }
#histList li { padding: 5px 8px; border-bottom: 1px solid var(--line); cursor: pointer; display: flex; justify-content: space-between; gap: 8px; }
#histList li:hover { background: rgba(0,229,255,.1); }
#histList li span:last-child { color: var(--cyan); }

@media (max-width: 400px) {
  .result { font-size: 36px; }
  .keys button { height: 50px; }
}
@media (prefers-reduced-motion: reduce) {
  .grid-bg, .status i { animation: none; }
}
```

File: script.js
```js
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
```

## Notes
- **Parser:** it handles `+ − × ÷`, parentheses, unary minus and `%`. `%` divides by 100, so `50%` gives `0.5`. Open parentheses are closed automatically on `=`.
- **After `=`:**
  - A digit or `(` starts a new calculation.
  - An operator continues from the result, but only if the result is a plain number.
  - After an error or an exponential result, an operator starts from empty. `-` starts a negative number. Other operators are ignored.
- **Keyboard:** digits and operators type. `Enter` or `=` evaluates. `Backspace` deletes. `Esc` or `Delete` clears.
- **Needs a browser check:** the `backdrop-filter` blur, the grid mask, and all the traced edge cases listed above.
