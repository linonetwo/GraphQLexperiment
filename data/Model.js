import Promise from 'bluebird';

export class Config {
  constructor({ connector }) {
    this.connector = connector;
  }

  getAlarmTypes() {
    return Promise.try(() =>
      this.connector.get('api/admin/config')
    ).then(({ alarmTypes }) =>
      alarmTypes
      );
  }
}

export class User {
  constructor({ connector }) {
    this.connector = connector;
  }

  login(username, password) {
    return this.connector.login(username, password);
  }

  isLogined() {
    return this.connector.getLoginStatus();
  }

  getUserName() {
    return this.connector.getUserName();
  }

  getPassWord() {
    return this.connector.getPassWord();
  }
}
