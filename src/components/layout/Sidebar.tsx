"use client"

import Link from "next/link"
import {usePathname} from "next/navigation"
import {ChevronDown, Home, Package, Settings} from "lucide-react"
import * as Accordion from "@radix-ui/react-accordion"
import {cn} from "@/lib/utils"
import Image from "next/image"

const menu = [
  { name: "Inicio", icon: Home, href: "/dashboard" },
  {
    name: "Gestión",
    icon: Package,
    subItems: [
      { name: "Stock", href: "/dashboard/stock" },
      { name: "Proveedores", href: "/dashboard/proveedores" },
      { name: "Pedidos", href: "/dashboard/pedidos" },
      { name: "Facturas", href: "/dashboard/facturas" },
      { name: "Recepción", href: "/dashboard/recepcion" },
    ]
  },
  { name: "Configuración", icon: Settings, href: "/dashboard/configuracion" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-blue-950 h-screen shrink-0">
      <div className="flex h-20 shrink-0 items-center justify-center border-b border-blue-900">
        <div className="relative h-7 w-40">
          <Image src="/img/logo.svg" alt="Repuestos GH" fill className="object-contain" />
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <Accordion.Root type="multiple" defaultValue={["Gestión"]} className="w-full space-y-0.5">
          {menu.map((item) => {
            const isActive = pathname === item.href || item.subItems?.some(s => pathname.startsWith(s.href))
            const Icon = item.icon

            if (!item.subItems) {
              return (
                <Link
                  key={item.name}
                  href={item.href!}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-blue-900 hover:text-white"
                  )}
                >
                  <Icon size={20} className="shrink-0" />
                  {item.name}
                </Link>
              )
            }

            return (
              <Accordion.Item key={item.name} value={item.name} className="border-0">
                <Accordion.Header>
                  <Accordion.Trigger
                    className={cn(
                      "group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors",
                      isActive
                        ? "text-white"
                        : "text-slate-300 hover:bg-blue-900 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} className="shrink-0" />
                      {item.name}
                    </div>
                    <ChevronDown
                      size={16}
                      className="text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180"
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
                  <div className="pl-10 pr-2 pt-0.5 pb-1 space-y-0.5">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={cn(
                          "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          pathname.startsWith(subItem.href)
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:bg-blue-900 hover:text-white"
                        )}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            )
          })}
        </Accordion.Root>
      </nav>
    </aside>
  )
}
