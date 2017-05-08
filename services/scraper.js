"use strict";

const util = require('util');
const errorHandler = require('../errorHandler').handleError;
const _ = require('underscore');
const request = require('request');
const parseString = require('xml2js').parseString;
const fs = require('fs');
var q = require('q');

var holder = [];

function visitNode(node, path){
    var nodeName = node.$.words;
    var size = getSize(node);
    path = path ? path + ' > ' + nodeName : nodeName;
    var flattenedNode = {name: path, size: size};
    holder.push(flattenedNode);

    //if a $ obj doesn't have a synset as well as a nested $, it means it is a leaf node
    if(node.synset){
        _.each(node.synset, (obj) => {
           visitNode(obj, path);
        });
    }

}
function getSize(node){
    var sum = 1;
    if(node.synset){

    _.each(node.synset, function (child) {
       sum += getSize(child);
    });

    }
    return sum;
}
var ScraperService = {
    scrape: (req, res, next) => {
        debugger;
        var xmlRequest = request.bind(request, 'http://www.image-net.org/api/xml/structure_released.xml');
        var query = req.db.collection('tree');

        q.nfcall(xmlRequest)
            .then((response) => {
                return parseString(response[0].body, (err, result) => {
                    if(err){
                        console.log(err);
                        return;
                    }
                    visitNode(result.ImageNetStructure.synset[0], '');
                });
            })
            .then((result) => {
                return query.insertOne({tree: holder});
            })
            .then(() => {
                res.status(200).send('parsing and saving successful!');
            })
            .catch((err) => {
                errorHandler(err);
                res.status(err.status || 500).send(err);
            })
    }
};

module.exports = ScraperService;