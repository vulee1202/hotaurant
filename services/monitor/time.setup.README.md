### Check time cofig

`timedatectl status`

### If NTP service: active then set to false

`sudo timedatectl set-ntp false`

### Set up Chronyd

```
    sudo apt update
    sudo apt install chrony -y
```

### Config for Chronyd

`sudo nano /etc/chrony/chrony.conf`
Then insert

```
    bindaddress 0.0.0.0
    allow 172.17.0.0/16
    server time.google.com iburst
    server time.cloudflare.com iburst

```

### Start Chronyd service

```
sudo systemctl enable chrony
sudo systemctl restart chrony
```

### Verify

`sudo systemctl status chrony`

### Apply for docker environment

`sudo nano /etc/docker/daemon.json`
If path not exist => Create a folder with relation path and insert config to the file

```
{
  "default-runtime": "runc",
  "runtimes": {
    "runc": {
      "path": "/usr/bin/runc",
      "runtimeArgs": [
        "--bind-mount=/etc/localtime:/etc/localtime:ro",
        "--bind-mount=/etc/timezone:/etc/timezone:ro"
      ]
    }
  }
}
```

### Validation docker

`sudo dockerd --validate`

### Restart docker

`sudo systemctl restart docker`

### Verify

`docker run -it --rm alpine date`
