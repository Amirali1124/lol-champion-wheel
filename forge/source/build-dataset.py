"""Rebuild The Forge's static dataset from scratch.

Two steps, run in order:

  1. fetch-raw-builds.py   pulls every champion's most-played ranked build from
                           u.gg's public stats API into raw-champions.json
  2. build-dataset.py     (this file) turns that raw data plus Riot's Data
                           Dragon into the five .js files the site loads

The item pool is every legendary and mythic item in the Summoner's Rift shop.
Components, wards, potions and the flat starting items (Doran's line, Cull,
the gold and vision starters) are not build slots, so they are excluded.

Each item is tagged AP, AD or neither by what it does, and each champion is
classed AP or AD by the build they actually run in ranked, so that the Easy
tier can roll a mage's items for a mage.

Sources
  u.gg          https://stats2.u.gg/lol/1.5/overview/16_20/ranked_solo_5x5/<id>/1.5.0.json
  Data Dragon   https://ddragon.leagueoflegends.com/cdn/16.20.1/data/en_US/
  CommunityDragon   champion splash art
  bigbrain.gg   a mirror of Riot's static assets, used for perk icons

Run it from this folder:  python build-dataset.py
"""
import json, io, os, collections, re, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'data')

PATCH = '16_21'
VER = '16.21.1'
DD = 'https://ddragon.leagueoflegends.com/cdn/%s/data/en_US/' % VER
DD_IMG = 'https://ddragon.leagueoflegends.com/cdn/%s/img/' % VER
CD = ('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/'
      'global/default/assets/characters/')
BB = 'https://static.bigbrain.gg/assets/lol/riot_static/%s/img/' % VER
SHARDS_URL = ('https://static.bigbrain.gg/assets/lol/riot_patch_update/prod/'
              'stat-shards-v2.json')
# CommunityDragon carries the items Riot has announced but not yet shipped.
CD_ITEMS = ('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/'
            'global/default/v1/items.json')
# Meraki's item file carries Riot's own tier: 1 is a component, 2 legendary,
# 3 mythic. It is the one field that says outright which items are components.

# Champions Riot renamed: the community asset path differs from the display name.
SLUG = {'Wukong': 'monkeyking', 'Renata Glasc': 'renata', 'Nunu & Willump': 'nunu'}
SPLASH_FILE = {'Xin Zhao': 'xinzhaorework'}

# Items that can never hold a build slot: wards, potions, elixirs and pets.
NOT_A_SLOT = {'Control Ward', 'Stealth Ward', 'Scarecrow Effigy', 'Farsight Alteration',
              'Oracle Lens', 'Health Potion', 'Refillable Potion', 'Cappa Juice',
              'Elixir of Iron', 'Elixir of Sorcery', 'Elixir of Wrath',
              'Scorchclaw Pup', 'Gustwalker Hatchling', 'Mosstomper Seedling',
              "Kalista's Black Spear"}

# The shop rarities come from lolshop.gg, which lists every item in the
# Summoner's Rift shop and sorts it into Riot's own rarities: legendaries,
# epics, basics, starters, boots and consumables. Riot's own item file does
# not state the rarity, and the recipe lists cannot tell a legendary item
# from an epic one, because a legendary item may share a component with
# another. lolshop.gg is the one source that says it outright.
# fetch-lolshop-items.py writes the list this reads.

# The item pool is the legendary items in the Summoner's Rift shop that a
# champion actually builds in the current patch. Items Riot has announced but
# not yet put on sale are filtered out by Riot's own shop flags, and the
# ultimate-shop items, which no champion builds, drop out with them.

# What an item does, by Riot's own tags.
AP_TAGS = {'SpellDamage', 'MagicPenetration', 'SpellBlock', 'Mana', 'ManaRegen', 'SpellVamp'}
AD_TAGS = {'Damage', 'AttackSpeed', 'CriticalStrike', 'ArmorPenetration', 'LifeSteal', 'OnHit'}


def get_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0',
                                               'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode('utf-8'))


