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

  async login(username, password) {
    try {
      const { token, error } = await this.connector.login(username, password);
      return { token };
    } catch (error) {
      return { error };
    }
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
