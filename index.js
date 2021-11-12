require('dotenv').config();
const { default: axios } = require('axios');

// eslint-disable-next-line no-promise-executor-return
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
class IntraClient {
  constructor() {
    this.client_id = process.env.CLIENT_ID || null;
    this.client_secret = process.env.CLIENT_SECRET || null;
    this.endpoint_api = process.env.ENDPOINT_API || 'https://api.intra.42.fr/v2';
    this.scopes = process.env.SCOPES_API || null;
    this.token = null;

    // eslint-disable-next-line consistent-return
    Object.keys(this).forEach((props) => {
      if (this[props] == null && props !== 'token') {
        return new Error(`${props} attribute is not defined correctly. Check your .env file`);
      }
    });
  }

  async request_token() {
    // Access Token generation
    try {
      const res = await this.request('auth', 'https://api.intra.42.fr/oauth/token', {
        headers: {
          'content-type': 'application/json',
        },
      }, {
        grant_type: 'client_credentials', client_id: this.client_id, client_secret: this.client_secret, scope: this.scopes,
      });
      if (res.status === 200) {
        this.token = res?.data?.access_token;
        return this.token;
      }
      return false;
    } catch (err) {
      return err;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  buildUrl(url, payload, pagination) {
    // Build the complete URL
    if (!url) {
      return new Error('[buildUrl] url is empty');
    }
    if (pagination) {
      // eslint-disable-next-line array-callback-return
      Object.keys(payload).map((arg) => {
        // eslint-disable-next-line no-param-reassign
        url += `&${arg}=${payload[arg]}`;
      });
      return url;
    }
    let URI = `${process.env.ENDPOINT_API}/${url}`;
    // eslint-disable-next-line array-callback-return
    Object.keys(payload).map((arg, key) => {
      if (key === 0) { URI += `?${arg}=${payload[arg]}`; } else { URI += `&${arg}=${payload[arg]}`; }
    });
    return URI;
  }

  // eslint-disable-next-line class-methods-use-this
  buildSimpleUrl(url) {
    return `${process.env.ENDPOINT_API}/${url}`;
  }

  // eslint-disable-next-line class-methods-use-this
  calculNbPages(response) {
    const headers = response?.headers;
    if (headers) {
      // eslint-disable-next-line no-prototype-builtins
      if (!headers.hasOwnProperty('x-total')) {
        return 0;
      }
      // eslint-disable-next-line no-prototype-builtins
      if (headers.hasOwnProperty('x-per-page')) {
        // eslint-disable-next-line radix
        return Math.ceil(parseInt(headers['x-total']) / parseInt(headers['x-per-page']));
      }
    } else { return new Error('[CalculNbPages] headers are not set properly'); }
  }

  async treatPages(firstCall, pageNumbers, url, headers, payload) {
    try {
      const requests = [];
      // eslint-disable-next-line no-plusplus
      for (let page = 1; page <= pageNumbers; page++) {
        const tmpUrl = this.buildUrl(url, {
          'page[number]': page,
        }, true);
        requests.push(this.request('get', tmpUrl, headers, payload, true));
        // eslint-disable-next-line no-await-in-loop
        await sleep(process.env.SLEEP_TIME);
      }
      return Promise.all(requests).then((result) => {
        const freshData = [];
        // eslint-disable-next-line array-callback-return
        result.map((req) => {
          freshData.push(req?.data);
        });
        return freshData;
      });
    } catch (err) {
      return err;
    }
  }

  async request(method, url, headers, payload, processing) {
    let pageNumbers = 1;
    // Check that token is an actual property of Object
    if (this.token == null && method !== 'auth') {
      this.token = await this.request_token();
    }
    // Push token to headers
    // eslint-disable-next-line no-param-reassign
    headers.Authorization = `Bearer ${this.token}`;

    if (method === 'get') {
      const firstCall = await axios({
        method,
        url,
        headers,
        data: payload,
      });
      // eslint-disable-next-line no-prototype-builtins
      if (!payload.hasOwnProperty('page[number]')) pageNumbers = this.calculNbPages(firstCall);
      if (pageNumbers < 2 || processing) return firstCall;

      const res = await this.treatPages(firstCall, pageNumbers, url, headers, payload);
      return {
        status: 200,
        data: res,
      };
    }
    return axios({
      method: (method === 'auth') ? 'post' : method,
      url,
      headers,
      data: payload,
    });
  }

  async get(url, headers, payload) {
    try {
      const URI = this.buildUrl(url, payload);
      const response = await this.request('get', URI, headers, payload);
      if (response?.status === 200) {
        return {
          status: 'success',
          data: response?.data,
        };
      }
      return {
        status: 'error',
        reason: 'unable to get',
      };
    } catch (err) {
      return err;
    }
  }

  async post(url, headers, payload) {
    try {
      const URI = this.buildSimpleUrl(url, payload);
      const response = await this.request('post', URI, headers, payload);
      if (response?.status === 201) {
        return {
          status: 'success',
          data: response?.data,
        };
      }
      return {
        status: 'error',
        reason: 'unable to delete',
      };
    } catch (err) {
      return err;
    }
  }

  async patch(url, headers, payload) {
    try {
      const URI = this.buildSimpleUrl(url, payload);
      const response = await this.request('patch', URI, headers, payload);
      if (response?.status === 204) {
        return {
          status: 'success',
          data: response?.data,
        };
      }
      return {
        status: 'error',
        reason: 'unable to patch',
      };
    } catch (err) {
      return err;
    }
  }

  async put(url, headers, payload) {
    try {
      const URI = this.buildSimpleUrl(url, payload);
      const response = await this.request('put', URI, headers, payload);
      if (response?.status === 204) {
        return {
          status: 'success',
          data: response?.data,
        };
      }

      return {
        status: 'error',
        reason: 'unable to put',
      };
    } catch (err) {
      return err;
    }
  }

  async delete(url, headers, payload) {
    try {
      const URI = this.buildSimpleUrl(url, payload);
      const response = await this.request('delete', URI, headers, payload);
      if (response?.status === 204) {
        return {
          status: 'success',
          data: response?.data,
        };
      }
      return {
        status: 'error',
        reason: 'unable to delete',
      };
    } catch (err) {
      return err;
    }
  }
}

module.exports = IntraClient;
