import { getConnection } from 'lib/connections/mongoose';
import { expect } from 'chai';
import _ from 'lodash';
import async from 'async';
import Student from 'lib/plugins/jisc_1_2_6/models/student';
import Staff from 'lib/plugins/jisc_1_2_6/models/staff';
import StudentCourseMembership from 'lib/plugins/jisc_1_2_6/models/studentCourseMembership';
import StudentCourseInstance from 'lib/plugins/jisc_1_2_6/models/studentCourseInstance';
import StudentAssessmentInstance from 'lib/plugins/jisc_1_2_6/models/studentAssessmentInstance';
import StudentModuleInstance from 'lib/plugins/jisc_1_2_6/models/studentModuleInstance';
import DBHelper from 'lib/plugins/jisc_1_2_6/utils/TestDBHelper';

const db = new DBHelper();

describe('Test the relation hydration on JISC students', () => {
  before((done) => {
    const connection = getConnection('JISC_1_2_6');
    if (connection.readyState !== 1) {
      connection.on('connected', done);
    } else {
      done();
    }
  });

  before('Set up client with "all" scopes', (done) => {
    db.prepareClient(done);
  });

  after('Clear client with "all" scopes', (done) => {
    db.cleanUpClient(done);
  });

  describe('add student related models and test for relations', () => {
    let savedModels;
    const staffData = db.getStaffData();
    const studentData = db.getStudentData(db.studentId, staffData.STAFF_ID);
    const scmData = db.getStudentCourseMembershipData(studentData.STUDENT_ID);
    const sciData = db.getStudentCourseInstanceData(studentData.STUDENT_ID);
    const saiData = db.getStudentAssessmentInstanceData(studentData.STUDENT_ID);
    const smiData = db.getStudentModuleInstanceData(studentData.STUDENT_ID);

    beforeEach('Insert student and related models', (done) => {
      async.series({
        scm: insertDone => db.prepStudentCourseMembership(insertDone, scmData),
        sci: insertDone => db.prepStudentCourseInstance(insertDone, sciData),
        student: insertDone => db.prepStudent(insertDone, studentData),
        sai: insertDone => db.prepStudentAssessmentInstance(insertDone, saiData),
        smi: insertDone => db.prepStudentModuleInstance(insertDone, smiData),
        staff: insertDone => db.prepStaff(insertDone, staffData),
      }, (err, results) => {
        savedModels = results;
        done(err);
      });
    });

    afterEach('Clean up related models', (done) => {
      async.parallel({
        student: cleanDone => db.cleanStudent(cleanDone),
        scm: cleanDone => db.cleanStudentCourseMembership(cleanDone),
        sci: cleanDone => db.cleanStudentCourseInstance(cleanDone),
        sai: cleanDone => db.cleanStudentAssessmentInstance(cleanDone),
        smi: cleanDone => db.cleanStudentModuleInstance(cleanDone),
        staff: cleanDone => db.cleanStaff(cleanDone),
      }, (err) => {
        done(err);
      });
    });

    it('should find multiple hydrated relations on the student', (done) => {
      Student.findOne({ STUDENT_ID: studentData.STUDENT_ID }, (err, model) => {
        expect(model).to.not.be.null; //eslint-disable-line
        const modelData = model.toObject();
        expect(modelData.studentCourseMemberships).to.be.an('Array').and.have.lengthOf(1);
        expect(modelData.studentCourseInstances).to.be.an('Array').and.have.lengthOf(1);
        expect(modelData.studentAssessmentInstances).to.be.an('Array').and.have.lengthOf(1);
        expect(modelData.studentModuleInstances).to.be.an('Array').and.have.lengthOf(1);
        expect(_.toString(modelData.studentCourseMemberships[0])).to.equal(_.toString(savedModels.scm._id));
        expect(_.toString(modelData.studentCourseInstances[0])).to.equal(_.toString(savedModels.sci._id));
        expect(_.toString(modelData.studentAssessmentInstances[0])).to.equal(_.toString(savedModels.sai._id));
        expect(_.toString(modelData.studentModuleInstances[0])).to.equal(_.toString(savedModels.smi._id));

        expect(_.toString(modelData.tutor)).to.equal(_.toString(savedModels.staff._id));
        done(err);
      });
    });

    it('should find hydrated student relation (mentees) on the staff', (done) => {
      Staff.findById(savedModels.staff._id, (err, model) => {
        expect(model).to.not.be.null; //eslint-disable-line
        const modelData = model.toObject();
        expect(modelData.mentees).to.be.an('Array').and.have.lengthOf(1);
        expect(_.toString(modelData.mentees[0])).to.equal(_.toString(savedModels.student._id));
        done(err);
      });
    });

    it('should find hydrated student relation on the student course membership', (done) => {
      StudentCourseMembership.findById(savedModels.scm._id, (err, model) => {
        expect(model).to.not.be.null; //eslint-disable-line
        const modelData = model.toObject();
        expect(_.toString(modelData.student)).to.equal(_.toString(savedModels.student._id));
        done(err);
      });
    });

    it('should find hydrated student relation on the student course instance', (done) => {
      StudentCourseInstance.findById(savedModels.sci._id, (err, model) => {
        expect(model).to.not.be.null; //eslint-disable-line
        const modelData = model.toObject();
        expect(_.toString(modelData.student)).to.equal(_.toString(savedModels.student._id));
        done(err);
      });
    });

    it('should find hydrated student relation on the student assessment instance', (done) => {
      StudentAssessmentInstance.findById(savedModels.sai._id, (err, model) => {
        expect(model).to.not.be.null; //eslint-disable-line
        const modelData = model.toObject();
        expect(_.toString(modelData.student)).to.equal(_.toString(savedModels.student._id));
        done(err);
      });
    });

    it('should find hydrated student relation on the student module instance', (done) => {
      StudentModuleInstance.findById(savedModels.smi._id, (err, model) => {
        expect(model).to.not.be.null; //eslint-disable-line
        const modelData = model.toObject();
        expect(_.toString(modelData.student)).to.equal(_.toString(savedModels.student._id));
        done(err);
      });
    });

    it('should delete Student and remove related models from StudentCourseMembership, StudentModuleInstance, StudentAssessmentInstance, StudentCourseInstance', (done) => {
      savedModels.student.remove().then(() => {
        StudentCourseMembership.findById(savedModels.scm._id, (err, scm) => {
          if (err) return done(err);
          expect(scm).to.not.equal(null);
          expect(scm.student).to.equal(null);
          StudentModuleInstance.findById(savedModels.smi._id, (err, smi) => {
            if (err) return done(err);
            expect(smi).to.not.equal(null);
            expect(smi.student).to.equal(null);
            StudentAssessmentInstance.findById(savedModels.sai._id, (err, sai) => {
              if (err) return done(err);
              expect(sai).to.not.equal(null);
              expect(sai.student).to.equal(null);
              StudentCourseInstance.findById(savedModels.sci._id, (err, sci) => {
                if (err) return done(err);
                expect(sci).to.not.equal(null);
                expect(sci.student).to.equal(null);
                done();
              });
            });
          });
        });
      }).catch(done);
    });

    it('should delete StudentCourseMembership and remove the related model from Student', (done) => {
      savedModels.scm.remove().then(() => {
        Student.findById(savedModels.student._id, (err, student) => {
          if (err) return done(err);
          expect(student).to.not.equal(null);
          expect(student.studentCourseMemberships).to.be.an('Array').and.have.lengthOf(0);
          done();
        });
      }).catch(done);
    });

    it('should delete StudentModuleInstance and remove the related model from Student', (done) => {
      savedModels.smi.remove().then(() => {
        Student.findById(savedModels.student._id, (err, student) => {
          if (err) return done(err);
          expect(student).to.not.equal(null);
          expect(student.studentModuleInstances).to.be.an('Array').and.have.lengthOf(0);
          done();
        });
      }).catch(done);
    });

    it('should delete StudentAssessmentInstance and remove the related model from Student', (done) => {
      savedModels.sai.remove().then(() => {
        Student.findById(savedModels.student._id, (err, student) => {
          if (err) return done(err);
          expect(student).to.not.equal(null);
          expect(student.studentAssessmentInstances).to.be.an('Array').and.have.lengthOf(0);
          done();
        });
      }).catch(done);
    });

    it('should delete StudentCourseInstance and remove the related model from Student', (done) => {
      savedModels.sci.remove().then(() => {
        Student.findById(savedModels.student._id, (err, student) => {
          if (err) return done(err);
          expect(student).to.not.equal(null);
          expect(student.studentCourseInstances).to.be.an('Array').and.have.lengthOf(0);
          done();
        });
      }).catch(done);
    });
  });
});