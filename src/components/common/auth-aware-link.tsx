"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent, type ReactNode } from "react";
import { getSession } from "next-auth/react";

type AuthAwareLinkProps = Omit<LinkProps, "href"> & {
  href: "/login" | "/signup";
  className?: string;
  children: ReactNode;
};

export default function AuthAwareLink({
  href,
  onClick,
  children,
  ...props
}: AuthAwareLinkProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    if (checking) return;
    setChecking(true);

    try {
      const session = await getSession();
      router.push(session?.user ? "/dashboard" : href);
    } catch {
      router.push(href);
    } finally {
      setChecking(false);
    }
  }

  return (
    <Link href={href} onClick={handleClick} aria-busy={checking || undefined} {...props}>
      {children}
    </Link>
  );
}
