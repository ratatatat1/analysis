const axios = require('axios')
const md5 = require('md5')

const baseUrl = 'http://ab.intra.xiaojukeji.com/cc/api/v2';

module.exports = async function(config) {
    const { ns, token, client, confName } = config;
    const timestamp = (Date.now() / 1000).toFixed();
    return axios
      .get(`${baseUrl}/n/namespaces/${ns}/configs/${confName}`, {
        params: {
          client,
          timestamp: timestamp,
          sign: md5(timestamp + token),
        },
      }).then(function(response) {
          return response.data.data[0].value.reduce((pre, cur) => ({...pre, [cur.key]: cur.value}), {})
      })
}