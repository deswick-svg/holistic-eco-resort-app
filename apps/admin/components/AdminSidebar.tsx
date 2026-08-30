"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  ["Dashboard", "/"],
  ["Bookings", "/bookings"],
  ["Guests", "/guests"],
  ["Rooms & Stays", "/rooms"],
  ["Offers & Coupons", "/offers"],
  ["Gallery", "/gallery"],
  ["Enquiries", "/enquiries"],
  ["Settings", "/settings"],
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#173326] p-6 text-white">
     <div className="mb-10">
  <div className="border-b border-[#b6a26f] pb-5">
    <Image
      src="/HER-logo-white.png"
      alt="Holistic Eco-Resort"
      width={140}
      height={140}
      className="mx-auto h-auto w-[125px]"
      priority
    />
  </div>

  <h1 className="mt-5 text-2xl font-semibold">
    Admin Panel
  </h1>
</div>

      <nav className="space-y-2">
        {menuItems.map(([label, href]) => {
          const active = pathname === href;

          return (
            <Link
              key={label}
              href={href}
              className={`block w-full rounded-lg px-4 py-3 text-left text-sm ${
                active ? "bg-white/10" : "hover:bg-white/10"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}