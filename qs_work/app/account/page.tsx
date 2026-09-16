 "use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {supabase} from "../../lib/supabase";
export default function Account(){
 const [email,setEmail]=useState(""),[msg,setMsg]=useState("");
 useEffect(()=>{supabase?.auth.getUser().then(({data})=>setEmail(data.user?.email||""))},[]);
 async function logout(){if(supabase){await supabase.auth.signOut();setMsg("ログアウトしました。");}}
 return <div className="wrap section"><div className="card"><h1>アカウント</h1><p>{email||"未ログイン"}</p><div className="profile-actions"><Link className="btn light" href="/notifications">通知・最近の活動</Link><Link className="btn light" href="/favorites">お気に入り資格</Link><Link className="btn light" href="/search-history">検索履歴</Link><Link className="btn light" href="/settings">通知設定</Link><Link className="btn light" href="/profile/edit">プロフィール編集</Link><Link className="btn light" href="/reports">報告履歴</Link><button className="btn" onClick={logout}>ログアウト</button></div>{msg&&<p className="muted">{msg}</p>}</div></div>
}