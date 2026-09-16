-- 2026-09-15時点で公式情報を確認した初期データ。
-- 年度情報は qualification_schedules に保存する。
insert into public.qualifications
(name,field,qualification_type,eligibility_status,practical_exam,official_url,source_name,verification_status,verified_at)
values
('二級建築士','建築・土木・工業','国家資格','受験資格あり',true,'https://www.jaeic.or.jp/shiken/2k/','建築技術教育普及センター','verified',now()),
('第二種電気工事士','建築・土木・工業','国家資格','受験資格の制限なし',true,'https://www.shiken.or.jp/construction/second/','電気技術者試験センター','verified',now()),
('ITパスポート試験','IT・情報','国家試験','受験資格の制限なし',false,'https://www.ipa.go.jp/shiken/mousikomi/cbt_ip.html','IPA','verified',now()),
('基本情報技術者試験','IT・情報','国家試験','受験資格の制限なし',false,'https://www.ipa.go.jp/shiken/2026/cbt-202605-jisshi.html','IPA','verified',now()),
('宅地建物取引士','不動産','国家資格','受験資格の制限なし',false,'https://www.retio.or.jp/exam/schedule/','不動産適正取引推進機構','verified',now()),
('日商簿記検定','お金・ビジネス','検定','級により異なる',false,'https://www.kentei.ne.jp/calendar_2026','日本商工会議所','verified',now()),
('色彩検定','デザイン・クリエイティブ','検定','受検資格の制限なし',false,'https://www.aft.or.jp/exam-orders','色彩検定協会','verified',now()),
('介護福祉士国家試験','医療・福祉','国家資格','受験資格あり',false,'https://www.sssc.or.jp/kaigo/tetsuzuki.html','社会福祉振興・試験センター','verified',now())
on conflict(name) do update set
field=excluded.field,qualification_type=excluded.qualification_type,eligibility_status=excluded.eligibility_status,
practical_exam=excluded.practical_exam,official_url=excluded.official_url,source_name=excluded.source_name,
verification_status='verified',verified_at=now();

insert into public.qualification_schedules
(qualification_id,fiscal_year,exam_date,application_period,exam_fee,exam_format,source_url,verification_status,verified_at)
select id,2026,'2026-07-05（学科） / 2026-09-13（設計製図）',null,18500,'学科＋設計製図','https://www.jaeic.or.jp/shiken/2k/','verified',now()
from public.qualifications where name='二級建築士'
on conflict(qualification_id,fiscal_year) do update set exam_date=excluded.exam_date,exam_fee=excluded.exam_fee,source_url=excluded.source_url,verification_status='verified',verified_at=now();

insert into public.qualification_schedules
select gen_random_uuid(),id,2026,'2026年度上期・下期','2026-08-17～2026-09-03',null,11100,'学科CBT/筆記＋技能','https://www.shiken.or.jp/construction/second/','verified',now()
from public.qualifications where name='第二種電気工事士'
on conflict(qualification_id,fiscal_year) do update set exam_date=excluded.exam_date,application_period=excluded.application_period,exam_fee=excluded.exam_fee,source_url=excluded.source_url,verification_status='verified',verified_at=now();

insert into public.qualification_schedules
select gen_random_uuid(),id,2026,'年間を通じてCBT方式',null,7500,'CBT','https://www.ipa.go.jp/shiken/mousikomi/cbt_ip.html','verified',now()
from public.qualifications where name='ITパスポート試験'
on conflict(qualification_id,fiscal_year) do update set exam_date=excluded.exam_date,exam_fee=excluded.exam_fee,source_url=excluded.source_url,verification_status='verified',verified_at=now();

insert into public.qualification_schedules
select gen_random_uuid(),id,2026,'CBT方式',null,7500,'CBT','https://www.ipa.go.jp/shiken/2026/cbt-202605-jisshi.html','verified',now()
from public.qualifications where name='基本情報技術者試験'
on conflict(qualification_id,fiscal_year) do update set exam_date=excluded.exam_date,exam_fee=excluded.exam_fee,source_url=excluded.source_url,verification_status='verified',verified_at=now();

insert into public.qualification_schedules
select gen_random_uuid(),id,2026,'2026-07-01～2026-07-31','2026-10-18',8200,'50問・四肢択一式','https://www.retio.or.jp/exam/schedule/','verified',now()
from public.qualifications where name='宅地建物取引士'
on conflict(qualification_id,fiscal_year) do update set exam_date=excluded.exam_date,application_period=excluded.application_period,exam_fee=excluded.exam_fee,source_url=excluded.source_url,verification_status='verified',verified_at=now();

insert into public.qualification_schedules
select gen_random_uuid(),id,2026,'2026-11-15（2・3級）',null,5500,'統一試験・ネット試験等','https://www.kentei.ne.jp/calendar_2026','verified',now()
from public.qualifications where name='日商簿記検定'
on conflict(qualification_id,fiscal_year) do update set exam_date=excluded.exam_date,exam_fee=excluded.exam_fee,source_url=excluded.source_url,verification_status='verified',verified_at=now();

insert into public.qualification_schedules
select gen_random_uuid(),id,2026,'2026-11-08（全級）', '2026-08-10～2026-10-01',7000,'マークシート等','https://www.aft.or.jp/exam-orders','verified',now()
from public.qualifications where name='色彩検定'
on conflict(qualification_id,fiscal_year) do update set exam_date=excluded.exam_date,application_period=excluded.application_period,exam_fee=excluded.exam_fee,source_url=excluded.source_url,verification_status='verified',verified_at=now();

insert into public.qualification_schedules
select gen_random_uuid(),id,2026,'2027-01-31','2026-07-22～2026-09-02',20510,'国家試験','https://www.sssc.or.jp/kaigo/tetsuzuki.html','verified',now()
from public.qualifications where name='介護福祉士国家試験'
on conflict(qualification_id,fiscal_year) do update set exam_date=excluded.exam_date,application_period=excluded.application_period,exam_fee=excluded.exam_fee,source_url=excluded.source_url,verification_status='verified',verified_at=now();
