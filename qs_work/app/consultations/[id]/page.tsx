"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function Chat() {
  const params = useParams();
  const id = String(params.id);

  const [me, setMe] = useState<any>(null);
  const [c, setC] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchChat() {
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      setMe(user);

      const { data: consult, error } = await supabase
        .from("consultations")
        .select(
          "id,requester_id,holder_id,topic,status,qualification:qualifications(name),requester:profiles!consultations_requester_id_fkey(nickname),holder:profiles!consultations_holder_id_fkey(nickname)"
        )
        .eq("id", id)
        .maybeSingle();

      if (
        cancelled ||
        error ||
        !consult ||
        ![consult.requester_id, consult.holder_id].includes(user.id)
      ) {
        if (!cancelled) {
          setStatus("この相談を開く権限がありません。");
        }
        return;
      }

      setC(consult);

      const { data: ms, error: messageError } = await supabase
        .from("messages")
        .select("id,sender_id,body,created_at")
        .eq("consultation_id", id)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (!cancelled) {
        if (messageError) {
          setStatus("メッセージを取得できませんでした。");
        } else {
          setMessages(ms || []);
        }
      }
    }

    fetchChat();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!supabase || !id) return;

    const channel = supabase
      .channel(`consultation-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `consultation_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((x) => x.id === payload.new.id)) {
              return prev;
            }

            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      if (!supabase) return;
      void supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    bottom.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function send() {
    if (
      !supabase ||
      !me ||
      !c ||
      c.status !== "active" ||
      !body.trim()
    ) {
      return;
    }

    const text = body.trim();

    setBody("");
    setStatus("");

    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    const optimisticMessage = {
      id: tempId,
      consultation_id: id,
      sender_id: me.id,
      body: text,
      created_at: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    const { data: insertedMessage, error } = await supabase
      .from("messages")
      .insert({
        consultation_id: id,
        sender_id: me.id,
        body: text,
      })
      .select("id,sender_id,body,created_at")
      .single();

    if (error || !insertedMessage) {
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempId)
      );
      setBody(text);
      setStatus("メッセージを送信できませんでした。");
      return;
    }

    setMessages((prev) =>
      prev.map((m) =>
        m.id === tempId
          ? {
              ...insertedMessage,
              consultation_id: id,
            }
          : m
      )
    );
  }

  if (status && !c) {
    return (
      <div className="wrap section">
        <div className="card">
          <p>{status}</p>
          <Link className="btn light" href="/consultations">
            相談一覧へ
          </Link>
        </div>
      </div>
    );
  }

  if (!c) {
    return (
      <div className="wrap section">
        <div className="card">読み込み中…</div>
      </div>
    );
  }

  const other =
    me?.id === c.requester_id
      ? c.holder?.nickname
      : c.requester?.nickname;

  return (
    <div className="wrap section detail">
      <Link className="muted" href="/consultations">
        ← 相談一覧へ
      </Link>

      <div className="card" style={{ marginTop: 14 }}>
        <span className="pill">
          {c.status === "active" ? "相談中" : "終了"}
        </span>

        <h1 className="big">
          {other || "相手"}さんとの相談
        </h1>

        <p className="muted">
          {c.qualification?.name
            ? `${c.qualification.name}・`
            : ""}
          {c.topic}
        </p>
      </div>

      <div className="card chat-box">
        {messages.map((m) => (
          <div
            className={
              m.sender_id === me?.id
                ? "message mine"
                : "message"
            }
            key={m.id}
          >
            <div className="message-body">{m.body}</div>

            <span className="muted">
              {new Date(m.created_at).toLocaleString(
                "ja-JP",
                {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </span>
          </div>
        ))}

        {!messages.length && (
          <p className="muted">
            まだメッセージはありません。
            最初のメッセージを送ってみましょう。
          </p>
        )}

        <div ref={bottom} />
      </div>

      {c.status === "active" ? (
        <div className="chat-compose">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="メッセージを入力"
            rows={3}
          />

          <button className="btn" onClick={send}>
            送信
          </button>
        </div>
      ) : (
        <div className="notice">
          この相談は終了しています。
          再度相談する場合は、新しい相談申請を送ってください。
        </div>
      )}

      {status && <div className="notice">{status}</div>}
    </div>
  );
}
