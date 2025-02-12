# ==> CREATE SELF-SIGNED CERTIFICATE <==

# CA Certificate

1. Create CA's Private Key
   `openssl genrsa -out ca.key 2048`

2. Create CA Certificate
   `openssl req -new -x509 -days 3650 -key ca.key -out ca.crt -subj "/C=VN/ST=SE/L=HCMC/O=VF/CN=127.0.0.1/emailAddress=vulee1202@gmail.com"`
   **_ CN should only be a single value, e.g.,: 127.0.0.1 _**

# Server Certificate

1. Create Server's Private Key
   `openssl genrsa -out server.key 2048`

2. Create Server's Certificate Signing Request (CSR)
   `openssl req -new -key server.key -out server.csr -subj "/C=VN/ST=SE/L=HCMC/O=VF/CN=127.0.0.1/emailAddress=vulee1202@gmail.com"`

3. Sign Server CSR by CA Certificate and CA's Private Key
   `openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 3650 -extensions v3_req -extfile <(printf "[v3_req]\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth")`
   **_ IMPORTANT _**
   **_ 1. keyUsage: Defines the certificate's use for signing and encrypting data (digitalSignature, keyEncipherment). _**
   **_ 2. extendedKeyUsage: Sets the certificate for server authentication purposes (serverAuth). _**

4. Cat Server certificate and CA cerficate to fullchain.server
   `cat server.crt ca.crt > fullchain.server.crt`

5. Verify
   `openssl verify -CAfile ca.crt server.crt`

# Client Certificate

1. Create Client's Private Key
   `openssl genrsa -out client.key 2048`

2. Create Client's Certificate Signing Request (CSR)
   `openssl req -new -key client.key -out client.csr -subj "/CN=client"`

3. Sign Client CSR by CA Certificate and CA's Private Key
   `openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt -days 3650 -extensions v3_req -extfile <(printf "[v3_req]\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth")`

4. Cat Client certificate and CA cerficate to fullchain.client
   `cat server.crt ca.crt > fullchain.client.crt`

5. Verify
   `openssl verify -CAfile ca.crt client.crt`
   `openssl s_client -connect 127.0.0.1:5671 -CAfile ca.crt -cert fullchain.client.crt -key client.key`
