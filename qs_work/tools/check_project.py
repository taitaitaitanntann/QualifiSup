from pathlib import Path
import json, sys

root = Path(__file__).resolve().parents[1]
required = [
    'package.json','next-env.d.ts','tsconfig.json','lib/supabase.ts',
    'app/page.tsx','app/qualifications/page.tsx','app/holders/page.tsx',
    'app/consultations/page.tsx','app/questions/page.tsx','app/notifications/page.tsx',
    'app/favorites/page.tsx','app/search-history/page.tsx','app/settings/page.tsx',
    'app/api/health/route.ts','supabase/ALL_IN_ONE_SETUP.sql'
]
missing=[p for p in required if not (root/p).exists()]
print('QualifiSup 最終チェック')
print('----------------------')
print(f'必要なファイル: {len(required)}')
print(f'見つからない: {len(missing)}')
if missing:
    for p in missing: print(' -',p)
    sys.exit(1)

pkg=json.loads((root/'package.json').read_text())
for name in ['next','react','react-dom','@supabase/supabase-js']:
    assert name in pkg.get('dependencies',{}), f'{name} が package.json にありません'

sql=(root/'supabase/ALL_IN_ONE_SETUP.sql').read_text()
for key in ['create table','profiles','qualifications','questions','answers','consultations','messages','follows','notifications']:
    assert key.lower() in sql.lower(), f'SQLに {key} がありません'

print('package.json: OK')
print('主要画面: OK')
print('データベース設定: OK')
print('結果: ファイル構成は問題ありません。')
