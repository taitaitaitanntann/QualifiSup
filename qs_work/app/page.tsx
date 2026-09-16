import Link from "next/link";
const quals=[["二級建築士","建築・土木・工業"],["第二種電気工事士","建築・土木・工業"],["ITパスポート試験","IT・情報"],["基本情報技術者試験","IT・情報"],["宅地建物取引士","不動産"],["日商簿記検定","お金・ビジネス"]];
export default function Home(){return <>
<section className="hero"><div className="wrap"><h1>資格選びに、<br/>頼れる先輩を。</h1><p>資格を探すだけで終わらない。<br/>実際に挑戦した人の経験を見て、相談できる。</p><div className="search"><input placeholder="資格・資格者を検索"/><Link className="btn" href="/qualifications">探す</Link></div></div></section>
<section className="section"><div className="wrap"><h2>QualifiSupでできること</h2><div className="feature">{[["🏆","資格を探す","条件から自分に合う資格を探す"],["👤","資格者を探す","実際に取得した人・挑戦した人を探す"],["💬","相談する","相談申請から個別チャットへ"],["❓","質問広場","資格ごとに質問・回答を探す"]].map(x=><div className="card" key={x[0]}><div>{x[0]}</div><h3>{x[1]}</h3><span className="muted">{x[2]}</span></div>)}</div></div></section>
<section className="section"><div className="wrap"><h2>注目の資格</h2><div className="grid">{quals.map(q=><Link className="card" href="/qualifications" key={q[0]}><span className="pill">{q[1]}</span><h3>{q[0]}</h3><span className="muted">公式情報を確認して掲載</span></Link>)}</div></div></section>
</> }