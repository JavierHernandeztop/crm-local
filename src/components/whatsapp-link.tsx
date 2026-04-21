"use client";

import { cn } from "@/lib/utils";
import { sanitizePhoneForWa } from "@/lib/whatsapp";

export { sanitizePhoneForWa } from "@/lib/whatsapp";

export function WhatsAppLink({
  phone,
  className,
  size = 16,
  title = "Enviar WhatsApp",
}: {
  phone: string;
  className?: string;
  size?: number;
  title?: string;
}) {
  const digits = sanitizePhoneForWa(phone);
  if (!digits) return null;
  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={title}
      title={title}
      className={cn(
        "inline-flex items-center justify-center rounded-full text-white transition-transform hover:scale-110 active:scale-95",
        className,
      )}
      style={{
        backgroundColor: "#25D366",
        width: size + 8,
        height: size + 8,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        width={size}
        height={size}
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.48-1.332.128-.302.128-.57.086-.887-.13-.99-1.432-1.633-2.378-1.79-.14-.028-.28-.028-.416-.014Z" />
        <path d="M16.005 2.66C8.634 2.66 2.66 8.635 2.66 16.005c0 2.38.636 4.693 1.838 6.73L2.66 29.34l6.763-1.77a13.28 13.28 0 0 0 6.582 1.77c7.37 0 13.345-5.974 13.345-13.345S23.375 2.66 16.005 2.66Zm0 24.05a10.67 10.67 0 0 1-5.43-1.484l-.39-.232-4.017 1.052 1.073-3.91-.253-.404a10.66 10.66 0 0 1-1.627-5.677c0-5.89 4.79-10.68 10.68-10.68 5.89 0 10.68 4.79 10.68 10.68 0 5.89-4.79 10.67-10.68 10.67Z" />
      </svg>
    </a>
  );
}
