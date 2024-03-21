FROM debian:12-slim

ARG SIP_PASSWORD=FS_password_1234

RUN apt-get update && \
    apt-get install -yq gnupg2 wget lsb-release git build-essential autoconf libtool pkg-config cmake nasm \
    libtiff-dev libssl-dev libsqlite3-dev libcurl4-openssl-dev libpcre3-dev libspeex-dev libspeexdsp-dev \
    libldns-dev libedit-dev liblua5.3-dev libopus-dev libsndfile-dev uuid-dev \
    libavformat-dev libswscale-dev

RUN cd /usr/src && \
    git clone --depth 1 https://github.com/freeswitch/spandsp.git

RUN cd /usr/src/spandsp && \
    bash ./bootstrap.sh -j && \
    bash ./configure && \
    make -j && \
    make install

RUN cd /usr/src && \
    git clone --depth 1 https://github.com/freeswitch/sofia-sip.git -bv1.13.17

RUN cd /usr/src/sofia-sip && \
    bash ./bootstrap.sh -j && \
    bash ./configure && \
    make -j && \
    make install

RUN cd /usr/src && \
    git clone --depth 1 https://github.com/signalwire/libks.git -bv2.0.4

RUN cd /usr/src/libks && \
    git config --global user.email "you@example.com" && \
    git config --global user.name "Your Name" && \
    echo 'dummy' > dummy && \
    git add dummy && \
    git commit -m 'dummy' && \
    mkdir build && cd build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release && \
    make -j && \
    touch changelog.Debian && gzip changelog.Debian && \
    make install

RUN cd /usr/src && \
    git clone --depth 1 https://github.com/signalwire/freeswitch.git -bv1.10.11

RUN cd /usr/src/freeswitch && \
    bash ./bootstrap.sh -j && \
    sed -i -E '/mod_(signalwire|pgsql)/d' modules.conf && \
    bash ./configure && \
    sed -i -E 's/V18_MODE_5BIT_(4545|50)/V18_MODE_WEITBRECHT_5BIT_4545/g' src/mod/applications/mod_spandsp/mod_spandsp_dsp.c && \
    sed -i -E 's/v18_init\((.*)\);/v18_init(\1, NULL, NULL);/g' src/mod/applications/mod_spandsp/mod_spandsp_dsp.c && \
    make -j && \
    make install

RUN ldconfig && mkdir -p /data/certs

RUN sed -i -E 's|(<!--)?<param name="tls-cert-dir" value="[^"]*"/>(-->)?|<param name="tls-cert-dir" value="/data/certs"/>|' \
    /usr/local/freeswitch/conf/sip_profiles/internal.xml && \
    sed -i -E 's#(<!--)?<load module="mod_(signalwire|pgsql)"/>(-->)?#<!--<load module="mod_(\2)"/>-->#' \
    /usr/local/freeswitch/conf/autoload_configs/modules.conf.xml && \
    sed -i -E 's|(<!--)?<load module="mod_h26x"/>(-->)?|<load module="mod_h26x"/>|' \
    /usr/local/freeswitch/conf/autoload_configs/modules.conf.xml && \
    sed -i -E 's!<X-PRE-PROCESS cmd="set" data="outbound_codec_prefs=[^"]*"/>!<X-PRE-PROCESS cmd="set" data="outbound_codec_prefs=H264,OPUS,G722,PCMU,PCMA"/>!' \
    /usr/local/freeswitch/conf/vars.xml && \
    sed -i -E 's!<X-PRE-PROCESS cmd="set" data="default_password=[^"]*"/>!<X-PRE-PROCESS cmd="set" data="default_password=$SIP_PASSWORD"/>!' \
    /usr/local/freeswitch/conf/vars.xml && \
    rm -r /usr/local/freeswitch/conf/sip_profiles/*-ipv6*

CMD ["/usr/local/freeswitch/bin/freeswitch"]