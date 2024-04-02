import useQueryString from 'src/utils/hooks/useQueryString';
import { Call } from '../../components/call/Call';

import styles from './Root.module.scss';

export const Root = () => {
  const { domain, url, user, password } = useQueryString();

  let error = '';

  if (typeof domain !== 'string') {
    error = 'Domain is missing';
  } else if (typeof url !== 'string') {
    error = 'URL is missing';
  } else if (typeof user !== 'string') {
    error = 'Username is missing';
  } else if (typeof password !== 'string') {
    error = 'Password is missing';
  }

  return (
    <div className={styles.container}>
      {error
        ? (<h1>{error}</h1>)
        : (<Call
          domain={domain as string}
          url={url as string}
          user={user as string}
          password={password as string}
        />)}
    </div>
  )
}
