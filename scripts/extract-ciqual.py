"""One-time preparation only: python -m pip install openpyxl==3.1.5"""
import hashlib
import json
import sys
from pathlib import Path
import openpyxl

root = Path(__file__).resolve().parents[1]
meta = json.loads((root / 'data/ciqual/source-manifest.json').read_text(encoding='utf-8'))
source = Path(sys.argv[1])
if hashlib.sha256(source.read_bytes()).hexdigest() != meta['sourceSha256']:
    raise ValueError('Wrong official source bytes; version upgrade requires review')
workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)
rows = list(workbook['composition nutritionnelle'].values)
codes = json.loads((root / 'data/ciqual/selection.json').read_text())
for item in meta['constituents'].values():
    assert rows[0][item['column'] - 1] == item['header'], 'Unexpected source header'
foods = [{'code': r[6], 'name': r[7], 'values': {
    key: r[item['column'] - 1] if r[item['column'] - 1] is not None else ''
    for key, item in meta['constituents'].items()
}} for r in rows[1:] if r[6] in codes]
assert len(foods) == len(set(codes)) == 30
Path(sys.argv[2]).write_text(json.dumps({'metadata': meta, 'foods': foods}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
