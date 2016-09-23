export const typeDefinitions = [`schema {
  query: RootQuery
  mutation: RootMutation
}

type RootMutation {
  getToken(username: String!, password: String!): TokenType
}

type TokenType {
  token: String
  error: String
}

type RootQuery {
  FortuneCookie: String
  Config: ConfigType
  User(token: String!): UserType
  Company(token: String!): CompanyType
  Alarm(token: String!, areaType: AreaType!, districtID: Int, siteID: Int, gatewayID: Int, cabinetID: Int, deviceID: Int): [AlarmInfoType]
  LineChart(token: String!, areaType: AreaType!, sources: [String], districtID: Int, siteID: Int, gatewayID: Int, cabinetID: Int, deviceID: Int, fromTime: String, toTime: String, scale: String): [LineChartListType]!
  LineChartSources(token: String!, areaType: AreaType!, districtID: Int, siteID: Int, gatewayID: Int, cabinetID: Int, deviceID: Int): [String]!
}

# /api/admin/config
# 供后台管理用的数据端点，此处只取 alarmtypes 用
type ConfigType {
  alarmTypes: [AlarmCodeType!]
  indicatorTypes(token: String!): [IndicatorType!]
}

# /api/admin/config
# 用于设备出问题告警的类型代码与它的实际意义之间的转换
type AlarmCodeType {
  code: String! # 告警类型代码，目前实际上是数字
  label: String! # 给人看的告警信息
}

# /api/account/whoami
type UserType {
  logined: Boolean
  token: String

  id: Int!
  name: String

  companyId: Int
  companyName: String
  departmentId: Int
  departmentName: String
  role: String
}


# /api/info/entry  /api/data/site/{id}/overview
# 厂区信息，说明还有它有哪些变电站或子厂区，厂区有自己的饼图数据
# 同时也能表示变电站的数据，可以包括饼图和进线列表等数据
interface PowerEntityType {
  id: Int!
  name: String!

  # ↓ 比较无关紧要的信息 
  address: String
  areaType: AreaType!

  pie: PieGraphType!
}

type CompanyType implements PowerEntityType {
  id: Int!
  name: String!

  # ↓ 比较无关紧要的信息 
  address: String
  areaType: AreaType!
  coordinate: String
  companyId: Int

  alarmInfos(pagesize: Int, pageIndex: Int, orderBy: OrderByType, fromTime: String, toTime: String, alarmCode: String): [AlarmInfoType]
  unreadAlarmAmount: Int
  pie: PieGraphType!
  children(id: Int): [DistrictType]
  lineChartSources(id: Int): [String]
  lineChart(sources: [String], scale: String): [LineChartListType]
}

type DistrictType implements PowerEntityType {
  id: Int!
  name: String!

  # ↓ 比较无关紧要的信息 
  address: String
  areaType: AreaType!
  coordinate: String
  companyId: Int
  districtId: Int
  gatewayID: Int

  pie: PieGraphType!
  children(id: Int): [SiteType]
  lineChartSources(id: Int): [String]
  lineChart(sources: [String], scale: String): [LineChartListType]
}

type SiteType implements PowerEntityType {
  id: Int!
  name: String!

  # ↓ 比较无关紧要的信息 
  address: String
  areaType: AreaType!
  companyId: Int
  districtId: Int
  siteId: Int

  pie: PieGraphType!
  alarmInfos(pagesize: Int, pageIndex: Int, orderBy: OrderByType, fromTime: String, toTime: String, alarmCode: String): [AlarmInfoType]
  unreadAlarmAmount: Int
  infos: [InfoType] # 显示一些「本日最大负荷」、「本月最大负荷」、「告警数量」等信息
  wires: [WireType]
  cabinets(id: Int): [CabinetType]
  lineChartSources(id: Int): [String]
  lineChart(sources: [String], fromTime: String, toTime: String, scale: String): [LineChartListType] 
}


enum AreaType {
  Company
  District
  Site
  Cabinet
  Device
}

enum OrderByType {
  time
  name
  type
  count
}

type IndicatorType {
  id: Int!,
  key: String
  name: String!
  unit: String
}

type LineChartListType {
  source: String!
  lineChart: [LineChartType]!
}

type LineChartType {
  time: String!
  value: String
}

# /api/alarm/site/{id}?pz=20&pi=1&o=time /api/alarm/device/{id}?pagesize=20&pageindex=1
# 一条告警信息
type AlarmInfoType {
  id: Int! # 告警ID
  code: String! # 警告编号 实际上是一个数字
  timestamp: String! # 警告时间，类似「2016-07-01 00:00:00」
  readed: Boolean! # 已读
  message: String

  userId: Int
  districtId: Int # 厂区ID
  districtName: String # 厂区名称
  siteId: Int # 变电站ID
  siteName: String # 变电站名称
  gatewayId: Int # 网关ID
  gatewayName: String # 网关名称
  cabinetId: Int # 设备所处机柜的全局唯一ID
  cabinetName: String # 设备所处机柜的名称
  deviceId: Int # 设备的全局唯一ID
  deviceName: String # 设备的名称
}

# /api/data/index/pie
type PieGraphType {
  total: Int! # 当前负荷，受权限控制影响，此处可能是0
  current: Int! # 总额定负荷，受权限控制影响，此处可能是0
  rate: String
  unit: String! # 客户想使用的单位
}

# /api/data/site/{id}/overview
# 通用的显示格式，用于进线和变电站
type InfoType {
  name: String
  code: Int # 用于表示这个数据是啥
  value: Float # 一般用于计算
}

# /api/data/site/{id}/overview
# 每个变电站都会有进线，需要显示它们的负载
type WireType {
  name: String! # 就是数据源中的 wire，显示「进线1」这样的线名
  current: Int # 当前负荷
  total: Int! # 能承载的总负荷
  unit: String!
  deviceId: Int!
  indicators: [InfoType]! # 「有功电度」、「无功电度」什么的
}

# /api/info/site/{id}/cabinets
type CabinetType {
  id: Int!
  name: String! # 柜子名
  type: String! # 「d01」这样的柜子类型
  address: String! # 「1-2-1-3」 这样的柜号
  children: [CabinetType]
  devices: [DeviceType]
  switches(id: Int): [SwitchType] # 似乎开关也是设备的一种，我得去问清楚
  sortId: String # 有时间问问加这个是想干嘛
  wire: String # 意义不明

  districtId: Int
  siteId: Int
  gatewayId: Int
  cabinetId: Int
  companyId: Int
}

# /api/info/site/{id}/cabinets  /api/data/device/{id}/realtime
interface DeviceType {
  id: Int!
  name: String! # 给设备取的名字
  realtimeData: [InfoType!] # 设备的实时数据
  unreadAlarmAmount: Int
  alarmInfos(pagesize: Int, pageIndex: Int, orderBy: OrderByType, fromTime: String, toTime: String, alarmCode: String): [AlarmInfoType]
  lineChartSources(id: Int): [String]
  lineChart(sources: [String], fromTime: String, toTime: String, scale: String): [LineChartListType]
}

# /api/data/site/{id}/cabinets/switches
# 变电站下的每个柜子都有一个到多个开关
type SwitchType implements DeviceType {
  id: Int!
  name: String! # 给设备取的名字
  realtimeData: [InfoType!] # 设备的实时数据
  unreadAlarmAmount: Int
  alarmInfos(pagesize: Int, pageIndex: Int, orderBy: OrderByType, fromTime: String, toTime: String, alarmCode: String): [AlarmInfoType]
  isOn: Boolean! # 开还是关，后端叫它 value
  lineChartSources(id: Int): [String]
  lineChart(sources: [String], fromTime: String, toTime: String, scale: String): [LineChartListType]
}

`];

