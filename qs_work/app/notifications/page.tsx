"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";

const labels:any={follow:"フォロー",mutual_follow:"相互フォロー",consultation_request:"新しい相談申請",consultation_approved:"相談が承認されました",consultation_declined:"相談が辞退されました",new_message:"新着メッセージ",consultation_ended:"相談が終了しました"};
const activityLabels:any={follow:"フォローされました",mutual_follow:"相互フォローになりました",consultation_requested:"相談を申請しました",consultation_received:"相談申請を受けました",consultation_approved:"相談が承認されました",consultation_declined:"相談が辞退されました",consultation_ended:"相談が終了しました",new_message:"新着メッセージがあります"};
export default function Notifications(){
 const [items,setItems]=useState<any[]>([]),[activities,setActivities]=useState<any[]>([]),[tab,setTab]=useState("all"),[loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{if(!supabase){setLoading(false);return;} const {data:u}=await supabase.auth.getUser(); if(!u.user){setLoading(false);return;} const [{data:n},{data:a}]=await Promise.all([
  supabase.from("notifications").select("id,type,actor_id,related_id,read_at,created_at,actor:profiles!notifications_actor_id_fkey(nickname)").eq("user_id",u.user.id).order("created_at",{ascending:false}).limit(50),
  supabase.from("activity_logs").select("id,type,actor_id,related_id,metadata,created_at,actor:profiles!activity_logs_actor_id_fkey(nickname)").eq("user_id",u.user.id).order("created_at",{ascending:false}).limit(50)
 ]); setItems(n||[]);setActivities(a||[]);setLoading(false); })()},[]);
 async function markRead(id:string){if(!supabase)return; await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("id",id);setItems(v=>v.map(x=>x.id===id?{...x,read_at:new Date().toISOString()}:x));}
 async function markAll(){if(!supabase)return; const unread=items.filter(x=>!x.read_at).map(x=>x.id);if(unread.length)await supabase.from("notifications").update({read_at:new Date().toISOString()}).in("id",unread);setItems(v=>v.map(x=>({...x,read_at:x.read_at||new Date().toISOString()})));}
 const unread=items.filter(x=>!x.read_at).length;
 return <div className="wrap section detail"><div className="page-head"><div><h1>通知・最近の活動</h1><p className="muted">フォローや相談、メッセージなどの動きをまとめて確認できます。</p></div>{tab!=="activity"&&<button className="btn light" onClick={markAll}>すべて既読</button>}</div>
 <div className="tabs"><button className={tab==="all"?"active":""} onClick={()=>setTab("all")}>通知 {unread>0&&<span className="count">{unread}</span>}</button><button className={tab==="activity"?"active":""} onClick={()=>setTab("activity")}>最近の活動</button></div>
 {loading?<div className="empty">読み込み中…</div>:tab==="activity"?<div className="list">{activities.length?activities.map(a=><div className="card activity-item" key={a.id}><div><b>{a.actor?.nickname||"ユーザー"}</b> {activityLabels[a.type]||"活動がありました"}</div><div className="muted">{new Date(a.created_at).toLocaleString("ja-JP")}</div>{a.related_id&&a.type?.includes("consultation")&&<Link className="text-link" href={`/consultations/${a.related_id}`}>相談を確認する →</Link>}</div>):<div className="empty">最近の活動はありません。</div>}</div>:<div className="list">{items.length?items.map(n=><button className={`card notification-item ${!n.read_at?"unread":""}`} key={n.id} onClick={()=>markRead(n.id)}><div className="notification-title"><b>{n.actor?.nickname||"ユーザー"}</b> {labels[n.type]||"お知らせ"}{!n.read_at&&<span className="dot"/>}</div><div className="muted">{new Date(n.created_at).toLocaleString("ja-JP")}</div>{n.related_id&&n.type?.includes("consultation")&&<span className="text-link">相談を確認する →</span>}</button>):<div className="empty">通知はありません。</div>}</div>}
 </div>
}
