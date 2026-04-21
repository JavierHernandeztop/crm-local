"use client";

import { useRouter } from "next/navigation";

export function ContactRow({
  contactId,
  children,
  className,
}: {
  contactId: number;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <tr
      onClick={(e) => {
        // Ignore clicks on interactive children (links, buttons, dropdowns, etc.)
        const target = e.target as HTMLElement;
        if (target.closest("a,button,[role='menu'],[role='menuitem'],input")) {
          return;
        }
        router.push(`/contactos/${contactId}`);
      }}
      className={className}
    >
      {children}
    </tr>
  );
}

export function ContactMobileItem({
  contactId,
  children,
  className,
}: {
  contactId: number;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <li
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("a,button,[role='menu'],[role='menuitem'],input")) {
          return;
        }
        router.push(`/contactos/${contactId}`);
      }}
      className={className}
    >
      {children}
    </li>
  );
}
