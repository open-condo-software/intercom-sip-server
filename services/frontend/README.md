# Web Client Static Boilerplate
 
для локальной разработки:  
```sh
docker-compose -p web-client-local -f deploy/docker-compose.local.yml up -d --build
```

для production развертки:  
```sh
docker-compose -p web-client-production -f deploy/docker-compose.yml up -d --build
```
