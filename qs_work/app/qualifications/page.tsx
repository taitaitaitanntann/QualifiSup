 "use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {supabase} from "../../lib/supabase";

type Q={id?:string,name:string,field:string,qualification_type:string,eligibility_status:string,practical_exam:boolean,exam_fee?:number,exam_date?:string,application_period?:string,verification_status:string,official_url?:string,source_name?:string};

const seed:Q[]=[
{name:"二級建築士",field:"建築・土木・工業",qualification_type:"国家資格",eligibility_status:"受験資格あり",practical_exam:true,exam_fee:18500,exam_date:"2026-07-05（学科） / 2026-09-13（設計製図）",verification_status:"verified",official_url:"https://www.jaeic.or.jp/shiken/2k/",source_name:"建築技術教育普及センター"},
{name:"第二種電気工事士",field:"建築・土木・工業",qualification_type:"国家資格",eligibility_status:"受験資格の制限なし",practical_exam:true,exam_fee:11100,exam_date:"2026年度上期・下期",application_period:"下期：2026-08-17～2026-09-03",verification_status:"verified",official_url:"https://www.shiken.or.jp/construction/second/",source_name:"電気技術者試験センター"},
{name:"ITパスポート試験",field:"IT・情報",qualification_type:"国家試験",eligibility_status:"受験資格の制限なし",practical_exam:false,exam_fee:7500,exam_date:"年間を通じてCBT方式",verification_status:"verified",official_url:"https://www.ipa.go.jp/shiken/mousikomi/cbt_ip.html",source_name:"IPA"},
{name:"基本情報技術者試験",field:"IT・情報",qualification_type:"国家試験",eligibility_status:"受験資格の制限なし",practical_exam:false,exam_fee:7500,exam_date:"CBT方式",verification_status:"verified",official_url:"https://www.ipa.go.jp/shiken/2026/cbt-202605-jisshi.html",source_name:"IPA"},
{name:"宅地建物取引士",field:"不動産",qualification_type:"国家資格",eligibility_status:"受験資格の制限なし",practical_exam:false,exam_fee:8200,exam_date:"2026-10-18",application_period:"2026-07-01～2026-07-31",verification_status:"verified",official_url:"https://www.retio.or.jp/exam/schedule/",source_name:"不動産適正取引推進機構"},
{name:"日商簿記検定",field:"お金・ビジネス",qualification_type:"検定",eligibility_status:"級により異なる",practical_exam:false,exam_fee:5500,exam_date:"2026-11-15（2・3級）",verification_status:"verified",official_url:"https://www.kentei.ne.jp/calendar_2026",source_name:"日本商工会議所"},
{name:"色彩検定",field:"デザイン・クリエイティブ",qualification_type:"検定",eligibility_status:"受検資格の制限なし",practical_exam:false,exam_fee:7000,exam_date:"2026-11-08（全級）",application_period:"2026-08-10～2026-10-01",verification_status:"verified",official_url:"https://www.aft.or.jp/exam-orders",source_name:"色彩検定協会"},
{name:"介護福祉士国家試験",field:"医療・福祉",qualification_type:"国家資格",eligibility_status:"受験資格あり",practical_exam:false,exam_fee:20510,exam_date:"2027-01-31",application_period:"2026-07-22～2026-09-02",verification_status:"verified",official_url:"https://www.sssc.or.jp/kaigo/tetsuzuki.html",source_name:"社会福祉振興・試験センター"}
];

export default function Qualifications(){
 const [rows,setRows]=useState<Q[]>(seed),[q,setQ]=useState(""),[field,setField]=useState("すべて"),[type,setType]=useState("すべて"),[elig,setElig]=useState("すべて"),[practical,setPractical]=useState("すべて"),[maxFee,setMaxFee]=useState(""),[sort,setSort]=useState("recommend"),[loading,setLoading]=useState(true);
 useEffect(()=>{let mounted=true;(async()=>{if(!supabase){setLoading(false);return}const {data,error}=await supabase.from("qualifications").select("*").eq("verification_status","verified");if(!error&&data?.length&&mounted){setRows(data as Q[])}setLoading(false)})();return()=>{mounted=false}},[]);
 const filtered=useMemo(()=>{let a=rows.filter(x=>(field==="すべて"||x.field===field)&&(type==="すべて"||x.qualification_type===type)&&(elig==="すべて"||x.eligibility_status===elig)&&(practical==="すべて"||String(x.practical_exam)===(practical==="あり"?"true":"false"))&&(!maxFee||!x.exam_fee||x.exam_fee<=Number(maxFee))&&x.name.toLowerCase().includes(q.toLowerCase()));
 if(sort==="fee")a.sort((x,y)=>(x.exam_fee??999999)-(y.exam_fee??999999)); if(sort==="new")a.reverse(); return a},[rows,q,field,type,elig,practical,maxFee,sort]);
 return <div className="wrap section"><h1>資格を探す</h1><p className="muted">公式確認済みの資格を中心に、条件から絞り込めます。未確認情報は検索結果に表示しません。</p>
 <div className="card" style={{margin:"20px 0"}}><div className="toolbar"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="資格名・キーワード"/></div><div className="grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
 <select value={field} onChange={e=>setField(e.target.value)}><option>すべて</option><option>建築・土木・工業</option><option>IT・情報</option><option>不動産</option><option>お金・ビジネス</option><option>デザイン・クリエイティブ</option><option>医療・福祉</option></select>
 <select value={type} onChange={e=>setType(e.target.value)}><option>すべて</option><option>国家資格</option><option>国家試験</option><option>検定</option></select>
 <select value={elig} onChange={e=>setElig(e.target.value)}><option>すべて</option><option>受験資格の制限なし</option><option>受験資格あり</option></select>
 <select value={practical} onChange={e=>setPractical(e.target.value)}><option>実技試験：すべて</option><option>あり</option><option>なし</option></select>
 <input type="number" min="0" value={maxFee} onChange={e=>setMaxFee(e.target.value)} placeholder="受験料の上限（円）"/>
 <select value={sort} onChange={e=>setSort(e.target.value)}><option value="recommend">おすすめ順</option><option value="fee">受験料が安い順</option><option value="new">掲載順</option></select>
 </div></div>
 <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><Link className="text-link" href="/qualifications/suggest">＋資格掲載を申請</Link><b>{filtered.length}件</b>{loading&&<span className="muted">データベース確認中…</span>}</div>
 <div className="list">{filtered.map((x,i)=><Link className="card" href={x.name==="二級建築士"?"/qualifications/second-class-architect":"#"} key={x.id??x.name}><span className="pill">{x.field}</span><h3>{x.name}</h3><span className="tag">{x.qualification_type}</span><span className="tag">{x.eligibility_status}</span>{x.exam_fee&&<span className="tag">受験料 {x.exam_fee.toLocaleString()}円</span>}<p className="muted">試験：{x.exam_date??"未確認"}</p><p className="status verified">🟢 公式確認済み　出典：{x.source_name}</p></Link>)}</div>
 {!filtered.length&&<div className="empty">条件に一致する資格がありません。条件を緩めて再検索してください。</div>}
 </div>
}