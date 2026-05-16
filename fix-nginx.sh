sed -i 's/proxy_set_header Host .*/proxy_set_header Host schoolpro.my.id;\n        proxy_set_header X-Forwarded-Host schoolpro.my.id;/g' /home/ubuntu/schoolpro-dev/nginx/schoolpro.my.id.conf
docker restart schoolpro-dev-nginx-1