def cache(name, url):
    """Fetch a JSON file once and keep it beside this script."""
    path = os.path.join(HERE, name)
    if not os.path.exists(path):
        print('  fetching', name, flush=True)
        with io.open(path, 'w', encoding='utf-8') as f:
            json.dump(get_json(url), f, ensure_ascii=False)
    return json.load(io.open(path, encoding='utf-8'))


def norm(s):
    return ''.join(ch for ch in s.lower() if ch.isalnum())


def slug(name):
    return SLUG.get(name) or ''.join(ch for ch in name.lower() if ch.isalnum())


def write(name, obj):
    path = os.path.join(DATA, name + '.js')
    with io.open(path, 'w', encoding='utf-8') as f:
        f.write('window.' + name.upper() + ' = ')
        json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')
    print('  %-16s %7d bytes' % (name + '.js', os.path.getsize(path)))


def main():
    if not os.path.isdir(DATA):
        os.makedirs(DATA)

    print('reading Riot Data Dragon')
    dd_champs = cache('champion.json', DD + 'champion.json')['data']
    raw_items = cache('item.json', DD + 'item.json')['data']
    runes_raw = cache('runesReforged.json', DD + 'runesReforged.json')
    summ_raw = cache('summoner.json', DD + 'summoner.json')['data']
    shards_raw = cache('stat-shards.json', SHARDS_URL)

    # Data Dragon's file name differs from the display name for some champions
    # (Cho'Gath ships as Chogath.png), so take it from the API.
    portrait_file = {v['name']: v['image']['full'] for v in dd_champs.values()}
    champ_info = {v['name']: v for v in dd_champs.values()}

    raw = json.load(io.open(os.path.join(HERE, 'raw-champions.json'), encoding='utf-8'))
    raw = [b for b in raw if 'error' not in b]
    print('raw builds:', len(raw))

    cd_items = {str(x['id']): x for x in cache('cd-items.json', CD_ITEMS)}

    def purchasable(item_id):
        """Can this item be bought in the Summoner's Rift shop right now?"""
        v = raw_items.get(str(item_id))
        if v is not None:
            return bool(v.get('maps', {}).get('11')) and v.get('inStore') is not False
        c = cd_items.get(str(item_id))
        if c is not None:
            return c.get('inStore') is True
        return False

    # ---- items ------------------------------------------------------------
    # Everything sold in the Summoner's Rift shop: Draft Pick, Ranked Draft
    # and Ranked Solo/Duo all share one shop.
    on_sr = {k: v for k, v in raw_items.items()
             if k.isdigit() and v.get('maps', {}).get('11') and v.get('inStore') is not False}

    # How often each item id shows up in a real ranked build, so that where
    # Data Dragon lists one item under several ids we keep the one players buy.
    seen = collections.Counter()
    # And how often each item shows up anywhere in the champions' ranked data,
    # across every rank tier and lane. An item nobody builds is not in the
    # pool, however legendary it is.
    usage = collections.Counter()
    for b in raw:
        for i in b.get('core', []):
            seen[str(i)] += 1
        for sl in b.get('slots', []):
            for cand in sl:
                seen[str(cand[0])] += 1
        for k, n in (b.get('usage') or {}).items():
            usage[str(k)] += n
    print('items seen in the ranked data: %d' % len(usage))

    # Only legendary items can hold a build slot, and the list of those comes
    # from lolshop.gg. A few of the items it lists are announced for the
    # patch but not yet purchasable, so Riot's own shop flags decide: an item
    # is in the pool only if it can be bought on Summoner's Rift right now.
    shop = json.load(io.open(os.path.join(HERE, 'lolshop-items.json'), encoding='utf-8'))
    legendary_ids = set(str(i) for i in shop['legendaries'] if purchasable(i))
    boot_ids = set(str(i) for i in shop['boots'] if purchasable(i))
    print('lolshop list: %d legendaries and %d boots in the shop now'
          % (len(legendary_ids), len(boot_ids)))

    by_name = collections.defaultdict(list)
    for k, v in on_sr.items():
        n = v['name']
        if n in NOT_A_SLOT or n == 'Boots':   # the 300g Boots is a component
            continue
        if k in legendary_ids:
            rank = 'LEGENDARY'
        elif k in boot_ids:
            rank = 'BOOTS'
        else:
            continue
        # and only if a champion actually builds it
        if usage.get(k, 0) < 1:
            continue
        by_name[n].append((k, rank))

    items = {}
    for name, pairs in by_name.items():
        # the id players actually buy, then the shop rarity of the item
        k, rank = sorted(pairs, key=lambda x: (-seen.get(x[0], 0), -on_sr[x[0]]['gold']['total']))[0]
        v = on_sr[k]
        tags = sorted(set(v.get('tags') or []))
        ap = bool(set(tags) & AP_TAGS)
        ad = bool(set(tags) & AD_TAGS)
        items[k] = {
            'name': name,
            'gold': v.get('gold', {}).get('total', 0),
            'tags': tags,
            'plain': v.get('plaintext', '') or '',
            'icon': DD_IMG + 'item/%s.png' % k,
            'pick': 0,
            'win': None,
            # 'ap' and 'ad' can both be true: an item that suits either damage type
            'ap': ap,
            'ad': ad,
            # legendary, distributed and boots are the items that can hold a
            # build slot. Riot lists boots under their own rank, but in the
            # shop they are legendary-tier items.
            'legendary': rank in ('LEGENDARY', 'DISTRIBUTED', 'BOOTS'),
            # boots are their own kind within the legendary set
            'boots': rank == 'BOOTS',
        }

    # ---- item pick and win rates -----------------------------------------
    picks = collections.Counter()
    wins = collections.Counter()
    for b in raw:
        for sl in b.get('slots', []):
            for cand in sl:
                k = str(cand[0])
                if k in items:
                    picks[k] += cand[2]
                    wins[k] += cand[1]
    for k, v in items.items():
        p = picks.get(k, 0)
        v['pick'] = p
        v['win'] = round(wins[k] / p, 4) if p else None

    # ---- champion damage class -------------------------------------------
    # A champion's class follows the build they actually run in ranked, so
    # that the Easy tier rolls the items that suit them.
    def build_vote(item_ids):
        ap = ad = 0
        for i in item_ids:
            it = items.get(str(i))
            if not it:
                continue
            if it['ap'] and not it['ad']:
                ap += 1
            elif it['ad'] and not it['ap']:
                ad += 1
        return ap, ad

    # ---- lanes ------------------------------------------------------------
    lanes = {}
    src = io.open(os.path.join(HERE, '..', '..', 'script.js'), encoding='utf-8').read()
    for _n, _t, ls in re.findall(
            r'\{\s*name:\s*"([^"]+)"\s*,\s*title:\s*"([^"]+)"\s*,\s*lanes:\s*\[([^\]]+)\]\s*\}', src):
        lanes[_n] = [x.strip().strip('"') for x in ls.split(',') if x.strip()]
    TAG_LANE = {'Tank': 'top', 'Fighter': 'top', 'Assassin': 'mid', 'Mage': 'mid',
                'Marksman': 'bot', 'Support': 'support'}

    def lane_of(c):
        if c['name'] in lanes:
            return lanes[c['name']]
        seen_l = []
        for t in c['tags']:
            if t in TAG_LANE and TAG_LANE[t] not in seen_l:
                seen_l.append(TAG_LANE[t])
        return seen_l or ['mid']

    # ---- champions --------------------------------------------------------
    def build_of(b):
        """The champion's real ranked build, in slot order."""
        out = []
        for i in b.get('core', []):
            i = str(i)
            if i in items and i not in out:
                out.append(i)
        for sl in b.get('slots', [])[:3]:
            if not sl:
                continue
            for cand in sorted(sl, key=lambda x: -x[2]):
                pick = str(cand[0])
                if pick in items and pick not in out:
                    out.append(pick)
                    break
        return out[:6]

    total_games = sum(b.get('games', 0) for b in raw)
    champs = []
    for b in sorted(raw, key=lambda x: int(x['key'])):
        s = slug(b['name'])
        six = build_of(b)
        info = champ_info.get(b['name'], {})
        atk = info.get('info', {}).get('attack', 0)
        mag = info.get('info', {}).get('magic', 0)
        ap, ad = build_vote(six)
        if ap > ad:
            dmg = 'AP'
        elif ad > ap:
            dmg = 'AD'
        elif mag > atk:
            dmg = 'AP'
        else:
            dmg = 'AD'
        champs.append({
            'key': b['key'], 'name': b['name'], 'title': b['title'], 'tags': b['tags'],
            'lanes': lane_of(b),
            'dmg': dmg,
            'portrait': DD_IMG + 'champion/' + portrait_file.get(b['name'], b['name'] + '.png'),
            'splash': CD + '%s/skins/base/images/%s_splash_centered_0.jpg'
                      % (s, SPLASH_FILE.get(b['name'], s)),
            'build': six,
            'games': b.get('games', 0),
            'wins': b.get('wins', 0),
            'winrate': round(b.get('wins', 0) / b['games'], 4) if b.get('games') else None,
            'pickrate': round(b.get('games', 0) / total_games, 5) if total_games else 0,
            'runes': [r for r in b.get('runes', []) if r],
            'shards': [str(x) for x in b.get('shards', []) if str(x).isdigit()],
            'summoners': [str(x) for x in b.get('summoners', []) if str(x).isdigit()],
        })

    # ---- runes ------------------------------------------------------------
    runes, trees = {}, {}
    for style in runes_raw:
        tree = {'id': style['id'], 'name': style['name'], 'icon': BB + style['icon'], 'rows': []}
        for slot in style['slots']:
            row = []
            for r in slot['runes']:
                runes[r['id']] = {'id': r['id'], 'name': r['name'], 'icon': BB + r['icon'],
                                  'shortDesc': r.get('shortDesc', ''), 'tree': style['id']}
                row.append(r['id'])
            tree['rows'].append(row)
        trees[style['id']] = tree

    # ---- stat shards ------------------------------------------------------
    patch = max(shards_raw.keys(), key=lambda k: tuple(int(x) for x in k.split('.')))
    shards = []
    for grp in shards_raw[patch]:
        shards.append({'key': grp['key'],
                       'shards': [{'id': s['id'], 'name': s['name'], 'desc': s['tooltip_desc'],
                                   'icon': BB + 'perk-images/StatMods/' + s['img']}
                                  for s in grp['shards']]})

    # ---- summoner spells --------------------------------------------------
    summoners = {}
    for k, v in summ_raw.items():
        if k.endswith('_Jade') or 'Placeholder' in k or v.get('key') is None:
            continue
        if 'CLASSIC' not in (v.get('modes') or []):
            continue
        summoners[str(v['key'])] = {'id': str(v['key']), 'name': v['name'],
                                     'icon': DD_IMG + 'spell/' + v['image']['full'],
                                     'desc': v.get('description', '')}

    write('champions', champs)
    write('items', items)
    write('runes', {'trees': trees, 'runes': runes})
    write('shards', shards)
    write('summoners', summoners)

    ap_n = sum(1 for v in items.values() if v['ap'])
    ad_n = sum(1 for v in items.values() if v['ad'])
    both = sum(1 for v in items.values() if v['ap'] and v['ad'])
    neither = len(items) - len([v for v in items.values() if v['ap'] or v['ad']])
    print('\nchampions     %d  (AP %d, AD %d)'
          % (len(champs), sum(1 for c in champs if c['dmg'] == 'AP'),
             sum(1 for c in champs if c['dmg'] == 'AD')))
    print('items         %d legendary/mythic' % len(items))
    print('  AP %d, AD %d, both %d, neither %d' % (ap_n, ad_n, both, neither))
    print('runes         %d in %d trees' % (len(runes), len(trees)))
    print('summoner spells %d' % len(summoners))
    print('build lengths %s' % dict(collections.Counter(len(c['build']) for c in champs)))
    print('ranked games  %d' % total_games)


if __name__ == '__main__':
    main()
