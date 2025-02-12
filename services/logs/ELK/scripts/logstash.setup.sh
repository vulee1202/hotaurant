#!/bin/sh
set -e  # Exit on errors

# Ensure required variables are set
if [ -z "$LOGSTASH_PASSWORD" ] || [ -z "$LOGSTASH_USERNAME" ] || [ -z "$LOGSTASH_FULL_NAME" ] || [ -z "$LOGSTASH_EMAIL" ]; then
    echo "Error: Missing required environment variables!"
    exit 1
fi

# Variables
ELASTICSEARCH_URL="https://elasticsearch:9200"
CERT_PATH="/certs/elasticsearch-ca.pem"
LOGSTASH_ROLE="logstash_system"

CREATEUSER_PAYLOAD=$(jq -n \
    --arg password "$LOGSTASH_PASSWORD" \
    --argjson roles "[\"$LOGSTASH_ROLE\"]" \
    --arg full_name "$LOGSTASH_FULL_NAME" \
    --arg email "$LOGSTASH_EMAIL" \
    '{password: $password, roles: $roles, full_name: $full_name, email: $email}'
)

# Wait for Elasticsearch to be ready
echo "Waiting for Elasticsearch to be ready..."
until curl -k --cacert "$CERT_PATH" -u "$ELASTIC_USERNAME:$ELASTIC_PASSWORD" \
    "$ELASTICSEARCH_URL/_cluster/health?wait_for_status=yellow" > /dev/null 2>&1; do
    echo "Elasticsearch not ready yet. Retrying in 5 seconds..."
    sleep 5
done
echo "Elasticsearch is ready!"

# Create or replace Logstash user
echo "Creating user $LOGSTASH_USERNAME..."
echo "$CREATEUSER_PAYLOAD" | curl -s -o /dev/null -X POST "$ELASTICSEARCH_URL/_security/user/$LOGSTASH_USERNAME" \
    -u "$ELASTIC_USERNAME:$ELASTIC_PASSWORD" --cacert "$CERT_PATH" \
    -H 'Content-Type: application/json' \
    -d @-
echo "User $LOGSTASH_USERNAME created successfully!"

echo "Setup completed!"
