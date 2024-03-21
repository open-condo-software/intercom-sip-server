import {CircularProgress, CircularProgressProps} from "@mui/material";

import Styles from './Loader.module.scss';

export const Loader = (props: CircularProgressProps) => {
  return (
    <CircularProgress
      {...props}
      classes={{
        root: Styles.loader,
      }}
    />
  )
}
