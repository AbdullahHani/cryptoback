const environment = require('dotenv');
const Redis = require('ioredis');

environment.config();

let client, subscriber;

client = new Redis(process.env.REDIS_URL);
subscriber = new Redis(process.env.REDIS_URL);

const RedisOptions = {
    createClient: function(type){
        switch(type){
            case 'client':
                return client;
            case 'subscriber':
                return subscriber;
            default:
                return new Redis(process.env.REDIS_URL);
        }
    }
}

// const RedisOptions = {
//     redis: {
//         opts: {
//             createClient: function(type){
//                 switch(type){
//                     case 'client':
//                         return client;
//                     case 'subscriber':
//                         return subscriber;
//                     default:
//                         return new Redis(process.env.REDIS_URL);
//                 }
//             }
//         }
//     }
// }


module.exports = RedisOptions;