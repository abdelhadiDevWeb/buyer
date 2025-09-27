import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import app from '@/config';

const instance = axios.create({
  baseURL: app.baseURL,
  timeout: app.timeout,
  headers: { 'x-access-key': app.apiKey },
  withCredentials: true,
});

const response = (res: AxiosResponse) => res.data;

export const requests = {
  get: (url: string, config = {}) => instance.get(url, config).then(response),

  post: (url: string, body: object, config = {}, returnFullResponse = false) =>
    returnFullResponse
      ? instance.post(url, body, config)
      : instance.post(url, body, config).then(response),

  postFormData: (url: string, formData: FormData, config: AxiosRequestConfig = {}) =>
    instance.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(config.headers || {})
      }
    }).then(response),

  put: (url: string, body: object, config = {}) =>
    instance.put(url, body, config).then(response),

  delete: (url: string, config = {}) =>
    instance.delete(url, config).then(response),
};