import { property, isEmpty, find, matchesProperty } from 'lodash';

export const resolvers = {
  RootMutation: {
    getToken(root, { username, password }, context) {
      return context.User.login(username, password);
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
        alarmInfos: await context.PowerEntity.getCompanyAlarm(token),
        unreadAlarm: await context.PowerEntity.getCompanyAlarmUnread(token),
        pie: await context.PowerEntity.getCompanyPie(token),
        children: await context.PowerEntity.getAllDistrictData(token),
        token
      };
      return powerEntity;
    },
    Alarm(root, { token, areaType, districtID, siteID, gatewayID, cabinetID, deviceID, ...alarmArgs }, context) {
      const { pagesize, pageIndex, orderBy, fromTime, toTime, alarmCode } = alarmArgs;

      switch (areaType) {
        case 'Company':
          return context.PowerEntity.getCompanyAlarm(token, pageIndex, orderBy, fromTime, toTime, alarmCode, pagesize);
        case 'Site':
          return context.PowerEntity.getSiteAlarm(siteID, token, pageIndex, orderBy, fromTime, toTime, alarmCode, pagesize);
        case 'Device':
          return context.PowerEntity.getDeviceAlarm(deviceID, token, pageIndex, orderBy, fromTime, toTime, alarmCode, pagesize);
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
    alarmInfos(powerEntity, args, context) {
      if (isEmpty(args)) {
        return powerEntity.alarmInfos;
      }
      const { pagesize, pageIndex, orderBy, fromTime, toTime, alarmCode } = args;
      return context.PowerEntity.getCompanyAlarm(powerEntity.token, pageIndex, orderBy, fromTime, toTime, alarmCode, pagesize);
    },
    unreadAlarmAmount(powerEntity, args, context) {
      return powerEntity.unreadAlarm;
    },
    async pie(powerEntity, args, context) {
      const pie = await powerEntity.pie;
      return pie ? pie : {
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
      return pie ? pie : {
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
    alarmInfos(powerEntity, args, context) {
      return context.PowerEntity.getSiteAlarm(powerEntity.id, powerEntity.token);
    },
    unreadAlarmAmount(powerEntity, args, context) {
      return context.PowerEntity.getSiteAlarmUnreadAmount(powerEntity.id, powerEntity.token);
    },
    async pie(powerEntity, args, context) {
      const pie = await context.PowerEntity.getSitePie(powerEntity.id, powerEntity.token);
      return pie ? pie : {
        current: 0,
        rate: '0%',
        total: 1,
        unit: 'kw',
      };
    },
    infos(powerEntity, args, context) {
      return context.PowerEntity.getSiteInfos(powerEntity.id, powerEntity.token);
    },
    wires(powerEntity, args, context) {
      return context.PowerEntity.getWires(powerEntity.id, powerEntity.token);
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
    lineChart: property('lineChart'),
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
    message: property('message'),
    userId: property('userId'),
    districtId: property('districtId'),
    districtName: property('districtName'),
    siteId: property('siteId'),
    siteName: property('siteName'),
    gatewayId: property('gatewayId'),
    gatewayName: property('gatewayName'),
    cabinetId: property('cabinetId'),
    cabinetName: property('cabinetName'),
    deviceId: property('deviceId'),
    deviceName: property('deviceName'),
  },
  WireType: {
    name: property('wire'),
    current: property('current'),
    total: property('total'),
    unit: property('unit'),
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
    alarmInfos(aswitch, { pagesize, pageIndex, orderBy, fromTime, toTime, alarmCode }, context) {
      return context.PowerEntity.getDeviceAlarm(aswitch.id, aswitch.token, pageIndex, orderBy, fromTime, toTime, alarmCode, pagesize);
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
    alarmInfos(aswitch, { pagesize, pageIndex, orderBy, fromTime, toTime, alarmCode }, context) {
      return context.PowerEntity.getDeviceAlarm(aswitch.id, aswitch.token, pageIndex, orderBy, fromTime, toTime, alarmCode, pagesize);
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
