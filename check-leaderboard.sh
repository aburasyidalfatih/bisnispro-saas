#!/bin/bash
echo "=== DB Count ==="
docker exec compose-program-neural-port-6gtmbm-db-1 psql -U db_admin_schoolpro -d saasmasterpro -t -A -c 'SELECT count(*) FROM tenant_scores;'
echo "=== Top 5 DB Scores ==="
docker exec compose-program-neural-port-6gtmbm-db-1 psql -U db_admin_schoolpro -d saasmasterpro -t -A -c 'SELECT "tenantId", "totalScore", "rank" FROM tenant_scores ORDER BY "totalScore" DESC LIMIT 5;'
echo "=== Redis ZSET ==="
docker exec compose-program-neural-port-6gtmbm-redis-1 redis-cli ZREVRANGE "leaderboard:global" 0 5 WITHSCORES
echo "=== Redis DBSIZE ==="
docker exec compose-program-neural-port-6gtmbm-redis-1 redis-cli DBSIZE
