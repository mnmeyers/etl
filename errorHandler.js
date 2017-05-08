"use strict";

module.exports = {
    handleError: (err) => {
        if(err){
            console.error(new Error(err));
        }
    }
};