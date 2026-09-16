"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default function HolderProfile() {
  const { id } = useParams<{ id: string }>();

  const [profile, setProfile] = useState<any>(null);
  const [quals, setQuals] = useState<any[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [mutual, setMutual] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [consult, setConsult] = useState({
    count: 0,
    helpful: 0,
    ratingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function load() {
    setLoading(true);
    setMsg("");

    if (!supabase) {
      setProfile({
        id,
        nickname: id === "demo-takumi" ? "たくみ" : "資格者",
        status: "大学生",
        field: "建築系",
        bio: "資格取得の経験をもとに、勉強方法や試験対策について相談できます。",
        daily_study_minutes: 60,
        study_period_days: 120,
        study_methods: ["独学", "過去問中心"],
        consultation_topics: "勉強方法・教材・試験対策",
      });

      setQuals([
        {
          name: "二級建築士",
          relationship: "取得済み",
          acquisition_year: 2025,
        },
      ]);

      setCounts({ followers: 24, following: 18 });
      setConsult({ count: 12, helpful: 96, ratingCount: 10 });
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setMe(user?.id || null);

    const { data: p, error } = await supabase
      .from("profiles")
      .select(
        "id,nickname,status,field,bio,avatar_url,qualification_year,daily_study_minutes,study_period_days,study_methods,consultation_topics"
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !p) {
      setMsg("資格者プロフィールを取得できませんでした。");
      setLoading(false);
      return;
    }

    setProfile(p);

    const { data: uq } = await supabase
      .from("user_qualifications")
      .select(
        "qualification_id,relationship,acquisition_year,qualifications(id,name)"
      )
      .eq("user_id", id);

    setQuals(
      (uq || []).map((x: any) => ({
        id: x.qualification_id,
        name: x.qualifications?.name || "資格",
        relationship: x.relationship,
        acquisition_year: x.acquisition_year,
      }))
    );

    const [{ data: mine }, { data: from }, { data: to }] =
      await Promise.all([
        user
          ? supabase
              .from("follows")
              .select("follower_id,following_id")
              .or(
                `follower_id.eq.${user.id},following_id.eq.${user.id}`
              )
          : Promise.resolve({ data: [] }),
        supabase
          .from("follows")
          .select("follower_id")
          .eq("following_id", id),
        supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", id),
      ]);

    const rows = mine || [];

    const amFollowing =
      !!user &&
      rows.some(
        (x: any) =>
          x.follower_id === user.id && x.following_id === id
      );

    const followsMe =
      !!user &&
      rows.some(
        (x: any) =>
          x.follower_id === id && x.following_id === user.id
      );

    setFollowing(amFollowing);
    setMutual(amFollowing && followsMe);

    setCounts({
      followers: (from || []).length,
      following: (to || []).length,
    });

    const { data: cs } = await supabase
      .from("consultations")
      .select("id")
      .eq("holder_id", id)
      .in("status", ["active", "ended"]);

    const cids = (cs || []).map((x: any) => x.id);

    let rs: any[] = [];

    if (cids.length) {
      const r = await supabase
        .from("consultation_ratings")
        .select("helpful")
        .in("consultation_id", cids);

      rs = r.data || [];
    }

    setConsult({
      count: (cs || []).length,
      helpful: rs.length
        ? Math.round(
            (rs.filter((x) => x.helpful).length / rs.length) * 100
          )
        : 0,
      ratingCount: rs.length,
    });

    setLoading(false);
  }

  async function toggleFollow() {
    if (!supabase) {
      setFollowing((v) => !v);
      return;
    }

    if (!me) {
      setMsg("フォローするにはログインしてください。");
      return;
    }

    if (me === id) return;

    if (following) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", me)
        .eq("following_id", id);

      if (error) {
        setMsg("フォロー解除に失敗しました。");
        return;
      }

      setFollowing(false);
      setMutual(false);
      setCounts((c) => ({
        ...c,
        followers: Math.max(0, c.followers - 1),
      }));
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({
          follower_id: me,
          following_id: id,
        });

      if (error) {
        setMsg("フォローできませんでした。");
        return;
      }

      await load();
    }
  }

  if (loading) {
    return (
      <div className="wrap section">
        <div className="empty">読み込み中…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="wrap section">
        <div className="empty">
          {msg || "プロフィールが見つかりません。"}
        </div>
      </div>
    );
  }

  return (
    <div className="wrap section detail">
      <Link href="/holders" className="text-link">
        ← 資格者を探す
      </Link>

      <div className="card profile-card">
        <div className="profile-head">
          <div className="avatar large-avatar">
            {profile.nickname?.slice(0, 1) || "?"}
          </div>

          <div>
            <h1 className="big">{profile.nickname}</h1>

            <div className="muted">
              {profile.status}
              {profile.field ? `・${profile.field}` : ""}
            </div>

            <div className="profile-follow-counts">
              <span>フォロワー {counts.followers}</span>
              <span>フォロー {counts.following}</span>

              {mutual && (
                <span className="pill">相互フォロー</span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button className="btn" onClick={toggleFollow}>
            {following ? "フォロー中" : "フォローする"}
          </button>

          <Link
            className="btn light"
            href={`/consultations?holder=${id}`}
          >
            {mutual ? "この人に相談する" : "相談を申請する"}
          </Link>
        </div>

        {msg && (
          <div className="notice" style={{ marginTop: 12 }}>
            {msg}
          </div>
        )}

        <h3>自己紹介</h3>
        <p>{profile.bio || "自己紹介はまだありません。"}</p>

        <h3>保有・挑戦中の資格</h3>

        {quals.length ? (
          quals.map((q) => (
            <div
              className="qualification-row"
              key={q.id || q.name}
            >
              <b>
                {q.relationship === "取得済み" ? "🏆" : "📚"}{" "}
                {q.name}
              </b>

              <span className="muted">
                {q.relationship}
                {q.acquisition_year
                  ? `・${q.acquisition_year}年`
                  : ""}
              </span>
            </div>
          ))
        ) : (
          <p className="muted">
            登録されている資格はありません。
          </p>
        )}

        <h3>勉強情報</h3>

        <div className="metric">
          <div>
            <b>
              {profile.daily_study_minutes != null
                ? `${profile.daily_study_minutes}分`
                : "—"}
            </b>
            <span className="muted">1日平均</span>
          </div>

          <div>
            <b>
              {profile.study_period_days != null
                ? `${profile.study_period_days}日`
                : "—"}
            </b>
            <span className="muted">勉強期間</span>
          </div>
        </div>

        {(profile.study_methods || []).length > 0 && (
          <div>
            {profile.study_methods.map((m: string) => (
              <span className="tag" key={m}>
                📚 {m}
              </span>
            ))}
          </div>
        )}

        <h3>相談できる内容</h3>
        <p>{profile.consultation_topics || "未設定"}</p>

        <h3>相談実績</h3>

        <div className="metric">
          <div>
            <b>{consult.count}</b>
            <span className="muted">相談件数</span>
          </div>

          <div>
            <b>
              {consult.ratingCount
                ? `${consult.helpful}%`
                : "未評価"}
            </b>
            <span className="muted">役に立った</span>
          </div>
        </div>
      </div>
    </div>
  );
}
