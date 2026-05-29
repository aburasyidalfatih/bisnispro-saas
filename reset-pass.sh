#!/bin/bash
docker exec compose-program-neural-port-6gtmbm-db-1 psql -U db_admin_schoolpro -d saasmasterpro -c "UPDATE users SET password = '\$2a\$12\$26QomsQNdsDZkoomdagNt.8m0R1ScxKdKIXqYOo/oKGMjPOfreoSS' WHERE email = 'andriko484@gmail.com';"
