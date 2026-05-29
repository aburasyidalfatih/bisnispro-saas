#!/bin/bash
echo "=== Check Top 5 Tenant IDs from Redis ==="
# Get top 5 IDs from Redis
IDS=$(docker exec compose-program-neural-port-6gtmbm-redis-1 redis-cli ZREVRANGE "leaderboard:global" 0 4)
echo "IDs from Redis: $IDS"

# Create a quoted comma separated list for SQL IN clause
IN_CLAUSE=""
for id in $IDS; do
  IN_CLAUSE="$IN_CLAUSE'$id',"
done
IN_CLAUSE=${IN_CLAUSE%?}

if [ ! -z "$IN_CLAUSE" ]; then
  echo "=== Check these IDs in DB (tenants table) ==="
  docker exec compose-program-neural-port-6gtmbm-db-1 psql -U db_admin_schoolpro -d saasmasterpro -t -A -c "SELECT id, name FROM tenants WHERE id IN ($IN_CLAUSE);"
else
  echo "No IDs found in Redis"
fi
