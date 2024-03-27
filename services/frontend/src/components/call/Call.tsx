import React, { useRef, useEffect } from 'react';
import { SimpleUser, SimpleUserOptions } from 'sip.js/lib/platform/web';

import styles from './Call.module.scss';
import { vars } from '../../configs/vars';

interface Props {
  sipUserOptions: SimpleUserOptions;
  onUnregistered?: () => void;
}

export const Call = ({ sipUserOptions, onUnregistered }: Props) => {
  const sipUserRef = useRef<SimpleUser>();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    console.log(videoRef.current);
    sipUserRef.current = new SimpleUser(vars.sipUrl, {
      ...sipUserOptions,
      media: {
        constraints: {
          audio: true,
          video: false,
        },
        remote: {
          video: videoRef.current ?? undefined,
          audio: videoRef.current ?? undefined,
        },
      },
      userAgentOptions: {
        ...sipUserOptions.userAgentOptions,
        sessionDescriptionHandlerFactoryOptions: {
          peerConnectionConfiguration: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
            ]
          },
        },
      },
    });
    sipUserRef.current.delegate = {
      onCallReceived: async () => {
        console.log('Call received');
        await sipUserRef.current?.answer({
          sessionDescriptionHandlerModifiers: [
            async (sessionDescription: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> => {
              if (sessionDescription.sdp && sessionDescription.type === 'answer') {
                const lines = [];
                let mline = -1;
                let rtpRegex: RegExp | null = null;
                let rtpId = '';
                for (const line of sessionDescription.sdp.split('\n')) {
                  const match = line.match(/^a=rtpmap:(\d+) H264/);
                  if (line.startsWith('m=video')) {
                    mline = lines.push(line) - 1;
                  } else if (match) {
                    rtpId = match[1];
                    rtpRegex = new RegExp(`^a=(rtpmap|rtcp-fb|fmtp):${rtpId}`);
                  } else if (!rtpRegex || !line.match(rtpRegex)) {
                    lines.push(line);
                  }
                }
                if (mline >= 0 && rtpId) {
                  lines[mline] = lines[mline].replace(' ' + rtpId, '');
                }
                sessionDescription.sdp = lines.join('\n');
              }
              return sessionDescription;
            },
          ],
        });
      },
      onCallAnswered: (...args) => console.log('[onSomething] onCallAnswered', args),
      onCallCreated: (...args) => console.log('[onSomething] onCallCreated', args),
      onCallDTMFReceived: (...args) => console.log('[onSomething] onCallDTMFReceived', args),
      onCallHangup: (...args) => console.log('[onSomething] onCallHangup', args),
      onCallHold: (...args) => console.log('[onSomething] onCallHold', args),
      onMessageReceived: (...args) => console.log('[onSomething] onMessageReceived', args),
      onRegistered: (...args) => console.log('[onSomething] onRegistered', args),
      onServerConnect: (...args) => console.log('[onSomething] onServerConnect', args),
      onServerDisconnect: onUnregistered,
      onUnregistered,
    };

    sipUserRef.current.connect().then(() => {
      console.log('connected');
      return sipUserRef.current?.register()
    }).then(() => {
      console.log('registered');
    });

    // return () => {
    //   sipUserRef.current?.unregister().then(() => {
    //     console.log('unregistered');
    //     return sipUserRef.current?.disconnect();
    //   }).then(() => {
    //     console.log('disconnect');
    //   });
    // };
  }, [sipUserOptions]);

  return (
    <div className={styles.container}>
      <video ref={videoRef} controls></video>
    </div>
  )
}
