"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Qualification = { id:string; name:string };
type Question = { id:string; qualification_id:string; title:string; body:string; created_at:string; edited:boolean; profiles?:{nickname:string}|null; qualifications?:{name:string}|null };

const demo = [
 {id:"demo-1",qualification_id:"",title:"二級建築士の受験資格について教えてください",body:"高校生のうちから準備するとしたら、まず何を勉強するのがおすすめですか？",created_at:new Date().toISOString(),edited:false,qualifications:{name:"二級建築士"},profiles:{nickname:"建築を勉強中"}},
 {id:"demo-2",qualification_id:"",title:"ITパスポートの勉強の進め方は？",body:"高校生から始める場合、どのような順番で勉強するとよいでしょうか？",created_at:new Date().toISOString(),edited:false,qualifications:{name:"ITパスポート試験"},profiles:{nickname:"資格挑戦中"}},
 {id:"demo-3",qualification_id:"",title:"宅地建物取引士の教材について",body:"実際に受験した方が使ってよかった教材を知りたいです。",created_at:new Date().toISOString(),edited:false,qualifications:{name:"宅地建物取引士"},profiles:{nickname:"資格初心者"}}
] as Question[];

export default function Questions(){
 const [questions,setQuestions]=useState<Question[]>(demo); const [quals,setQuals]=useState<Qualification[]>([]); const [open,setOpen]=useState(false); const [title,setTitle]=useState(""); const [body,setBody]=useState(""); const [qid,setQid]=useState(""); const [keyword,setKeyword]=useState(""); const [loading,setLoading]=useState(true); const [message,setMessage]=useState("");
 useEffect(()=>{(async()=>{ if(!supabase){setLoading(false);return;} const [{data:q},{data:c}]=await Promise.all([supabase.from("questions").select("id,qualification_id,title,body,created_at,edited,profiles(nickname),qualifications(name)").is("deleted_at",null).order("created_at",{ascending:false}),supabase.from("qualifications").select("id,name").eq("verification_status","verified").order("name")]); if(q&&q.length)setQuestions(q as any); if(c)setQuals(c as Qualification[]); setLoading(false); })() },[]);
 async function submit(e:React.FormEvent){e.preventDefault(); setMessage(""); if(!qid||!title.trim()||!body.trim()){setMessage("資格・タイトル・質問内容を入力してください。");return;} if(!supabase){setMessage("Supabase未接続のため、現在はデモ表示です。");return;} const {data:{user}}=await supabase.auth.getUser(); if(!user){setMessage("質問を投稿するにはログインしてください。");return;} const {data,error}=await supabase.from("questions").insert({user_id:user.id,qualification_id:qid,title:title.trim(),body:body.trim()}).select("id,qualification_id,title,body,created_at,edited,profiles(nickname),qualifications(name)").single(); if(error){setMessage(error.message);return;} setQuestions([data as any,...questions]); setTitle("");setBody("");setQid("");setOpen(false);setMessage("質問を投稿しました。"); }
 const filtered=questions.filter(q=>(`${q.title} ${q.body} ${q.qualifications?.name||""}`).toLowerCase().includes(keyword.toLowerCase()));
 return <div className="wrap section"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}><div><h1>質問広場</h1><p className="muted">資格タグ必須。資格に関係する人が回答できます。</p></div><button className="btn" onClick={()=>setOpen(!open)}>質問する</button></div>
 <div className="toolbar"><input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="質問・資格名を検索" /></div>
 {message&&<div className="notice" style={{marginBottom:14}}>{message}</div>}
 {open&&<form className="card form" style={{margin:"20px 0"}} onSubmit={submit}><label>資格<select value={qid} onChange={e=>setQid(e.target.value)}><option value="">資格を選択してください</option>{quals.map(q=><option key={q.id} value={q.id}>{q.name}</option>)}</select></label><label>タイトル<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="例：二級建築士は高校生から受験できますか？" /></label><label>質問内容<textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="質問内容を書いてください"/></label><div style={{display:"flex",gap:10}}><button className="btn" type="submit">投稿する</button><button className="btn light" type="button" onClick={()=>setOpen(false)}>キャンセル</button></div></form>}
 <div className="list">{filtered.map(q=><Link href={`/questions/${q.id}`} className="card" key={q.id}><span className="pill">#{q.qualifications?.name||"資格"}</span><h3>{q.title}</h3><p className="muted">{q.body.slice(0,100)}{q.body.length>100?"…":""}</p><span className="muted">{q.profiles?.nickname||"ユーザー"}　{new Date(q.created_at).toLocaleDateString("ja-JP")}{q.edited?"　編集済み":""}</span></Link>)}</div>{!loading&&!filtered.length&&<div className="empty">質問が見つかりませんでした。</div>}</div>
}
