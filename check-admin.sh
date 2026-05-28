#!/bin/bash
docker exec compose-program-neural-port-6gtmbm-db-1 psql -U db_admin_schoolpro -d saasmasterpro -t -A -c 'SELECT email, "isSuperAdmin" FROM "User" WHERE "isSuperAdmin" = true;'
echo "--- All users with andriko484@gmail.com ---"
docker exec compose-program-neural-port-6gtmbm-db-1 psql -U db_admin_schoolpro -d saasmasterpro -t -A -c 'SELECT email, "isSuperAdmin" FROM "User" WHERE email = '"'"'andriko484@gmail.com'"'"';'
