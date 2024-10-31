# intercom-sip-server

docker-compose для развертывания

## Build

Базовая команда выглядит так:
```sh
sudo docker compose build
```

## Configuration

Конфигурация должна быть прописана .env:
```env
SOCKET_PASSWORD=
SIP_PASSWORD=
SIP_IP=
```

- `SIP_PASSWORD` - Пароль от тестовых учёток SIP
- `SOCKET_PASSWORD` - Пароль от сокета mod_event_socket
- `SIP_IP` - публичный IP контейнера, по которому его можно зарезольвить. Используется для SDP и прочих вещей.

## Подключение к сокету

```sh
sudo docker compose exec -it sip-server /usr/local/freeswitch/bin/fs_cli -rRS --password ${SOCKET_PASSWORD}
```

## Порты

Контейнер использует следующие порты:
- `8021` для mod_event_socket
- `5060` для SIP (нужно открыть)
- `5061` для SIP over TLS
- `5080` для SIP
- `24000`-`25000` для RTP (нужно открыть)
- `4443` WSS mod_sofia (используется самоподписанный сертификат)
- `7443` WS mod_sofia
