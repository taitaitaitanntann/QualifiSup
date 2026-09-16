"use client";
import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {supabase} from "../../lib/supabase";

type Person={id:string;nickname:string;status:string;field:string;bio:string;avatar_url:string|null;daily_study_minutes:number|null;study_period_days:number|null;study_methods:string[];consultation_topics:string;quals:{id:string;name:string;relationship:string;acquisition_year:number|null}[];consultations:number;helpful:number;ratingCount:number};

const fallback:Person[]=[
 {id:"demo-takumi",nickname:"たくみ",status:"工業高校生",field:"建築系",bio:"高校で建築を学びながら資格に挑戦しています。",avatar_url:null,daily_study_minutes:60,study_period_days:120,study_methods:["過去問中心","教科書・参考書中心"],consultation_topics:"勉強方法・教材・試験対策",quals:[{id:"demo-1",name:"2級建築施工管理技士補",relationship:"取得済み",acquisition_year:2026}],consultations:18,helpful:96,ratingCount:12},
 {id:"demo-sato",nickname:"佐藤",status:"大学生",field:"情報系",bio:"情報系の資格を中心に勉強しています。",avatar_url:null,daily_study_minutes:90,study_period_days:180,study_methods:["独学","YouTube・動画","過去問中心"],consultation_topics:"試験対策・勉強方法・教材",quals:[{id:"demo-2",name:"基本情報技術者試験",relationship:"取得済み",acquisition_year:2026}],consultations:12,helpful:94,ratingCount:8},
 {id:"demo-m",nickname:"M",status:"社会人",field:"建設系",bio:"仕事と両立しながら資格取得を経験しました。",avatar_url:null,daily_study_minutes:75,study_period_days:300,study_methods:["独学","過去問中心","教科書・参考書中心"],consultation_topics:"社会人の勉強時間・試験対策",quals:[{id:"demo-3",name:"二級建築士",relationship:"取得済み",acquisition_year:2025}],consultations:21,helpful:98,ratingCount:16}
];

const statuses=["すべて","高校生","大学生","専門学生","社会人","その他"];
const methods=["独学","資格学校・スクール","オンライン講座","YouTube・動画","過去問中心","教科書・参考書中心","人に教えてもらう"];

function score(p:Person, q:string, status:string, field:string, method:string, topic:string, minStudy:string){
 let s=0; const text=[p.nickname,p.status,p.field,p.bio,p.consultation_topics,...p.quals.map(x=>x.name),...p.study_methods].join(" ").toLowerCase();
 if(q && text.includes(q.toLowerCase())) s+=3;
 if(status!=="すべて" && p.status===status) s+=1;
 if(field && p.field.toLowerCase().includes(field.toLowerCase())) s+=1;
 if(method && p.study_methods.includes(method)) s+=1;
 if(topic && p.consultation_topics.includes(topic)) s+=1;
 if(minStudy && p.daily_study_minutes!==null && p.daily_study_minutes>=Number(minStudy)) s+=1;
 return s;
}

