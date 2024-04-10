# intercom-sip-server
An open example implementing a SIP server for an intercom

# Deploy server

To deploy project, create file `deploy/.env` from example, adjust settings and use `deploy.sh` from the project root.

Following ports should be accessible on server:
 - 80 (for HTTP)
 - 5060 (for SIP)
 - 16000-16999 (for RTP media)

# Run frontend

After deploy, frontend and SIP over WebSocket will be on HTTP port 80 on the server. It's preferred to set up proxy with HTTPS in front of it.
The client app should navigate to `https://{PROXY_URL}/?user={USER_NUMBER}&password={USER_PASSWORD}&domain={EXTERNAL_IP}&url={WS_ENDPOINT}`.

External IP could be acquired by running command `docker exec -it doma-freeswitch-1 /usr/local/freeswitch/bin/fs_cli -x 'sofia status profile internal'` on deployed server in field `Ext-RTP-IP`.

For example, if your server is deployed on IP `192.168.10.42` and is behind proxy on `https://sip.example.com/`

    user = 1000
    password = 1234
    domain = 192.168.10.42
    url = wss://sip.example.com/sip (Note wss instead of https)

All url parameters should be url-encoded.

# Users import script

Prepare `.csv` file with pairs of `number,password` of users, and run `cd scripts && node importUsers.js /path/to/users.csv`. This script will import users in running instance of the server. 

Note: if container was rebuilt, it's required to import users again.