export const typeDefinitions = `schema {
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
}

# /api/admin/config
# 供后台管理用的数据端点，此处只取 alarmtypes 用
type ConfigType {
  alarmTypes: [AlarmCodeType!]
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
  username: String
  password: String
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

  pie: PieGraphType
}

type CompanyType implements PowerEntityType {
  id: Int!
  name: String!

  # ↓ 比较无关紧要的信息 
  address: String
  areaType: AreaType!
  coordinate: String
  companyId: Int

  alarmInfos(pagesize: Int, pageIndex: Int, orderBy: OrderByType, fromTime: String, toTime: String, filterAlarmCode: String): [AlarmInfoType]
  unreadAlarm: Int
  pie: PieGraphType
  children: [DistrictType]
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

  pie: PieGraphType
  children(areaType: AreaType, id: Int): [SiteType]
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

  pie: PieGraphType
  alarmInfos(pagesize: Int, pageIndex: Int, orderBy: OrderByType, fromTime: String, toTime: String, filterAlarmCode: String): [AlarmInfoType]
  unreadAlarm: Int
  infos(siteID: Int!): [InfoType] # 显示一些「本日最大负荷」、「本月最大负荷」、「告警数量」等信息
  wires(siteID: Int!): [WireType]
  cabinets(siteID: Int!): [CabinetType]
}


enum AreaType {
  Company
  District
  Site
  Cabinet
}

enum OrderByType {
  time
  name
  type
  count
}


# /api/alarm/site/{id}?pz=20&pi=1&o=time /api/alarm/device/{id}?pagesize=20&pageindex=1
# 一条告警信息
type AlarmInfoType {
  id: Int! # 告警ID
  code: String! # 警告编号 实际上是一个数字
  timestamp: String! # 警告时间，类似「2016-07-01 00:00:00」
  readed: Boolean! # 已读

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
  rate: String!
  unit: String! # 客户想使用的单位
}

# /api/data/site/{id}/overview
# 通用的显示格式，用于进线和变电站
type InfoType {
  name: String! # 用于显示这个数据是啥
  display: String! # 用于显示这个值有多大
  value: Float! # 一般用于计算
}

# /api/data/site/{id}/overview
# 每个变电站都会有进线，需要显示它们的负载
type WireType {
  name: String! # 就是数据源中的 wire，显示「进线1」这样的线名
  current: Int! # 当前负荷
  total: Int! # 能承载的总负荷
  unit: String!
  indicators: InfoType! # 「有功电度」、「无功电度」什么的
}

# /api/info/site/{id}/cabinets
type CabinetType {
  id: Int!
  name: String! # 柜子名
  type: String! # 「d01」这样的柜子类型
  address: String! # 「1-2-1-3」 这样的柜号
  devices: [DeviceType]
  switches: [SwitchType] # 似乎开关也是设备的一种，我得去问清楚
  sortId: String # 有时间问问加这个是想干嘛
  wire: String # 意义不明
}

# /api/info/site/{id}/cabinets  /api/data/device/{id}/realtime
interface DeviceType {
  id: Int!
  name: String! # 给设备取的名字
  realtimeData: [InfoType!] # 设备的实时数据
  alarmInfos(pagesize: Int!, pageIndex: Int!, orderBy: OrderByType, fromTime: String, toTime: String, filterAlarmCode: String): [AlarmInfoType!]  
}

# /api/data/site/{id}/cabinets/switches
# 变电站下的每个柜子都有一个到多个开关
type SwitchType implements DeviceType {
  id: Int!
  name: String! # 给设备取的名字
  realtimeData: [InfoType!] # 设备的实时数据
  alarmInfos(pagesize: Int!, pageIndex: Int!, orderBy: OrderByType, fromTime: String, toTime: String, filterAlarmCode: String): [AlarmInfoType!]  
  isOn: Boolean # 开还是关，后端叫它 value
}

`;

