import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SimpleUser } from 'sip.js/lib/platform/web';
import classNames from 'classnames';

import { removeCodec } from 'src/utils/removeCodec';
import CallStatus from 'src/const/CallStatus';
import { Button } from '@mui/material';
import styles from './Call.module.scss';

interface Props {
  url: string;
  domain: string;
  user: string;
  password: string;
}

export const Call = ({ url, domain, user, password }: Props) => {
  const sipUserRef = useRef<SimpleUser>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState(CallStatus.NOT_REGISTERED);
  const [error, setError] = useState('');

  const handleCallAnswer = useCallback(() => {
    setStatus(CallStatus.ANSWERING);
    setError('');
    sipUserRef.current?.answer({
      sessionDescriptionHandlerModifiers: [
        async (
          sessionDescription: RTCSessionDescriptionInit,
        ): Promise<RTCSessionDescriptionInit> => {
          if (sessionDescription.sdp && sessionDescription.type === 'answer') {
            sessionDescription.sdp = removeCodec(sessionDescription.sdp);
          }
          return sessionDescription;
        },
      ],
    });
  }, []);

  const handleCallDecline = useCallback(() => {
    sipUserRef.current?.decline();
  }, []);

  const handleCallHangup = useCallback(() => {
    sipUserRef.current?.hangup();
  }, []);

  const handleDisconnect = useCallback(() => {
    setStatus(CallStatus.NOT_REGISTERED);
    setError('Произошло отключение...');
  }, []);

  const handleRegistered = useCallback(() => {
    setStatus(CallStatus.REGISTERED);
    setError('');
  }, []);

  const handleIncoming = useCallback(() => {
    setStatus(CallStatus.INCOMING_CALL);
    setError('');
  }, []);

  const handleInCall = useCallback(() => {
    setStatus(CallStatus.IN_CALL);
    setError('');
  }, []);

  useEffect(() => {
    console.log(videoRef.current);
    sipUserRef.current = new SimpleUser(url, {
      aor: `sip:${user}@${domain}`,
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
        displayName: user,
        authorizationPassword: password,
        authorizationUsername: user,
        sessionDescriptionHandlerFactoryOptions: {
          peerConnectionConfiguration: {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
          },
        },
      },
    });
    sipUserRef.current.delegate = {
      onCallReceived: handleIncoming,
      onCallAnswered: handleInCall,
      onCallHangup: handleRegistered,
      onRegistered: handleRegistered,
      onServerDisconnect: handleDisconnect,
      onUnregistered: handleDisconnect,
      onCallCreated: (...args) =>
        console.log('[onSomething] onCallCreated', args),
      onCallDTMFReceived: (...args) =>
        console.log('[onSomething] onCallDTMFReceived', args),
      onCallHold: (...args) => console.log('[onSomething] onCallHold', args),
      onMessageReceived: (...args) =>
        console.log('[onSomething] onMessageReceived', args),
      onServerConnect: (...args) =>
        console.log('[onSomething] onServerConnect', args),
    };

    sipUserRef.current
      .connect()
      .then(() => {
        console.log('connected');
        return sipUserRef.current?.register();
      })
      .then(() => {
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
  }, []);

  return (
    <div className={styles.container}>
      <video
        ref={videoRef}
        playsInline
        className={classNames(styles.video, {
          [styles.hidden]: status !== CallStatus.IN_CALL,
        })}
      ></video>

      <Button
        variant="contained"
        className={classNames({
          [styles.hidden]: status !== CallStatus.IN_CALL,
        })}
        onClick={handleCallHangup}
      >
        Завершить
      </Button>

      <h1
        className={classNames({
          [styles.hidden]: status !== CallStatus.REGISTERED,
        })}
      >
        Режим ожидания
      </h1>

      <h1
        className={classNames({
          [styles.hidden]: status !== CallStatus.ANSWERING,
        })}
      >
        Соединение...
      </h1>

      <h1
        className={classNames({
          [styles.hidden]: status !== CallStatus.INCOMING_CALL,
        })}
      >
        Входящий вызов...
      </h1>

      <Button
        variant="contained"
        color="success"
        className={classNames({
          [styles.hidden]: status !== CallStatus.INCOMING_CALL,
        })}
        onClick={handleCallAnswer}
      >
        Ответить
      </Button>

      <Button
        variant="contained"
        color="error"
        className={classNames({
          [styles.hidden]: status !== CallStatus.INCOMING_CALL,
        })}
        onClick={handleCallDecline}
      >
        Отклонить
      </Button>
      {error && <h1 className={styles.error}>{error}</h1>}
    </div>
  );
};
