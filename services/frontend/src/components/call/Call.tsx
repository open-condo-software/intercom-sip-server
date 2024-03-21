import React, { useRef, useEffect } from 'react';
import { SimpleUser, SimpleUserOptions } from 'sip.js/lib/platform/web';

import styles from './Call.module.scss';
import { vars } from '../../configs/vars';

interface Props {
  sipUserOptions: SimpleUserOptions;
}

export const Call = ({ sipUserOptions }: Props) => {
  const sipUserRef = useRef<SimpleUser>();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
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
      }
    });
    sipUserRef.current.delegate = {
      onCallReceived: async () => {
        console.log('Call received');
        await sipUserRef.current?.answer();
      }
    };

    sipUserRef.current.connect().then(() => {
      console.log('connected');
      return sipUserRef.current?.register()
    }).then(() => {
      console.log('registered');
    });

    return () => {
      sipUserRef.current?.unregister().then(() => {
        console.log('unregistered');
        return sipUserRef.current?.disconnect();
      }).then(() => {
        console.log('disconnect');
      });
    };
  }, [sipUserOptions]);

  return (
    <div className={styles.container}>
      <video ref={videoRef}></video>
    </div>
  )
}
