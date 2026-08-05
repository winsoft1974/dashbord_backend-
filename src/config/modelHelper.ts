import mongoose from 'mongoose';
import { MockCollection, MockModelInstance } from './mockDb';

export const getModel = (modelName: string, schema: any) => {
  let cachedModel: any = null;

  const getTarget = () => {
    if (cachedModel) return cachedModel;

    const useMock = process.env.USE_MOCK_DB === 'true';
    if (useMock) {
      const collection = new MockCollection(modelName);
      
      // Return class mimicking mongoose model class
      cachedModel = class {
        constructor(data: any) {
          return new MockModelInstance(data, collection);
        }
        
        static find(query: any = {}) { return collection.find(query); }
        static findOne(query: any = {}) { return collection.findOne(query); }
        static findById(id: string) { return collection.findById(id); }
        static findByIdAndUpdate(id: string, update: any, options: any = {}) { return collection.findByIdAndUpdate(id, update, options); }
        static findByIdAndDelete(id: string) { return collection.findByIdAndDelete(id); }
        static countDocuments(query: any = {}) { return collection.countDocuments(query); }
        static aggregate(pipeline: any[]) { return collection.aggregate(pipeline); }
        static insertMany(docs: any[]) { return collection.insertMany(docs); }
        static deleteMany(query: any = {}) { return collection.deleteMany(query); }
      };
    } else {
      cachedModel = mongoose.models[modelName] || mongoose.model(modelName, schema);
    }
    return cachedModel;
  };

  // Return a proxy that lazily resolves at the moment of construct or property access
  return new Proxy(function() {} as any, {
    construct(target, argumentsList) {
      const ModelClass = getTarget();
      return Reflect.construct(ModelClass, argumentsList);
    },
    get(target, prop) {
      const ModelClass = getTarget();
      const value = (ModelClass as any)[prop];
      if (typeof value === 'function') {
        return value.bind(ModelClass);
      }
      return value;
    }
  });
};
