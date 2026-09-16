"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

const methods = [
  "独学",
  "資格学校・スクール",
  "オンライン講座",
  "YouTube・動画",
  "過去問中心",
  "教科書・参考書中心",
  "人に教えてもらう",
  "その他",
];

export default function EditProfile() {
  const [f, setF] = useState<any>({
    nickname: "",
    status: "",
    field: "",
    bio: "",
    qualification_year: "",
    daily_study_minutes: "",
    study_period_days: "",
    study_methods: [],
    consultation_topics: "",
  });

  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select(
          "nickname,status,field,bio,qualification_year,daily_study_minutes,study_period_days,study_methods,consultation_topics"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setF({
          ...data,
          study_methods: data.study_methods || [],
        });
      }
    })();
  }, []);

  function toggle(method: string) {
    setF((x: any) => ({
      ...x,
      study_methods: x.study_methods.includes(method)
        ? x.study_methods.filter((v: string) => v !== method)
        : [...x.study_methods, method],
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    if (!supabase) {
      setMsg("Supabase未接続です。");
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
      .from("profiles")
      .update({
        nickname: f.nickname,
        status: f.status,
        field: f.field,
        bio: f.bio,
        qualification_year: f.qualification_year
          ? Number(f.qualification_year)
          : null,
        daily_study_minutes: f.daily_study_minutes
          ? Number(f.daily_study_minutes)
          : null,
        study_period_days: f.study_period_days
          ? Number(f.study_period_days)
          : null,
        study_methods: f.study_methods,
        consultation_topics: f.consultation_topics,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      setMsg("保存できませんでした。");
    } else {
      setMsg("プロフィールを保存しました。");
    }
  }

  return (
    <div className="wrap section detail">
      <Link href="/profile" className="text-link">
        ← プロフィール
      </Link>

      <div className="card">
        <h1>プロフィール編集</h1>

        <form className="form" onSubmit={save}>
          <label>
            ニックネーム
            <input
              value={f.nickname}
              onChange={(e) =>
                setF({ ...f, nickname: e.target.value })
              }
            />
          </label>

          <label>
            現在の状況
            <select
              value={f.status}
              onChange={(e) =>
                setF({ ...f, status: e.target.value })
              }
            >
              <option value="">選択</option>
              <option>高校生</option>
              <option>大学生</option>
              <option>専門学生</option>
              <option>社会人</option>
              <option>その他</option>
            </select>
          </label>

          <label>
            分野・専攻
            <input
              value={f.field || ""}
              onChange={(e) =>
                setF({ ...f, field: e.target.value })
              }
            />
          </label>

          <label>
            自己紹介
            <textarea
              value={f.bio || ""}
              onChange={(e) =>
                setF({ ...f, bio: e.target.value })
              }
            />
          </label>

          <label>
            資格取得年（任意）
            <input
              type="number"
              value={f.qualification_year || ""}
              onChange={(e) =>
                setF({ ...f, qualification_year: e.target.value })
              }
            />
          </label>

          <label>
            1日平均勉強時間（任意・分）
            <input
              type="number"
              min="0"
              value={f.daily_study_minutes || ""}
              onChange={(e) =>
                setF({ ...f, daily_study_minutes: e.target.value })
              }
            />
          </label>

          <label>
            勉強期間（任意・日）
            <input
              type="number"
              min="0"
              value={f.study_period_days || ""}
              onChange={(e) =>
                setF({ ...f, study_period_days: e.target.value })
              }
            />
          </label>

          <label>
            勉強方法（複数選択）
            <div>
              {methods.map((method) => (
                <button
                  type="button"
                  className={`tag ${
                    f.study_methods.includes(method)
                      ? "activeTag"
                      : ""
                  }`}
                  key={method}
                  onClick={() => toggle(method)}
                >
                  {f.study_methods.includes(method) ? "✓ " : ""}
                  {method}
                </button>
              ))}
            </div>
          </label>

          <label>
            相談できる内容
            <textarea
              value={f.consultation_topics || ""}
              onChange={(e) =>
                setF({ ...f, consultation_topics: e.target.value })
              }
            />
          </label>

          <button className="btn">保存する</button>
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
