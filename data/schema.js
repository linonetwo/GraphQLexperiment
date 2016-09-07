export const typeDefinitions = `schema {
  query: RootQuery
  mutation: RootMutation
}

type RootMutation {
  getToken(username: String!, password: String!): TokenType
}

type TokenType {
  token: String!
  error: String
}

type RootQuery {
  Config: ConfigType
  #User: UserType
  #Company: PowerEntityType
}

# /api/admin/config
# 供后台管理用的数据端点，此处只取 alarmtypes 用
type ConfigType {
  alarmTypes: [AlarmCodeType!]
}

# /api/admin/config
# 用于设备出问题告警的类型代码与它的实际意义之间的转换
type AlarmCodeType {
  code: Int! # 告警类型代码
  label: String! # 给人看的告警信息
}

`;

export const resolvers = {
  RootMutation: {
    getToken(root, { username, password }, context) {
      return { token: context.User.login(username, password) };
    },
  },
  RootQuery: {
    Config(root, args, context) {
      return context.Config.getAlarmTypes();
    },
    // User: {
    //   logined(root, args, context) {
    //     return context.User.isLogined();
    //   },
    //   username(root, args, context) {
    //     return context.User.getUserName();
    //   },
    //   password(root, args, context) {
    //     return context.User.getPassWord();
    //   },
    //   id(root, args, context) {
    //     return context.User.getID();
    //   },
    //   name(root, args, context) {
    //     return context.User.getName();
    //   },
    // },
  },
  ConfigType: {
    alarmTypes(_, __, context) {
      return context.Config.getAlarmTypes();
    },
  },
  AlarmCodeType: {
    code(a, b, c) {
      console.log(a, b, c);
    },
    label(a, b, c) {
      console.log(a, b, c);
    },
  },
};
