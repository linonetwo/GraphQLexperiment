
import { property, isEmpty, find, matchesProperty, flatten } from 'lodash';
import moment from 'moment';

export const resolvers = {
  RootMutation: {
    getToken(root, { username, password }, context) {
      return context.User.login(username, password);
    },
    confirmAlarm(root, { companyID, alarmID, token }, context) {
      return context.PowerEntity.confirmAlarm(companyID, alarmID, token);
    },
  },
  RootQuery: {
    FortuneCookie(root, args, context) {
      return context.FortuneCookie.getFortuneCookie();
    },
    Config(root, args, context) {
      return context.Config.getAlarmTypes();
    },
    User(root, { token }, context) {
      return { token };
    },
    async Company(root, { token }, context) {
      const powerEntity = {
        id: await context.User.getMetaData('companyId', token),
        name: await context.User.getMetaData('companyName', token),
        address: await context.User.getMetaData('address', token),
        areaType: 'Company',
        pie: await context.PowerEntity.getCompanyPie(token),
        children: await context.PowerEntity.getAllDistrictData(token),
        token
      };
      return powerEntity;
    },
    Alarm(root, { token, areaType, districtID, siteID, gatewayID, cabinetID, deviceID, ...alarmArgs }, context) {
      const { pagesize, pageIndex, orderBy, fromTime, toTime, alarmCodes, confirmed } = alarmArgs;

      switch (areaType) {
        case 'Company':
          return context.PowerEntity.getCompanyAlarm(token, pageIndex, orderBy, fromTime, toTime, alarmCodes, confirmed, pagesize);
        case 'Site':
          return context.PowerEntity.getSiteAlarm(siteID, token, pageIndex, orderBy, fromTime, toTime, alarmCodes, confirmed, pagesize);
        case 'Device':
          return context.PowerEntity.getDeviceAlarm(deviceID, token, pageIndex, orderBy, fromTime, toTime, alarmCodes, confirmed, pagesize);
        default:
          return [];
      }
    },
    LineChart(root, { token, areaType, sources, districtID, siteID, gatewayID, cabinetID, deviceID, ...lineChartArgs }, context) {
      const { fromTime, toTime, scale } = lineChartArgs;

      switch (areaType) {
        case 'Company':
          return context.PowerEntity.getCompanyLineChart(token, sources, fromTime, toTime, scale);
        case 'District':
          return context.PowerEntity.getDistrictLineChart(districtID, token, sources, fromTime, toTime, scale);
        case 'Site':
          return context.PowerEntity.getSiteLineChart(siteID, token, sources, fromTime, toTime, scale);
        case 'Device':
          return context.PowerEntity.getDeviceLineChart(deviceID, token, sources, fromTime, toTime, scale);
        default:
          return [];
      }
    },
    LineChartSources(root, { token, areaType, districtID, siteID, gatewayID, cabinetID, deviceID }, context) {
      switch (areaType) {
        case 'Company':
          return context.PowerEntity.getCompanyLineChartSources(token);
        case 'District':
          return context.PowerEntity.getDistrictLineChartSources(districtID, token);
        case 'Site':
          return context.PowerEntity.getSiteLineChartSources(siteID, token);
        case 'Device':
          return context.PowerEntity.getDeviceLineChartSources(deviceID, token);
        default:
          return [];
      }
    },
  },
  ConfirmedAlarmType: {
    id: property('confirmedUserId'),
    name: property('confirmedUserName'),
    time: property('confirmedTime'),
    succeed: property('confirmedSuccess'),
  },
  ConfigType: {
    alarmTypes(_, args, context) {
      return context.Config.getAlarmTypes();
    },
    indicatorTypes(_, { token }, context) {
      return context.Config.getIndicatorTypes(token);
    }
  },
  AlarmCodeType: {
    code({ code }, args, context) {
      // RootQuery 中的 Config 返回的东西会被解构，得到一个符合 AlarmCodeType 的对象，传给这里的第一个参数
      return code;
    },
    label({ label }, args, context) {
      return label;
    },
  },
  UserType: {
    logined({ token }, args, context) {
      return context.User.getLoginStatus(token);
    },
    token({ token }, args, context) {
      return token;
    },
    id({ token }, args, context) {
      return context.User.getMetaData('id', token);
    },
    name({ token }, args, context) {
      return context.User.getMetaData('name', token);
    },
    companyId({ token }, args, context) {
      return context.User.getMetaData('companyId', token);
    },
    companyName({ token }, args, context) {
      return context.User.getMetaData('companyName', token);
    },
    departmentId({ token }, args, context) {
      return context.User.getMetaData('departmentId', token);
    },
    departmentName({ token }, args, context) {
      return context.User.getMetaData('departmentName', token);
    },
    role({ token }, args, context) {
      return context.User.getMetaData('role', token);
    },
  },
  PowerEntityType: {
    id(powerEntity, args, context) {
      return powerEntity.id;
    },
    areaType(powerEntity, args, context) {
      return powerEntity.areaType;
    },
    pie(powerEntity, args, context) {
      return powerEntity.pie ? powerEntity.pie : {
        current: 0,
        rate: '0%',
        total: 1,
        unit: 'kw',
      };
    },
  },
  CompanyType: {
    id(powerEntity, args, context) {
      return powerEntity.id;
    },
    name(powerEntity, args, context) {
      return powerEntity.name;
    },
    coordinate(powerEntity, args, context) {
      return powerEntity.coordinate;
    },
    companyId(powerEntity, args, context) {
      return powerEntity.companyId;
    },
    areaType(powerEntity, args, context) {
      return powerEntity.areaType;
    },
    unreadAlarmAmount(powerEntity, args, context) {
      return context.PowerEntity.getCompanyAlarmUnread(powerEntity.id, powerEntity.token);
    },
    unConfirmedAlarmAmount(powerEntity, args, context) {
      return context.PowerEntity.getCompanyAlarmUnconfirmed(powerEntity.id, powerEntity.token);
    },
    async pie(powerEntity, args, context) {
      const pie = await powerEntity.pie;
      return pie || {
        current: 0,
        rate: '0%',
        total: 1,
        unit: 'kw',
      };
    },
    lineChartSources(powerEntity, args, context) {
      return context.PowerEntity.getCompanyLineChartSources(powerEntity.token);
    },
    lineChart(powerEntity, { sources, scale }, context) {
      return context.PowerEntity.getCompanyLineChart(powerEntity.token, sources, scale);
    },
    children(powerEntity, { id }, context) {
      let childrenWithToken = powerEntity.children.map(district => Object.assign({}, district, { token: powerEntity.token }));
      if (id) {
        childrenWithToken = [find(childrenWithToken, matchesProperty('id', id))];
      }
      return childrenWithToken;
    },
  },
  DistrictType: {
    id(powerEntity, args, context) {
      return powerEntity.id;
    },
    name(powerEntity, args, context) {
      return powerEntity.name;
    },
    coordinate(powerEntity, args, context) {
      return powerEntity.coordinate;
    },
    companyId(powerEntity, args, context) {
      return powerEntity.companyId;
    },
    address(powerEntity, args, context) {
      return powerEntity.address;
    },
    areaType(powerEntity, args, context) {
      return powerEntity.areaType;
    },
    async pie(powerEntity, args, context) {
      const pie = await context.PowerEntity.getDistrictPie(powerEntity.id, powerEntity.token);
      return pie || {
        current: 0,
        rate: '0%',
        total: 1,
        unit: 'kw',
      };
    },
    lineChartSources(powerEntity, args, context) {
      return context.PowerEntity.getDistrictLineChartSources(powerEntity.id, powerEntity.token);
    },
    lineChart(powerEntity, { sources, scale }, context) {
      return context.PowerEntity.getDistrictLineChart(powerEntity.id, powerEntity.token, sources, scale);
    },
    children(powerEntity, { id }, context) {
      let childrenWithToken = powerEntity.children.map(district => Object.assign({}, district, { token: powerEntity.token }));
      if (id) {
        childrenWithToken = [find(childrenWithToken, matchesProperty('id', id))];
      }
      return childrenWithToken;
    },
  },
  SiteType: {
    id(powerEntity, args, context) {
      return powerEntity.id;
    },
    areaType(powerEntity, args, context) {
      return powerEntity.areaType;
    },
    unreadAlarmAmount(powerEntity, args, context) {
      return context.PowerEntity.getSiteAlarmUnreadAmount(powerEntity.id, powerEntity.token);
    },
    async pie(powerEntity, args, context) {
      const pie = await context.PowerEntity.getSitePie(powerEntity.id, powerEntity.token);
      return pie || {
        current: 0,
        rate: '0%',
        total: 1,
        unit: 'kw',
      };
    },
    infos(powerEntity, args, context) {
      return context.PowerEntity.getSiteInfos(powerEntity.id, powerEntity.token);
    },
    async wires(site, args, context) {
      const wires = await context.PowerEntity.getWires(site.id, site.token);

      // inject cabinetId to wires
      const cabinetIdList = await context.PowerEntity.getCabinets(site.id, site.token).map(cabinet => cabinet.id);

      for (const wire of wires) {
        for (const cabinetId of cabinetIdList) {
          const switches = await context.PowerEntity.getCabinetSwitches(site.id, cabinetId, site.token);
          for (const aSwitch of switches) {
            if (aSwitch.id === wire.deviceId) {
              wire.cabinetID = cabinetId;
            }
          }
        }
      }

      return wires;
    },
    async cabinets(powerEntity, { id }, context) {
      const cabinets = await context.PowerEntity.getCabinets(powerEntity.id, powerEntity.token);
      let cabinetsWithToken = cabinets.map(cabinet => Object.assign({}, cabinet, { token: powerEntity.token }));
      if (id) {
        cabinetsWithToken = [find(cabinetsWithToken, matchesProperty('id', id))];
      }
      return cabinetsWithToken;
    },
    lineChartSources(powerEntity, args, context) {
      return context.PowerEntity.getSiteLineChartSources(powerEntity.id, powerEntity.token);
    },
    lineChart(powerEntity, { sources, fromTime, toTime, scale }, context) {
      return context.PowerEntity.getSiteLineChart(powerEntity.id, powerEntity.token, sources, fromTime, toTime, scale);
    },
  },
  IndicatorType: {
    id: property('id'),
    key: property('key'),
    name: property('name'),
    unit: property('unit'),
  },
  LineChartListType: {
    source: property('source'),
    lineChart(LineChartList, args, context) {
      return LineChartList.lineChart;
    },
  },
  LineChartType: {
    time: property('time'),
    value: property('value'),
  },
  AlarmInfoType: {
    id: property('alarmId'),
    code: property('code'),
    timestamp: property('time'),
    readed: property('readed'),
    confirmed: property('confirmed'),
    message: property('message'),

    confirmedUserID: property('confirmedUserId'),
    confirmedUserName: property('confirmedUserName'),
    districtID: property('districtId'),
    districtName: property('districtName'),
    siteID: property('siteId'),
    siteName: property('siteName'),
    gatewayID: property('gatewayId'),
    gatewayName: property('gatewayName'),
    cabinetID: property('cabinetId'),
    cabinetName: property('cabinetName'),
    deviceID: property('deviceId'),
    deviceName: property('deviceName'),
  },
  WireType: {
    name: property('wire'),
    current: property('current'),
    total: property('total'),
    unit: property('unit'),
    cabinetID: property('cabinetID'),
    deviceId: property('deviceId'),
    indicators: property('indicators'),
  },
  CabinetType: {
    id: property('id'),
    name: property('name'),
    type: property('type'),
    address: property('address'),
    devices: property('devices'),
    children: property('children'),
    async switches(cabinet, { id }, context) {
      const switchGroup = await context.PowerEntity.getCabinetSwitches(cabinet.siteId, cabinet.id, cabinet.token);
      let switchesWithToken = switchGroup.map(aswitch => Object.assign({}, aswitch, { token: cabinet.token }));
      if (id) {
        switchesWithToken = [find(switchesWithToken, matchesProperty('id', id))];
      }
      return switchesWithToken;
    },
    sortId: property('sortId'),
    wire: property('wire'),
    siteId: property('siteId'),
    districtId: property('districtId'),
    gatewayId: property('gatewayId'),
    companyId: property('companyId'),
  },
  DeviceType: {
    id: property('id'),
    name: property('name'),
    realtimeData(device, args, context) {
      return context.PowerEntity.getRealtimeData(device.id, device.token);
    },
    alarmInfos(powerEntity, args, context) {
      const { token, areaType, districtID, siteID, gatewayID, cabinetID, deviceID, ...alarmArgs } = args;
      const { pagesize, pageIndex, orderBy, fromTime, toTime, alarmCodes, confirmed } = alarmArgs;
      return context.PowerEntity.getDeviceAlarm(powerEntity.id, powerEntity.token, powerEntity.id, pageIndex, orderBy, fromTime, toTime, alarmCodes, confirmed, pagesize);
    },
    lineChartSources(device, args, context) {
      return context.PowerEntity.getDeviceLineChartSources(device.id, device.token);
    },
    lineChart(device, { sources, fromTime, toTime, scale }, context) {
      return context.PowerEntity.getDeviceLineChart(device.id, device.token, sources, fromTime, toTime, scale);
    },
  },
  SwitchType: {
    id: property('id'),
    name: property('name'),
    realtimeData(aswitch, args, context) {
      return context.PowerEntity.getRealtimeData(aswitch.id, aswitch.token);
    },
    alarmInfos(powerEntity, args, context) {
      const { token, areaType, districtID, siteID, gatewayID, cabinetID, deviceID, ...alarmArgs } = args;
      const { pagesize, pageIndex, orderBy, fromTime, toTime, alarmCodes, confirmed } = alarmArgs;
      return context.PowerEntity.getDeviceAlarm(powerEntity.id, powerEntity.token, powerEntity.id, pageIndex, orderBy, fromTime, toTime, alarmCodes, confirmed, pagesize);
    },
    isOn: property('value'),
    lineChartSources(device, args, context) {
      return context.PowerEntity.getDeviceLineChartSources(device.id, device.token);
    },
    lineChart(device, { sources, fromTime, toTime, scale }, context) {
      return context.PowerEntity.getDeviceLineChart(device.id, device.token, sources, fromTime, toTime, scale);
    },
  }
};
