"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {supabase} from "../../lib/supabase";
type H={id:string;search_type:string;query_text:string;filters:any;created_at:string};
const labels:any={qualification:"資格検索",holder:"資格者検索",question:"質問検索"};
export default function SearchHistory(){
 const [items,setItems]=useState<H[]>([]),[loading,setLoading]=useState(true),[msg,setMsg]=useState("");
 useEffect(()=>{(async()=>{if(!supabase){setLoading(false);return}const {data:u}=await supabase.auth.getUser();if(!u.user){setLoading(false);return}const {data,error}=await supabase.from("search_history").select("*").eq("user_id",u.user.id).order("created_at",{ascending:false}).limit(100);if(error)setMsg("検索履歴を取得できませんでした。");else setItems((data||[]) as H[]);setLoading(false)})()},[]);
 async function clearAll(){if(!supabase)return;const {data:u}=await supabase.auth.getUser();if(!u.user)return;await supabase.from("search_history").delete().eq("user_id",u.user.id);setItems([])}
 async function remove(id:string){if(!supabase)return;const {error}=await supabase.from("search_history").delete().eq("id",id);if(!error)setItems(x=>x.filter(i=>i.id!==id));}
 function rerun(h:H){const path=h.search_type==="qualification"?"/qualifications":h.search_type==="holder"?"/holders":"/questions";window.location.href=path+(h.query_text?`?q=${encodeURIComponent(h.query_text)}`:"");}
 return <div className="wrap section"><Link className="muted" href="/account">← アカウント</Link><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><div><h1>検索履歴</h1><p className="muted">資格・資格者・質問の検索をもう一度実行できます。</p></div>{items.length>0&&<button className="btn light" onClick={clearAll}>すべて削除</button>}</div>{loading?<div className="empty">読み込み中…</div>:!supabase?<div className="empty">Supabase接続後に検索履歴が利用できます。</div>:!items.length?<div className="empty">検索履歴はありません。</div>:<div className="list">{items.map(h=><div className="card" key={h.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><button onClick={()=>rerun(h)} style={{border:0,background:"transparent",textAlign:"left",padding:0,cursor:"pointer",flex:1}}><span className="tag">{labels[h.search_type]||h.search_type}</span><h3 style={{margin:"8px 0 4px"}}>{h.query_text||"条件検索"}</h3><span className="muted">{new Date(h.created_at).toLocaleString("ja-JP")}</span></button><button className="btn light" onClick={()=>remove(h.id)}>削除</button></div>)}</div>}{msg&&<p className="muted">{msg}</p>}</div>
}
