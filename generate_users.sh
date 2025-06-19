#!/bin/bash

# Функция для транслитерации кириллицы в латиницу и замены символов на нижнее подчеркивание
transliterate() {
    echo "$1" | sed -e "
    s/А/A/g; s/Б/B/g; s/В/V/g; s/Г/G/g; s/Д/D/g; s/Е/E/g; s/Ё/Yo/g;
    s/Ж/Zh/g; s/З/Z/g; s/И/I/g; s/Й/Y/g; s/К/K/g; s/Л/L/g; s/М/M/g;
    s/Н/N/g; s/О/O/g; s/П/P/g; s/Р/R/g; s/С/S/g; s/Т/T/g; s/У/U/g;
    s/Ф/F/g; s/Х/Kh/g; s/Ц/Ts/g; s/Ч/Ch/g; s/Ш/Sh/g; s/Щ/Shch/g;
    s/Ъ//g; s/Ы/Y/g; s/Ь//g; s/Э/E/g; s/Ю/Yu/g; s/Я/Ya/g;
    s/а/a/g; s/б/b/g; s/в/v/g; s/г/g/g; s/д/d/g; s/е/e/g; s/ё/yo/g;
    s/ж/zh/g; s/з/z/g; s/и/i/g; s/й/y/g; s/к/k/g; s/л/l/g; s/м/m/g;
    s/н/n/g; s/о/o/g; s/п/p/g; s/р/r/g; s/с/s/g; s/т/t/g; s/у/u/g;
    s/ф/f/g; s/х/kh/g; s/ц/ts/g; s/ч/ch/g; s/ш/sh/g; s/щ/shch/g;
    s/ъ//g; s/ы/y/g; s/ь//g; s/э/e/g; s/ю/yu/g; s/я/ya/g;
    s/ /_/g; s/\./_/g; s/,/_/g; s/;/_/g; s/:/_/g; s/-/_/g;
    s/!/_/g; s/?/_/g; s/\*/_/g; s/&/_/g; s/@/_/g; s/#/_/g;
    s/\$/_/g; s/%/_/g; s/\^/_/g; s/(/_/g; s/)/_/g;
    s/\[/_/g; s/\]/_/g; s/{/_/g; s/}/_/g; s/|/_/g; s/\\\\/_/g;
    s/'/_/g; s/\"/_/g; s/</_/g; s/>/_/g;
    "
}

mkdir -p output-users

# Загрузить переменные из файла .env
export $(grep -v '^#' .env | xargs)

CLEAN_SOCKET_PASSWORD=$(echo "$SOCKET_PASSWORD" | tr -d '\r' | tr -d '\n')

cc_filepath="volume-configs/callcenter.conf.xml"

echo "<configuration name=\"callcenter.conf\" description=\"CallCenter\">
  <settings>
    <param name=\"truncate-agents-on-load\" value=\"true\"/>
    <param name=\"truncate-tiers-on-load\" value=\"true\"/>
  </settings>

  <queues>" > "$cc_filepath"

# Обрабатываем каждый файл в папке input-users
for filepath in input-users/*; do
    filename=$(basename -- "$filepath")
    output_filename="$(transliterate "${filename%.*}").xml"
    output_filepath="output-users/$output_filename"
    
    echo "<include>" > "$output_filepath"

    echo "$(sed '1d' "$filepath")" | while IFS=';' read -r kvartira extension extension_udp password; do
        clean_password=$(echo "$password" | tr -d '\r' | tr -d '\n')
        login="$extension"
        
        if [ "$kvartira" = "x" ]; then
            cat <<EOL >> "$output_filepath"
  <user id="${login}">
    <params>
      <param name="password" value="${clean_password}"/>
    </params>
    <variables>
      <variable name="toll_allow" value="domestic,international,local"/>
      <variable name="accountcode" value="${login}"/>
      <variable name="user_context" value="intercoms-main"/>
      <variable name="effective_caller_id_name" value="${login}"/>
      <variable name="effective_caller_id_number" value="${login}"/>
      <variable name="outbound_caller_id_name" value="\$\${outbound_caller_name}"/>
      <variable name="outbound_caller_id_number" value="\$\${outbound_caller_id}"/>
      <variable name="sip-force-contact" value="NDLB-connectile-dysfunction"/>
      <variable name="X-Doma-AI-Type" value="intercom"/>
    </variables>
  </user>
EOL
        else
            cat <<EOL >> "$output_filepath"
  <user id="${login}">
    <params>
      <param name="password" value="${clean_password}"/>
      <param name="vm-password" value="${login}"/>
    </params>
    <variables>
      <variable name="absolute_codec_string" value="OPUS,G722,PCMU,PCMA,VP8"/>
      <variable name="toll_allow" value="domestic,international,local"/>
      <variable name="accountcode" value="${login}"/>
      <variable name="user_context" value="rooms-main"/>
      <variable name="effective_caller_id_name" value="room house 1 apart 1"/>
      <variable name="effective_caller_id_number" value="room-1-1"/>
      <variable name="outbound_caller_id_name" value="\$\${outbound_caller_name}"/>
      <variable name="outbound_caller_id_number" value="\$\${outbound_caller_id}"/>
      <variable name="sip-force-contact" value="NDLB-connectile-dysfunction"/>
      <variable name="sip-force-expires" value="7200"/>
      <variable name="X-Doma-AI-Type" value="apartment"/>
    </variables>
  </user>
EOL
        cat <<EOL >> "$cc_filepath"
         <queue name="${login}@default">
      <param name="strategy" value="ring-all"/>
      <param name="moh-sound" value="\$\${hold_music}"/>
      <param name="time-base-score" value="system"/>
      <param name="max-wait-time" value="120"/>
      <param name="max-wait-time-with-no-agent" value="0"/>
      <param name="max-wait-time-with-no-agent-time-reached" value="0"/>
      <param name="tier-rules-apply" value="false"/>
      <param name="tier-rule-wait-second" value="300"/>
      <param name="tier-rule-wait-multiply-level" value="false"/>
      <param name="tier-rule-no-agent-no-wait" value="false"/>
      <param name="discard-abandoned-after" value="60"/>
      <param name="abandoned-resume-allowed" value="false"/>
    </queue>
EOL
        fi
    done
    
    echo "</include>" >> "$output_filepath"
done

echo "
  </queues>

  <agents>
  </agents>
  <tiers>
  </tiers>

</configuration> " >> "$cc_filepath"

docker compose exec -Td sip-server /usr/local/freeswitch/bin/fs_cli -rRS --password $CLEAN_SOCKET_PASSWORD -x "reloadxml"

for filepath in input-users/*; do
    filename=$(basename -- "$filepath")
    echo "$(sed '1d' "$filepath")" | while IFS=';' read -r kvartira extension extension_udp password; do
        login="$extension"
        
        if [ "$kvartira" != "x" ]; then
            echo "$login"
            docker compose exec -Td sip-server /usr/local/freeswitch/bin/fs_cli -rRS --password $CLEAN_SOCKET_PASSWORD -x "callcenter_config queue unload $login@default"
            docker compose exec -Td sip-server /usr/local/freeswitch/bin/fs_cli -rRS --password $CLEAN_SOCKET_PASSWORD -x "callcenter_config queue load $login@default"
        fi
    done
    
done
