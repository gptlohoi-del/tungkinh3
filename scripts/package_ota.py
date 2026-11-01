#!/usr/bin/env python3
"""Create a regular rooted ZIP understood by Capgo manual download(), with latest.json for Pages."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED,ZipInfo
import json,hashlib,os,re
root=Path(__file__).resolve().parent.parent
www=root/'www'; site=root/'site'; ver=json.loads((www/'web-version.json').read_text())
version=ver['version']; native=ver['nativeRevision']
if not re.fullmatch(r'\d+\.\d+\.\d+',version):raise SystemExit('web-version.json: version sai')
base=(os.environ.get('TK3_OTA_BASE_URL') or 'https://gptlohoi-del.github.io/tungkinh3/').rstrip('/')+'/'
if not base.startswith('https://'):raise SystemExit('Chỉ dùng HTTPS để phân phối OTA')
files=[p for p in sorted(www.rglob('*')) if p.is_file()]
if not files or not (www/'index.html').is_file():raise SystemExit('Cần npm run build:web trước')
site.mkdir(parents=True,exist_ok=True);updates=site/'updates';updates.mkdir(exist_ok=True)
zipfile=updates/f'{version}.zip'
with ZipFile(zipfile,'w',ZIP_DEFLATED,compresslevel=6) as z:
    for p in files:
        name=p.relative_to(www).as_posix()
        if any(x.startswith('.') for x in name.split('/')):continue
        info=ZipInfo(name,(2020,1,1,0,0,0));info.compress_type=ZIP_DEFLATED
        info.external_attr=(0o644 << 16)
        z.writestr(info,p.read_bytes())
sha=hashlib.sha256(zipfile.read_bytes()).hexdigest()
manifest={'version':version,'nativeRevision':native,'url':base+'updates/'+zipfile.name,'sha256':sha,'size':zipfile.stat().st_size}
(updates/'latest.json').write_text(json.dumps(manifest,indent=2)+'\n','utf-8')
(site/'.nojekyll').touch()
(site/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>Tụng Kinh 3 OTA</title><h1>Trang cập nhật Tụng Kinh 3</h1><p>Thông tin ở <a href="updates/latest.json">latest.json</a>.</p>','utf-8')
print('Created',zipfile,'SHA256',sha,'bytes',zipfile.stat().st_size)
print('Manifest URL',base+'updates/latest.json')
