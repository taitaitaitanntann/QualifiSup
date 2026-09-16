"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      if (!supabase) {
        setMsg("Supabase未接続です。");
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMsg("プロフィールを見るにはログインしてください。");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "nickname,status,field,bio,qualification_year,daily_study_minutes,study_period_days,study_methods,consultation_topics"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setMsg("プロフィールを取得できませんでした。");
      } else {
        setProfile(data);
      }

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="wrap section">
        <div className="empty">プロフィールを読み込み中です。</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="wrap section">
        <div className="card">
          <h1>プロフィール</h1>
          <div className="empty">
            {msg || "プロフィールがまだ作成されていません。"}
          </div>
          <Link className="btn" href="/profile/edit">
            プロフィールを作成・編集する
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap section detail">
      <div className="card profile-card">
        <div className="profile-head">
          <div className="avatar large">
            {(profile.nickname || "U").slice(0, 1)}
          </div>

          <div>
            <h1>{profile.nickname || "ニックネーム未設定"}</h1>
            <p className="muted">
              {profile.status || "状況未設定"}・
              {profile.field || "分野未設定"}
            </p>
          </div>
        </div>

        {profile.bio && (
          <>
            <h3>自己紹介</h3>
            <p>{profile.bio}</p>
          </>
        )}

        {profile.qualification_year && (
          <p>
            <b>資格取得年：</b>
            {profile.qualification_year}年
          </p>
        )}

        {profile.daily_study_minutes != null && (
          <p>
            <b>1日平均勉強時間：</b>
            {profile.daily_study_minutes}分
          </p>
        )}

        {profile.study_period_days != null && (
          <p>
            <b>勉強期間：</b>
            {profile.study_period_days}日
          </p>
        )}

        {profile.study_methods?.length > 0 && (
          <>
            <h3>勉強方法</h3>
            <div>
              {profile.study_methods.map((m: string) => (
                <span className="tag" key={m}>
                  📚 {m}
                </span>
              ))}
            </div>
          </>
        )}

        {profile.consultation_topics && (
          <>
            <h3>相談できる内容</h3>
            <p>{profile.consultation_topics}</p>
          </>
        )}

        <div className="profile-actions">
          <Link className="btn" href="/profile/edit">
            プロフィールを編集
          </Link>

          <Link className="btn light" href="/account">
            アカウント
          </Link>
        </div>
      </div>
    </div>
  );
}
