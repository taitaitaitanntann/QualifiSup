"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const reasons = [
  "不適切な内容",
  "資格と関係のない内容",
  "嫌がらせ・迷惑行為",
  "誤った情報",
  "その他",
];

function ReportContent() {
  const p = useSearchParams();
  const type = p.get("type") || "question";
  const target = p.get("id") || "";

  const [reason, setReason] = useState(reasons[0]);
  const [notify, setNotify] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase || !target) {
      setMsg("報告対象を確認できません。");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMsg("報告にはログインが必要です。");
      return;
    }

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: type,
      target_id: target,
      reason,
      notify_result: notify,
    });

    setMsg(
      error
        ? "報告を送信できませんでした。"
        : "報告を受け付けました。運営が確認します。"
    );
  }

  return (
    <div className="wrap section detail">
      <Link href="/account" className="text-link">
        ← アカウント
      </Link>

      <div className="card">
        <h1>報告する</h1>

        <p className="muted">
          対象：{type} / {target}
        </p>

        <form className="form" onSubmit={submit}>
          <label>
            報告理由
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {reasons.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>

          <label
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              style={{ width: "auto" }}
            />
            対応結果の通知を希望する
          </label>

          <button className="btn">報告を送信</button>
        </form>

        {msg && (
          <div className="notice" style={{ marginTop: 14 }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Report() {
  return (
    <Suspense
      fallback={
        <div className="wrap section">
          <div className="empty">読み込み中…</div>
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
