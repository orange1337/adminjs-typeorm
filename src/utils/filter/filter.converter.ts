import { Filter, FilterElement } from 'adminjs'
import { BaseEntity, FindOptionsWhere } from 'typeorm'
import { DefaultParser } from './default-filter.parser'
import { parsers } from './filter.utils'

function customUnflattenQuery(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}

  for (const key in obj) {
    const parts = key.split('.')
    let current: any = result

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]

      if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
        // eslint-disable-next-line no-continue
        continue
      }

      if (
        current[part] === undefined
        || current[part] === null
        || typeof current[part] !== 'object'
        || Array.isArray(current[part])
      ) {
        current[part] = {}
      }

      current = current[part]
    }

    const lastPart = parts[parts.length - 1]
    current[lastPart] = obj[key]
  }

  return result
}

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
  const unflattenQuery = customUnflattenQuery({ [customFilterKey]: customFilterValue })

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
