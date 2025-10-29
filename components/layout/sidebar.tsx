import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../auth-provider'
import { Button } from '../ui/button'

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '🏠' },
    { name: 'Medical Terms', href: '/terms', icon: '📖' },
    { name: 'Medical Phrases', href: '/phrases', icon: '💬' },
    { name: 'Categories', href: '/categories', icon: '🏷️' },
  ]

  // Only show users page for admin
  if (user?.role === 'admin') {
    navigation.push({ name: 'Users', href: '/users', icon: '👥' })
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <div className="text-2xl">⚕️</div>
          <div>
            <h1 className="font-bold text-lg">Medical Assistant</h1>
            <p className="text-xs text-muted-foreground">
              {user?.username} ({user?.role})
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => (
          <Link key={item.name} href={item.href}>
            <div
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-muted-foreground'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </div>
          </Link>
        ))}
      </nav>

      <div className="border-t p-4">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={() => logout()}
        >
          <span>🚪</span>
          Sign Out
        </Button>
      </div>
    </div>
  )
}