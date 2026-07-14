export const findMenuPath = (menus: any[], targetUrl: string): any[] | null => {
  if (!menus || menus.length === 0) return null
  
  for (const menu of menus) {
    const menuUrl = menu.url || ""
    
    // Check children first (Depth-First Search) to find the deepest matching node
    if (menu.children && menu.children.length > 0) {
      const foundInChildren = findMenuPath(menu.children, targetUrl)
      if (foundInChildren) return [menu, ...foundInChildren]
    }

    // Only match self if no children matched
    if (menuUrl === targetUrl || menuUrl === `${targetUrl}/` || menuUrl.endsWith(targetUrl)) {
      return [menu]
    }
  }
  return null
}

export const buildDynamicBreadcrumbs = (
  menus: any[], 
  targetUrl: string, 
  fallbackLabel: string
) => {
  const menuPath = findMenuPath(menus, targetUrl)
  
  if (menuPath) {
    return menuPath.map((m, index) => {
      const isLast = index === menuPath.length - 1
      return {
        label: m.label,
        href: isLast ? undefined : (m.url || undefined)
      }
    })
  }
  
  return [
    { label: "Beranda", href: "/" },
    { label: fallbackLabel }
  ]
}
