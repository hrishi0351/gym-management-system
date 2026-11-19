'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const contentModel = require('../models/content.model');

exports.facilities = asyncHandler(async (req, res) =>
  success(res, await contentModel.facilities(), 'Facilities loaded')
);

exports.gallery = asyncHandler(async (req, res) =>
  success(res, await contentModel.gallery(req.query.category), 'Gallery loaded')
);