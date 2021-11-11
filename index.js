require('dotenv').config()
const { default: axios } = require('axios');
const bunyan = require('bunyan');
const PrettyStream = require('bunyan-pretty-colors');

const prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);

const streams = [{
    level: 'debug',
    type: 'raw',
    stream: prettyStdOut,
  }];

const logger = bunyan.createLogger({
    name: '42api-client',
    streams,
    tags: ['42api-client', 'api wrapper'],
  });

class IntraClient {
    constructor(){
        this.client_id = process.env.CLIENT_ID || null;
        this.client_secret = process.env.CLIENT_SECRET || null;
        this.endpoint_api = process.env.ENDPOINT_API || "https://api.intra.42.fr/v2";
        this.scopes = process.env.SCOPES_API || null;
        this.token = null;

        Object.keys(this).forEach(props => {
            if(this[props] == null && props != 'token'){
                logger.error(`${props} attribute is not defined correctly`);
                return 0;
            }      
        });
    }


    async request_token(){
        //Access Token generation
        try{
            let res = await this.request('auth', 'https://api.intra.42.fr/oauth/token', {headers:{
            'content-type':'application/json',
        }}, {'grant_type':'client_credentials', 'client_id': this.client_id, 'client_secret' :this.client_secret, 'scope': this.scopes})
            if(res.status == 200)
            {
                this.token = res?.data?.access_token;
                return this.token;
            }
            else
                return false;
        }
        catch(err){
            logger.error('token generation failed');
            console.log(err);
        }
        
    }

    buildUrl(url, payload){
        //Build the complete URL
        if(!url)
        {
            logger.error(`url is empty`);
            return false;
        }
        let URI = `${process.env.ENDPOINT_API}/${url}`;
        Object.keys(payload).map((arg, key)=>{
            if(key == 0)
                URI += `?${arg}=${payload[arg]}`;
            else
                URI += `&${arg}=${payload[arg]}`
        })
        return URI;
    }

    async request(method, url, headers, payload){
        //Check that token is an actual property of Object
        if(this.token == null && method != 'auth'){
            this.token = await this.request_token();
        }
        //Push token to headers
        headers['Authorization'] = `Bearer ${this.token}`;

        return await axios({
            method: (method == 'auth') ? 'post': method,
            url,
            headers,
            data: payload
        })
    }

    async get(url, headers, payload){
        try{
            let URI = this.buildUrl(url, payload);
            let response = await this.request('get', URI, headers, payload);
            if(response?.status == 200){
                return response.data;
            }
            else
                return false;
        }
        catch(err)
        {
            logger.error(err);
            console.log(err);
        }
    }

    async post(url, headers, payload){
        return await this.request('post', url, headers, payload);

    }

    async patch(url, headers, payload){
        return await this.request('patch', url, headers, payload);

    }

    async put(url, headers, payload){
        return await this.request('put', url, headers, payload);

    }

    async delete(url, headers, payload){
        return await this.request('delete', url, headers, payload);
    }
}

const main = async () => {
    let ic = new IntraClient();
    
    //let res = await ic.request_token();
    let payload = {
        'filter[primary_campus]':46,
        'filter[cursus]': 9,
    };
    let res = await ic.get('teams', {}, payload);
    console.log(res);

}

main();