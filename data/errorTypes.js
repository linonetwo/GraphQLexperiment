const UNDEFINED_DUT_TO_UNSET = 'undefined-due-to-unset';
const NETWORK_UNEXPECTED = 'network-unexpected';


export const USERNAME_USE_BEFORE_SET = `${UNDEFINED_DUT_TO_UNSET} user name hasn\'t been set yet, should use login() before getUserName()`;

export const PASSWORD_USE_BEFORE_SET = `${UNDEFINED_DUT_TO_UNSET} user password hasn\'t been set yet, should use login() before getPassWord()`;

export const API_FAILURE = `${NETWORK_UNEXPECTED} api endpoint returning unexpected response, should check whether api server was down or check the usage of api`;
