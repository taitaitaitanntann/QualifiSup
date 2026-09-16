# QualifiSup STEP 12

## タイムライン
- おすすめ / 新着 / 相互フォローの3表示
- フォロー中・相互フォローの投稿をおすすめ順で優先
- 相互フォロー画面は相互フォロー相手の投稿のみ
- 投稿の「👍役に立った」は likes テーブルで管理
- 投稿作成時に activity_logs へ記録
- 資格タグは資格DBから選択可能

## Supabase
1. `supabase/schema.sql`
2. `supabase/step8_migration.sql` ～ `step12_migration.sql`
を順番にSQL Editorで実行してください。

`NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定します。

## 注意
- 実運用では投稿本文・プロフィール表示・RLSを本番データで十分テストしてください。
- `likes.target_type = 'post'` を利用しています。
