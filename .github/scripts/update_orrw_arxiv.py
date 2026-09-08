"""One-off, author-authorized arXiv link update for the ORRW and Manhattan announcements."""
import argparse
import base64
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import subprocess
import time
import unicodedata
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

REPO = 'nitromannitol/nitromannitol.github.io'
WORKFLOW = 'orrw-arxiv.yml'
START = datetime(2026, 9, 8, 0, 0, tzinfo=timezone.utc)
TITLE = 'Once-reinforced random walk on Zd has range exponent at least d/(d+1)'
PAPERS = {
    'orrw-range-exponent': TITLE,
    'manhattan-lattice-transient': 'The randomly oriented Manhattan lattice in 2D is transient',
}
AUTHORS = {'Ahmed Bou-Rabee', 'Yuval Peres'}
ATOM = '{http://www.w3.org/2005/Atom}'
ENTRY = re.compile(r'(?ms)^  \{\n    id: "orrw-range-exponent",.*?^  \},?')
ARXIV_LINK = re.compile(r'\{ type: "arXiv", url: "([^"]*)" \}')
PDF_LINK = re.compile(r'\{ type: "PDF", url: "([^"]*)" \}')


def normal(text):
    text = unicodedata.normalize('NFKD', unescape(text))
    text = re.sub(r'<[^>]*>', '', text)
    text = re.sub(r'\\(?:mathbb|mathbf|mathrm|frac|mathcal|text)\b', '', text)
    return re.sub(r'[^a-z0-9]', '', text.lower())


def normal_author(name):
    if ',' in name:
        surname, given = name.split(',', 1)
        name = given + ' ' + surname
    return normal(name)


def matching(title, authors, expected_title=TITLE):
    return normal(title) == normal(expected_title) and {normal_author(a) for a in authors} == {normal_author(a) for a in AUTHORS}


def find_paper(xml, expected_title=TITLE):
    matches = set()
    for item in ET.fromstring(xml).findall(ATOM + 'entry'):
        title = item.findtext(ATOM + 'title', '')
        authors = [a.findtext(ATOM + 'name', '') for a in item.findall(ATOM + 'author')]
        if not matching(title, authors, expected_title):
            continue
        identifier = item.findtext(ATOM + 'id', '')
        match = re.fullmatch(r'https?://arxiv\.org/abs/(\d{4}\.\d{4,5})(?:v\d+)?', identifier)
        if not match:
            raise ValueError('Matched paper has no public arXiv identifier')
        matches.add(match[1])
    if len(matches) > 1:
        raise ValueError('Multiple public identifiers match; refusing to guess')
    return next(iter(matches), None)


def update_links(source, identifier, entry_id='orrw-range-exponent'):
    if not re.fullmatch(r'\d{4}\.\d{4,5}', identifier):
        raise ValueError('Not a public arXiv identifier')
    pattern = re.compile(r'(?ms)^  \{\n    id: "' + re.escape(entry_id) + r'",.*?^  \},?')
    entries = list(pattern.finditer(source))
    if len(entries) != 1:
        raise ValueError('Expected exactly one target publication entry')
    entry = entries[0]
    block = entry[0]
    links = list(ARXIV_LINK.finditer(block))
    if len(links) != 1:
        raise ValueError('Expected exactly one target arXiv link')
    abstract_url = f'https://arxiv.org/abs/{identifier}'
    pdf_url = f'https://arxiv.org/pdf/{identifier}'
    if links[0][1] not in ('', abstract_url):
        raise ValueError('Existing arXiv link differs; refusing to overwrite it')
    block = ARXIV_LINK.sub(lambda _: '{ type: "arXiv", url: "' + abstract_url + '" }', block)
    pdfs = list(PDF_LINK.finditer(block))
    if pdfs:
        if len(pdfs) != 1 or pdfs[0][1] != pdf_url:
            raise ValueError('Existing PDF link differs; refusing to overwrite it')
    else:
        block = ARXIV_LINK.sub(lambda m: m[0] + ',\n      { type: "PDF", url: "' + pdf_url + '" }', block)
    result = source[:entry.start()] + block + source[entry.end():]
    subprocess.run(['node', '--check'], input=result, text=True, check=True, capture_output=True)
    return result


def gh(path, method='GET', data=None):
    args = ['gh', 'api', f'repos/{REPO}/{path}', '--method', method]
    if data is not None:
        args += ['--input', '-']
    out = subprocess.run(args, input=json.dumps(data) if data is not None else None,
                         text=True, capture_output=True, check=True).stdout
    return json.loads(out) if out.strip() else None


def fetch(url, limit=3000000, headers=None):
    request = Request(url, headers={'User-Agent': 'ORRW-publication-link-check/1.0 (github.com/' + REPO + ')', **(headers or {})})
    with urlopen(request, timeout=45) as response:
        return response.read(limit)


