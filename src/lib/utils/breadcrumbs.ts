export const findMenuPath = (menus: any[], targetUrl: string): any[] | null => {
  if (!menus || menus.length === 0) return null
  
  for (const menu of menus) {
    const menuUrl = menu.url || ""
    if (menuUrl === targetUrl || menuUrl === `${targetUrl}/` || menuUrl.endsWith(targetUrl)) {
      return [menu]
    }
    if (menu.children && menu.children.length > 0) {
      const found = findMenuPath(menu.children, targetUrl)
      if (found) return [menu, ...found]
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
    return menuPath.map(m => ({ label: m.label }))
  }
  
  return [
    { label: "Beranda", href: "/" },
    { label: fallbackLabel }
  ]
}
