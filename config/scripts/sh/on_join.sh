#!/bin/bash

# Путь к файлу для записи
LOG_FILE="/usr/local/freeswitch/scripts/sh/joins.log"

CURRENT_DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "$CURRENT_DATE - $@" >> "$LOG_FILE"

# Отправка пуш сообщения
RES=$(curl "$PUSH_URL/$2" -H "Authorization: Bearer $PUSH_API_KEY")

echo "RESPONSE - $RES" >> "$LOG_FILE"
