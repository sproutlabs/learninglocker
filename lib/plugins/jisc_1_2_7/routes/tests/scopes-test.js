import { getConnection } from 'lib/connections/mongoose';
import DBHelper from 'lib/plugins/jisc_1_2_7/utils/TestDBHelper';

const db = new DBHelper();

describe('JISC API scoping tests', () => {
  before((done) => {
    const connection = getConnection('JISC_1_2_7');
    if (connection.readyState !== 1) {
      connection.on('connected', done);
    } else {
      done();
    }
  });

  describe('Client with scope "all" should be able to view and update all fields', () => {
    before('Set up client with "all" scopes', (done) => {
      db.prepareClient(done);
    });

    after('Clear client with "all" scopes', (done) => {
      db.cleanUpClient(done);
    });

    describe('for a student', () => {

    });
  });
});