# QualifiSup STEP 11

フォロー・相互フォロー通知、通知設定、通知と最近の活動をまとめた画面を追加。

## Supabase
`supabase/step11_migration.sql` を STEP8〜10 の後に実行してください。

追加:
- notification_settings
- activity_logs
- フォロー/相互フォロー通知
- 通知ON/OFF（相談5種 + フォロー + 相互フォロー）
- /notifications
- /settings

本番ではRLS、トリガー、Realtime設定をSupabase側で確認してください。
