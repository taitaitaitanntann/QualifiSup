"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

function ConsultationsContent() {
  const params = useSearchParams();
  const holder = params.get("holder");

  const [me, setMe] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [active, setActive] = useState<any[]>([]);
  const [ended, setEnded] = useState<any[]>([]);
  const [holderName, setHolderName] = useState("資格者");
  const [qualification, setQualification] = useState<any[]>([]);
  const [qualificationId, setQualificationId] = useState("");
  const [topic, setTopic] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [status, setStatus] = useState("");
  const [tab, setTab] = useState<"asking" | "receiving">("asking");

  async function addNotification(
    userId: string,
    type: string,
    actorId: string,
    relatedId: string
  ) {
    if (!supabase || !userId) return;

    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      actor_id: actorId,
      related_id: relatedId,
    });
  }

  async function addActivity(
    userId: string,
    type: string,
    actorId: string,
    relatedId: string
  ) {
    if (!supabase || !userId) return;

    await supabase.from("activity_logs").insert({
      user_id: userId,
      type,
      actor_id: actorId,
      related_id: relatedId,
    });
  }

  async function load() {
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setMe(user);

    const [{ data: r }, { data: q }] = await Promise.all([
      supabase
        .from("consultations")
        .select(
          "id,requester_id,holder_id,qualification_id,topic,initial_message,status,decline_reason,created_at,approved_at,ended_at,requester:profiles!consultations_requester_id_fkey(id,nickname),holder:profiles!consultations_holder_id_fkey(id,nickname),qualification:qualifications(id,name)"
        )
        .or(`requester_id.eq.${user.id},holder_id.eq.${user.id}`)
        .order("created_at", { ascending: false }),

      supabase
        .from("qualifications")
        .select("id,name")
        .eq("verification_status", "verified")
        .order("name"),
    ]);

    const all = r || [];

    setRequests(
      all.filter(
        (x: any) =>
          x.holder_id === user.id && x.status === "pending"
      )
    );

    setActive(
      all.filter(
        (x: any) =>
          (x.requester_id === user.id ||
            x.holder_id === user.id) &&
          ["pending", "active"].includes(x.status)
      )
    );

    setEnded(
      all.filter(
        (x: any) =>
          (x.requester_id === user.id ||
            x.holder_id === user.id) &&
          ["ended", "declined"].includes(x.status)
      )
    );

    setQualification(q || []);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!supabase || !holder) return;

    async function fetchHolder() {
      if (!supabase || !holder) return;

      const { data: p } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", holder)
        .maybeSingle();

      setHolderName(p?.nickname || "資格者");
    }

    fetchHolder();
  }, [holder]);

  async function send() {
    if (!supabase || !me) {
      setStatus("相談申請にはログインが必要です。");
      return;
    }

    if (!holder || !topic.trim()) {
      setStatus("相談内容を入力してください。");
      return;
    }

    if (me.id === holder) {
      setStatus("自分自身には相談できません。");
      return;
    }

    const { data: back } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", holder)
      .eq("following_id", me.id)
      .maybeSingle();

    const { data: mine } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", me.id)
      .eq("following_id", holder)
      .maybeSingle();

    const direct = !!back && !!mine;

    const { data: existingConsultation, error: existingError } =
      await supabase
        .from("consultations")
        .select("id,status")
        .eq("requester_id", me.id)
        .eq("holder_id", holder)
        .in("status", ["pending", "active"])
        .limit(1)
        .maybeSingle();

    if (existingError) {
      setStatus("現在の相談状況を確認できませんでした。");
      return;
    }

    if (existingConsultation) {
      if (existingConsultation.status === "active") {
        setStatus("この資格者とはすでに相談中です。");
      } else {
        setStatus("この資格者への相談申請はすでに送信済みです。");
      }
      return;
    }

    const { data: consultation, error } = await supabase
      .from("consultations")
      .insert({
        requester_id: me.id,
        holder_id: holder,
        qualification_id: qualificationId || null,
        topic: topic.trim(),
        initial_message: initialMessage.trim() || null,
        status: direct ? "active" : "pending",
        approved_at: direct
          ? new Date().toISOString()
          : null,
      })
      .select("id")
      .single();

    if (error || !consultation) {
      setStatus("相談申請を送信できませんでした。");
      return;
    }

    if (direct) {
      await addNotification(
        holder,
        "consultation_request",
        me.id,
        consultation.id
      );

      await addNotification(
        holder,
        "consultation_approved",
        me.id,
        consultation.id
      );

      await addActivity(
        me.id,
        "consultation_requested",
        me.id,
        consultation.id
      );

      await addActivity(
        holder,
        "consultation_received",
        me.id,
        consultation.id
      );

      setStatus(
        "相互フォローのため、相談を開始しました。"
      );
    } else {
      await addNotification(
        holder,
        "consultation_request",
        me.id,
        consultation.id
      );

      await addActivity(
        me.id,
        "consultation_requested",
        me.id,
        consultation.id
      );

      await addActivity(
        holder,
        "consultation_received",
        me.id,
        consultation.id
      );

      setStatus(
        "相談申請を送信しました。資格者の承認を待ってください。"
      );
    }

    setTopic("");
    setInitialMessage("");
    await load();
  }

  async function approve(id: string) {
    if (!supabase || !me) return;

    const { data: consultation, error } = await supabase
      .from("consultations")
      .update({
        status: "active",
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("holder_id", me.id)
      .eq("status", "pending")
      .select("requester_id")
      .single();

    if (error || !consultation) {
      setStatus("承認できませんでした。");
      return;
    }

    await addNotification(
      consultation.requester_id,
      "consultation_approved",
      me.id,
      id
    );

    await addActivity(
      consultation.requester_id,
      "consultation_approved",
      me.id,
      id
    );

    await load();
    setStatus("相談を承認しました。");
  }

  async function decline(id: string) {
    if (!supabase || !me) return;

    const reason =
      prompt(
        "断る理由を選んでください（今は相談を受け付けていない／内容が専門外／忙しい／その他）"
      ) || "その他";

    const { data: consultation, error } = await supabase
      .from("consultations")
      .update({
        status: "declined",
        decline_reason: reason,
      })
      .eq("id", id)
      .eq("holder_id", me.id)
      .eq("status", "pending")
      .select("requester_id")
      .single();

    if (error || !consultation) {
      setStatus("断る処理に失敗しました。");
      return;
    }

    await addNotification(
      consultation.requester_id,
      "consultation_declined",
      me.id,
      id
    );

    await addActivity(
      consultation.requester_id,
      "consultation_declined",
      me.id,
      id
    );

    await load();
    setStatus("相談申請を辞退しました。");
  }

  async function end(id: string) {
    if (!supabase || !me) return;

    if (
      !confirm(
        "この相談を終了しますか？終了後は新しいメッセージを送れません。"
      )
    ) {
      return;
    }

    const { data: consultation, error } = await supabase
      .from("consultations")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      .eq("id", id)
      .or(
        `requester_id.eq.${me.id},holder_id.eq.${me.id}`
      )
      .eq("status", "active")
      .select("requester_id,holder_id")
      .single();

    if (error || !consultation) {
      setStatus("終了できませんでした。");
      return;
    }

    const otherUser =
      consultation.requester_id === me.id
        ? consultation.holder_id
        : consultation.requester_id;

    await addNotification(
      otherUser,
      "consultation_ended",
      me.id,
      id
    );

    await addActivity(
      me.id,
      "consultation_ended",
      me.id,
      id
    );

    await addActivity(
      otherUser,
      "consultation_ended",
      me.id,
      id
    );

    await load();
    setStatus("相談を終了しました。");
  }

  const askingList = active.filter(
    (c) => c.requester_id === me?.id
  );

  const receivingList = active.filter(
    (c) =>
      c.holder_id === me?.id &&
      c.status === "active"
  );

  return (
    <div className="wrap section">
      <h1>相談</h1>

      {holder ? (
        <div className="card form">
          <Link
            className="muted"
            href={`/holders/${holder}`}
          >
            ← {holderName}さんのプロフィールへ
          </Link>

          <h2>{holderName}さんに相談する</h2>

          <p className="muted">
            申請を送ると、相手が承認したあとチャットを開始できます。
            相互フォローの場合はこの画面から直接相談できます。
          </p>

          <label>
            相談する資格
            <select
              value={qualificationId}
              onChange={(e) =>
                setQualificationId(e.target.value)
              }
            >
              <option value="">選択しない</option>

              {qualification.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            相談内容
            <input
              value={topic}
              onChange={(e) =>
                setTopic(e.target.value)
              }
              placeholder="例：勉強方法について"
            />
          </label>

          <label>
            最初に伝えたいこと
            <textarea
              value={initialMessage}
              onChange={(e) =>
                setInitialMessage(e.target.value)
              }
              placeholder="自分の状況や聞きたいこと（任意）"
              rows={6}
            />
          </label>

          <button className="btn" onClick={send}>
            相談申請を送る
          </button>

          {status && (
            <div className="notice">{status}</div>
          )}
        </div>
      ) : (
        <>
          <div className="toolbar">
            <button
              className={
                tab === "asking"
                  ? "btn"
                  : "btn light"
              }
              onClick={() => setTab("asking")}
            >
              💬 相談している
            </button>

            <button
              className={
                tab === "receiving"
                  ? "btn"
                  : "btn light"
              }
              onClick={() => setTab("receiving")}
            >
              🗣️ 相談を受けている
            </button>
          </div>

          {tab === "receiving" &&
            requests.length > 0 && (
              <div className="list">
                {requests.map((c) => (
                  <div className="card" key={c.id}>
                    <b>
                      {c.requester?.nickname ||
                        "ユーザー"}
                      さんから相談申請
                    </b>

                    <p>
                      相談内容：{c.topic}
                    </p>

                    {c.initial_message && (
                      <p className="muted">
                        {c.initial_message}
                      </p>
                    )}

                    <div className="profile-actions">
                      <button
                        className="btn"
                        onClick={() =>
                          approve(c.id)
                        }
                      >
                        承認する
                      </button>

                      <button
                        className="btn light"
                        onClick={() =>
                          decline(c.id)
                        }
                      >
                        断る
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          {(tab === "asking"
            ? askingList
            : receivingList
          ).length > 0 ? (
            <div className="list">
              {(tab === "asking"
                ? askingList
                : receivingList
              ).map((c) => (
                <div className="card" key={c.id}>
                  <span className="pill">
                    {c.status === "pending"
                      ? "承認待ち"
                      : "相談中"}
                  </span>

                  <h3>
                    {tab === "asking"
                      ? c.holder?.nickname ||
                        "資格者"
                      : c.requester?.nickname ||
                        "相談者"}
                    さん
                  </h3>

                  <p>{c.topic}</p>

                  {c.status === "active" && (
                    <>
                      <Link
                        className="btn"
                        href={`/consultations/${c.id}`}
                      >
                        チャットを開く
                      </Link>

                      <button
                        className="btn light"
                        onClick={() =>
                          end(c.id)
                        }
                      >
                        相談を終了する
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              {tab === "asking"
                ? "相談中の相手はいません。"
                : "新しい相談申請はありません。"}
            </div>
          )}

          {ended.length > 0 && (
            <details
              className="card"
              style={{ marginTop: 16 }}
            >
              <summary>
                終了・辞退した相談（
                {ended.length}）
              </summary>

              <div
                className="list"
                style={{ marginTop: 12 }}
              >
                {ended.map((c) => (
                  <div
                    className="qualification-row"
                    key={c.id}
                  >
                    <b>{c.topic}</b>

                    <span className="muted">
                      {c.status === "ended"
                        ? "終了"
                        : "辞退"}

                      {c.decline_reason
                        ? `・${c.decline_reason}`
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {status && (
            <div className="notice">{status}</div>
          )}
        </>
      )}
    </div>
  );
}


export default function Consultations() {
  return (
    <Suspense
      fallback={
        <div className="wrap section">
          <div className="empty">読み込み中…</div>
        </div>
      }
    >
      <ConsultationsContent />
    </Suspense>
  );
}
