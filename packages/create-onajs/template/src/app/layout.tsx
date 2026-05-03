import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children?: ReactNode }) {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        {" · "}
        <Link to="/blog">Blog</Link>
      </nav>
      {children}
    </div>
  );
}
