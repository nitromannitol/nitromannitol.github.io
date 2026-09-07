"""One-off, author-authorized arXiv link update after the ORRW announcement."""
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
START = datetime(2026, 9, 8, 4, 40, tzinfo=timezone.utc)
TITLE = 'Once-reinforced random walk on Zd has range exponent at least d/(d+1)'
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


def matching(title, authors):
    return normal(title) == normal(TITLE) and {normal_author(a) for a in authors} == {normal_author(a) for a in AUTHORS}


def find_paper(xml):
    matches = set()
    for item in ET.fromstring(xml).findall(ATOM + 'entry'):
        title = item.findtext(ATOM + 'title', '')
        authors = [a.findtext(ATOM + 'name', '') for a in item.findall(ATOM + 'author')]
        if not matching(title, authors):
            continue
        identifier = item.findtext(ATOM + 'id', '')
        match = re.fullmatch(r'https?://arxiv\.org/abs/(\d{4}\.\d{4,5})(?:v\d+)?', identifier)
        if not match:
            raise ValueError('Matched paper has no public arXiv identifier')
        matches.add(match[1])
    if len(matches) > 1:
        raise ValueError('Multiple public identifiers match; refusing to guess')
    return next(iter(matches), None)


def update_links(source, identifier):
    if not re.fullmatch(r'\d{4}\.\d{4,5}', identifier):
        raise ValueError('Not a public arXiv identifier')
    entries = list(ENTRY.finditer(source))
    if len(entries) != 1:
        raise ValueError('Expected exactly one ORRW publication entry')
    entry = entries[0]
    block = entry[0]
    links = list(ARXIV_LINK.finditer(block))
    if len(links) != 1:
        raise ValueError('Expected exactly one ORRW arXiv link')
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


def verify_public(identifier):
    meta = Metadata(fetch(f'https://arxiv.org/abs/{identifier}').decode()).values
    if not matching(' '.join(meta.get('citation_title', [])), meta.get('citation_author', [])):
        raise ValueError('Public abstract page does not confirm the title and both authors')
    if meta.get('citation_arxiv_id', []) not in ([identifier], [identifier + 'v1']):
        raise ValueError('Public abstract page does not confirm the identifier')
    time.sleep(3)
    if fetch(f'https://arxiv.org/pdf/{identifier}', limit=5) != b'%PDF-':
        raise ValueError('Public PDF is not available yet')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    now = datetime.now(timezone.utc)
    if now < START:
        print(f'Waiting until {START.isoformat()}; no website changes.')
        return
    query = urlencode({'search_query': 'au:Peres AND ti:range', 'max_results': 100,
                       'sortBy': 'submittedDate', 'sortOrder': 'descending'})
    identifier = find_paper(fetch('https://export.arxiv.org/api/query?' + query))
    if identifier is None:
        print('ORRW is not listed publicly yet; the next scheduled run will retry.')
        return
    time.sleep(3)
    verify_public(identifier)
    # Read master afresh, so concurrent website edits are preserved. The contents
    # API rejects a stale file SHA rather than overwriting a simultaneous edit.
    current = gh('contents/publications.js?ref=master')
    old = base64.b64decode(current['content']).decode()
    new = update_links(old, identifier)
    if args.dry_run:
        print(f'Verified {identifier}; dry run, no writes.')
        return
    if new != old:
        gh('contents/publications.js', 'PUT', {
            'message': f'Add verified ORRW arXiv links ({identifier})',
            'content': base64.b64encode(new.encode()).decode(),
            'sha': current['sha'], 'branch': 'master'})
    # GITHUB_TOKEN commits do not themselves trigger Pages builds.
    gh('pages/builds', 'POST')
    for attempt in range(24):
        time.sleep(15)
        try:
            live = fetch(f'https://nitromannitol.github.io/publications.js?orrw-check={int(time.time())}').decode()
            if update_links(live, identifier) == live:
                print(f'Published and verified https://arxiv.org/abs/{identifier} and its PDF link.')
                gh(f'actions/workflows/{WORKFLOW}/disable', 'PUT')
                print('One-off workflow disabled after successful publication.')
                return
        except Exception as error:
            print(f'Waiting for deployment: {error}')
    raise RuntimeError('Links committed, but deployment is not visible yet; next hourly run will retry')


if __name__ == '__main__':
    main()
