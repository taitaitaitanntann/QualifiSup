"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {supabase} from "../../lib/supabase";
type Fav={id:string;qualification_id:string;created_at:string;qualifications?:{name:string;field:string;qualification_type:string;eligibility_status:string;exam_fee:number|null;exam_date:string|null}};
export default function Favorites(){
 const [items,setItems]=useState<Fav[]>([]),[loading,setLoading]=useState(true),[msg,setMsg]=useState("");
 useEffect(()=>{(async()=>{if(!supabase){setLoading(false);return}const {data:u}=await supabase.auth.getUser();if(!u.user){setLoading(false);return}const {data,error}=await supabase.from("favorites").select("*, qualifications(name,field,qualification_type,eligibility_status,exam_fee,exam_date)").eq("user_id",u.user.id).order("created_at",{ascending:false});if(error)setMsg("お気に入りを取得できませんでした。");else setItems((data||[]) as Fav[]);setLoading(false)})()},[]);
 async function remove(id:string){if(!supabase)return;const {error}=await supabase.from("favorites").delete().eq("id",id);if(!error)setItems(x=>x.filter(i=>i.id!==id));}
 return <div className="wrap section"><Link className="muted" href="/account">← アカウント</Link><h1>お気に入り資格</h1><p className="muted">気になる資格を一覧で確認できます。</p>{loading?<div className="empty">読み込み中…</div>:!supabase?<div className="empty">Supabase接続後にお気に入りが利用できます。</div>:!items.length?<div className="empty">お気に入りに登録した資格はありません。</div>:<div className="list">{items.map(f=><div className="card" key={f.id}><div style={{display:"flex",justifyContent:"space-between",gap:12}}><div><span className="pill">{f.qualifications?.field||"未確認"}</span><h3 style={{marginBottom:8}}>{f.qualifications?.name||"資格情報"}</h3><span className="tag">{f.qualifications?.qualification_type||"未確認"}</span><span className="tag">{f.qualifications?.eligibility_status||"未確認"}</span>{f.qualifications?.exam_fee!=null&&<span className="tag">受験料 {f.qualifications.exam_fee.toLocaleString()}円</span>}<p className="muted">試験：{f.qualifications?.exam_date||"未確認"}</p></div><button className="btn light" onClick={()=>remove(f.id)}>解除</button></div></div>)}</div>}{msg&&<p className="muted">{msg}</p>}</div>
}
