import React, { useState, useCallback } from 'react';
import { TextField, Button } from '@mui/material';

import styles from './Login.module.scss';

interface Props {
    onConnect: (user: string, password: string) => void;
}

export const Login = ({onConnect}: Props) => {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');

  const handleConnect = useCallback(() => {
    onConnect(user, password);
  }, [onConnect]);

  return (
    <div className={styles.container}>
      <TextField value={user} onChange={(e) => setUser(e.target.value)} label='User' />
      <TextField value={password} onChange={(e) => setPassword(e.target.value)} label='Password' type="password" />
      <Button onClick={handleConnect}>Connect</Button>
    </div>
  )
}
