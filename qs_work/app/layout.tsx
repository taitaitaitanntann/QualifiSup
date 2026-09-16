import "./globals.css";
import Link from "next/link";
import AuthNav from "./components/AuthNav";

export const metadata = {
  title: "QualifiSup｜資格選びに、頼れる先輩を。",
  description: "資格を目指す人と、資格取得者をつなぐサービス",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header>
          <div className="wrap nav">
            <Link href="/" className="logo">
              Qualifi<span>Sup</span>
            </Link>

            <nav>
              <Link href="/qualifications">資格を探す</Link>
              <Link href="/holders">資格者を探す</Link>
              <Link href="/questions">質問広場</Link>
              <Link href="/feed">タイムライン</Link>
              <Link href="/consultations">相談</Link>
              <Link href="/notifications">通知</Link>
            </nav>

            <AuthNav />
          </div>
        </header>

        <main>{children}</main>

        <footer>
          <div className="wrap footer">
            <b>QualifiSup</b>
            <span>資格選びに、頼れる先輩を。</span>
            <Link href="/terms">利用規約</Link>
            <Link href="/legal/privacy">プライバシー</Link>
            <Link href="/legal/community">ガイドライン</Link>
            <Link href="/legal/consultation">相談ルール</Link>
            <span>© 2026 QualifiSup</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
