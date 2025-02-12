### Create an folder to store certs like /certs

### Ensure correct password with config

`cd /certs`

### TLS HTTPS certificates

`docker exec -it elasticsearch rm /usr/share/elasticsearch/elasticsearch-ssl-http.zip`
`docker exec -it elasticsearch /usr/share/elasticsearch/bin/elasticsearch-certutil http`

### Check <Docker_IP>

`docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' elasticsearch`

### Set up config

`DNS: elasticsearch, localhost`
`IP: 127.0.0.1, <Docker_IP>`

`docker cp elasticsearch:/usr/share/elasticsearch/elasticsearch-ssl-http.zip elasticsearch-ssl-http.zip`

### TLS Transport certificates

`docker exec -it elasticsearch rm /usr/share/elasticsearch/elastic-stack-ca.p12`
`docker exec -it elasticsearch /usr/share/elasticsearch/bin/elasticsearch-certutil ca`

`docker exec -it elasticsearch rm /usr/share/elasticsearch/elastic-certificates.p12`
`docker exec -it elasticsearch /usr/share/elasticsearch/bin/elasticsearch-certutil cert --ca elastic-stack-ca.p12 --dns localhost,elasticsearch --ip 127.0.0.1`

`docker cp elasticsearch:/usr/share/elasticsearch/elastic-certificates.p12 ./elastic-certificates.p12`

### Extract ca.crt (Certificate Authority)

`openssl pkcs12 -in elastic-certificates.p12 -cacerts -nokeys -out ca.crt`

### Extract instance.crt (Certificate)

`openssl pkcs12 -in elastic-certificates.p12 -clcerts -nokeys -out instance.crt`

### Extract instance.key (Private Key)

`openssl pkcs12 -in elastic-certificates.p12 -nocerts -nodes -out instance.key`

### Set Permissions to key

`chmod 600 elastic-certificates.p12`
`chmod 600 ca.crt`
`chmod 600 instance.crt`
`chmod 600 instance.key`

### Manual copy to your project
