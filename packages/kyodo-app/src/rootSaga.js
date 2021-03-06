import axios from 'axios';
import moment from 'moment';
import {
  all,
  fork,
  call,
  put,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';
import { drizzleSagas } from 'drizzle';
import {
  LOAD_RATE_REQUEST,
  LOAD_RATE_SUCCESS,
  LOAD_PERIOD_TASKS_REQUEST,
  LOAD_PERIOD_TASKS_SUCCESS,
  LOAD_HISTORICAL_RATES_REQUEST,
  LOAD_HISTORICAL_RATES_SUCCESS,
  LOAD_MULTISIG_BALANCE_REQUEST,
  LOAD_MULTISIG_BALANCE_SUCCESS,
} from './constants';
import { BASE_CURRENCY } from './constants';
import * as fromActions from './actions';

function* loadRate({ currency }) {
  try {
    let rateURI = 'https://min-api.cryptocompare.com/data/';
    if (!Array.isArray(currency)) {
      rateURI = `${rateURI}price?fsym=${currency}`;
    } else {
      rateURI = `${rateURI}pricemulti?fsyms=${currency}`;
    }
    rateURI = `${rateURI}&tsyms=${BASE_CURRENCY}`;
    const { data } = yield call(axios.get, rateURI);
    let rates = {};
    if (!Array.isArray(currency)) {
      rates[currency] = data[BASE_CURRENCY];
    } else {
      currency.map(c => (rates[c] = data[c][BASE_CURRENCY]));
    }

    yield put({
      rates,
      type: LOAD_RATE_SUCCESS,
      currency,
    });
  } catch (e) {}
}

function* watchLoadRate() {
  yield takeEvery(LOAD_RATE_REQUEST, loadRate);
}

function* loadBalance() {
  try {
    const address = process.env.REACT_APP_MULTISIG_ADDRESS;
    const apiURI = `http://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`;

    const eventLoad = yield call(axios.get, apiURI);
    const {
      data: { tokens },
    } = eventLoad;

    const tokenSymbols = tokens.map(token => token.tokenInfo.symbol);

    yield put(fromActions.loadRate(tokenSymbols));
    yield put(fromActions.loadHistoricalRates(tokenSymbols));
    yield put({
      type: LOAD_MULTISIG_BALANCE_SUCCESS,
      data: eventLoad.data,
    });
  } catch (e) {}
}

function* watchLoadBalance() {
  yield takeLatest(LOAD_MULTISIG_BALANCE_REQUEST, loadBalance);
}

function* loadHistoricalRate(currency) {
  const apiURI = `https://min-api.cryptocompare.com/data/histoday?fsym=${currency}&tsym=${BASE_CURRENCY}&limit=30`;

  const eventLoad = yield call(axios.get, apiURI);
  const {
    data: { Data },
  } = eventLoad;

  const data = {};
  Data.forEach(value => {
    data[moment.unix(value.time).format('YYYY-MM-DD')] = {
      [currency]: value.close,
      [BASE_CURRENCY]: 1,
    };
  });

  yield put({
    type: LOAD_HISTORICAL_RATES_SUCCESS,
    data,
  });
}

function* loadHistoricalRates({ currencies }) {
  try {
    // loop through currencies and create a load request
    yield currencies.map(currency => call(loadHistoricalRate, currency));
  } catch (e) {}
}

function* watchLoadHistoricalRates() {
  yield takeLatest(LOAD_HISTORICAL_RATES_REQUEST, loadHistoricalRates);
}

function* loadPeriodTasks() {
  try {
    const apiURI = 'http://localhost:3666/tips';

    const { data } = yield call(axios.get, apiURI);
    const tasks = data.map(t => ({
      title: t.task.taskTitle,
      domain: t.domain.domainTitle,
      from: t.from.alias,
      to: t.to.alias,
      id: t._id,
      amount: t.amount,
    }));

    yield put({
      type: LOAD_PERIOD_TASKS_SUCCESS,
      tasks,
    });
  } catch (e) {
    console.log(e);
  }
}

function* watchLoadTasks() {
  yield takeLatest(LOAD_PERIOD_TASKS_REQUEST, loadPeriodTasks);
}

export default function* root() {
  yield all([
    ...drizzleSagas.map(saga => fork(saga)),
    watchLoadBalance(),
    watchLoadRate(),
    watchLoadHistoricalRates(),
    watchLoadTasks(),
  ]);
}
