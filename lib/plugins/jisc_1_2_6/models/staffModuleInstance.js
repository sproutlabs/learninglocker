import mongoose from 'mongoose';
import { getConnection } from 'lib/connections/mongoose';
import timestamps from 'mongoose-timestamp';
import softDeletePlugin from 'lib/models/plugins/softDelete';
import filterByOrg from 'lib/models/plugins/filterByOrg';
import fieldScoping from 'lib/plugins/jisc_1_2_6/models/plugins/fieldScoping';
import scopeChecks from 'lib/models/plugins/scopeChecks';
import async from 'async';
import * as scopes from 'lib/constants/scopes';
import { updateForeignMultiple,
         updateLocalSingular } from 'lib/plugins/jisc_1_2_6/utils/relations';

const schema = new mongoose.Schema({
  STAFF_ID: { type: String, required: true, maxLength: 255, readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.SSP, scopes.OPENDASH] },
  MOD_INSTANCE_ID: { type: String, required: true, maxLength: 255, readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.OPENDASH] },

  /**
  * Relations
  */
  staff: { type: mongoose.Schema.ObjectId, ref: 'Staff', readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.SSP, scopes.OPENDASH] },
  moduleInstance: { type: mongoose.Schema.ObjectId, ref: 'ModuleInstance', readAccess: [scopes.ALL, scopes.UDD_READ, scopes.TRIBAL_INSIGHT, scopes.OPENDASH] },
  organisation: { type: mongoose.Schema.ObjectId, ref: 'Organisation' }
});
const baseScopes = [scopes.ALL, scopes.TRIBAL_INSIGHT, scopes.SSP, scopes.OPENDASH];
schema.readScopes = baseScopes.concat([scopes.UDD_READ]);
schema.writeScopes = baseScopes;

schema.plugin(timestamps, {
  createdAt: 'CREATED_AT',
  updatedAt: 'UPDATED_AT'
});

schema.plugin(softDeletePlugin, {
  flush: {
    keep: ['organisation']
  }
});
schema.plugin(filterByOrg);
schema.plugin(fieldScoping);
schema.plugin(scopeChecks);

schema.index({ organisation: 1, MOD_INSTANCE_ID: 1 });

const updateForeignRelations = (model, removeRelations, next) => {
  const Staff = getConnection('JISC_1_2_6').model('Staff');
  const ModuleInstance = getConnection('JISC_1_2_6').model('ModuleInstance');

  async.parallel([
    // 'Staff.staffModuleInstances'
    done => updateForeignMultiple(Staff, model, removeRelations, {
      STAFF_ID: model.STAFF_ID,
      organisation: model.organisation
    }, 'staffModuleInstances', done),

    // 'ModuleInstance.staffModuleInstances'
    done => updateForeignMultiple(ModuleInstance, model, removeRelations, {
      MOD_INSTANCE_ID: model.MOD_INSTANCE_ID,
      organisation: model.organisation
    }, 'staffModuleInstances', done)
  ], next);
};

const updateLocalRelations = (model, next) => {
  const Staff = getConnection('JISC_1_2_6').model('Staff');
  const ModuleInstance = getConnection('JISC_1_2_6').model('ModuleInstance');

  async.parallel([
    // 'this.staff'
    done => updateLocalSingular(Staff, model, {
      STAFF_ID: model.STAFF_ID,
      organisation: model.organisation
    }, 'staff', done),

    // 'this.moduleInstance'
    done => updateLocalSingular(ModuleInstance, model, {
      MOD_INSTANCE_ID: model.MOD_INSTANCE_ID,
      organisation: model.organisation
    }, 'moduleInstance', done)
  ], next);
};

schema.pre('save', function preSave(next) {
  const model = this;
  const removeForeignRelations = model.deleted;
  async.parallel([
    updateForeignRelations.bind(null, model, removeForeignRelations),
    updateLocalRelations.bind(null, model)
  ], next);
});

schema.pre('remove', function preDelete(next) {
  const model = this;
  const removeForeignRelations = true;
  async.parallel([
    updateForeignRelations.bind(null, model, removeForeignRelations)
  ], next);
});

export default getConnection('JISC_1_2_6').model('StaffModuleInstance', schema, 'jiscStaffModuleInstances');