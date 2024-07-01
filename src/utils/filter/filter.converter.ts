import { Filter } from 'adminjs'
import { BaseEntity, FindOptionsWhere } from 'typeorm'
import { DefaultParser } from './default-filter.parser'
import { parsers } from './filter.utils'

export const convertFilter = (
  filterObject?: Filter,
): FindOptionsWhere<BaseEntity> => {
  if (!filterObject) {
    return {}
  }

  const { filters } = filterObject ?? {}
  const where = {}

  Object.entries(filters ?? {}).forEach(([fieldKey, filter]) => {
    const parser = parsers.find((p) => p.isParserForType(filter))

    let customFilterKey = ''
    let customFilterValue = ''
    if (parser) {
      const { filterValue, filterKey } = parser.parse(filter, fieldKey)
      customFilterKey = filterKey
      customFilterValue = filterValue
    } else {
      const { filterValue, filterKey } = DefaultParser.parse(filter, fieldKey)
      customFilterKey = filterKey
      customFilterValue = filterValue
    }

    const fieldKeyParts = customFilterKey.split('.')
    if (fieldKeyParts?.length > 1) {
      fieldKeyParts.reduce((acc, key, index) => {
        if (index === fieldKeyParts.length - 1) {
          acc[key] = customFilterValue
        } else {
          acc[key] = {}
        }
        return acc[key]
      }, where)
    } else {
      where[customFilterKey] = customFilterValue
    }
  })

  return where
}
