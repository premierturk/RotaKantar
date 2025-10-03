import axios from 'axios';
import * as moment from 'moment';

const instance = axios.create({
  headers: { 'X-Custom-Header': 'foobar' }
});

function handleDates(body: any) {
  if (body === null || body === undefined || typeof body !== 'object') {
    return body;
  }
  if (!Array.isArray(body)) { return body; }
  body.forEach(function (item) {
    for (const key of Object.keys(item)) {
      const value = item[key];
      const isDate = typeof value === 'string' && moment(value, moment.ISO_8601, true).isValid() && value.includes("T") && (value.length > 23 && value.length < 30);
      if (isDate) {
        item[key] = new Date(value);
      } else if (typeof value === 'object') {
        handleDates(value);
      }
    }
  });
}

instance.interceptors.response.use(function (response) {
  if (response.data !== undefined) {
    handleDates(response.data);
  }
  return response;
}, function (error) {
  return Promise.reject(error);
});

const strUser = window.localStorage.getItem('user');
if (strUser !== null && strUser !== 'null' && strUser != undefined && strUser != "undefined") {
  const user: any = JSON.parse(strUser);
  instance.defaults.headers.common.Authorization = `Bearer ${user.access_token}`;
}

export default instance;
