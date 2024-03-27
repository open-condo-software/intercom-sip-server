import React, { useState, useCallback } from 'react';
import { TextField, Button } from '@mui/material';

import styles from './Login.module.scss';

interface Props {
    onConnect: (user: string, password: string) => void;
}

export const Login = ({onConnect}: Props) => {
  const [user, setUser] = useState('1000');
  const [password, setPassword] = useState('');

  const handleConnect = useCallback(() => {
    onConnect(user, password);
  }, [onConnect, user, password]);

  return (
    <form className={styles.container} onSubmit={handleConnect}>
      <TextField value={user} onChange={(e) => setUser(e.target.value)} label='User' />
      <TextField value={password} onChange={(e) => setPassword(e.target.value)} label='Password' type="password" />
      <Button type='submit'>Connect</Button>
    </form>
  )
}
