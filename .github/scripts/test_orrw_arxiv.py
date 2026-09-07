import unittest
from unittest.mock import patch
import update_orrw_arxiv as updater

SOURCE = '''const publications = [
  {
    id: "manhattan-lattice-transient",
    links: [{ type: "arXiv", url: "" }]
  },
  {
    id: "orrw-range-exponent",
    title: "Once-reinforced random walk",
    links: [
      { type: "arXiv", url: "" },
      { type: "Lean", url: "https://github.com/nitromannitol/ORRW-Lower-Bound" }
    ],
    year: 2026
  },
  { id: "another-paper", title: "Unrelated author edit" }
];
'''
TITLE = r'Once-reinforced random walk on $\mathbb{Z}^d$ has range exponent at least $\frac{d}{d+1}$'


def feed(title=TITLE, authors=('Ahmed Bou-Rabee', 'Yuval Peres'), identifier='http://arxiv.org/abs/2609.99999v1'):
    return '<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>' + title + '</title><id>' + identifier + '</id>' + ''.join('<author><name>' + a + '</name></author>' for a in authors) + '</entry></feed>'


class Tests(unittest.TestCase):
    def test_exact_match(self):
        self.assertEqual(updater.find_paper(feed()), '2609.99999')

    def test_html_metadata_author_order(self):
        self.assertTrue(updater.matching(TITLE, ['Bou-Rabee, Ahmed', 'Peres, Yuval']))

    def test_wrong_paper(self):
        self.assertIsNone(updater.find_paper(feed(title='The randomly oriented Manhattan lattice in 2D is transient')))

    def test_wrong_authors(self):
        self.assertIsNone(updater.find_paper(feed(authors=['Yuval Peres'])))

    def test_not_announced(self):
        self.assertIsNone(updater.find_paper('<feed xmlns="http://www.w3.org/2005/Atom"/>'))

    def test_temporary_identifier_rejected(self):
        with self.assertRaises(ValueError):
            updater.find_paper(feed(identifier='https://arxiv.org/submit/8048321'))

    def test_scoped_idempotent_edit(self):
        new = updater.update_links(SOURCE, '2609.99999')
        self.assertEqual(updater.update_links(new, '2609.99999'), new)
        self.assertEqual(updater.ENTRY.sub('', new), updater.ENTRY.sub('', SOURCE))
        self.assertIn('https://arxiv.org/abs/2609.99999', new)
        self.assertIn('https://arxiv.org/pdf/2609.99999', new)
        self.assertIn('https://github.com/nitromannitol/ORRW-Lower-Bound', new)

    def test_existing_different_link_rejected(self):
        new = updater.update_links(SOURCE, '2609.99999')
        with self.assertRaises(ValueError):
            updater.update_links(new, '2609.99998')

    def test_missing_or_duplicate_entry_rejected(self):
        for source in ('const publications = [];', SOURCE + SOURCE):
            with self.assertRaises(ValueError):
                updater.update_links(source, '2609.99999')

    def test_start_gate_makes_no_requests(self):
        from datetime import datetime, timezone
        with patch.object(updater, 'datetime') as clock, patch.object(updater, 'fetch') as fetch, patch('sys.argv', ['updater']):
            clock.now.return_value = datetime(2026, 9, 7, 17, tzinfo=timezone.utc)
            updater.main()
            fetch.assert_not_called()


if __name__ == '__main__':
    unittest.main()
