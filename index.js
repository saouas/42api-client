require('dotenv').config()
const { default: axios } = require('axios');
  
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
class IntraClient {
    constructor(){
        this.client_id = process.env.CLIENT_ID || null;
        this.client_secret = process.env.CLIENT_SECRET || null;
        this.endpoint_api = process.env.ENDPOINT_API || "https://api.intra.42.fr/v2";
        this.scopes = process.env.SCOPES_API || null;
        this.token = null;

        Object.keys(this).forEach(props => {
            if(this[props] == null && props != 'token'){
               return new Error(`${props} attribute is not defined correctly. Check your .env file`);
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
            return err;
        }
        
    }

    buildUrl(url, payload, pagination){
        //Build the complete URL
        if(!url)
        {
            logger.error(`[buildUrl] url is empty`);
            return false;
        }
        if(pagination){
            Object.keys(payload).map((arg, key)=>{
                url += `&${arg}=${payload[arg]}`;
            });
            return url;
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

    buildSimpleUrl(url){
        return `${process.env.ENDPOINT_API}/${url}`;
    }

    calculNbPages(response){
        let headers = response?.headers;
        if(headers){
            if(!headers.hasOwnProperty('x-total')){
                return 0;

            }
            if(headers.hasOwnProperty('x-per-page')){
                return Math.ceil(parseInt(headers['x-total'])/parseInt(headers['x-per-page']));
            }
        }
        else
            return new Error(`[CalculNbPages] headers are not set properly`);
    }

    async treatPages (first_call, page_numbers, url, headers, payload){
        try{
            let requests = [];
            for(let page = 1; page <= page_numbers; page++){
                let tmp_url = this.buildUrl(url, {
                    'page[number]': page
                }, true);
                requests.push(this.request('get', tmp_url, headers, payload, true));
                await sleep(process.env.SLEEP_TIME);
            }
            return Promise.all(requests).then((result)=>{
                let fresh_data = [];
                result.map((req)=>{
                    fresh_data.push(req?.data);
                })
                return fresh_data;
            })
        }
        catch(err){
            return err;
        }
    }

    async request(method, url, headers, payload, processing){
        let page_numbers = 1;
        //Check that token is an actual property of Object
        if(this.token == null && method != 'auth'){
            this.token = await this.request_token();
        }
        //Push token to headers
        headers['Authorization'] = `Bearer ${this.token}`;

        if(method == 'get'){
            let first_call = await axios({
                method,
                url,
                headers,
                data: payload
            })
            if(!payload.hasOwnProperty('page[number]'))
                page_numbers = this.calculNbPages(first_call);
            if(page_numbers < 2 || processing)
                return first_call;
            else{
                let res = await this.treatPages(first_call, page_numbers,url, headers, payload);
                return {
                    status: 200,
                    data: res
                };
            }
        }
        else
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
                return {
                    status: 'success',
                    data: response?.data
                }
            }
            else
                return {
                    status: 'error',
                    reason: 'unable to get'
                }
        }
        catch(err)
        {
            return err;
        }
    }

    async post(url, headers, payload){
        try{
            let URI = this.buildSimpleUrl(url, payload);
            let response = await this.request('post', URI, headers, payload);
            if(response?.status == 201)
                return {
                    status: 'success',
                    data: response?.data
                }
            else
                return {
                    status: 'error',
                    reason: 'unable to delete'
                }
        }
        catch(err)
        {
            return err;
        }
    }

    async patch(url, headers, payload){
        try{
            let URI = this.buildSimpleUrl(url, payload);            
            let response = await this.request('patch', URI, headers, payload);
            console.log(response);
            if(response?.status == 204)
                return {
                    status: 'success',
                    data: response?.data
                };
            else
                return {
                    status: 'error',
                    reason: 'unable to patch'
                }
        }
        catch(err)
        {
            return err;
        }
    }

    async put(url, headers, payload){
        try{
            let URI = this.buildSimpleUrl(url, payload);            
            let response = await this.request('put', URI, headers, payload);
            if(response?.status == 204){
                return {
                    status: 'success',
                    data: response?.data
                }; 
            }
                
            else
                return {
                    status: 'error',
                    reason: 'unable to put'
                } 
        }
        catch(err)
        {
            return err;
        }
    }

    async delete(url, headers, payload){
        try{
            let URI = this.buildSimpleUrl(url, payload);            
            let response = await this.request('delete', URI, headers, payload);
            if(response?.status == 204)
                return {
                    status: 'success',
                    data: response?.data
                };
            else
                return {
                    status: 'error',
                    reason: 'unable to delete'
                }
        }
        catch(err)
        {
            return err;
        }
    }
}

const main = async () => {
    let ic = new IntraClient();
    
    //let res = await ic.request_token();
    // let payload = {
    //     'filter[primary_campus]':46,
    //     'filter[cursus]': 9,
    //     'page[number]': 4
    // };

    let payload = {
        "filter[campus_id]": 40,
        "sort": 'begin_at'
      };
    let res = await ic.get('exams', {}, payload);
    console.log(res.data);

}

main();