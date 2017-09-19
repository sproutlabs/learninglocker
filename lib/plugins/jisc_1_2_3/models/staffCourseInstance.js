import mongoose from 'mongoose';
import { getConnection } from 'lib/connections/mongoose';
import timestamps from 'mongoose-timestamp';
import filterByOrg from 'lib/models/plugins/filterByOrg';
import fieldScoping from 'lib/plugins/jisc_1_2_3/models/plugins/fieldScoping';
import scopeChecks from 'lib/models/plugins/scopeChecks';
import async from 'async';
import * as scopes from 'lib/constants/scopes';
import { updateForeignMultiple,
         updateLocalSingular } from 'lib/plugins/jisc_1_2_3/utils/relations';

const schema = new mongoose.Schema({
  STAFF_ID: { type: String, required: true, maxLength: 255, readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.SSP] },
  COURSE_INSTANCE_ID: { type: String, required: true, maxLength: 255, readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.SSP] },

  /**
   * Relations
   */
  staff: { type: mongoose.Schema.ObjectId, ref: 'Staff', readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.SSP] },
  courseInstance: { type: mongoose.Schema.ObjectId, ref: 'CourseInstance', readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.SSP] },
  organisation: { type: mongoose.Schema.ObjectId, ref: 'Organisation' }
});
const baseScopes = [scopes.ALL, scopes.TRIBAL_INSIGHT, scopes.SSP];
schema.readScopes = baseScopes.concat([scopes.UDD_READ]);
schema.writeScopes = baseScopes;

schema.plugin(timestamps, {
  createdAt: 'CREATED_AT',
  updatedAt: 'UPDATED_AT'
});
schema.plugin(filterByOrg);
schema.plugin(fieldScoping);
schema.plugin(scopeChecks);

const updateForeignRelations = (model, next) => {
  const Staff = getConnection('JISC_1_2_3').model('Staff');
  const CourseInstance = getConnection('JISC_1_2_3').model('CourseInstance');

  async.parallel([
    // 'Staff.staffCourseInstances'
    done => updateForeignMultiple(Staff, model, {
      STAFF_ID: model.STAFF_ID,
      organisation: model.organisation
    }, 'staffCourseInstances', done),

    // 'CourseInstance.staffCourseInstances'
    done => updateForeignMultiple(CourseInstance, model, {
      COURSE_INSTANCE_ID: model.COURSE_INSTANCE_ID,
      organisation: model.organisation
    }, 'staffCourseInstances', done)
  ], next);
};

const updateLocalRelations = (model, next) => {
  const Staff = getConnection('JISC_1_2_3').model('Staff');
  const CourseInstance = getConnection('JISC_1_2_3').model('CourseInstance');

  async.parallel([
    // 'this.staff'
    done => updateLocalSingular(Staff, model, {
      STAFF_ID: model.STAFF_ID,
      organisation: model.organisation
    }, 'staff', done),

    // 'this.courseInstance'
    done => updateLocalSingular(CourseInstance, model, {
      COURSE_INSTANCE_ID: model.COURSE_INSTANCE_ID,
      organisation: model.organisation
    }, 'courseInstance', done)
  ], next);
};

schema.pre('save', function preSave(next) {
  const model = this;
  async.parallel([
    updateForeignRelations.bind(null, model),
    updateLocalRelations.bind(null, model)
  ], next);
});

schema.set('toObject', { virtuals: true });

export default getConnection('JISC_1_2_3').model('StaffCourseInstance', schema, 'jiscStaffCourseInstances');