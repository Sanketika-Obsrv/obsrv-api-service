import * as _ from 'lodash';

export class SchemaGenerationException extends Error {
  statusCode: number;
  constructor(message: string, code: number) {
    super(message);
    this.name = 'SchemaGenerationException';
    this.statusCode = code;
  }
}