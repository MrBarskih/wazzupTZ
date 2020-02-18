
import validate from 'validate.js';

//проверка на забаненный домен
// забаненные домены можно добавлять в linkConstraints - domain - bannedDomains
validate.validators.domain = function(value, options) {

  if (!value) {
    return;
  }

  let urlDomain;
    //find & remove protocol (http, ftp, etc.) and get hostname
    if (value.indexOf("//") > -1) {
        urlDomain = value.split('/')[2];
    }
    else {
        urlDomain = value.split('/')[0];
    }
    urlDomain = urlDomain.split(':')[0];//find & remove port number
    urlDomain = urlDomain.split('?')[0];//find & remove "?"

  if (options.bannedDomains){
    if (validate.contains(options.bannedDomains, urlDomain)){
    let result = {
      code: "BOOKMARKS_BLOCKED_DOMAIN",
      description: `${urlDomain} banned`
    };

    return result
    }
  }
};

export const sortByConstraints = {
  singleValue: {  
    type : "string",
    only : ["createdAt", "favorites"]
  }
}

export const sortDirConstraints = {
  singleValue: {  
    type : "string",
    only : ["asc", "desc"]
  }
}

export const favoritesConstraints = {
  singleValue: {  
    type : "boolean"
  }
}

export const linkConstraints = {
  url:{
    schemes: ["http", "https"],
    message: {
      code: "BOOKMARKS_INVALID_LINK",
      description: "Invalid link"
    }
  },
  domain:{
    bannedDomains: ["yahoo.com", "socket.io"]
  }
}