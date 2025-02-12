#!/bin/sh
set -e  # Exit on errors

# Install required tools
apk add --no-cache curl jq

# Step CA API URL and certificate paths
STEP_CA_API_URL="https://step-ca:9000"
ROOT_CA_PATH="/certs/root_ca.crt"

# Ensure the root certificate exists
if [ ! -f "$ROOT_CA_PATH" ]; then
    echo "Root CA certificate not found at $ROOT_CA_PATH. Exiting."
    exit 1
fi

# Function to check if the provisioner already exists
check_provisioner_exists() {
    echo "Checking if provisioner 'filebeat-provisioner' already exists..."
    response=$(curl -f --cacert "$ROOT_CA_PATH" "$STEP_CA_API_URL/provisioners")
    
    if echo "$response" | jq -e ".provisioners[] | select(.name == \"filebeat-provisioner\")" > /dev/null; then
        echo "Provisioner 'filebeat-provisioner' already exists. Skipping creation."
        return 0
    else
        echo "Provisioner 'filebeat-provisioner' does not exist. Proceeding to create."
        return 1
    fi
}

# Function to generate the Filebeat certificate
create_certificate() {
    echo "Generating certificate for 'filebeat.local'..."
    payload=$(jq -n \
        --arg certificate "filebeat.local" \
        --arg key "/home/step/certs/filebeat.key" \
        --argjson san '["filebeat.local", "127.0.0.1"]' \
        --arg provisioner "filebeat-provisioner" \
        --arg password "$FILEBEAT_PASSWORD" \
        '{
            certificate: $certificate,
            key: $key,
            san: $san,
            provisioner: $provisioner,
            password: $password
        }')

    response=$(curl -s -o /dev/null -X POST "$STEP_CA_API_URL/certificates" \
        --cacert "$ROOT_CA_PATH" \
        -H "Content-Type: application/json" \
        -d "$payload")

    if echo "$response" | jq -e . >/dev/null 2>&1; then
        echo "Certificate generated successfully:"
        echo "$response" | jq
    else
        echo "Failed to generate certificate. Response:"
        echo "$response"
        exit 1
    fi
}

# Function to wait until Step CA is ready
check_step_ca_ready() {
    until curl -f --cacert "$ROOT_CA_PATH" "$STEP_CA_API_URL/health" > /dev/null; do
        echo "curl -f --cacert "$ROOT_CA_PATH" "$STEP_CA_API_URL/health""
        echo "Waiting for Step CA to be ready..."
        sleep 2
    done
    echo "Step CA is ready."
}

# Start script execution
echo "Starting Step CA and waiting for it to be ready..."
check_step_ca_ready

# Check if provisioner exists
if ! check_provisioner_exists; then
    echo "Provisioner 'filebeat-provisioner' already exists. Skipping creation."
fi

# Generate certificate
echo "Generating certificate..."
create_certificate

echo "Filebeat certificate creation complete!"
