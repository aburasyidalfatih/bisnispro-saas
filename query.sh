docker exec -i compose-program-neural-driver-wrovvf-db-1 psql -U postgres -d postgres -c "SELECT id, name, email, \"isSuperAdmin\" FROM \"User\" WHERE email='alkhoir.pmk@gmail.com';"
docker exec -i compose-program-neural-driver-wrovvf-db-1 psql -U postgres -d postgres -c "SELECT * FROM \"TenantUser\" WHERE \"userId\" IN (SELECT id FROM \"User\" WHERE email='alkhoir.pmk@gmail.com');"
