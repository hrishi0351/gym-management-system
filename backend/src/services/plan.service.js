'use strict';

const AppError = require('../utils/AppError');
const planModel = require('../models/plan.model');
const audit = require('./audit.service');

const listActive = () => planModel.listActive();
const listAll = () => planModel.listAll();

async function getById(id) {
  const plan = await planModel.findById(id);
  if (!plan) throw AppError.notFound('Plan not found');
  return plan;
}

async function create(data, req) {
  if (await planModel.findByName(data.name)) throw AppError.conflict('A plan with this name already exists');
  const plan = await planModel.create(data);
  await audit.log({
    userId: req.user.id,
    action: 'PLAN_CREATED',
    entityType: 'membership_plan',
    entityId: plan.id,
    details: { name: plan.name, price: plan.price },
    req,
  });
  return plan;
}

async function update(id, data, req) {
  const existing = await getById(id);
  if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
    if (await planModel.findByName(data.name)) throw AppError.conflict('A plan with this name already exists');
  }
  const plan = await planModel.update(id, data);
  await audit.log({
    userId: req.user.id,
    action: 'PLAN_UPDATED',
    entityType: 'membership_plan',
    entityId: id,
    details: data,
    req,
  });
  return plan;
}

async function remove(id, req) {
  const plan = await getById(id);
  if ((await planModel.countMemberships(id)) > 0) {
    throw AppError.conflict('This plan has memberships. Deactivate it instead of deleting.');
  }
  await planModel.remove(id);
  await audit.log({
    userId: req.user.id,
    action: 'PLAN_DELETED',
    entityType: 'membership_plan',
    entityId: id,
    details: { name: plan.name },
    req,
  });
}

module.exports = { listActive, listAll, getById, create, update, remove };