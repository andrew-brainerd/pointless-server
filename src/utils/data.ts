import {
  Db,
  Filter,
  MongoClient,
  MongoClientOptions,
  ObjectId,
  Sort,
  Document,
  UpdateFilter,
  InsertOneResult
} from 'mongodb';
import log from './log';
import omit from 'lodash/omit';
import { AddToSetResult, RemoveResult } from '../types/data';

const dbUri = process.env.MONGODB_URI as string;
const dbName = process.env.DB_NAME as string;

const mongoOptions: MongoClientOptions = {};

let db: Db | undefined;
let retryCount = 0;

export const connectToMongoDB = async () => {
  MongoClient.connect(dbUri, mongoOptions, (err, client) => {
    if (err) {
      log.error('Failed to connect to MongoDb', err);
      retryCount++;

      if (retryCount < 5) {
        connect(false);
      }
      return;
    }

    db = client?.db(dbName);

    log.cool(`Connected to DB: ${dbName}`);
    connect(true);
  });
}

export const connect = async (isConnected: boolean) => !isConnected && connectToMongoDB();

export const calculateTotalPages = (items = 0, size: number) => {
  if (items > size) {
    return Math.ceil(items / size);
  }

  return 1;
}

export const insertOne = async (
  collectionName: string,
  document: Document
): Promise<InsertOneResult<Document>> => {
  return new Promise((resolve, reject) => {
    db?.collection(collectionName)
      .insertOne(document, (err, result) => {
        err ? reject(err) : resolve(result as InsertOneResult<Document>);
      });
  });
};

export const getSome = async (
  collectionName: string,
  page: number,
  size: number,
  query: Filter<Document>,
  projection: Document,
  sort: Sort
) => {
  const collection = db?.collection(collectionName);
  const totalItems = await collection?.countDocuments({});
  const totalPages = calculateTotalPages(totalItems, size);
  const sorting = sort || { $natural: -1 };

  return new Promise((resolve, reject) => {
    collection?.find(query)
      .project(projection)
      .skip(size * (page - 1))
      .limit(size)
      .sort(sorting)
      .toArray((err, items) => {
        err ? reject(err) : resolve({
          items,
          totalItems,
          totalPages
        });
      });
  });
};

export const getById = async (collectionName: string, id: string) => {
  return new Promise((resolve, reject) => {
    db?.collection(collectionName)
      .find({ _id: new ObjectId(id) })
      .toArray((err, result = []) =>
        err ? reject(err) : resolve(result[0])
      );
  });
};

export const getByProperty = (collectionName: string, property: string, value: string) => {
  return new Promise((resolve, reject) => {
    db?.collection(collectionName)
      .find({ [property]: value })
      .toArray((err, result = []) =>
        err ? reject(err) : resolve(result[0])
      );
  });
};

export const getByProperties = (collectionName: string, query: Filter<Document>) => {
  return new Promise((resolve, reject) => {
    db?.collection(collectionName)
      .find(query)
      .toArray((err, result) =>
        err ? reject(err) : resolve(result)
      );
  });
};

export const getAllByProperty = (collectionName: string, property: string, value: string) => {
  return new Promise((resolve, reject) => {
    db?.collection(collectionName)
      .find({ [property]: value })
      .toArray((err, result) =>
        err ? reject(err) : resolve(result)
      );
  });
};

export const updateOne = async (collectionName: string, id: string, update: Document) => {
  return new Promise((resolve, reject) => {
    try {
      db?.collection(collectionName)
        .updateOne(
          { _id: new ObjectId(id) },
          { $set: update },
          (err, result) => {
            const { matchedCount, modifiedCount } = result || {};
            if (err) reject(err);
            const didUpdate = matchedCount === 1 && modifiedCount === 1;
            resolve({ didUpdate, id });
          }
        );
    } catch (err) {
      reject(err);
    }
  });
};

export const updateMany = async (collectionName: string, query: Filter<Document>, update: UpdateFilter<Document>) => {
  return new Promise((resolve, reject) => {
    try {
      db?.collection(collectionName)
        .updateMany(
          query,
          update,
          (err, result) => {
            const { matchedCount = 0, modifiedCount = 0 } = result || {};
            if (err) reject(err);
            resolve({
              didUpdateAll: matchedCount === modifiedCount,
              didUpdateSome: modifiedCount > 0
            });
          }
        );
    } catch (err) {
      reject(err);
    }
  });
};

export const saveObject = async (collectionName: string, item: { _id: string; }) => {
  return new Promise((resolve, reject) => {
    try {
      db?.collection(collectionName)
        .update(
          { _id: item._id },
          { $set: omit(item, '_id') },
          { upsert: true },
          (err, result) => err ? reject(err) : resolve(result)
        );
    } catch (err) {
      reject(err);
    }
  });
};

export const deleteOne = async (collectionName: string, id: string) => {
  return new Promise((resolve, reject) => {
    db?.collection(collectionName)
      .deleteOne(
        { _id: new ObjectId(id) },
        err => err ? reject(err) : resolve(id)
      )
  });
};

export const addToSet = async <T>(collectionName: string, id: string, property: string, item: T): Promise<AddToSetResult<T>> => {
  return new Promise((resolve, reject) => {
    const addition = { [property]: item };
    db?.collection(collectionName)
      .updateOne(
        { _id: new ObjectId(id) },
        { $addToSet: addition },
        (err, result) => {
          if (err) reject(err);
          resolve({
            alreadyExists: result?.matchedCount === 1 && result?.modifiedCount === 0,
            item
          });
        }
      );
  });
}

export const pullFromSet = async (collectionName: string, id: string, property: string, removeId: string): Promise<RemoveResult> => {
  return new Promise((resolve, reject) => {
    const removal = { [property]: { _id: new ObjectId(removeId) } };
    db?.collection(collectionName)
      .updateOne(
        { _id: new ObjectId(id) },
        { $pull: removal },
        (err, result) => {
          if (err) reject(err);
          const { matchedCount, modifiedCount } = result || {};
          const notAMember = matchedCount === 1 && modifiedCount === 0;
          resolve({ notAMember, id });
        }
      );
  });
};

connect(false);

export default db;
