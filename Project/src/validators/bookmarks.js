
export const fieldsConstraints = {
  array: {
    type: 'string',
    values: [
      'guid',
      'link',
      'createdAt',
      'updatedAt',
      'description',
      'favorites'
    ]
  }
}

export const sortByC = {
  presence: {
    allowEmpty: false
  }
}