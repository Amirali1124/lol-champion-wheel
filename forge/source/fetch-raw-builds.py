"""Fetch every champion's most-played ranked build from u.gg's public stats API.

Writes raw-champions.json beside this script. Run it first, then
build-dataset.py, which turns that raw file into the files the site loads.

The API returns a nested structure: for each champion a set of buckets (by rank
tier and lane), each holding build records. A record is a pair of the block
list and a timestamp. Every block carries a slice of the build: the core
three items, the three legendary slots with their pick and win counts, the
rune page, the stat shards and the summoner spells. The busiest bucket is
the champion's real ranked build.

The wider count matters: a patch is young, so one champion's busiest bucket
is a thin sample. The count of every item that appears anywhere in the
champion's data decides whether an item belongs in the pool.
"""
import collections, json, io, os, subprocess, time

HERE = os.path.dirname(os.path.abspath(__file__))

PATCH = '16_21'
DD = 'https://ddragon.leagueoflegends.com/cdn/16.21.1/data/en_US'
UGG = ('https://stats2.u.gg/lol/1.5/overview/%s/ranked_solo_5x5/%%d/1.5.0.json' % PATCH)


def get_json(url, tries=5):
    """Fetch JSON with curl, which some hosts accept where urllib is refused."""
    last = None
    for t in range(tries):
        p = subprocess.run(
            ['curl', '-sL', '--max-time', '120', '-H', 'User-Agent: Mozilla/5.0',
             '-H', 'Accept: application/json', url],
            capture_output=True)
        if p.returncode == 0 and p.stdout:
            try:
                return json.loads(p.stdout.decode('utf-8'))
            except ValueError as e:
                last = e
        else:
            last = RuntimeError('curl exit %d' % p.returncode)
        time.sleep(1.5 * (t + 1))
    raise last


def records(node, out):
    """Every build record in the tree: a pair whose second half is a timestamp."""
    if isinstance(node, list):
        if (len(node) == 2 and isinstance(node[1], str) and len(node[1]) >= 20
                and node[1][4] == '-'):
            out.append(node)
            return
        for x in node:
            records(x, out)
    elif isinstance(node, dict):
        for x in node.values():
            records(x, out)


def parse(ov):
    """The champion's busiest bucket: its real ranked build and numbers.

    A record's blocks read: the rune page, the summoner spells, the starting
    items, the core three, the skill order, the six slots, the record's own
    wins and games, and the stat shards. Each block carries its own
    [games, wins] pair, and block 6 carries the record's totals.

    Also counts every item that appears anywhere in the champion's data, across
    all the rank tiers and lanes.
    """
    buckets = {}
    usage = collections.Counter()
    for outer, inner in ov.items():
        if not isinstance(inner, dict):
            continue
        recs = []
        for sub in inner.values():
            if isinstance(sub, dict):
                for rec in sub.values():
                    records(rec, recs)
        best = None
        for rec in recs:
            b = rec[0]
            if not isinstance(b, list) or len(b) < 9:
                continue
            total = b[6] if isinstance(b[6], list) and len(b[6]) > 1 else None
            if not total or not isinstance(total[1], int):
                continue
            games = total[1]
            core = b[3][2] if isinstance(b[3], list) and len(b[3]) > 2 else []
            for i in (core if isinstance(core, list) else []):
                if i is not None:
                    usage[str(i)] += 1
            for sl in (b[5] if isinstance(b[5], list) else []):
                if not sl:
                    continue
                for cand in sl:
                    if not cand or len(cand) < 3:
                        continue
                    usage[str(cand[0])] += cand[2]
            if best is None or games > best[0]:
                best = (games, b)
        if best:
            buckets[outer] = best
    if not buckets:
        return None
    outer, (games, b) = max(buckets.items(), key=lambda kv: kv[1][0])
    total = b[6]
    return {
        'games': total[1],
        'wins': total[0],
        'core': b[3][2] if isinstance(b[3], list) and len(b[3]) > 2 else [],
        'slots': b[5] if isinstance(b[5], list) else [],
        'summoners': b[1][2] if isinstance(b[1], list) and len(b[1]) > 2 else [],
        'start': b[2][2] if isinstance(b[2], list) and len(b[2]) > 2 else [],
        'runes': b[0][4] if isinstance(b[0], list) and len(b[0]) > 4 else [],
        'ptree': b[0][2] if isinstance(b[0], list) and len(b[0]) > 2 else None,
        'stree': b[0][3] if isinstance(b[0], list) and len(b[0]) > 3 else None,
        'shards': b[8][2] if isinstance(b[8], list) and len(b[8]) > 2 else [],
        'usage': dict(usage),
    }


def one(c):
    try:
        p = parse(get_json(UGG % int(c['key'])))
    except Exception as e:
        return {'key': c['key'], 'name': c['name'], 'error': str(e)[:70]}
    if not p:
        return {'key': c['key'], 'name': c['name'], 'error': 'no-build'}
    p.update({'key': c['key'], 'name': c['name'], 'title': c['title'], 'tags': c['tags']})
    return p


def main():
    champs = get_json(DD + '/champion.json')['data']
    order = sorted(champs.values(), key=lambda x: int(x['key']))
    res = []
    t0 = time.time()
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=8) as ex:
        for i, r in enumerate(ex.map(one, order)):
            res.append(r)
            if (i + 1) % 25 == 0:
                print('  %d/%d  %.0fs' % (i + 1, len(order), time.time() - t0), flush=True)

    path = os.path.join(HERE, 'raw-champions.json')
    with io.open(path, 'w', encoding='utf-8') as f:
        json.dump(res, f, ensure_ascii=False, separators=(',', ':'))

    bad = [r for r in res if 'error' in r]
    print('fetched ok=%d failed=%d in %.0fs' % (len(res) - len(bad), len(bad), time.time() - t0))
    for b in bad:
        print('  FAIL', b['name'], b['error'])
    print('  wrote raw-champions.json')


if __name__ == '__main__':
    main()