export default function Holders(){
 const [people,setPeople]=useState< Person[]>(fallback); const [q,setQ]=useState(""); const [status,setStatus]=useState("すべて"); const [field,setField]=useState(""); const [method,setMethod]=useState(""); const [topic,setTopic]=useState(""); const [minStudy,setMinStudy]=useState(""); const [sort,setSort]=useState("recommend"); const [loading,setLoading]=useState(false); const [message,setMessage]=useState("");
 useEffect(()=>{(async()=>{if(!supabase)return; setLoading(true); const {data:profiles,error}=await supabase.from("profiles").select("id,nickname,status,field,bio,avatar_url,daily_study_minutes,study_period_days,study_methods,consultation_topics"); if(error||!profiles){setMessage("デモデータを表示しています。Supabase接続後は登録ユーザーが表示されます。");setLoading(false);return;}
  const ids=profiles.map(p=>p.id); if(!ids.length){setPeople([]);setLoading(false);return;}
  const [{data:uq},{data:cons},{data:ratings}]=await Promise.all([
   supabase.from("user_qualifications").select("user_id,qualification_id,relationship,acquisition_year,qualifications(id,name)").in("user_id",ids),
   supabase.from("consultations").select("id,holder_id").in("holder_id",ids),
   supabase.from("consultation_ratings").select("rater_id,helpful,consultation_id")
  ]);
  const mapped=profiles.map((p:any)=>{const qs=(uq||[]).filter((x:any)=>x.user_id===p.id).map((x:any)=>({id:x.qualification_id,name:x.qualifications?.name||"資格",relationship:x.relationship,acquisition_year:x.acquisition_year})); const cs=(cons||[]).filter((x:any)=>x.holder_id===p.id).length; const rs=(ratings||[]).filter((x:any)=>{const c=(cons||[]).find((c:any)=>c.holder_id===p.id && c.id===x.consultation_id); return !!c}); const helpful=rs.length?Math.round(rs.filter((x:any)=>x.helpful).length/rs.length*100):0; return {...p,field:p.field||"",bio:p.bio||"",avatar_url:p.avatar_url||null,study_methods:p.study_methods||[],consultation_topics:p.consultation_topics||"",quals:qs,consultations:cs,helpful,ratingCount:rs.length};});
  setPeople(mapped);setMessage("");setLoading(false);
 })()},[]);
 const filtered=useMemo(()=>{let arr=people.map(p=>({...p,_score:score(p,q,status,field,method,topic,minStudy)})).filter((p:any)=>{if(q && !([p.nickname,p.status,p.field,p.consultation_topics,...p.quals.map((x:any)=>x.name),...p.study_methods].join(" ").toLowerCase().includes(q.toLowerCase())))return false;if(status!=="すべて"&&p.status!==status)return false;if(field&&!p.field.toLowerCase().includes(field.toLowerCase()))return false;if(method&&!p.study_methods.includes(method))return false;if(topic&&!p.consultation_topics.includes(topic))return false;if(minStudy&&(!p.daily_study_minutes||p.daily_study_minutes<Number(minStudy)))return false;return true;});
  return arr.sort((a:any,b:any)=>sort==="recommend"?(b._score-a._score)||(b.helpful-a.helpful)||(b.consultations-a.consultations):sort==="helpful"?(b.helpful-a.helpful)||(b.consultations-a.consultations):b.consultations-a.consultations);
 },[people,q,status,field,method,topic,minStudy,sort]);
 return <div className="wrap section"><h1>資格者を探す</h1><p className="muted">自分と近い経験を持ち、相談できる人を探せます。</p>{message&&<div className="notice">{message}</div>}
 <div className="holder-search-layout"><aside className="filter-panel card"><h3>条件で絞り込む</h3><label>状況<select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(x=><option key={x}>{x}</option>)}</select></label><label>分野・専攻<input value={field} onChange={e=>setField(e.target.value)} placeholder="例：建築"/></label><label>勉強方法<select value={method} onChange={e=>setMethod(e.target.value)}><option value="">すべて</option>{methods.map(x=><option key={x}>{x}</option>)}</select></label><label>相談できる内容<input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="例：試験対策"/></label><label>1日平均勉強時間<select value={minStudy} onChange={e=>setMinStudy(e.target.value)}><option value="">指定なし</option><option value="30">30分以上</option><option value="60">1時間以上</option><option value="90">1時間30分以上</option><option value="120">2時間以上</option></select></label><button className="btn light" onClick={()=>{setQ("");setStatus("すべて");setField("");setMethod("");setTopic("");setMinStudy("")}}>条件をリセット</button></aside>
 <section><div className="holder-toolbar"><div className="search compact"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="資格・分野・相談内容を検索"/><span>{loading?"読み込み中…":`${filtered.length}人`}</span></div><select value={sort} onChange={e=>setSort(e.target.value)}><option value="recommend">おすすめ順</option><option value="helpful">役に立った割合順</option><option value="consultations">相談件数順</option></select></div><div className="list">{filtered.map((p:any)=><article className="card holder-card" key={p.id}><div className="person"><div className="avatar">{p.nickname[0]}</div><div className="holder-main"><Link href={`/holders/${p.id}`}><h3>{p.nickname}</h3></Link><div className="muted">{p.status}・{p.field||"分野未設定"}</div><div>{p.quals.slice(0,3).map((x:any)=><span className="tag" key={x.id}>🏆 {x.name}</span>)}</div><div>{p.study_methods.slice(0,3).map((x:string)=><span className="tag" key={x}>📚 {x}</span>)}</div><p className="consult-topic">💬 相談できる内容：{p.consultation_topics||"未設定"}</p><span className="status">あなたと{Math.min(5,p._score)}項目一致　👍 役に立った {p.ratingCount?p.helpful:"未評価"}{p.ratingCount?"%":""}　💬 相談 {p.consultations}件</span></div></div><Link className="btn" href={`/holders/${p.id}`}>プロフィールを見る</Link></article>)}{!filtered.length&&<div className="empty">条件に合う資格者が見つかりませんでした。</div>}</div></section></div></div>
}
