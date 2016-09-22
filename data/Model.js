/* eslint no-param-reassign: 0 */
import Promise from 'bluebird';
import moment from 'moment';
import { has, findIndex, find, matchesProperty, isFinite } from 'lodash';

import {
  USERNAME_USE_BEFORE_SET,
  PASSWORD_USE_BEFORE_SET,
  TOKEN_USE_BEFORE_SET,
  USERMETA_USE_BEFORE_SET,
  API_FAILURE,
  MODEL_DONT_HAVE_THIS_FIELD,
  IMPORTANT_ID_NOT_PROVIDED,
} from './errorTypes';

export class Config {
  constructor({ connector }) {
    this.connector = connector;
  }

  async getAlarmTypes() {
    try {
      const platformMetaData = await this.connector.get('api/admin/config');
      return platformMetaData.alarmTypes;
    } catch (error) {
      throw new Error(error);
    }
  }

  async getIndicatorTypes(token) {
    try {
      const indicators = await this.connector.get('/api/admin/indicators', token);
      return indicators;
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
  }

  async getLoginStatus(token) {
    try {
      const meta = await this.getAllMetaData();
      return true;
    } catch (error) {
      return false;
    }
  }


  async getAllMetaData(token) {

    const metaData = await this.connector.get('/api/account/whoami', token);
    this.metaData[token] = metaData;

    return this.metaData[token];
  }

  getMetaData(field, token) {
    return this.getAllMetaData(token)
      .then(meta => has(meta, field) ? meta[field] : Promise.reject(new Error(MODEL_DONT_HAVE_THIS_FIELD + ' : ' + field)));
  }

  async login(username, password) {
    try {
      const { token, error } = await this.connector.login(username, password);

      this.username[token] = username;
      this.password[token] = password;

      const { metaData } = await this.connector.get('/api/account/whoami', token);
      this.metaData[token] = metaData;

      return { token };
    } catch (error) {
      return { error };
    }
  }
}


export class PowerEntity {
  constructor({ connector }) {
    this.connector = connector;
    this.districts = {};
    this.siteInfos = {};
    this.modules = {};
  }

  async getAllDistrictData(token) {
    const districtsDatas: Array<Object> = await this.connector.get('/api/info/entry', token);

    return districtsDatas;
  }

  getCompanyPie(token) {
    return this.connector.get('/api/data/index/pie', token);
  }

  getCompanyAlarm(token, pageIndex = 1, orderBy = 'time', fromTime = '', toTime = '', alarmCode = '', pageSize = 20) {
    return this.connector.get(`/api/alarm/company?pz=${pageSize}&pi=${pageIndex}&ob=${orderBy}&ft=${fromTime}&tt=${toTime}&ac=${alarmCode}`, token);
  }

  getCompanyAlarmUnread(token): Promise<number> {
    return this.connector.get('/api/alarm/unread_quantity', token)
      .then(obj => obj.count);
  }

  getDistrictPie(districtID, token) {
    return this.connector.get(`/api/data/district/${districtID}/pie`, token);
  }

  async getAllSiteOverview(siteID, token) {
    const { infos, wires } = await this.connector.get(`/api/data/site/${siteID}/overview`, token);
    return { infos, wires };
  }

  getSitePie(siteID, token) {
    return this.connector.get(`/api/data/site/${siteID}/pie`, token);
  }

  getSiteAlarm(siteID, token, pageIndex = 1, orderBy = 'time', fromTime = '', toTime = '', alarmCode = '', pageSize = 20) {
    return this.connector.get(`/api/alarm/site/${siteID}?pz=${pageSize}&pi=${pageIndex}&ob=${orderBy}&ft=${fromTime}&tt=${toTime}&ac=${alarmCode}`, token);
  }

  getSiteAlarmUnreadAmount(siteID, token): Promise<number> {
    return this.connector.get(`/api/alarm/unread_quantity/site/${siteID}`, token)
      .then(obj => obj.count);
  }

  getSiteInfos(siteID, token) {
    return this.getAllSiteOverview(siteID, token)
      .then(obj => obj.infos);
  }

  getWires(siteID, token) {
    return this.getAllSiteOverview(siteID, token)
      .then(obj => obj.wires);
  }

  getCabinets(siteID, token) {
    return this.connector.get(`/api/info/site/${siteID}/cabinets`, token);
  }

  getCabinetSwitches(siteID, cabinetID, token) {
    return this.connector.get(`/api/data/site/${siteID}/cabinets/switches`, token)
      .then(list => find(list, obj => obj.cabinet.id === cabinetID))
      .then(obj => obj.switches);
  }

