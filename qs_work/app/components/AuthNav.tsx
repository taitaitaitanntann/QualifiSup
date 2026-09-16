"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function AuthNav() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const checkUser = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setLoggedIn(!!user);
      setLoading(false);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;

  if (!loggedIn) {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <Link className="login" href="/signup">
          新規登録
        </Link>
        <Link className="login" href="/login">
          ログイン
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Link className="login" href="/profile">
        👤 プロフィール
      </Link>

      <Link className="login" href="/account">
        アカウント
      </Link>

      <button
        className="login"
        onClick={async () => {
          if (!supabase) return;

          if (!supabase) return;
          await supabase.auth.signOut();
          window.location.href = "/";
        }}
      >
        ログアウト
      </button>
    </div>
  );
}
