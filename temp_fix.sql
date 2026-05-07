INSERT INTO tenants (id, name, slug, plan, "updatedAt") VALUES ('platform', 'Platform Internal', 'platform', 'free', NOW()) ON CONFLICT DO NOTHING;
