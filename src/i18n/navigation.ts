// Lokalize link/yonlendirme yardimcilari.
// Kendi <Link> bileşenimizi ve useRouter / usePathname / redirect
// helper'larini bu dosyadan kullaniyoruz - boylece Next.js'in default
// navigation API'lerini dogrudan kullanmak yerine dile duyarli olanlari
// kullaniyoruz.

import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
