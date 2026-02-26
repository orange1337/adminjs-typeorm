import { Like } from 'typeorm'
import { Property } from '../../Property'
import { FilterParser } from './filter.types'

const uuidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[5|4|3|2|1][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i

export const DefaultParser: FilterParser = {
  isParserForType: (filter) => filter.property.type() === 'string',
  parse: (filter, fieldKey) => {
    // fix UUID filtering for PostgresSQL
    if (uuidRegex.test(filter.value.toString()) || (filter.property as Property).column.type === 'uuid') {
      return { filterKey: fieldKey, filterValue: filter.value }
    }

    return { filterKey: fieldKey, filterValue: Like(`%${filter.value}%`) }
  },
}
