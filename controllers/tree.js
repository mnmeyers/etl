"use strict";

const util = require('util');
const errorHandler = require('../errorHandler').handleError;
const _ = require('underscore');
const fs = require('fs');
var q = require('q');


var tree = {
    name: 'ImageNet 2011 Fall Release',
    size: 60942,
    children: []
};

function createTree(flatTree) {
    flatTree.shift();//want to take off the top level node
    _.each(flatTree, function (node) {
       var path = node.name.split(' > ');
       var childNodeName = path.pop();
       var nodePaths = node.name.split(' > ');
       nodePaths.unshift('');
       findNodeAndInsertChild(tree, nodePaths, {name: childNodeName, size: node.size, children: []});
    });
}

function findNodeAndInsertChild(node, nodePaths, childToInsert) {
    //if it has the name of current path and this isn't the last element...
    //call this function again with the remaining paths and this node
    //else if has the name of current path and is the last path element, push in the childToInsert
    if(!node.children || !nodePaths.length){
        console.warn(`there was a problem with params: ${util.inspect(node, {depth: null})} ${nodePaths}`);
        return;
    }
    for(var i = 1; i < nodePaths.length; i++){

        if(node.name === nodePaths[i - 1] && i === nodePaths.length - 1){
            node.children.push(childToInsert);
            return;
        } else if(node.children.length){

            for(var j = 0; j < node.children.length; j++){

                //need to pad nodePaths with empty string so that when you recursively call, you will have the parent name
                if(node.children[j].name === nodePaths[i] && i !== nodePaths.length - 1){
                    nodePaths = nodePaths.slice(i);
                    findNodeAndInsertChild(node.children[j], nodePaths, childToInsert);
                    return;
                } else if(node.children[j].name === nodePaths[nodePaths.length - 2]){
                    node.children[j].children.push(childToInsert);
                    return;
                }
            }
        }


  }
    console.warn(`no place found for this node! ${util.inspect(node)}`);

}


var TreeController = {
    fetchAndFormat: (req, res, next) => {
        var query = req.db.collection('tree');

        q.nfcall(query.findOne.bind(query, {}, {_id: 0}))
            .then((results) => {
                var flatTree = results.tree;
                createTree(flatTree);
                res.status(200).send(tree);

            })
            .catch((err) => {
                errorHandler(err);
                res.sendStatus(err.status || 500);
            });
    }
};

module.exports = TreeController;