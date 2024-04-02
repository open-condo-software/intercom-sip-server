import axios, { Method, CancelToken } from 'axios';

interface IArgs {
  method: Method;
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, any>;
  cancelToken?: CancelToken;
  onUploadProgress?: (progressEvent: any) => void;
  onDownloadProgress?: (progressEvent: any) => void;
}

export const sendHttpRequest = (args: IArgs) => {
  const {
    url,
    method,
    data,
    params,
    headers,
    cancelToken,
    onUploadProgress,
    onDownloadProgress,
  } = args;
  return axios({
    url,
    method,
    data,
    params,
    headers,
    cancelToken,
    onUploadProgress,
    onDownloadProgress,
  });
};
