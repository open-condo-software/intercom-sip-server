FROM debian:12-slim

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

RUN ldconfig

CMD ["/usr/local/freeswitch/bin/freeswitch"]