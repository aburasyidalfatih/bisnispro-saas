import re

file_path = 'c:/grafity project/bisnispro/src/features/tenant/services/application.service.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replacements
content = content.replace('schoolName', 'businessName')
content = content.replace('schoolSlug', 'businessSlug')
content = content.replace('Sekolah', 'Bisnis')
content = content.replace('sekolah', 'bisnis')
content = content.replace('school_registration', 'business_registration')
content = content.replace('schoolStatus', 'businessStatus')

# Remove maxStudents logic
content = re.sub(r'const freePlan = await db\.subscriptionPlan\.findUnique\(\{ where: \{ slug: \"free\" \} \}\)\n\s*const quota = freePlan \? freePlan\.maxStudents : 0', 'const freePlan = await db.subscriptionPlan.findUnique({ where: { slug: \"free\" } })', content)
content = content.replace('studentQuota: quota,', '')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
