"""Fetch lolshop.gg's item classification and save it beside this script.

lolshop.gg lists every item in the Summoner's Rift shop and sorts it into the
shop rarities Riot uses: legendaries, epics, basics, starters, boots and
consumables. It is the one source that states the rarity outright, so the
Forge takes its legendary list from here.

The file it writes, lolshop-items.json, has the shape:

    { "patch": "16.21.1",
      "legendaries": [3031, 3089, ...],
      "boots": [3111, 3047, ...] }

Run it before build-dataset.py.
"""
import json, io, os, re, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'lolshop-items.json')
URL = 'https://lolshop.gg/'


def fetch():
    req = urllib.request.Request(URL, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'})
    html = urllib.request.urlopen(req, timeout=60).read().decode('utf-8', 'replace')
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
                  html, re.S)
    if not m:
        raise SystemExit('could not find the Next.js payload on lolshop.gg')
    page = json.loads(m.group(1))['props']['pageProps']
    items = page['itemsData']['items']
    all_lists = page['itemsData']['all']

    def ids(group):
        out = []
        for i in all_lists[group]:
            v = items[str(i)] if str(i) in items else items[i]
            out.append(v['id'])
        return out

    return {
        'patch': page['patch'],
        'legendaries': ids('legendaries'),
        'boots': ids('boots'),
        'epics': ids('epics'),
        'basics': ids('basics'),
        'starters': ids('starters'),
        'consumables': ids('consumables'),
    }


def main():
    if os.path.exists(OUT):
        data = json.load(io.open(OUT, encoding='utf-8'))
        print('lolshop-items.json already there (patch %s)' % data['patch'])
        return
    print('fetching lolshop.gg ...', flush=True)
    data = fetch()
    with io.open(OUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print('  patch %s | %d legendaries | %d boots'
          % (data['patch'], len(data['legendaries']), len(data['boots'])))
    print('  wrote lolshop-items.json')


if __name__ == '__main__':
    main()
