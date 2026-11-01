"""In CI only: derive a unique monotonically increasing web version per OTA workflow."""
import os, json
from pathlib import Path
p=Path(__file__).resolve().parent.parent/'web-version.json'
v=json.loads(p.read_text('utf-8'))
run=os.environ['OTA_RUN_NUMBER']
if not run.isascii() or not run.isdigit() or int(run)<1:raise SystemExit('OTA_RUN_NUMBER invalid')
# Workflow run_number counts per workflow file, not commit or job.
v['version']=f'1.2.{int(run)}'
p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n','utf-8')
print('Publishing OTA',v['version'],'for nativeRevision',v['nativeRevision'])
