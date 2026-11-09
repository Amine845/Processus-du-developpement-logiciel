"""Parse official XLSX using Python 3 standard library only. No package install."""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

N = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def norm(s):
    return ''.join(c for c in s.lower() if c.isalnum())
def read_xlsx(path):
    with zipfile.ZipFile(path) as z:
        if sum(i.file_size for i in z.infolist()) > 100_000_000:
            raise ValueError('XLSX uncompressed size limit exceeded')
        strings = [''.join(e.itertext()) for e in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si', N)]
        def sheet(name):
            output = []
            for row in ET.fromstring(z.read(name)).findall('.//s:sheetData/s:row', N):
                values = {}
                for cell in row:
                    ref = cell.attrib['r']
                    col = re.match('[A-Z]+', ref)[0]
                    index = 0
                    for c in col:
                        index = index * 26 + ord(c) - 64
                    value = cell.find('s:v', N)
                    text = value.text if value is not None else ''
                    if cell.attrib.get('t') == 's':
                        text = strings[int(text)]
                    elif cell.attrib.get('t') == 'inlineStr':
                        text = ''.join(cell.find('s:is', N).itertext())
                    values[index - 1] = text
                output.append([values.get(i, '') for i in range(max(values, default=-1) + 1)])
            return output
        rows = sheet('xl/worksheets/sheet1.xml')
        definitions = sheet('xl/worksheets/sheet2.xml')
    expected = json.loads((Path(__file__).resolve().parents[1] / 'data/ciqual/constituents-2025.json').read_text(encoding='utf-8'))
    actual = {str(row[1]): norm(row[2]) for row in definitions[1:]}
    if actual != {d['key']: norm(d['header']) for d in expected}:
        raise ValueError('Constituent definitions changed; review required')
    header = rows[0]
    if header[6:8] != ['alim_code', 'alim_nom_fr'] or len(header) != 84:
        raise ValueError('Unexpected food schema')
    columns = {norm(h): i for i, h in enumerate(header)}
    indexes = {d['key']: columns[norm(d['header'])] for d in expected}
    if len(indexes) != 74:
        raise ValueError('Expected 74 constituents')
    group_headers = ['alim_grp_code', 'alim_ssgrp_code', 'alim_ssssgrp_code', 'alim_grp_nom_fr', 'alim_ssgrp_nom_fr', 'alim_ssssgrp_nom_fr']
    if header[:6] != group_headers:
        raise ValueError('Official group columns changed; review required')
    foods = [{'groups': dict(zip(group_headers, row[:6])), 'code': row[6], 'name': row[7], 'values': {key: row[i] if i < len(row) else '' for key, i in indexes.items()}} for row in rows[1:]]
    return foods
if __name__ == '__main__':
    print(json.dumps(read_xlsx(sys.argv[1]), ensure_ascii=False))
