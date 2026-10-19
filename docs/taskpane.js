/* Google Icons (Material Symbols) を PowerPoint に挿入する作業ウィンドウ */
(function () {
  "use strict";

  const BASE = "https://fonts.gstatic.com/s/i/short-term/release/materialsymbols";
  const PAGE = 150;
  const CM_TO_PT = 72 / 2.54;
  const DEFAULT_SWATCHES = ["#1f1f1f", "#6b6b6b", "#c43e1c", "#1a73e8"];

  const $ = (id) => document.getElementById(id);
  const state = {
    style: "outlined",
    icons: [],
    categories: [],
    results: [],
    shown: 0,
    inOffice: false,
    canReplace: false,
  };

  // ---------- 保存（使えない環境でも動くように） ----------
  function load(key, fallback) {
    try {
      const v = localStorage.getItem("gicons." + key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      localStorage.setItem("gicons." + key, JSON.stringify(value));
    } catch (e) { /* 保存できなくても続ける */ }
  }

  // ---------- URL ----------
  function variant() {
    const w = $("wght").value;
    let v = "";
    if (w !== "400") v += "wght" + w;
    if ($("fill").checked) v += "fill1";
    return v || "default";
  }
  function svgUrl(name, px) {
    return `${BASE}${state.style}/${name}/${variant()}/${px}px.svg`;
  }

  // ---------- 日本語 → 英単語 ----------
  // カタカナはひらがなに寄せて比べる（「ほーむ」でも「ホーム」に当たる）
  function kana(s) {
    return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  }
  function loadJa(dict) {
    state.ja = Object.keys(dict).map((k) => [kana(k.toLowerCase()), dict[k]]);
    state.jaExact = new Map(state.ja);
  }
  // 日本語の検索語を「英単語のまとまり」の並びに変える。まとまりごとに AND で探す
  function jaGroups(token) {
    const t = kana(token);
    if (state.jaExact.has(t)) return [state.jaExact.get(t)];
    // 入力途中の語（「矢」→「矢印」）は前方一致・部分一致で拾う
    const partial = new Set();
    for (const [g, ws] of state.ja) if (g.includes(t)) ws.forEach((w) => partial.add(w));
    if (partial.size) return [Array.from(partial)];
    // 「赤い矢印」「上矢印」のような続け書きは、知っている語を左から長い順に切り出す
    const groups = [];
    let i = 0;
    while (i < t.length) {
      let best = null;
      for (const [g, ws] of state.ja) {
        if ((!best || g.length > best[0].length) && t.startsWith(g, i)) best = [g, ws];
      }
      if (best) { groups.push(best[1]); i += best[0].length; } else i++;
    }
    return groups;
  }
  function isAscii(s) {
    return /^[\x00-\x7f]+$/.test(s);
  }

  // ---------- 検索 ----------
  // 英単語のまとまりに対するスコア（0 は不一致）
  function scoreWords(words, label, nameWords, tags) {
    let best = 0;
    for (const w of words) {
      if (label === w) return 1000;
      if (nameWords.includes(w)) best = Math.max(best, 500);
      else if (label.includes(w)) best = Math.max(best, 200);
      else if (tags.includes(" " + w + " ")) best = Math.max(best, 50);
    }
    return best;
  }

  function search() {
    const q = $("q").value.trim().toLowerCase().replace(/_/g, " ");
    const cat = $("cat").value;
    // 各検索語を、英語ならそのまま、日本語なら英単語のまとまりに変える
    const tokens = [];
    let unknownJa = false;
    for (const t of q ? q.split(/\s+/) : []) {
      if (isAscii(t)) { tokens.push({ en: t }); continue; }
      const groups = state.ja ? jaGroups(t) : [];
      if (!groups.length) unknownJa = true;
      groups.forEach((g) => tokens.push({ words: g }));
    }
    const out = [];
    for (const ic of state.icons) {
      const [name, ci, pop, tags] = ic;
      if (cat !== "" && String(ci) !== cat) continue;
      if (unknownJa) break;
      if (!tokens.length) {
        out.push([pop, ic]);
        continue;
      }
      const label = name.replace(/_/g, " ");
      const nameWords = name.split("_");
      const paddedTags = " " + tags + " ";
      let score = 0;
      let ok = true;
      for (const t of tokens) {
        let s = 0;
        if (t.words) s = scoreWords(t.words, label, nameWords, paddedTags);
        else if (label === t.en) s = 1000;
        else if (label.startsWith(t.en)) s = 500;
        else if (label.includes(t.en)) s = 200;
        else if (tags.includes(t.en)) s = 50;
        if (!s) { ok = false; break; }
        score += s;
      }
      if (ok) out.push([score * 100000 + pop, ic]);
    }
    out.sort((a, b) => b[0] - a[0]);
    state.results = out.map((r) => r[1]);
    state.shown = 0;
    $("grid").textContent = "";
    $("count").textContent = `${state.results.length.toLocaleString()} 件`;
    renderMore();
  }

  function cell(name) {
    const b = document.createElement("button");
    b.className = "cell";
    b.title = name;
    b.dataset.name = name;
    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = "";
    img.src = svgUrl(name, 24);
    const s = document.createElement("span");
    s.textContent = name;
    b.append(img, s);
    return b;
  }

  function renderMore() {
    const frag = document.createDocumentFragment();
    const end = Math.min(state.shown + PAGE, state.results.length);
    for (let i = state.shown; i < end; i++) frag.append(cell(state.results[i][0]));
    state.shown = end;
    $("grid").append(frag);
  }

  function renderRecent() {
    const list = load("recent", []);
    $("recentWrap").hidden = !list.length;
    const box = $("recent");
    box.textContent = "";
    list.forEach((n) => box.append(cell(n)));
  }

  function refreshThumbs() {
    document.querySelectorAll(".cell").forEach((b) => {
      b.querySelector("img").src = svgUrl(b.dataset.name, 24);
    });
  }

  // ---------- 色 ----------
  function renderSwatches() {
    const box = $("swatches");
    box.textContent = "";
    load("swatches", DEFAULT_SWATCHES).forEach((c) => {
      const b = document.createElement("button");
      b.className = "sw";
      b.style.background = c;
      b.title = c + "（右クリックで削除）";
      b.onclick = () => { $("color").value = c; save("color", c); };
      b.oncontextmenu = (e) => {
        e.preventDefault();
        save("swatches", load("swatches", DEFAULT_SWATCHES).filter((x) => x !== c));
        renderSwatches();
      };
      box.append(b);
    });
  }

  // ---------- SVG 整形 ----------
  // Google の SVG は viewBox="0 -960 960 960" なので原点を 0,0 に直し、色を付ける
  function buildSvg(text, color, sizePt) {
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    const root = doc.documentElement;
    const vb = (root.getAttribute("viewBox") || "0 0 24 24").split(/[\s,]+/).map(Number);
    const px = Math.round(sizePt * 96 / 72);
    const inner = Array.from(root.childNodes)
      .map((n) => new XMLSerializer().serializeToString(n))
      .join("")
      .replace(/ xmlns="[^"]*"/g, "");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${vb[2]} ${vb[3]}">` +
      `<g transform="translate(${-vb[0]} ${-vb[1]})" fill="${color}">${inner}</g></svg>`;
  }

  // ---------- 挿入 ----------
  async function takeSelectedGeometry() {
    return PowerPoint.run(async (ctx) => {
      const shapes = ctx.presentation.getSelectedShapes();
      shapes.load("items/left,items/top,items/width,items/height");
      await ctx.sync();
      if (shapes.items.length !== 1) return null;
      const s = shapes.items[0];
      const g = { left: s.left, top: s.top, width: s.width, height: s.height };
      s.delete();
      await ctx.sync();
      return g;
    });
  }

  function setSelectedData(svg, opts) {
    return new Promise((resolve, reject) => {
      Office.context.document.setSelectedDataAsync(
        svg,
        Object.assign({ coercionType: Office.CoercionType.XmlSvg }, opts),
        (r) => (r.status === Office.AsyncResultStatus.Succeeded ? resolve() : reject(r.error))
      );
    });
  }

  async function nameInserted(name) {
    if (!state.canReplace) return;
    try {
      await PowerPoint.run(async (ctx) => {
        const shapes = ctx.presentation.getSelectedShapes();
        shapes.load("items");
        await ctx.sync();
        if (shapes.items.length === 1) shapes.items[0].name = "gicon:" + name;
        await ctx.sync();
      });
    } catch (e) { /* 名前付けは任意 */ }
  }

  async function insert(name) {
    const color = $("color").value;
    let sizePt = Math.max(0.2, parseFloat($("size").value) || 1.5) * CM_TO_PT;
    try {
      const res = await fetch(svgUrl(name, 48));
      if (!res.ok) throw new Error(`このスタイルでは取得できませんでした（${res.status}）`);
      const raw = await res.text();

      if (!state.inOffice) {
        const svg = buildSvg(raw, color, sizePt);
        try { await navigator.clipboard.writeText(svg); } catch (e) { /* 無視 */ }
        console.log(svg);
        toast(`${name}：PowerPoint の外なので、SVG をクリップボードにコピーしました`);
        remember(name);
        return;
      }

      const opts = {};
      const replacing = $("replace").checked;
      if (replacing) {
        if (!state.canReplace) throw new Error("この PowerPoint では差し替えに未対応です");
        const g = await takeSelectedGeometry();
        if (!g) throw new Error("差し替える図形を1つだけ選んでください");
        sizePt = Math.min(g.width, g.height);
        opts.imageLeft = g.left + (g.width - sizePt) / 2;
        opts.imageTop = g.top + (g.height - sizePt) / 2;
      }
      opts.imageWidth = sizePt;
      opts.imageHeight = sizePt;
      await setSelectedData(buildSvg(raw, color, sizePt), opts);
      await nameInserted(name);
      remember(name);
      // 差し替えは1回ごと。続けて押したときに別の図形を消さないよう、終わったら外す
      if (replacing) $("replace").checked = false;
      toast(replacing ? `${name} に差し替えました` : `${name} を挿入しました`);
    } catch (e) {
      toast("挿入できませんでした：" + (e && e.message ? e.message : e));
    }
  }

  function remember(name) {
    const list = [name].concat(load("recent", []).filter((n) => n !== name)).slice(0, 16);
    save("recent", list);
    renderRecent();
  }

  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  // ---------- 設定の復元と保存 ----------
  function restoreSettings() {
    const s = load("settings", {});
    if (s.style) state.style = s.style;
    document.querySelectorAll("#style button").forEach((b) => b.classList.toggle("on", b.dataset.v === state.style));
    if (s.wght) $("wght").value = s.wght;
    if (s.fill) $("fill").checked = true;
    if (s.size) $("size").value = s.size;
    $("color").value = load("color", "#1f1f1f");
  }
  function saveSettings() {
    save("settings", { style: state.style, wght: $("wght").value, fill: $("fill").checked, size: $("size").value });
  }

  // ---------- 起動 ----------
  function wire() {
    let timer;
    $("q").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(search, 120); });
    $("cat").addEventListener("change", search);
    $("style").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      state.style = b.dataset.v;
      document.querySelectorAll("#style button").forEach((x) => x.classList.toggle("on", x === b));
      saveSettings();
      refreshThumbs();
    });
    ["fill", "wght"].forEach((id) => $(id).addEventListener("change", () => { saveSettings(); refreshThumbs(); }));
    $("size").addEventListener("change", saveSettings);
    $("color").addEventListener("change", () => save("color", $("color").value));
    $("addSwatch").onclick = () => {
      const c = $("color").value;
      const list = load("swatches", DEFAULT_SWATCHES).filter((x) => x !== c);
      list.push(c);
      save("swatches", list.slice(-12));
      renderSwatches();
    };
    document.addEventListener("click", (e) => {
      const b = e.target.closest(".cell");
      if (b) insert(b.dataset.name);
    });
    new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && state.shown < state.results.length) renderMore();
    }, { rootMargin: "400px" }).observe($("more"));
  }

  async function start() {
    restoreSettings();
    renderSwatches();
    renderRecent();
    wire();
    try {
      loadJa(await (await fetch("data/ja.json?v=1")).json());
    } catch (e) { /* 日本語辞書が無くても英語で検索できる */ }
    try {
      const data = await (await fetch("data/icons.json")).json();
      state.icons = data.icons;
      state.categories = data.categories;
      data.categories.forEach((c, i) => {
        if (!c) return;
        const o = document.createElement("option");
        o.value = String(i);
        o.textContent = c;
        $("cat").append(o);
      });
      search();
    } catch (e) {
      $("count").textContent = "アイコン一覧を読み込めませんでした";
    }
    $("q").focus();
  }

  function detectOffice() {
    if (typeof Office === "undefined" || !Office.onReady) return Promise.resolve();
    return Office.onReady().then((info) => {
      state.inOffice = !!(info && info.host);
      state.canReplace = state.inOffice && Office.context.requirements.isSetSupported("PowerPointApi", "1.5");
    }).catch(() => {});
  }

  // Office の外でも動かせるよう、検出を待ちすぎない
  Promise.race([detectOffice(), new Promise((r) => setTimeout(r, 1500))]).then(start);
})();
