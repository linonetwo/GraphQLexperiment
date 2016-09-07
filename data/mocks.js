import pokemon from 'pokemon-random-name';
import chinese from "chinese-random-name";
import { v4 as uuid } from "node-uuid";
import moment from 'moment';
import _ from 'lodash';
import { MockList } from 'graphql-tools';

const randomName = (maxLength = 2, factor = 0.8) => {
  let name = '';
  for (let index = 0; index < maxLength; index++) {
    name += chinese.names.get3();
    if (Math.random() > factor / 2) {
      name += pokemon();
    }
    if (Math.random() > factor) {
      break;
    }
  }
  return name;
};




const mocks = {
  String: randomName,
};

export default mocks;
