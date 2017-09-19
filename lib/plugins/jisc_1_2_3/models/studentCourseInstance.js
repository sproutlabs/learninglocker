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
  STUDENT_ID: { type: String, required: true, maxLength: 255, readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.LAP, scopes.SSP] },
  STUDENT_COURSE_MEMBERSHIP_ID: { type: String, required: true, maxLength: 255, readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.LAP, scopes.SSP] },
  STUDENT_COURSE_MEMBERSHIP_SEQ: { type: String, required: true, maxLength: 255, readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.LAP, scopes.SSP] },
  MODE: { type: Number, required: true, min: 1, max: 99, default: 98, readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.LAP, scopes.SSP] },
  YEAR_COM: { type: Number, readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.LAP, scopes.SSP] },
  YEAR_PRG: { type: Number, readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.LAP, scopes.SSP] },
  YEAR_STU: { type: Number, readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.LAP, scopes.SSP] },
  COURSE_LOCATION: { type: String, maxLength: 255, readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.LAP, scopes.SSP] },
  X_COURSE_AVERAGE_MARK: { type: Number, min: 0, max: 1, readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.LAP, scopes.SSP] },
  X_YEAR_AVERAGE_MARK: { type: Number, min: 0, max: 1, readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.LAP, scopes.SSP] },

  /**
  * Relations
  */
  student: { type: mongoose.Schema.ObjectId, ref: 'Student' },
  studentCourseMembership: { type: mongoose.Schema.ObjectId, ref: 'StudentCourseMembership', readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.LAP, scopes.SSP] },
  organisation: { type: mongoose.Schema.ObjectId, ref: 'Organisation' }
});
const baseScopes = [scopes.ALL, scopes.TRIBAL_INSIGHT, scopes.LAP, scopes.SSP];
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
  const Student = getConnection('JISC_1_2_3').model('Student');
  const StudentCourseMembership = getConnection('JISC_1_2_3').model('StudentCourseMembership');

  async.parallel([
    done => updateForeignMultiple(Student, model, {
      STUDENT_ID: model.STUDENT_ID,
      organisation: model.organisation
    }, 'studentCourseInstances', done),
    done => updateForeignMultiple(StudentCourseMembership, model, {
      STUDENT_COURSE_MEMBERSHIP_ID: model.STUDENT_COURSE_MEMBERSHIP_ID,
      organisation: model.organisation
    }, 'studentCourseInstances', done),
  ], next);
};

const updateLocalRelations = (model, next) => {
  const Student = getConnection('JISC_1_2_3').model('Student');
  const StudentCourseMembership = getConnection('JISC_1_2_3').model('StudentCourseMembership');

  async.parallel([
    done => updateLocalSingular(Student, model, {
      STUDENT_ID: model.STUDENT_ID,
      organisation: model.organisation
    }, 'student', done),
    done => updateLocalSingular(StudentCourseMembership, model, {
      STUDENT_COURSE_MEMBERSHIP_ID: model.STUDENT_COURSE_MEMBERSHIP_ID,
      organisation: model.organisation
    }, 'studentCourseMembership', done),
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

export default getConnection('JISC_1_2_3').model('StudentCourseInstance', schema, 'jiscStudentCourseInstances');