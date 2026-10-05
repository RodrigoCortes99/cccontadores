"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import { usePanelUser } from "../../lib/PanelUserContext";
import RouteContext from "./RouteContext";
import {usePathname} from 'next/navigation';
import {presentationPath} from '@/lib/presentation/model';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path=usePathname();
  const { user, loading, error, reload } = usePanelUser();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="appShellLoading">
        <LoadingState label="Cargando panel..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="appShellLoading">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (presentationPath(path)) {
    return <main id="panel-main" tabIndex={-1}>{children}</main>;
  }

  return (
    <div className={`appShell ${collapsed ? "appShell--collapsed" : ""}`}>
      <a className="uxSkip" href="#panel-main">Ir al contenido</a>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        esCliente={user?.role==='client'}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="appShell__content">
        <Header
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
        />

        <main className="appMain" id="panel-main" tabIndex={-1}><RouteContext/>{children}</main>
      </div>
    </div>
  );
}
