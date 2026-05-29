import re

with open('src/app/(super-admin)/super-admin/analytics/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'from "@/components/ui/tabs"' not in content:
    content = content.replace(
        'import { Badge } from "@/components/ui/badge"',
        'import { Badge } from "@/components/ui/badge"\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"'
    )

tabs_nav = """
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-5 h-auto gap-2 sm:gap-0 bg-transparent sm:bg-muted p-0 sm:p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border sm:border-0 rounded-xl sm:rounded-md py-2 sm:py-1.5">Overview</TabsTrigger>
          <TabsTrigger value="growth" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border sm:border-0 rounded-xl sm:rounded-md py-2 sm:py-1.5">Growth</TabsTrigger>
          <TabsTrigger value="finance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border sm:border-0 rounded-xl sm:rounded-md py-2 sm:py-1.5">Finance</TabsTrigger>
          <TabsTrigger value="engagement" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border sm:border-0 rounded-xl sm:rounded-md py-2 sm:py-1.5">Engagement</TabsTrigger>
          <TabsTrigger value="tenants" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border sm:border-0 rounded-xl sm:rounded-md py-2 sm:py-1.5 col-span-2 sm:col-span-1">Tenants</TabsTrigger>
        </TabsList>
"""

def find_section(section_str):
    idx = content.find(section_str)
    if idx == -1: return -1
    idx_eq = content.rfind("{/* ====", 0, idx)
    return idx_eq if idx_eq != -1 else idx

idx_start = find_section("{/* SECTION 1")
idx_s56 = find_section("{/* SECTION 5 & 6")
idx_s7 = find_section("{/* SECTION 7")
idx_s4 = find_section("{/* SECTION 4")
idx_s8 = find_section("{/* SECTION 8")
idx_s9 = find_section("{/* SECTION 9")
idx_s10 = find_section("{/* SECTION 10")
idx_s11 = find_section("{/* SECTION 11")
idx_s12 = find_section("{/* SECTION 12")
idx_s13 = find_section("{/* SECTION 13")
idx_s14 = find_section("{/* SECTION 14")
idx_end = content.find("    </div>\n  )\n}", idx_s14)

markers = {
    'idx_start': idx_start,
    'idx_s56': idx_s56,
    'idx_s7': idx_s7,
    'idx_s4': idx_s4,
    'idx_s8': idx_s8,
    'idx_s9': idx_s9,
    'idx_s10': idx_s10,
    'idx_s11': idx_s11,
    'idx_s12': idx_s12,
    'idx_s13': idx_s13,
    'idx_s14': idx_s14,
    'idx_end': idx_end
}

for name, val in markers.items():
    if val == -1:
        print(f"Error finding marker: {name}")

if all(v != -1 for v in markers.values()):
    s1_2_3 = content[idx_start:idx_s56]
    s56 = content[idx_s56:idx_s7]
    s7 = content[idx_s7:idx_s4]
    s4 = content[idx_s4:idx_s8]
    s8 = content[idx_s8:idx_s9]
    s9 = content[idx_s9:idx_s10]
    s10 = content[idx_s10:idx_s11]
    s11 = content[idx_s11:idx_s12]
    s12 = content[idx_s12:idx_s13]
    s13 = content[idx_s13:idx_s14]
    s14_end = content[idx_s14:idx_end]

    new_body = tabs_nav + f"""
        <TabsContent value="overview" className="space-y-8 mt-6">
{s1_2_3}
        </TabsContent>

        <TabsContent value="growth" className="space-y-8 mt-6">
{s9}{s13}{s56}
        </TabsContent>

        <TabsContent value="finance" className="space-y-8 mt-6">
{s8}{s11}
        </TabsContent>

        <TabsContent value="engagement" className="space-y-8 mt-6">
{s7}{s10}{s14_end}{s12}
        </TabsContent>

        <TabsContent value="tenants" className="space-y-8 mt-6">
{s4}
        </TabsContent>
      </Tabs>
"""
    new_content = content[:idx_start] + new_body + content[idx_end:]

    with open('src/app/(super-admin)/super-admin/analytics/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("Refactor successful")
