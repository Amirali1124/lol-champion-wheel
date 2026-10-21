/* The Forge: random League of Legends builds.
   Three difficulties, one rule each:
     Easy: the champion's own most-played build, unchanged.
     Medium: two items kept from that build, four rolled at random.
     Hard: all six items rolled at random.
   Runes and summoner spells roll randomly on every tier. */

(function () {
  'use strict';

  var CHAMPS = window.CHAMPIONS || [];
  var ITEMS = window.ITEMS || {};
  var RUNE_DATA = window.RUNES || { trees: {}, runes: {} };
  var RUNES = RUNE_DATA.runes || {};
  var TREES = RUNE_DATA.trees || {};
  var SHARDS = window.SHARDS || [];
  var SUMMONERS = window.SUMMONERS || {};

  var ITEM_IDS = Object.keys(ITEMS);
  var SUMMONER_IDS = Object.keys(SUMMONERS);
  var TOTAL_GAMES = CHAMPS.reduce(function (a, c) { return a + c.games; }, 0);
  var PATCH = '16.21';

  /* Only legendary items can be rolled: components, epic items, wards and
     potions are not build slots. */
  var POOL = ITEM_IDS.filter(function (id) { return ITEMS[id].legendary; });
  var BOOTS_POOL = ITEM_IDS.filter(function (id) { return ITEMS[id].boots; });
  var AP_POOL = POOL.filter(function (id) { return ITEMS[id].ap; });
  var AD_POOL = POOL.filter(function (id) { return ITEMS[id].ad; });
  var SHARED_POOL = POOL.filter(function (id) { return !ITEMS[id].ap && !ITEMS[id].ad; });

  /* ------------------------------------------------------------------
     The three tiers.
     Easy   six items rolled from the champion's own damage pool
     Medium two from that pool, four from everywhere
     Hard   all six from everywhere
     ------------------------------------------------------------------ */
  var TIERS = [
    { id: 'easy', name: 'Easy', themed: 6,
      rule: 'All six items rolled from the champion\'s own damage pool.',
      note: 'Six items rolled at random from the pool that suits this champion: spell damage for a mage, attack damage for a marksman, plus the shared tank items.' },
    { id: 'medium', name: 'Medium', themed: 2,
      rule: 'Two items from that pool, four from everywhere.',
      note: 'Two items rolled from the champion\'s own damage pool; the other four rolled from the whole legendary pool.' },
    { id: 'hard', name: 'Hard', themed: 0,
      rule: 'All six items rolled from the whole legendary pool.',
      note: 'All six items rolled at random from every legendary item in the shop. Runes and spells roll every time.' }
  ];

  var state = {
    view: 'forge',
    champion: null,
    tier: 'easy',
    build: null,
    lane: 'all',
    query: '',
    codexLane: 'all',
    codexQuery: '',
    codexSort: 'games',
    codexLimit: 25
  };

  /* ------------------------------------------------------------------
     Random helpers
     ------------------------------------------------------------------ */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Two items cannot both sit in a build if they are the same item, or if
     both are boots: a champion wears one pair. Everything else is legal, since
     the shop sells as many components as you like. */
  function conflicts(a, b) {
    var A = ITEMS[a], B = ITEMS[b];
    if (!A || !B) return false;
    if (a === b) return true;
    return A.tags.indexOf('Boots') !== -1 && B.tags.indexOf('Boots') !== -1;
  }

  /* Six items that can actually be bought together: no duplicates, and never
     two pairs of boots. */
  function rollItems(count, from, exclude) {
    var chosen = [];
    var taken = (exclude || []).slice();
    var guard = 0;
    while (chosen.length < count && guard < 6000) {
      guard++;
      var id = pick(from);
      if (taken.indexOf(id) !== -1) continue;
      var clash = false;
      for (var i = 0; i < chosen.length; i++) if (conflicts(chosen[i], id)) { clash = true; break; }
      for (var j = 0; j < taken.length; j++) if (conflicts(taken[j], id)) { clash = true; break; }
      if (clash) continue;
      chosen.push(id);
    }
    return chosen;
  }

  /* Summoner spells: two distinct ones, and never the same spell twice. */
  function rollSummoners() {
    var two = shuffled(SUMMONER_IDS).slice(0, 2);
    return two;
  }

  /* ------------------------------------------------------------------
     Runes: a primary tree and a secondary tree, each with a keystone.
     ------------------------------------------------------------------ */
  var TREE_IDS = Object.keys(TREES);

  function rollRunes() {
    var primary = pick(TREE_IDS);
    var secondary = pick(TREE_IDS.filter(function (t) { return t !== primary; }));
    var pTree = TREES[primary], sTree = TREES[secondary];
    var out = [];
    // keystone, three minors, then the secondary keystone and its minor
    out.push(pick(pTree.rows[0]));
    out.push(pick(pTree.rows[1]));
    out.push(pick(pTree.rows[2]));
    out.push(pick(pTree.rows[3]));
    out.push(pick(sTree.rows[0]));
    out.push(pick(sTree.rows[1]));
    return out;
  }

  function rollShards() {
    var group = pick(SHARDS);
    return group.shards.map(function (s) { return s.id; });
  }

  /* ------------------------------------------------------------------
     The roll
     ------------------------------------------------------------------ */
  /* The pool that suits a champion: the items for their damage type, plus the
     shared tank items every champion can use. */
  function themedPool(champ) {
    var dmg = champ.dmg === 'AD' ? AD_POOL : AP_POOL;
    return dmg.concat(SHARED_POOL);
  }

  function buildFor(champ, tier) {
    var themed = themedPool(champ);
    var items, runes, shards, summoners;

    if (tier.themed === 6) {
      items = rollItems(6, themed, []);
    } else if (tier.themed === 2) {
      // The two themed slots come first, so a later boots swap can never
      // take one of them away.
      var two = rollItems(2, themed, []);
      var four = rollItems(4, POOL, two);
      items = two.concat(four);
    } else {
      items = rollItems(6, POOL, []);
    }

    // Every build wears boots. If the roll did not pick a pair, swap one slot
    // for them: on Easy the pair comes from the champion's own pool, so the
    // build stays in the same damage type.
    if (!items.some(function (id) { return ITEMS[id].boots; })) {
      var pool = tier.themed === 6 ? themed : POOL;
      var pairs = pool.filter(function (id) { return ITEMS[id].boots; });
      if (pairs.length) {
        // never take a themed slot on Medium
        var from = tier.themed === 2 ? 2 : 0;
        items[from + Math.floor(Math.random() * (items.length - from))] = pick(pairs);
      }
    }

    runes = rollRunes();
    shards = rollShards();
    summoners = rollSummoners();

    return { items: items, runes: runes, shards: shards, summoners: summoners, tier: tier.id };
  }

  /* ------------------------------------------------------------------
     Formatting
     ------------------------------------------------------------------ */
  function fmtInt(n) { return Number(n || 0).toLocaleString('en-US'); }
  function fmtPct(x, digits) { return (x * 100).toFixed(digits === undefined ? 1 : digits) + '%'; }
  function fmtGold(g) { return fmtInt(g) + 'g'; }

  function laneLabel(lanes) {
    if (!lanes || !lanes.length) return 'Any lane';
    return lanes.join(', ');
  }

  /* How many of the 173 champions build each item. Computed once. */
  var ITEM_USAGE = null;
  function itemUsage() {
    if (ITEM_USAGE) return ITEM_USAGE;
    ITEM_USAGE = {};
    CHAMPS.forEach(function (c) {
      c.build.forEach(function (id) { ITEM_USAGE[id] = (ITEM_USAGE[id] || 0) + 1; });
    });
    return ITEM_USAGE;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function img(src, alt, cls, w, h, eager) {
    var i = el('img');
    if (cls) i.className = cls;
    i.src = src; i.alt = alt || ''; i.decoding = 'async';
    i.loading = eager ? 'eager' : 'lazy';
    if (eager) i.fetchPriority = 'high';
    if (w) i.width = w;
    if (h) i.height = h;
    return i;
  }

  /* ------------------------------------------------------------------
     The champion picker
     ------------------------------------------------------------------ */
  function filteredChamps() {
    var q = state.query.trim().toLowerCase();
    return CHAMPS.filter(function (c) {
      if (state.lane !== 'all' && c.lanes.indexOf(state.lane) === -1) return false;
      if (!q) return true;
      return c.name.toLowerCase().indexOf(q) !== -1 || c.title.toLowerCase().indexOf(q) !== -1;
    });
  }

  function renderPicker() {
    var list = document.getElementById('champ-list');
    var empty = document.getElementById('picker-empty');
    var count = document.getElementById('picker-count');
    var shown = filteredChamps();
    list.textContent = '';
    shown.forEach(function (c) {
      var li = el('li');
      var b = el('button');
      b.type = 'button';
      b.setAttribute('aria-pressed', state.champion && state.champion.key === c.key ? 'true' : 'false');
      b.title = c.name + ' · ' + c.title;
      b.setAttribute('aria-label', c.name + ', ' + c.title);
      b.appendChild(img(c.portrait, '', '', 48, 48));
      b.addEventListener('click', function () { selectChampion(c); });
      li.appendChild(b);
      list.appendChild(li);
    });
    count.textContent = shown.length + ' of ' + CHAMPS.length;
    empty.hidden = shown.length > 0;
  }

  /* ------------------------------------------------------------------
     The roll panel
     ------------------------------------------------------------------ */
  function renderTiers() {
    var rules = document.getElementById('tier-rules');
    rules.textContent = '';

    TIERS.forEach(function (t) {
      var on = state.tier === t.id;
      var rule = el('button', 'rule' + (on ? ' rule--on' : ''));
      rule.type = 'button';
      rule.setAttribute('role', 'radio');
      rule.setAttribute('aria-checked', on ? 'true' : 'false');
      rule.appendChild(el('span', 'rule__name', t.name));
      rule.appendChild(el('span', 'rule__text', t.rule));
      rule.addEventListener('click', function () {
        if (state.tier === t.id) return;
        state.tier = t.id;
        renderTiers();
        roll();
      });
      rules.appendChild(rule);
    });
  }

  function renderRoll() {
    var champ = state.champion;
    var meta = document.getElementById('roll-mode');
    var hero = document.getElementById('hero-splash');
    var rollGrid = document.querySelector('.roll__grid');
    var slots = document.getElementById('slots');
    var actions = document.querySelector('.roll__actions');

    if (!champ) {
      // The panel keeps its frame: the first screen shows what a build is,
      // not an empty box.
      rollGrid.hidden = true;
      slots.hidden = true;
      actions.hidden = true;
      hero.hidden = true;
      meta.textContent = '';
      document.getElementById('slots-foot').textContent = '';
      document.getElementById('hero-name').textContent = 'No champion yet';
      document.getElementById('hero-title').textContent = 'Pick one on the right to start';
      document.getElementById('hero-tags').textContent = '';
      document.getElementById('meta-body').textContent = '';
      document.getElementById('meta-meta').textContent = '';
      document.getElementById('context-body').textContent = '';
      document.getElementById('context-meta').textContent = '';
      return;
    }

    rollGrid.hidden = false;
    slots.hidden = false;
    actions.hidden = false;
    hero.hidden = false;

    hero.src = champ.splash;
    hero.alt = champ.name + ', ' + champ.title;
    document.getElementById('hero-name').textContent = champ.name;
    document.getElementById('hero-title').textContent = champ.title;
    document.getElementById('forge-stamp').textContent = 'Patch ' + PATCH + ' · ' + fmtInt(TOTAL_GAMES) + ' ranked games';

    var tags = document.getElementById('hero-tags');
    tags.textContent = '';
    tags.appendChild(el('span', 'chip', champ.dmg === 'AD' ? 'Attack damage' : 'Spell damage'));
    tags.appendChild(el('span', 'chip', laneLabel(champ.lanes)));

    meta.textContent = state.build ? TIERS.filter(function (t) { return t.id === state.tier; })[0].name + ' build' : '';

    renderSlots();
    renderRunes();
    renderContext();
    renderMeta();
  }

  function renderSlots() {
    var wrap = document.getElementById('slots');
    var foot = document.getElementById('slots-foot');
    wrap.textContent = '';
    wrap.classList.remove('is-rolled');
    foot.textContent = '';
    if (!state.build) return;
    var maxPick = 0, gold = 0;
    state.build.items.forEach(function (id) {
      var it = ITEMS[id];
      if (it && it.pick > maxPick) maxPick = it.pick;
      if (it) gold += it.gold;
    });
    var tier = TIERS.filter(function (t) { return t.id === state.tier; })[0];
    state.build.items.forEach(function (id, i) {
      var it = ITEMS[id];
      var slot = el('div', 'slot' + (it ? '' : ' slot--empty'));
      slot.style.setProperty('--i', i);
      if (it) {
        slot.appendChild(img(it.icon, it.name, 'slot__icon', 44, 44, true));
        slot.appendChild(el('span', 'slot__name', it.name));
        slot.appendChild(el('span', 'slot__meta', fmtGold(it.gold)));
        if (it.pick) {
          var bar = el('div', 'slot__bar');
          var fill = el('i');
          fill.style.width = Math.max(6, Math.round((it.pick / maxPick) * 100)) + '%';
          bar.appendChild(fill);
          slot.appendChild(bar);
        }
      } else {
        slot.appendChild(el('span', 'slot__name', '—'));
      }
      wrap.appendChild(slot);
    });

    foot.appendChild(el('b', null, fmtGold(gold)));
    foot.appendChild(el('span', null, 'total'));
    foot.appendChild(el('span', null, '·'));
    if (tier.themed === 6) {
      foot.appendChild(el('span', null, 'all six from the ' + (state.champion.dmg === 'AD' ? 'AD' : 'AP') + ' pool'));
    } else if (tier.themed === 2) {
      foot.appendChild(el('span', null, '2 from the ' + (state.champion.dmg === 'AD' ? 'AD' : 'AP') + ' pool, 4 from all'));
    } else {
      foot.appendChild(el('span', null, 'every item rolled at random'));
    }
  }

  /* ------------------------------------------------------------------
     Runes and spells
     ------------------------------------------------------------------ */
  function renderRunes() {
    var body = document.getElementById('runes-body');
    var meta = document.getElementById('runes-meta');
    body.textContent = '';
    if (!state.build) { meta.textContent = ''; return; }

    var byTree = {};
    state.build.runes.forEach(function (id) {
      var r = RUNES[id];
      if (!r) return;
      (byTree[r.tree] = byTree[r.tree] || []).push(r);
    });

    // a rune page, read as rows: one row per tree, one for shards and spells
    var page = el('div', 'page');

    Object.keys(byTree).forEach(function (treeId) {
      var tree = TREES[treeId];
      var runes = byTree[treeId];
      var row = el('div', 'page__row');
      var label = el('div', 'page__label');
      if (tree) label.appendChild(img(tree.icon, tree.name, '', 18, 18));
      label.appendChild(el('span', null, tree ? tree.name : 'Runes'));
      label.appendChild(el('span', 'page__role', runes.length === 4 ? 'Primary' : 'Secondary'));
      row.appendChild(label);
      var list = el('div', 'page__items');
      runes.forEach(function (r) {
        var w = el('div', 'rune');
        w.title = r.shortDesc || r.name;
        w.appendChild(img(r.icon, r.name, '', 30, 30, true));
        w.appendChild(el('span', 'rune__name', r.name));
        list.appendChild(w);
      });
      row.appendChild(list);
      page.appendChild(row);
    });

    var last = el('div', 'page__row');
    last.appendChild(el('div', 'page__label', 'Shards and spells'));
    var list = el('div', 'page__items');
    (state.build.shards || []).forEach(function (id) {
      var s = null;
      SHARDS.forEach(function (g) {
        g.shards.forEach(function (x) { if (String(x.id) === String(id)) s = x; });
      });
      if (!s) return;
      var w = el('div', 'rune');
      w.title = s.desc;
      w.appendChild(img(s.icon, s.name, '', 30, 30, true));
      w.appendChild(el('span', 'rune__name', s.name));
      list.appendChild(w);
    });
    (state.build.summoners || []).forEach(function (id) {
      var s = SUMMONERS[id];
      if (!s) return;
      var w = el('div', 'rune');
      w.title = s.desc;
      w.appendChild(img(s.icon, s.name, '', 30, 30, true));
      w.appendChild(el('span', 'rune__name', s.name));
      list.appendChild(w);
    });
    last.appendChild(list);
    page.appendChild(last);

    body.appendChild(page);
    meta.textContent = 'Rolled at random';
  }

  /* ------------------------------------------------------------------
     The rolled build against the champion's own ranked build
     ------------------------------------------------------------------ */
  function renderMeta() {
    var body = document.getElementById('meta-body');
    var meta = document.getElementById('meta-meta');
    body.textContent = '';
    var c = state.champion;
    if (!c) { meta.textContent = ''; return; }

    var metaIds = c.build.filter(function (id) { return ITEMS[id]; });
    var grid = el('div', 'meta-grid');
    metaIds.forEach(function (id) {
      var it = ITEMS[id];
      var inBuild = state.build && state.build.items.indexOf(id) !== -1;
      var cell = el('div', 'meta-cell' + (inBuild ? ' meta-cell--in' : ''));
      cell.title = it.name + (inBuild ? ', kept in this build' : ', rolled out');
      cell.appendChild(img(it.icon, it.name, 'meta-cell__icon', 32, 32, true));
      cell.appendChild(el('span', 'meta-cell__name', it.name));
      grid.appendChild(cell);
    });
    body.appendChild(grid);

    var same = state.build ? state.build.items.filter(function (id) { return metaIds.indexOf(id) !== -1; }).length : 0;
    meta.textContent = same + ' of 6 shared with the ranked build';
  }

  /* ------------------------------------------------------------------
     The champion's ranked numbers, under their portrait
     ------------------------------------------------------------------ */
  function renderContext() {
    var body = document.getElementById('context-body');
    var meta = document.getElementById('context-meta');
    body.textContent = '';
    var c = state.champion;
    if (!c) { meta.textContent = ''; return; }

    var figs = el('div', 'figures');
    function figure(label, value) {
      var f = el('div', 'figure');
      f.appendChild(el('div', 'figure__label', label));
      f.appendChild(el('div', 'figure__value num', value));
      return f;
    }
    figs.appendChild(figure('Games', fmtInt(c.games)));
    figs.appendChild(figure('Win rate', c.winrate === null ? '—' : fmtPct(c.winrate)));
    figs.appendChild(figure('Pick rate', fmtPct(c.pickrate, 2)));
    body.appendChild(figs);

    // where the champion sits among the 173, on the two numbers that decide a pick
    var byGames = CHAMPS.slice().sort(function (a, b) { return b.games - a.games; });
    var gameRank = byGames.findIndex(function (x) { return x.key === c.key; }) + 1;
    var byWin = CHAMPS.slice().filter(function (x) { return x.winrate !== null; })
      .sort(function (a, b) { return b.winrate - a.winrate; });
    var winRank = byWin.findIndex(function (x) { return x.key === c.key; }) + 1;

    var ranks = el('div', 'ranks');
    [
      ['Most played of 173 champions', 'rank ' + gameRank],
      ['Highest win rate of 173 champions', 'rank ' + winRank]
    ].forEach(function (pair) {
      var row = el('div', 'rank');
      row.appendChild(el('span', null, pair[0]));
      row.appendChild(el('span', 'num', pair[1]));
      ranks.appendChild(row);
    });
    body.appendChild(ranks);

    // the item the whole field builds most, for scale
    var usage = itemUsage();
    var topItem = null, topCount = 0;
    Object.keys(usage).forEach(function (id) {
      if (usage[id] > topCount && ITEMS[id]) { topCount = usage[id]; topItem = id; }
    });
    if (topItem) {
      var it = ITEMS[topItem];
      var row = el('div', 'row');
      row.appendChild(img(it.icon, it.name, '', 28, 28, true));
      var w = el('div', 'row__text');
      w.appendChild(el('span', null, it.name));
      w.appendChild(el('span', 'sub', 'Built by ' + topCount + ' of the 173 champions'));
      row.appendChild(w);
      body.appendChild(row);
    }
    meta.textContent = 'Across ' + fmtInt(TOTAL_GAMES) + ' ranked games';
  }

  /* ------------------------------------------------------------------
     Actions
     ------------------------------------------------------------------ */
  function selectChampion(c) {
    state.champion = c;
    state.tier = 'easy';
    renderPicker();
    renderTiers();
    roll();
  }

  function roll() {
    if (!state.champion) return;
    state.build = buildFor(state.champion, TIERS.filter(function (t) { return t.id === state.tier; })[0]);
    renderRoll();
    // the slots settle one after another, so a roll reads as a roll
    var slots = document.getElementById('slots');
    slots.classList.add('is-rolled');
    setTimeout(function () { slots.classList.remove('is-rolled'); }, 900);
    document.getElementById('roll-flash').textContent = 'Rolled ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function buildText() {
    if (!state.build || !state.champion) return '';
    var lines = [];
    lines.push(state.champion.name + ' · ' + TIERS.filter(function (t) { return t.id === state.tier; })[0].name + ' build');
    lines.push('Items: ' + state.build.items.map(function (id) { return ITEMS[id] ? ITEMS[id].name : id; }).join(', '));
    lines.push('Runes: ' + state.build.runes.map(function (id) { return RUNES[id] ? RUNES[id].name : id; }).join(', '));
    lines.push('Summoners: ' + state.build.summoners.map(function (id) { return SUMMONERS[id] ? SUMMONERS[id].name : id; }).join(', '));
    return lines.join('\n');
  }

  function copyBuild() {
    var text = buildText();
    if (!text) return;
    var flash = document.getElementById('roll-flash');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        flash.textContent = 'Build copied to the clipboard';
      }, function () {
        flash.textContent = 'Could not copy. The build is in the panel above.';
      });
    } else {
      flash.textContent = 'Clipboard unavailable in this browser';
    }
  }

  /* ------------------------------------------------------------------
     The codex
     ------------------------------------------------------------------ */
  function codexRows() {
    var q = state.codexQuery.trim().toLowerCase();
    var rows = CHAMPS.filter(function (c) {
      if (state.codexLane !== 'all' && c.lanes.indexOf(state.codexLane) === -1) return false;
      if (!q) return true;
      return c.name.toLowerCase().indexOf(q) !== -1 || c.title.toLowerCase().indexOf(q) !== -1;
    });
    if (state.codexSort === 'games') rows.sort(function (a, b) { return b.games - a.games; });
    else if (state.codexSort === 'winrate') rows.sort(function (a, b) { return (b.winrate || 0) - (a.winrate || 0); });
    else rows.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return rows;
  }

  function renderCodex() {
    var body = document.getElementById('codex-body');
    var empty = document.getElementById('codex-empty');
    var rows = codexRows();
    var shown = rows.slice(0, state.codexLimit);
    body.textContent = '';

    shown.forEach(function (c) {
      var tr = el('tr');
      var tdName = el('td');
      var cell = el('div', 'champ-cell');
      cell.appendChild(img(c.portrait, c.name, '', 32, 32));
      var names = el('div');
      names.appendChild(el('span', 'champ-cell__name', c.name));
      names.appendChild(el('span', 'champ-cell__lane', laneLabel(c.lanes)));
      cell.appendChild(names);
      tdName.appendChild(cell);
      tr.appendChild(tdName);

      var tdBuild = el('td');
      var buildCell = el('div', 'build-cell');
      c.build.forEach(function (id) {
        var it = ITEMS[id];
        if (it) buildCell.appendChild(img(it.icon, it.name, '', 26, 26));
      });
      tdBuild.appendChild(buildCell);
      tr.appendChild(tdBuild);

      tr.appendChild(el('td', 'n num', fmtInt(c.games)));
      tr.appendChild(el('td', 'n num', c.winrate === null ? '—' : fmtPct(c.winrate)));
      tr.appendChild(el('td', 'n num', fmtPct(c.pickrate, 2)));

      var tdAct = el('td');
      var b = el('button', 'row-action', 'Forge');
      b.type = 'button';
      b.addEventListener('click', function () {
        switchView('forge');
        selectChampion(c);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      tdAct.appendChild(b);
      tr.appendChild(tdAct);

      body.appendChild(tr);
    });

    empty.hidden = rows.length > 0;
    document.getElementById('codex-count').textContent = rows.length + ' champions';
    document.getElementById('codex-shown').textContent =
      'Showing ' + shown.length + ' of ' + rows.length + ' champions';
    var more = document.getElementById('codex-more');
    more.textContent = state.codexLimit >= rows.length ? 'Show all' : 'Show all ' + rows.length;
    more.hidden = rows.length <= 25;
    document.getElementById('codex-stamp').textContent = 'Patch ' + PATCH + ' · ' + fmtInt(TOTAL_GAMES) + ' ranked games';
  }

  function renderTopItems() {
    var list = document.getElementById('top-items');
    list.textContent = '';
    var counts = {};
    CHAMPS.forEach(function (c) {
      c.build.forEach(function (id) { counts[id] = (counts[id] || 0) + 1; });
    });
    var rows = Object.keys(counts).map(function (id) {
      return { id: id, name: ITEMS[id] ? ITEMS[id].name : id, n: counts[id] };
    }).sort(function (a, b) { return b.n - a.n; }).slice(0, 10);
    var max = rows.length ? rows[0].n : 1;
    rows.forEach(function (r) {
      var li = el('li');
      li.appendChild(el('span', 'barlist__label', r.name));
      var track = el('span', 'barlist__track');
      var fill = el('span', 'barlist__fill');
      fill.style.width = Math.max(4, Math.round((r.n / max) * 100)) + '%';
      track.appendChild(fill);
      li.appendChild(track);
      li.appendChild(el('span', 'barlist__value num', r.n + ' champs'));
      list.appendChild(li);
    });
  }

  function renderTopChamps() {
    var list = document.getElementById('top-champs');
    list.textContent = '';
    var rows = CHAMPS.slice().sort(function (a, b) { return b.games - a.games; }).slice(0, 10);
    var max = rows.length ? rows[0].games : 1;
    rows.forEach(function (c) {
      var li = el('li');
      li.appendChild(el('span', 'barlist__label', c.name));
      var track = el('span', 'barlist__track');
      var fill = el('span', 'barlist__fill');
      fill.style.width = Math.max(4, Math.round((c.games / max) * 100)) + '%';
      track.appendChild(fill);
      li.appendChild(track);
      li.appendChild(el('span', 'barlist__value num', fmtInt(c.games)));
      list.appendChild(li);
    });
  }

  /* ------------------------------------------------------------------
     View switching
     ------------------------------------------------------------------ */
  function switchView(view) {
    state.view = view;
    document.querySelectorAll('[data-view-panel]').forEach(function (p) {
      p.hidden = p.getAttribute('data-view-panel') !== view;
    });
    document.querySelectorAll('.topbar__nav button[data-view]').forEach(function (b) {
      if (b.getAttribute('data-view') === view) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    if (view === 'codex') renderCodex();
    window.scrollTo({ top: 0 });
  }

  /* ------------------------------------------------------------------
     Wiring
     ------------------------------------------------------------------ */
  function wireSegmented(id, onPick) {
    var group = document.getElementById(id);
    if (!group) return;
    group.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      group.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      onPick(b);
    });
  }

  function init() {
    document.getElementById('forge-stamp').textContent = 'Patch ' + PATCH + ' · ' + fmtInt(TOTAL_GAMES) + ' ranked games';

    document.querySelectorAll('.topbar__nav button[data-view]').forEach(function (b) {
      b.addEventListener('click', function () { switchView(b.getAttribute('data-view')); });
    });

    var search = document.getElementById('champ-search');
    search.addEventListener('input', function () { state.query = search.value; renderPicker(); });

    wireSegmented('lane-filter', function (b) { state.lane = b.getAttribute('data-lane'); renderPicker(); });
    wireSegmented('codex-lane', function (b) { state.codexLane = b.getAttribute('data-lane'); state.codexLimit = 25; renderCodex(); });
    wireSegmented('codex-sort', function (b) { state.codexSort = b.getAttribute('data-sort'); renderCodex(); });

    document.getElementById('random-champion').addEventListener('click', function () {
      var pool = filteredChamps();
      if (!pool.length) return;
      selectChampion(pick(pool));
    });

    document.getElementById('roll-btn').addEventListener('click', roll);
    document.getElementById('copy-btn').addEventListener('click', copyBuild);

    var codexSearch = document.getElementById('codex-search');
    codexSearch.addEventListener('input', function () {
      state.codexQuery = codexSearch.value; state.codexLimit = 25; renderCodex();
    });

    document.getElementById('codex-more').addEventListener('click', function () {
      state.codexLimit = codexRows().length;
      renderCodex();
    });

    renderPicker();
    renderTiers();
    renderTopItems();
    renderTopChamps();
    renderCodex();

    // open on a real champion and a real build, so the first screen shows the product
    if (CHAMPS.length) selectChampion(CHAMPS[0]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
