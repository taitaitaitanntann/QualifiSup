 "use client";
import {useState} from "react";
import Link from "next/link";
import {supabase} from "../../lib/supabase";

export default function Signup(){
 const [birth,setBirth]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[nickname,setNickname]=useState(""),[status,setStatus]=useState("高校生"),[field,setField]=useState(""),[agree,setAgree]=useState(false),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);
 function age(){if(!birth)return 0;const b=new Date(birth+"T00:00:00"),n=new Date();let a=n.getFullYear()-b.getFullYear();const m=n.getMonth()-b.getMonth();if(m<0||(m===0&&n.getDate()<b.getDate()))a--;return a;}
 async function submit(e:React.FormEvent){e.preventDefault();setMsg("");
  if(age()<15){setMsg("QualifiSupは15歳以上を対象としています。");return;}
  if(password.length<8){setMsg("パスワードは8文字以上にしてください。");return;}
  if(password!==confirm){setMsg("パスワードが一致しません。");return;}
  if(!agree){setMsg("利用規約・プライバシーポリシー・安全ルールへの同意が必要です。");return;}
  if(!supabase){setMsg("Supabaseが未接続です。.env.localを設定してください。");return;}
  setBusy(true);
  const {data,error}=await supabase.auth.signUp({email,password,options:{data:{nickname,status,field,birth_date:birth}}});
  if(error){setMsg(error.message);setBusy(false);return;}
  if(data.user){const {error:pError}=await supabase.from("profiles").upsert({id:data.user.id,nickname,status,field});if(pError)setMsg("プロフィール保存エラー: " + pError.message);else setMsg("登録しました。メール認証が必要な設定の場合、受信メールを確認してください。");}
  setBusy(false);
 }
 return <div className="wrap section"><div className="card form"><h1>新規登録</h1><div className="notice">15歳以上の方が利用できます。公開プロフィールには本名・住所・電話番号・学校名・会社名などを登録しないでください。</div>
 <form onSubmit={submit} className="form">
 <label>生年月日<input required type="date" value={birth} onChange={e=>setBirth(e.target.value)}/></label>
 <label>メールアドレス<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
 <label>パスワード<input required type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="8文字以上"/></label>
 <label>パスワード確認<input required type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
 <label>ニックネーム<input required value={nickname} onChange={e=>setNickname(e.target.value)} maxLength={30}/></label>
 <label>現在の状況<select value={status} onChange={e=>setStatus(e.target.value)}><option>高校生</option><option>大学生</option><option>専門学生</option><option>社会人</option><option>その他</option></select></label>
 <label>分野・専攻<input value={field} onChange={e=>setField(e.target.value)} placeholder="例：建築"/></label>
 <label style={{display:"flex",gap:8,alignItems:"flex-start",fontWeight:400}}><input required type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} style={{width:18}}/>利用規約・プライバシーポリシー・安全ルールを確認し、同意します。</label>
 <button className="btn" disabled={busy}>{busy?"登録中…":"アカウントを作成"}</button></form>
 {msg&&<div className="notice">{msg}</div>}<p className="muted">登録済み → <Link href="/login">ログイン</Link></p>
 </div></div>
}