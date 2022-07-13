#!/bin/sh

node ../main.js -p 3001 -f 1.json &
node ../main.js -p 3002 -y 2.yml &
node ../main.js -p 3003 -i "[{\"rule\": \"ServeDirectory\", \"dir\": \"public\"}]" -v &
node 4.js &

curl http://localhost:3001/test/index.txt
curl http://localhost:3002/index
curl http://localhost:3003/index.txt
curl http://localhost:3004/test/index.txt
