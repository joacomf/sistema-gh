"use client"

import { signOut } from "next-auth/react"
import { LogOut, User } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import Image from "next/image"

export function Topbar({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      <div className="flex items-center lg:hidden">
        <div className="relative h-6 w-32">
          <Image src="/img/logo.svg" alt="Repuestos GH" fill className="object-contain object-left invert" />
        </div>
      </div>

      <div className="hidden lg:block" />

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-white shrink-0">
              <User size={16} />
            </div>
            <span className="hidden sm:block text-sm text-slate-600 max-w-[200px] truncate">
              {userEmail || "Usuario"}
            </span>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-[220px] overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
            align="end"
            sideOffset={8}
          >
            <div className="px-3 py-2 text-sm text-slate-500 border-b border-slate-100 mb-1 truncate">
              {userEmail}
            </div>
            <DropdownMenu.Item
              className="flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 outline-none focus:bg-red-50"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut size={15} />
              Cerrar sesión
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  )
}
