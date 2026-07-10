import { PanelUserProvider } from "../../lib/PanelUserContext";
import { ToastProvider } from "../../components/panel/Toast";
import AppShell from "../../components/panel/AppShell";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelUserProvider>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </PanelUserProvider>
  );
}
