#!/bin/bash

# Путь к файлу для записи
LOG_FILE="/usr/local/freeswitch/scripts/sh/bridges.log"

# Запись всех переданных аргументов в файл
echo "$@" >> "$LOG_FILE"
 