class Metadata(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.values = {}
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta':
            self.values.setdefault(attrs.get('name', '').lower(), []).append(attrs.get('content', ''))


def verify_public(identifier, expected_title=TITLE):
    meta = Metadata(fetch(f'https://arxiv.org/abs/{identifier}').decode()).values
    if not matching(' '.join(meta.get('citation_title', [])), meta.get('citation_author', []), expected_title):
        raise ValueError('Public abstract page does not confirm the title and both authors')
    if meta.get('citation_arxiv_id', []) not in ([identifier], [identifier + 'v1']):
        raise ValueError('Public abstract page does not confirm the identifier')
    time.sleep(3)
    if fetch(f'https://arxiv.org/pdf/{identifier}', limit=5) != b'%PDF-':
        raise ValueError('Public PDF is not available yet')


def discover():
    # Search the public API first. The HTML author search provides a fallback
    # when the API is rate-limited or has not yet indexed an announcement.
    query = urlencode({'search_query': 'au:Peres AND (ti:range OR ti:Manhattan)',
                       'max_results': 100, 'sortBy': 'submittedDate', 'sortOrder': 'descending'})
    found = {}
    try:
        xml = fetch('https://export.arxiv.org/api/query?' + query)
        for entry_id, title in PAPERS.items():
            identifier = find_paper(xml, title)
            if identifier:
                found[entry_id] = identifier
    except Exception as error:
        print(f'arXiv API unavailable: {error}')
    if len(found) < len(PAPERS):
        time.sleep(3)
        query = urlencode({'query': 'Ahmed Bou-Rabee', 'searchtype': 'author',
                           'abstracts': 'show', 'order': '-announced_date_first', 'size': 50})
        html = fetch('https://arxiv.org/search/?' + query).decode()
        found.update(find_search_results(html))
    return found


def find_search_results(html):
    found = {}
    for block in re.split(r'<li class="arxiv-result">', html)[1:]:
        title = re.search(r'<p[^>]*class="[^"]*\btitle\b[^"]*"[^>]*>(.*?)</p>', block, re.S)
        authors = re.search(r'<p[^>]*class="authors"[^>]*>(.*?)</p>', block, re.S)
        identifier = re.search(r'href="https?://arxiv\.org/abs/(\d{4}\.\d{4,5})(?:v\d+)?"', block)
        if not (title and authors and identifier):
            continue
        names = re.findall(r'<a[^>]*>(.*?)</a>', authors[1], re.S)
        for entry_id, expected in PAPERS.items():
            if matching(title[1], names, expected):
                if entry_id in found and found[entry_id] != identifier[1]:
                    raise ValueError('Multiple matching identifiers in arXiv search')
                found[entry_id] = identifier[1]
    return found


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    if datetime.now(timezone.utc) < START:
        print(f'Waiting until {START.isoformat()}; no website changes.')
        return
    found = discover()
    if not found:
        print('Neither paper is listed publicly yet; the next scheduled run will retry.')
        return
    verified = {}
    for entry_id, identifier in found.items():
        try:
            time.sleep(3)
            verify_public(identifier, PAPERS[entry_id])
            verified[entry_id] = identifier
        except Exception as error:
            print(f'{entry_id}: public abstract/PDF verification pending: {error}')
    if not verified:
        raise RuntimeError('No discovered identifier could be verified publicly')
    current = gh('contents/publications.js?ref=master')
    old = base64.b64decode(current['content']).decode()
    new = old
    for entry_id, identifier in verified.items():
        new = update_links(new, identifier, entry_id)
    if args.dry_run:
        print(f'Verified {verified}; dry run, no writes.')
        return
    if new != old:
        gh('contents/publications.js', 'PUT', {
            'message': 'Add verified arXiv links for ' + ', '.join(verified),
            'content': base64.b64encode(new.encode()).decode(),
            'sha': current['sha'], 'branch': 'master'})
    # GITHUB_TOKEN commits do not themselves trigger Pages builds.
    gh('pages/builds', 'POST')
    for attempt in range(24):
        time.sleep(15)
        try:
            live = fetch(f'https://nitromannitol.github.io/publications.js?arxiv-check={int(time.time())}').decode()
            if all(update_links(live, identifier, entry_id) == live
                   for entry_id, identifier in verified.items()):
                print(f'Published and verified on the live webpage: {verified}')
                if len(verified) == len(PAPERS):
                    gh(f'actions/workflows/{WORKFLOW}/disable', 'PUT')
                    print('Workflow disabled after both papers were published.')
                else:
                    print('Continuing hourly checks for the other paper.')
                return
        except Exception as error:
            print(f'Waiting for deployment: {error}')
    raise RuntimeError('Links committed, but deployment is not visible yet; next hourly run will retry')


if __name__ == '__main__':
    main()
