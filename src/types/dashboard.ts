import type { ReactNode } from "react";

export type DashboardUser = {
  displayName: string;
  email: string | null;
  initial: string;
};

export type DashboardLayoutProps = {
  children: ReactNode;
};
