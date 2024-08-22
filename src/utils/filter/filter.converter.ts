import { Filter, FilterElement, unflatten } from 'adminjs'
import { BaseEntity, FindOptionsWhere } from 'typeorm'
import { DefaultParser } from './default-filter.parser'
import { parsers } from './filter.utils'

function customizeFilter(where: any, fieldKey: string, filter: FilterElement): any {
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
  const unflattenQuery = unflatten({ [customFilterKey]: customFilterValue })

  // eslint-disable-next-line no-param-reassign
  where[fieldKeyParts[0]] = unflattenQuery[fieldKeyParts[0]]

  return where
}

export const convertFilter = (
  filterObject?: Filter,
): FindOptionsWhere<BaseEntity> | FindOptionsWhere<BaseEntity>[] => {
  if (!filterObject) {
    return {}
  }

  const { filters } = filterObject ?? {}
  const where = {}
  const orWhere = {}

  Object.entries(filters ?? {}).forEach(([fieldKey, filter]) => {
    const isOrFilter = filter?.['isOrFilter']
    if (!isOrFilter) {
      return
    }

    orWhere[fieldKey] = customizeFilter({}, fieldKey, filter)
  })

  Object.entries(filters ?? {}).forEach(([fieldKey, filter]) => {
    const isOrFilter = filter?.['isOrFilter']
    if (isOrFilter) {
      return
    }

    customizeFilter(where, fieldKey, filter)
  })

  const orWhereValues = Object.values(orWhere)

  if (orWhereValues?.length) {
    orWhereValues.forEach((orFilter: any) => {
      Object.entries(where).forEach(([key, value]) => {
        // eslint-disable-next-line no-param-reassign
        orFilter[key] = value
      })
    })

    return orWhereValues as FindOptionsWhere<BaseEntity>[]
  }

  return where
}
