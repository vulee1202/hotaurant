#!/bin/sh
apk add --no-cache curl jq
chmod +x /scripts/*.setup.sh
/scripts/kibana.admin.setup.sh &
/scripts/kibana.setup.sh &
/scripts/logstash.setup.sh &
wait
