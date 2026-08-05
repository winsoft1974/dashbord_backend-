import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class MockQuery<T = any> {
  private data: T[];

  constructor(data: T[]) {
    this.data = data;
  }

  sort(sortObj: any) {
    const keys = Object.keys(sortObj);
    if (keys.length > 0) {
      const key = keys[0];
      const order = sortObj[key]; // 1 (asc) or -1 (desc)
      this.data.sort((a: any, b: any) => {
        let valA = a[key];
        let valB = b[key];
        
        // Normalize dates
        if (key === 'createdAt' || key === 'publishedAt' || key === 'subscribedAt') {
          valA = new Date(valA || 0).getTime();
          valB = new Date(valB || 0).getTime();
        }

        if (valA < valB) return order === 1 ? -1 : 1;
        if (valA > valB) return order === 1 ? 1 : -1;
        return 0;
      });
    }
    return this;
  }

  skip(num: number) {
    this.data = this.data.slice(num);
    return this;
  }

  limit(num: number) {
    this.data = this.data.slice(0, num);
    return this;
  }

  // Support await and promises on query chains
  then(onfulfilled?: (value: T[]) => any, onrejected?: (reason: any) => any) {
    return Promise.resolve(this.data).then(onfulfilled, onrejected);
  }
}

export class MockModelInstance {
  [key: string]: any;
  private _collection: MockCollection;

  constructor(data: any, collection: MockCollection) {
    Object.assign(this, data);
    this._collection = collection;
    if (!this._id) {
      this._id = Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    }
  }

  async save() {
    return this._collection.saveInstance(this);
  }

  async comparePassword(password: string) {
    return bcrypt.compare(password, this.passwordHash || '');
  }
}

export class MockCollection {
  private collectionName: string;
  private filePath: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.filePath = path.join(DATA_DIR, `${collectionName.toLowerCase()}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  private read(): any[] {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      return [];
    }
  }

  private write(data: any[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  private wrap(item: any) {
    if (!item) return null;
    return new MockModelInstance(item, this);
  }

  private wrapArray(items: any[]) {
    return items.map(item => this.wrap(item));
  }

  private filterItems(items: any[], query: any): any[] {
    if (!query || Object.keys(query).length === 0) return items;
    
    return items.filter(item => {
      for (const key in query) {
        const val = query[key];
        
        if (val instanceof RegExp) {
          if (!val.test(item[key] || '')) return false;
          continue;
        }

        if (key === '$or' && Array.isArray(val)) {
          const matchAny = val.some(subQuery => {
            const subKey = Object.keys(subQuery)[0];
            const subVal = subQuery[subKey];
            if (subVal instanceof RegExp) {
              return subVal.test(item[subKey] || '');
            }
            return item[subKey] === subVal;
          });
          if (!matchAny) return false;
          continue;
        }

        if (val && typeof val === 'object' && val.$in && Array.isArray(val.$in)) {
          if (!val.$in.includes(item[key])) return false;
          continue;
        }

        if (item[key] !== val) return false;
      }
      return true;
    });
  }

  find(query: any = {}) {
    const items = this.read();
    const filtered = this.filterItems(items, query);
    const wrapped = this.wrapArray(filtered);
    return new MockQuery(wrapped);
  }

  async findOne(query: any = {}) {
    const items = this.read();
    const filtered = this.filterItems(items, query);
    return this.wrap(filtered[0] || null);
  }

  async findById(id: string) {
    const items = this.read();
    const item = items.find(i => (i._id || i.id) === id);
    return this.wrap(item || null);
  }

  async findByIdAndUpdate(id: string, update: any, options: any = {}) {
    const items = this.read();
    const index = items.findIndex(i => (i._id || i.id) === id);
    if (index === -1) return null;

    const current = items[index];
    const updated = {
      ...current,
      ...(update.$set || update),
      updatedAt: new Date().toISOString()
    };
    items[index] = updated;
    this.write(items);
    return this.wrap(updated);
  }

  async findByIdAndDelete(id: string) {
    const items = this.read();
    const index = items.findIndex(i => (i._id || i.id) === id);
    if (index === -1) return null;
    const removed = items.splice(index, 1)[0];
    this.write(items);
    return this.wrap(removed);
  }

  async countDocuments(query: any = {}) {
    const items = this.read();
    const filtered = this.filterItems(items, query);
    return filtered.length;
  }

  async aggregate(pipeline: any[]) {
    const items = this.read();
    let result = [...items];

    for (const stage of pipeline) {
      if (stage.$match) {
        result = this.filterItems(result, stage.$match);
      } else if (stage.$group) {
        const groupKeyObj = stage.$group._id;
        const sums: { [key: string]: number } = {};
        
        result.forEach(item => {
          let keyStr = '';
          if (typeof groupKeyObj === 'string' && groupKeyObj.startsWith('$')) {
            const field = groupKeyObj.substring(1);
            keyStr = item[field] || '';
          } else if (groupKeyObj && typeof groupKeyObj === 'object') {
            const dateVal = new Date(item.createdAt || item.subscribedAt || Date.now());
            const month = dateVal.getMonth() + 1;
            const year = dateVal.getFullYear();
            keyStr = JSON.stringify({ month, year });
          }
          
          sums[keyStr] = (sums[keyStr] || 0) + 1;
        });

        return Object.keys(sums).map(keyStr => {
          let parsedId: any = keyStr;
          try {
            parsedId = JSON.parse(keyStr);
          } catch {
            // ignore
          }
          return {
            _id: parsedId,
            count: sums[keyStr]
          };
        });
      }
    }

    return result;
  }

  async insertMany(docs: any[]) {
    const items = this.read();
    const seeded = docs.map(doc => {
      const now = new Date().toISOString();
      return {
        _id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
        ...doc,
        createdAt: doc.createdAt || now,
        updatedAt: doc.updatedAt || now
      };
    });
    const combined = [...items, ...seeded];
    this.write(combined);
    return this.wrapArray(seeded);
  }

  async deleteMany(query: any = {}) {
    if (Object.keys(query).length === 0) {
      this.write([]);
      return { deletedCount: 0 };
    }
    const items = this.read();
    const remaining = items.filter(item => !this.filterItems([item], query).length);
    this.write(remaining);
    return { deletedCount: items.length - remaining.length };
  }

  async saveInstance(instance: MockModelInstance) {
    const items = this.read();
    const data = { ...instance };
    delete data._model;

    const index = items.findIndex(i => i._id === data._id);
    const now = new Date().toISOString();
    
    if (index === -1) {
      data.createdAt = data.createdAt || now;
      data.updatedAt = now;
      items.push(data);
    } else {
      data.updatedAt = now;
      items[index] = data;
    }

    this.write(items);
    return this.wrap(data);
  }
}
