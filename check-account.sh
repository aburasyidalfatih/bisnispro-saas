#!/bin/bash
docker exec compose-program-neural-port-6gtmbm-db-1 psql -U db_admin_schoolpro -d saasmasterpro -t -A -c 'SELECT provider, "providerAccountId" FROM "Account" WHERE "userId" = '"'"'cmoldjlh5000211oslzq49jmd'"'"';'
