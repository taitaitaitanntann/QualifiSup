"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

function CorrectionContent() {
  const p = useSearchParams();
  const qid = p.get("qualification") || "";

  const [name, setName] = useState("");
  const [item, setItem] = useState("受験資格");
  const [value, setValue] = useState("");
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!supabase || !qid) return;

    supabase
      .from("qualifications")
      .select("name")
      .eq("id", qid)
      .maybeSingle()
      .then((r) => setName(r.data?.name || ""));
  }, [qid]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase || !qid) {
      setMsg("資格情報を確認できません。");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMsg("ログインが必要です。");
      return;
    }

    const { error } = await supabase
      .from("qualification_corrections")
      .insert({
        qualification_id: qid,
        requester_id: user.id,
        item,
        proposed_value: value,
        evidence_url: url,
      });

    setMsg(
      error
        ? "修正申請を送信できませんでした。"
        : "修正申請を受け付けました。運営確認中です。"
    );
  }

  return (
    <div className="wrap section detail">
      <Link href={`/qualifications/${qid}`} className="text-link">
        ← 資格詳細
      </Link>

      <div className="card">
        <h1>資格情報の修正</h1>

        <p className="muted">{name || "資格"}</p>

        <form className="form" onSubmit={submit}>
          <label>
            修正項目
            <select
              value={item}
              onChange={(e) => setItem(e.target.value)}
            >
              <option>受験資格</option>
              <option>試験日</option>
              <option>申込期間</option>
              <option>受験料</option>
              <option>公式サイト</option>
              <option>その他</option>
            </select>
          </label>

          <label>
            正しいと思う内容
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>

          <label>
            根拠URL
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
            />
          </label>

          <button className="btn">修正を申請</button>
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

export default function Correction() {
  return (
    <Suspense
      fallback={
        <div className="wrap section">
          <div className="empty">読み込み中…</div>
        </div>
      }
    >
      <CorrectionContent />
    </Suspense>
  );
}
