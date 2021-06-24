const fs = require('fs')
const SSL_KEY = fs.readFileSync('./certificate/key.pem')
const SSL_KEY_CERT = fs.readFileSync('./certificate/cert.pem')
const https = require('https')
const express = require('express')
const app = express()
const data = require('./data.json')
const axios = require('axios')

require('dotenv').config()

app.use(express.json()) 
app.use(express.urlencoded({extended:false}))

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

const users = [
    {
        user_id: 'HKT-01',
        username: "bob",
        password: "123"
    },
    {
        user_id: 'HKT-02',
        username: "alice",
        password: "123"
    },
    {
        user_id: 'HKT-03',
        username: "jame",
        password: "777"
    },
]


const getCurrentUser = ({headers}) => {
    return headers['mock-logged-in-as'] ||
            headers['x-authenticated-userid']
}

app.get('/halo', (req, res) => {
    res.send(users)
})

app.post('/login', (req, res) => {
    let {username, password} = req.body
    users.forEach(async e => {
        if(username == e.username && password == e.password) {
            console.log('here1', e.user_id);
            try {
                let kongres = await axios({
                    method: 'post',
                    url: 'https://localhost:9443/api/authorize/oauth2/token',
                    data: {
                        client_id:"pH1POCWAt1o12p21nLZz912xX9FWxn5X",
                        client_secret:"uCCMB4WUheoJ118GkTvsylHukgXc0Skf",
                        grant_type:"password",
                        scope:"password_authen",
                        provision_key:"IcOmBTNRODtrlM3cX0oiVlWb9l3sFInT",
                        authenticated_userid:e.user_id,
                    }
                })
                console.log(kongres.data);
                console.log('this:',kongres.data.access_token);
                let accessToken = kongres.data.access_token
                let refreshToken = kongres.data.refresh_token
                let goAuthenRes = await axios({
                    method:'get',
                    url:'http://localhost:8000/api/authorize',
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                })
                // goAuthenRes = JSON.stringify(goAuthenRes)
                res.send(goAuthenRes.data)
            } catch (error) {
                console.log('eerror',error.message);
                res.send('error')
                throw error
            }
      
        } else {
        }
    })
})


app.get('/authorize', (req, res) => {
    console.log(req.headers);
    const user = getCurrentUser(req)
    if(!user) {
        res.status(401).send('not authen')
        return
    } 
    res.send(data[user] || [])
})

const server = https.createServer({key: SSL_KEY, cert: SSL_KEY_CERT}, app)
server.listen(7788, () =>{
    console.log('server listen xx');
})