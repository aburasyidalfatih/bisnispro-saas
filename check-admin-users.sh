#!/bin/bash
docker exec compose-program-neural-port-6gtmbm-db-1 psql -U db_admin_schoolpro -d saasmasterpro -t -A -c 'SELECT email, "isSuperAdmin", "isActive", (password IS NOT NULL AND password != '"''"') as has_password FROM users WHERE email = '"'"'andriko484@gmail.com'"'"';'