  getRealtimeData(deviceID, token) {
    return this.connector.get(`/api/data/device/${deviceID}/realtime`, token)
  }

  async getDeviceAlarm(deviceID, token, pageIndex = 1, orderBy = 'time', fromTime = '', toTime = '', alarmCode = '', pageSize = 20) {
    const alarms = await this.connector.get(`/api/alarm/device/${deviceID}?pz=${pageSize}&pi=${pageIndex}&ob=${orderBy}&ft=${fromTime}&tt=${toTime}&ac=${alarmCode}`, token);
    return alarms;
  }

  async getCompanyLineChartSources(token) {
    // 目前还只显示厂区负荷一根线
    return ['companyLoad'];
  }

  async getCompanyLineChart(token, sources, scale = '5m') {
    const companyChartList = [];

    if (!sources) {
      sources = await this.getCompanyLineChartSources(token);
    }

    if (sources.includes('companyLoad')) {
      companyChartList.push({source: 'companyLoad', lineChart: await this.connector.get(`/api/load/company/today?sc=${scale}`, token)})
    }

    return companyChartList;
  }

  async getDistrictLineChartSources(districtID, token) {
    // 目前还只显示厂区负荷一根线
    return ['districtLoad'];
  }

  async getDistrictLineChart(districtID, token, sources, scale = '5m') {
    if (!isFinite(Number(districtID))) {
      throw new Error(IMPORTANT_ID_NOT_PROVIDED);
    }

    const districtChartList = [];

    if (!sources) {
      sources = await this.getDistrictLineChartSources(districtID, token);
    }

    if (sources.includes('districtLoad')) {
      districtChartList.push({source: 'districtLoad', lineChart: await this.connector.get(`/api/load/ditrict/${districtID}/today?sc=${scale}`, token)})
    }

    return districtChartList;
  }

  async getSiteLineChartSources(siteID, token) {
    if (!isFinite(Number(siteID))) {
      throw new Error(IMPORTANT_ID_NOT_PROVIDED);
    }

    const wireIDList = await this.getWires(siteID, token).then(wireList => wireList.map(wireObj => String(wireObj.deviceId)));
    return [...wireIDList, 'siteLoad'];
  }

  async getSiteLineChart(siteID, token, sources, fromTime = moment().subtract(1, 'days').format('YYYY-MM-DD'), toTime = moment().format('YYYY-MM-DD'), scale = '5m') {
    if (!isFinite(Number(siteID))) {
      throw new Error(IMPORTANT_ID_NOT_PROVIDED);
    }

    const siteChartList = [];
    
    if (!sources) {
      sources = await this.getSiteLineChartSources(siteID, token);
    }

    if (sources.includes('siteLoad')) {
      siteChartList.push({source: 'siteLoad', lineChart: await this.connector.get(`/api/load/site/${siteID}?ft=${fromTime}&tt=${toTime}&sc=${scale}`, token)})
    }

    for (const wire of sources) {
      if (isFinite(Number(wire))) {
        siteChartList.push({source: wire, lineChart: await this.connector.get(`/api/load/wire/${wire}?ft=${fromTime}&tt=${toTime}&sc=${scale}`, token)})
      }
    }
    return siteChartList;
  }

  async getDeviceLineChartSources(deviceID, token) {
    if (!isFinite(Number(deviceID))) {
      throw new Error(IMPORTANT_ID_NOT_PROVIDED);
    }

    const deviceIndicatorList = await this.connector.get(`/api/load/device/${deviceID}/datasources`, token);
    return deviceIndicatorList;
  }

  async getDeviceLineChart(deviceID, token, sources, fromTime = moment().subtract(1, 'days').format('YYYY-MM-DD'), toTime = moment().format('YYYY-MM-DD'), scale = '5m') {
    if (!isFinite(Number(deviceID))) {
      throw new Error(IMPORTANT_ID_NOT_PROVIDED);
    }
    
    const deviceChartList = [];

    if (!sources) {
      sources = await this.getDeviceLineChartSources(deviceID, token);
    }

    for (const indicator of sources) {
      if (isFinite(Number(indicator))) {       
        deviceChartList.push({source: indicator, lineChart: await this.connector.get(`/api/load/device/${deviceID}/datasource/${indicator}?ft=${fromTime}&tt=${toTime}&sc=${scale}`, token)})
      }
    }
    return deviceChartList;
  }


  getChildren(areaType, id, token) {
    switch (areaType) {
      case 'Company':
        return this.getAllDistrictData(token);
      case 'District':
        return this.getAllDistrictData(token)
          .then(districts => findIndex(districts, obj => obj.id === id));
      case 'Site':
        return this.getCabinets(token);
      default:
        return [];
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
