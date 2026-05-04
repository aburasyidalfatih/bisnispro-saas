SELECT t.slug, u.email, tu.role FROM tenants t JOIN tenant_users tu ON t.id = tu."tenantId" JOIN users u ON tu."userId" = u.id WHERE t.slug = 'demo';
