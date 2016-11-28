import Promise from 'bluebird';
const fetch = require('node-fetch');

import {
  API_FAILURE,
  NO_TOKEN,
} from './errorTypes';


const YINSHI_URL = 'https://open.ys7.com/api/lapp/token/get';
const APPKEY = '93ce9b9a3bbd450ab7de2b0f9c111d32&appSecret=3c9713a3568bcd80f0d29ef6c5901ff2';

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  return Promise.reject(API_FAILURE + error.toString());
}

function parseJSON(response) {
  return response.json();
}

export default class EZConnector {
  getEZToken() {
    return fetch(YINSHI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `appKey=${APPKEY}`,
    })
    .then(checkStatus)
    .then(parseJSON)
    .then((data) => (data.data.accessToken))
    .catch((err) => new Error(API_FAILURE, err));
  }
}