import { property } from 'lodash';

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
      };
      return {
        powerEntity,
        token,
      };
    },
  },
  ConfigType: {
    alarmTypes(_, args, context) {
      return context.Config.getAlarmTypes();
    },
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
    username({ token }, args, context) {
      return context.User.getUserName(token);
    },
    password({ token }, args, context) {
      return context.User.getPassWord(token);
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
    id({ token, powerEntity }, args, context) {
      return powerEntity.id;
    },
    areaType({ token, powerEntity }, args, context) {
      return powerEntity.areaType;
    },
    pie({ token, powerEntity }, args, context) {
      return powerEntity.pie;
    },
  },
  CompanyType: {
    id({ token, powerEntity }, args, context) {
      return powerEntity.id;
    },
    name({ token, powerEntity }, args, context) {
      return powerEntity.name;
    },
    coordinate({ token, powerEntity }, args, context) {
      return powerEntity.coordinate;
    },
    companyId({ token, powerEntity }, args, context) {
      return powerEntity.companyId;
    },
    areaType({ token, powerEntity }, args, context) {
      return powerEntity.areaType;
    },
    alarmInfos({ token, powerEntity }, args, context) {
      return powerEntity.alarmInfos;
    },
    unreadAlarm({ token, powerEntity }, args, context) {
      return powerEntity.unreadAlarm;
    },
    pie({ token, powerEntity }, args, context) {
      return powerEntity.pie;
    },
    children({ token, powerEntity }, args, context) {
      const childrenWithToken = powerEntity.children.map(district => Object.assign({}, district, { token }));
      return childrenWithToken;
    },
  },
  DistrictType: {
    id(powerEntity, args, context) {
      return powerEntity.id;
    },
    name({ token, powerEntity }, args, context) {
      return powerEntity.name;
    },
    coordinate({ token, powerEntity }, args, context) {
      return powerEntity.coordinate;
    },
    companyId({ token, powerEntity }, args, context) {
      return powerEntity.companyId;
    },
    address(powerEntity, args, context) {
      return powerEntity.address;
    },
    areaType(powerEntity, args, context) {
      return powerEntity.areaType;
    },
    pie(powerEntity, args, context) {
      return context.PowerEntity.getDistrictPie(powerEntity.id, powerEntity.token);
    },
    children(powerEntity, { areaType, id }, context) {
      // console.log('DistrictType', powerEntity);
      const childrenWithToken = powerEntity.children.map(district => Object.assign({}, district, { token: powerEntity.token }));
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
    unreadAlarm({ token, powerEntity }, args, context) {
      return context.PowerEntity.getSiteAlarmUnread(powerEntity.id, powerEntity.token);
    },
    pie(powerEntity, args, context) {
      return context.PowerEntity.getSitePie(powerEntity.id, powerEntity.token);
    },
    infos(powerEntity, { siteID }, context) {
      return siteID ? context.PowerEntity.getSiteInfos(siteID, token) : powerEntity.infos;
    },
    wires(powerEntity, { siteID }, context) {
      return siteID ? context.PowerEntity.getWires(siteID, token) : powerEntity.wires;
    },
    cabinets(powerEntity, { siteID }, context) {
      return siteID ? context.PowerEntity.getCabinets(siteID, token) : powerEntity.cabinets;
    },
  },
  AlarmInfoType: {
    id: property('id'),
    code: property('code'),
    timestamp: property('timestamp'),
    readed: property('readed'),
  },
  PieGraphType: {
    total: property('total'),
    current: property('current'),
    rate: property('rate'),
    unit: property('unit'),
  },
  WireType: {
    name: property('name'),
    current: property('current'),
    total: property('total'),
    unit: property('unit'),
    indicators: property('indicators'),
  },
  CabinetType: {
    id: property('id'),
    name: property('name'),
    type: property('type'),
    address: property('address'),
    devices: property('devices'),
    switches: property('switches'),
    sortId: property('sortId'),
    wire: property('wire'),
  },
  DeviceType: {
    id: property('id'),
    name: property('name'),
    realtimeData: property('realtimeData'),
    alarmInfos: property('alarmInfos'),
  },
  SwitchType: {
    id: property('id'),
    name: property('name'),
    realtimeData: property('realtimeData'),
    alarmInfos: property('alarmInfos'),
    isOn: property('value'),
  }
};
