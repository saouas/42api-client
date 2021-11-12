<div id="top"></div>
<h1 align="center">42api-client</h3>




<!-- ABOUT THE PROJECT -->
## About The Project

This project is a 42api client wrapper api. It will allow you to interface 42API easily in your future applications. The 42api client is written in nodeJS so will be compatible on backend side but also in front end side.


### Built With

* Nodejs
* Axios
* dotenv
* eslint

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

To install the 42api-client in your project this is very easy, you can do it through NPM or download the library and put it on your project modules.


### Installation

1. Install the paquet `npm install 42api-client`
2. Configure your env with the necessary variables as following
```
  CLIENT_ID=GET_YOURS_FROM_INTRA
  CLIENT_SECRET=GET_YOURS_FROM_INTRA
  ENDPOINT_API=https://api.intra.42.fr/v2
  SCOPES_API=profile public projects elearning tig forum
  SLEEP_TIME=330
```

3. Invoke the module as following: `const IntraClient = require('42api-client');`
4. TADAM :D

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

To give you an idea about how to use the library you can check the `examples` folder or the following example:

```
const payload = {
    'filter[campus_id]': 40,
    sort: 'begin_at',
  };
  const res = await ic.get('exams', {}, payload);
  console.log(res.data);
```



<!-- ROADMAP -->
## Roadmap

- [] Use retry variable instead of sleep
- [] Improve error handling
- [] ???

If you have any suggestion, please open an issue on the offical repository.

<p align="right">(<a href="#top">back to top</a>)</p>




<!-- LICENSE -->
## License

Distributed under the MIT License.



<!-- CONTACT -->
## Contact

Salim Aouas (@Signal) - signal@42madrid.com

<p align="right">(<a href="#top">back to top</a>)</p>

