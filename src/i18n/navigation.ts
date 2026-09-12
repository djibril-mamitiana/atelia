import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware drop-in replacements for next/navigation's Link, redirect,
 * usePathname and useRouter — they automatically add/preserve the current
 * locale prefix. Use these instead of next/link and next/navigation inside
 * `src/app/[locale]/**` and any component only ever rendered there.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
