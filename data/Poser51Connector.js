/* global fetch:false */
import Promise from 'bluebird';
import fetch from 'node-fetch';

import {
  USERNAME_USE_BEFORE_SET,
  PASSWORD_USE_BEFORE_SET,
} from './errorTypes';


const POWER51PATH = 'http://power51.grootapp.com:31328';


function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}




export default class Power51Connector {
  constructor(token) {
    this.token = token;
    this.metaData = {};
    this.logined = !!this.token;
  }

  setToken(token) {
    this.token = token;
  }

  getUserName() {
    return this.userName !== undefined
      ? Promise.resolve(this.userName)
      : Promise.reject(new Error(USERNAME_USE_BEFORE_SET));
  }

  getPassWord() {
    return this.password !== undefined
      ? Promise.resolve(this.password)
      : Promise.reject(new Error(PASSWORD_USE_BEFORE_SET));
  }

  getLoginStatus() {
    return this.logined;
  }

  login(username, password) {
    return Promise.try(() =>
      fetch(`${POWER51PATH}/api/account/login_app`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
    )
    .then(checkStatus)
    .then(response => response.json())
    .then(json => {
      if (json.data.code !== 0) {
        return Promise.reject(json.data.message);
      }

      this.setToken(json.token);
      this.metaData = { ...this.metaData, ...json.data };
      return json.token;
    })
    .catch(err => console.error(err));
  }

  logout() { // 实际上服务端并没有做 logout，每次登陆生成的 token 都会保存 7天
    this.token = undefined;
    this.logined = false;
  }

  get(route) {
    return Promise.try(() =>
      fetch(`${POWER51PATH}/${route}?token=${this.token}`, {
        method: 'GET',
        headers: {},
      })
    )
    .then(json => {
      if (json.data.code === -1) {
        return Promise.reject(json.data.message);
      }
      return json.data;
    });
  }

  post(route, data) {
    return Promise.try(() =>
      fetch(`${POWER51PATH}/${route}?token=${this.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      })
    )
    .then(json => {
      if (json.data.code === -1) {
        return Promise.reject(json.data.message);
      }
      return json.data;
    });
  }
}
