import React, { useState, useCallback } from 'react';
import { SimpleUserOptions } from 'sip.js/lib/platform/web';

import { Login } from '../../components/login/Login';
import { Call } from '../../components/call/Call';
import { vars } from '../../configs/vars';

import styles from './Root.module.scss';

export const Root = () => {
  const [sipOptions, setSipOptions] = useState<SimpleUserOptions | null>(null);

  const handleConnect = useCallback((user: string, password: string) => {
    const options: SimpleUserOptions = {
      aor: `sip:${user}@${vars.sipServer}`,
      userAgentOptions: {
        displayName: user,
        authorizationPassword: password,
        authorizationUsername: user,
      },
    };
    setSipOptions(options);
  }, []);

  const handleDisconnect = useCallback(() => {
    setSipOptions(null);
  }, []);

  return (
    <div className={styles.container}>
      {sipOptions
        ? <Call sipUserOptions={sipOptions} onUnregistered={handleDisconnect} />
        : <Login onConnect={handleConnect} />}
    </div>
  )
}
