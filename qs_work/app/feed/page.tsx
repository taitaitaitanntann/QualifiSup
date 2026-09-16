"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Post={id:string;body:string;created_at:string;user_id:string;profile?:{nickname:string;status:string;field:string|null;avatar_url:string|null};qualification?:{name:string}|null;likes:number;liked:boolean;score:number;isFollow:boolean;isMutual:boolean};
const demo:Post[]=[
 {id:"demo1",body:"2級建築士の勉強を始めました。まずは過去問を中心に進めています。",created_at:new Date().toISOString(),user_id:"demo",profile:{nickname:"たくみ",status:"工業高校生",field:"建築系",avatar_url:null},qualification:{name:"二級建築士"},likes:12,liked:false,score:0,isFollow:true,isMutual:true},
 {id:"demo2",body:"資格試験は、分からないところをそのままにせず調べることを意識しています。",created_at:new Date(Date.now()-3600000).toISOString(),user_id:"demo2",profile:{nickname:"ゆう",status:"社会人",field:"IT・情報",avatar_url:null},qualification:{name:"基本情報技術者試験"},likes:8,liked:false,score:0,isFollow:false,isMutual:false}
];
export default function Feed(){
 const [posts,setPosts]=useState<Post[]>([]); const [mode,setMode]=useState<"recommended"|"new"|"mutual">("recommended"); const [loading,setLoading]=useState(true); const [me,setMe]=useState<string|null>(null);
 useEffect(()=>{load();},[mode]);
 async function load(){
  setLoading(true); if(!supabase){setPosts(sortPosts(demo));setLoading(false);return;}
  const {data:{user}}=await supabase.auth.getUser(); setMe(user?.id||null);
  const {data:raw}=await supabase.from("posts").select("id,body,created_at,user_id,qualification_id,profiles(nickname,status,field,avatar_url),qualifications(name)").is("deleted_at",null).order("created_at",{ascending:false}).limit(80);
  if(!raw||!raw.length){setPosts([]);setLoading(false);return;}
  const ids=(raw as any[]).map(p=>p.user_id); const {data:follows}=await supabase.from("follows").select("follower_id,following_id").or(`follower_id.eq.${user?.id||"00000000-0000-0000-0000-000000000000"},following_id.eq.${user?.id||"00000000-0000-0000-0000-000000000000"}`);
  const followRows=follows||[]; const following=new Set(followRows.filter(f=>f.follower_id===user?.id).map(f=>f.following_id)); const followers=new Set(followRows.filter(f=>f.following_id===user?.id).map(f=>f.follower_id));
  const visible=(raw as any[]).filter(p=>mode!=="mutual" || (following.has(p.user_id)&&followers.has(p.user_id)));
  const postIds=visible.map(p=>p.id); let likes:any[]=[]; if(postIds.length){const r=await supabase.from("likes").select("target_id,user_id").eq("target_type","post").in("target_id",postIds);likes=r.data||[];}
  const mapped=visible.map(p=>{const isF=following.has(p.user_id),isM=isF&&followers.has(p.user_id),ls=likes.filter(l=>l.target_id===p.id);return {...p,likes:ls.length,liked:!!user&&ls.some(l=>l.user_id===user.id),isFollow:isF,isMutual:isM,score:(isM?30:0)+(isF?20:0)+Math.min(ls.length,20)+(Math.max(0,7-(Date.now()-new Date(p.created_at).getTime())/86400000)*2)};});
  setPosts(sortPosts(mapped));setLoading(false);
 }
 function sortPosts(a:Post[]){if(mode==="new")return [...a].sort((x,y)=>+new Date(y.created_at)-+new Date(x.created_at));if(mode==="mutual")return [...a].sort((x,y)=>+new Date(y.created_at)-+new Date(x.created_at));return [...a].sort((x,y)=>y.score-x.score);}
 async function like(p:Post){if(!supabase){setPosts(ps=>ps.map(x=>x.id===p.id?{...x,liked:!x.liked,likes:x.likes+(x.liked?-1:1)}:x));return;} const {data:{user}}=await supabase.auth.getUser();if(!user)return alert("ログインしてください"); if(p.liked){await supabase.from("likes").delete().eq("user_id",user.id).eq("target_type","post").eq("target_id",p.id)}else{await supabase.from("likes").insert({user_id:user.id,target_type:"post",target_id:p.id})};setPosts(ps=>ps.map(x=>x.id===p.id?{...x,liked:!x.liked,likes:x.likes+(x.liked?-1:1)}:x));}
 return <main className="section"><div className="wrap feedWrap"><div className="feedHeader"><div><h1>タイムライン</h1><p className="muted">資格に関する投稿を見つけよう。</p></div><Link className="btn" href="/posts/new">＋投稿する</Link></div><div className="tabs">{[["recommended","おすすめ"],["new","新着"],["mutual","相互フォロー"]].map(([v,l])=><button key={v} className={mode===v?"tab active":"tab"} onClick={()=>setMode(v as any)}>{l}</button>)}</div>{loading?<p>読み込み中…</p>:posts.length===0?<div className="card"><h3>投稿がありません</h3><p className="muted">まずは資格について投稿してみましょう。</p></div>:<div className="feedList">{posts.map(p=><article className="card post" key={p.id}><div className="postTop"><div className="avatar">{p.profile?.nickname?.slice(0,1)||"?"}</div><div><Link href={`/holders/${p.user_id}`}><strong>{p.profile?.nickname||"退会ユーザー"}</strong></Link><div className="muted">{p.profile?.status}{p.profile?.field?`・${p.profile.field}`:""} · {new Date(p.created_at).toLocaleString("ja-JP")}</div></div></div>{p.qualification&&<span className="pill">{p.qualification.name}</span>}<p className="postBody">{p.body}</p><button className={p.liked?"like liked":"like"} onClick={()=>like(p)}>👍 役に立った {p.likes}</button></article>)}</div>}</div></main>
}
