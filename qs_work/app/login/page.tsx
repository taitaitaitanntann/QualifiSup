 "use client";
import {useState} from "react";
import Link from "next/link";
import {supabase} from "../../lib/supabase";

export default function Login(){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMsg("");
  if(!supabase){setMsg("Supabaseが未接続です。.env.localを設定してください。");setBusy(false);return;}
  const {error}=await supabase.auth.signInWithPassword({email,password});
  setMsg(error?error.message:"ログインしました。");
  setBusy(false);
 }
 async function reset(){if(!supabase){setMsg("Supabaseが未接続です。");return;} if(!email){setMsg("メールアドレスを入力してください。");return;}
  const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/account`});
  setMsg(error?error.message:"パスワード再設定メールを送信しました。");
 }
 return <div className="wrap section"><div className="card form"><h1>ログイン</h1>
 <form onSubmit={submit} className="form"><label>メールアドレス<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
 <label>パスワード<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label>
 <button className="btn" disabled={busy}>{busy?"処理中…":"ログイン"}</button></form>
 <button className="btn light" onClick={reset}>パスワードを忘れた場合</button>
 {msg&&<div className="notice">{msg}</div>}
 <p className="muted">アカウントがない方 → <Link href="/signup">新規登録</Link></p>
 </div></div>
}