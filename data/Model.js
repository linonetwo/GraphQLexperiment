import Promise from 'bluebird';
import fetch from 'node-fetch';
import _ from 'lodash';
import moment from 'moment';

import {
  USERNAME_USE_BEFORE_SET,
  PASSWORD_USE_BEFORE_SET,
  TOKEN_USE_BEFORE_SET,
  USERMETA_USE_BEFORE_SET,
  API_FAILURE,
  MODEL_DONT_HAVE_THIS_FIELD,
} from './errorTypes';

export class Config {
  constructor({ connector }) {
    this.connector = connector;
    this.platformMetaData = {};
  }

  async getAlarmTypes() {
    try {
      const platformMetaData = await this.connector.get('api/admin/config');
      this.platformMetaData = { ...this.platformMetaData, ...platformMetaData };
      return platformMetaData.alarmTypes;
    } catch (error) {
      throw new Error(error);
    }
  }
}

export class User {
  constructor({ connector }) {
    this.connector = connector;
    this.username = {};
    this.password = {};
    this.metaData = {};
    this.logined = {};
  }

  getLoginStatus(token) {
    return !!this.logined[token];
  }

  getUserName(token) {
    return !!this.userName[token]
      ? Promise.resolve(this.userName[token])
      : Promise.reject(new Error(USERNAME_USE_BEFORE_SET));
  }

  getPassWord(token) {
    return !!this.password[token]
      ? Promise.resolve(this.password[token])
      : Promise.reject(new Error(PASSWORD_USE_BEFORE_SET));
  }

  async getAllMetaData(token) {
    console.log(1, this.metaData);

    if (_.isEmpty(this.metaData[token]) || !this.metaData[token].lastUpdate || moment(this.metaData[token].lastUpdate) < moment().subtract(1, 'hours')) {
      const metaData = await this.connector.get('/api/account/whoami', token);
      console.log(2, metaData)
      this.metaData[token] = { ...this.metaData[token], ...metaData, lastUpdate: moment().utc().format() };
    }
    return Promise.resolve(this.metaData[token]);
  }

  getMetaData(field, token) {
    return this.getAllMetaData(token)
      .then(meta => _.has(meta, field) ? meta[field] : Promise.reject(new Error(MODEL_DONT_HAVE_THIS_FIELD)));
  }

  async login(username, password) {
    try {
      const { token, error } = await this.connector.login(username, password);

      this.username[token] = username;
      this.password[token] = password;

      const { metaData } = await this.connector.get('/api/account/whoami', token);
      this.metaData[token] = { ...this.metaData[token], ...metaData, lastUpdate: moment().utc().format() };
      this.logined[token] = true;

      return { token };
    } catch (error) {
      return { error };
    }
  }
}

export class FortuneCookie {
  async getFortuneCookie() {
    try {
      const response = await fetch('http://fortunecookieapi.com/v1/cookie');
      const [{ fortune: { message: fortuneCookie } }] = await response.json();
      return fortuneCookie;
    } catch (error) {
      return error.toString();
    }
  }
}
