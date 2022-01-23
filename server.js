'use strict';

const Hapi = require('@hapi/hapi');
const https = require('https');
const axios = require('axios');
const test = false;

const server = Hapi.server({
    port: 3000,
    host: 'localhost'
});
server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
        const input = inputJson;
        // console.log(input);
        const data = JSON.parse(input);
        const resp = [];
        const hashMap = new Map();
        for (let [key, value] of Object.entries(data)) {
            for (let [keyIn, valueIn] of Object.entries(value)) {
                hashMap.set(valueIn.id, valueIn);
                if (valueIn.parent_id == null) {
                    resp.push(valueIn);
                }
            }
        }
        hashMap.forEach((value, keys) => {
            if (value.parent_id !== null && value.parent_id) {
                const parent = hashMap.get(value.parent_id);
                parent.children.push(value);
                hashMap.set(value.parent_id, parent);
            }
        });
        console.log(hashMap);
        return '<pre>' + JSON.stringify(resp) + '</pre>';
    }
});


// Github Search API

server.route({
    method: 'GET',
    path: '/github',
    handler: async (request, h) => {
        const params = request.query;
        const data = await getRepos(params.page_number);

        return buildHtml(data.data, params.page_number);
    }
});
if (!test)
server.start();
console.log('Server running on %s', server.info.uri);
exports.init = async () => {
    return await server;
};
exports.start = async () => {
    return await server;
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

const inputJson = '{"0":\n' +
    '  [{"id": 10,\n' +
    '    "title": "House",\n' +
    '    "level": 0,\n' +
    '    "children": [],\n' +
    '    "parent_id": null}],\n' +
    ' "1":\n' +
    '  [{"id": 12,\n' +
    '    "title": "Red Roof",\n' +
    '    "level": 1,\n' +
    '    "children": [],\n' +
    '    "parent_id": 10},\n' +
    '   {"id": 18,\n' +
    '    "title": "Blue Roof",\n' +
    '    "level": 1,\n' +
    '    "children": [],\n' +
    '    "parent_id": 10},\n' +
    '   {"id": 13,\n' +
    '    "title": "Wall",\n' +
    '    "level": 1,\n' +
    '    "children": [],\n' +
    '    "parent_id": 10}],\n' +
    ' "2":\n' +
    '  [{"id": 17,\n' +
    '    "title": "Blue Window",\n' +
    '    "level": 2,\n' +
    '    "children": [],\n' +
    '    "parent_id": 12},\n' +
    '   {"id": 16,\n' +
    '    "title": "Door",\n' +
    '    "level": 2,\n' +
    '    "children": [],\n' +
    '    "parent_id": 13},\n' +
    '   {"id": 15,\n' +
    '    "title": "Red Window",\n' +
    '    "level": 2,\n' +
    '    "children": [],\n' +
    '    "parent_id": 12}]}';

function getRepos(pageNumber = 1) {
    const instance = createAxiosInstance();
    return new Promise((resolve, reject) => {
        const requestData = {
            method: 'get',
            url: `https://api.github.com/search/code?q=nodejs+user:nodejs&page=` + pageNumber + `&per_page=10`
        };
        instance(requestData)
            .then(response => {
                resolve(response);
            }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
}

function createAxiosInstance() {
    const inst = {
        baseURL: 'https://api.github.com/',
        httpsAgent: new https.Agent({rejectUnauthorized: false}),
        timeout: 5000,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    const instance = axios.create(inst);
    return instance;
}

function buildHtml(data, pageNumber = 1) {

    let html = '<table><tr><td><a href="/github?page_number=' + (pageNumber - 1) + '">Prev</a></td>';
    html += pageNumber > 1 ? '<td><a href="/github?page_number=' + (pageNumber + 1) + '">Next</a></td>' : '</tr></table>';
    html += '<div><pre>' + JSON.stringify(data) + '</pre></div>';
    return html;
}

exports.server = async () => {
    return server;
}