
export const fieldsConstraints = {
  array: {
    type: 'string',
    values: [
      'link',
      'description',
      'favorites',
      'ds'
    ]
  }
}

export const sortByConstraints = {
  format: {
    pattern: "[a-zA-Z]+",
    message: "is not string"
  }
}

export const sortDirConstraints = {
  format: {
    pattern: "[a-zA-Z]+",
    message: "is not string"
  }
}

export const linkConstraints = {
  url:{
    schemes: ["http", "https"],
    message: "Link is not a valid url. 'http://' or 'https://', please"
  }
}
