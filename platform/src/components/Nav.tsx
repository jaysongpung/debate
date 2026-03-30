"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function Nav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const links = [
    { href: "/", label: "토론 목록" },
    { href: "/calendar", label: "캘린더" },
  ];

  return (
    <header className="border-b bg-background">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <nav className="flex gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              <Button
                variant={pathname === l.href ? "default" : "ghost"}
                size="sm"
              >
                {l.label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {user.nickname}
            {user.role === "admin" && (
              <span className="ml-1 text-xs text-destructive">(관리자)</span>
            )}
          </span>
          <Button variant="ghost" size="sm" onClick={logout}>
            로그아웃
          </Button>
        </div>
      </div>
    </header>
  );
}
