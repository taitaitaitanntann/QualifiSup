# QualifiSup FINAL CANDIDATE

STEP 15〜20相当をまとめて実装した最終候補版です。

## 今回の追加・接続
- 資格詳細をDBの資格IDで表示
- お気に入り資格を資格詳細から追加・解除
- 資格情報の修正申請
- 未掲載資格の掲載申請
- プロフィール編集
- 報告送信・報告履歴
- 運営確認画面（報告・資格修正・掲載申請）
- 相談終了後の「役に立った」評価
- 利用規約・プライバシー・コミュニティガイドライン・相談ルール
- 管理者専用DBテーブルとRLS
- ブロック用DBとRLS
- 通知設定RLS

## Supabase
実行順：
1. `supabase/schema.sql`
2. `supabase/step8_migration.sql` ～ `step14_migration.sql`
3. `supabase/step15_20_final_migration.sql`

管理者を登録する場合は、Authユーザー作成後にSQLコメントのUUIDを自分の運営アカウントIDへ置き換えて登録してください。

## 公開前に必ず確認すること
- NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
- Supabase Authのメール設定
- RLSを実環境で検証
- 管理者UUIDを登録
- 保護者同意の実装と法的要件
- 個人情報の実際の保存・削除・外部サービス連携
- 資格情報の公式ソースと年度更新
- 料金を導入する場合の特商法等の確認
- 利用規約・プライバシーポリシーの最終法務確認
- Vercel等へのデプロイ後の本番テスト

## 注意
このフォルダは「機能をまとめた完成候補」です。Supabase未接続の状態では実データ機能は動きません。法務・本番セキュリティ・実データの最終確認は公開前に別途必要です。
