"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

type PanelBackProps = {
  backLabel?: string;
  panelHref?: string;
};

export default function PanelBack({
  backLabel = "Volver",
  panelHref = "/panel",
}: PanelBackProps) {
  const router = useRouter();

  return (
    <div className="panelBack">
      <button
        type="button"
        onClick={() => router.back()}
        className="panelBackBtn"
      >
        ← {backLabel}
      </button>

      <Link href={panelHref} className="panelBackLink">
        Ir al panel
      </Link>
    </div>
  );
}